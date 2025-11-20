import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Save, Shuffle, RotateCcw } from 'lucide-react';

// --- Types ---

interface Genome {
    radius: number;      // 30-120
    spikeCount: number;  // 3-18
    spikeLength: number; // 0-1.2
    wobble: number;      // 0-0.6
    hue: number;         // 0-360
    saturation: number;  // 0.3-1.0
}

interface HistoryItem {
    genome: Genome;
    id: number;
    timestamp: number;
}

// --- Constants ---

const DEFAULT_GENOME: Genome = {
    radius: 75,
    spikeCount: 8,
    spikeLength: 0.5,
    wobble: 0.1,
    hue: 200,
    saturation: 0.8,
};

const GENE_RANGES = {
    radius: { min: 30, max: 120, step: 1, label: 'Size' },
    spikeCount: { min: 3, max: 18, step: 1, label: 'Spikes' },
    spikeLength: { min: 0, max: 1.2, step: 0.01, label: 'Spike Length' },
    wobble: { min: 0, max: 0.6, step: 0.01, label: 'Irregularity' },
    hue: { min: 0, max: 360, step: 1, label: 'Color' },
    saturation: { min: 0.3, max: 1.0, step: 0.01, label: 'Saturation' },
};

const HISTORY_LIMIT = 12;

// --- Helper Functions ---

const randomUniform = (min: number, max: number) => Math.random() * (max - min) + min;

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const generateRandomGenome = (): Genome => ({
    radius: randomUniform(GENE_RANGES.radius.min, GENE_RANGES.radius.max),
    spikeCount: Math.round(randomUniform(GENE_RANGES.spikeCount.min, GENE_RANGES.spikeCount.max)),
    spikeLength: randomUniform(GENE_RANGES.spikeLength.min, GENE_RANGES.spikeLength.max),
    wobble: randomUniform(GENE_RANGES.wobble.min, GENE_RANGES.wobble.max),
    hue: randomUniform(GENE_RANGES.hue.min, GENE_RANGES.hue.max),
    saturation: randomUniform(GENE_RANGES.saturation.min, GENE_RANGES.saturation.max),
});

const mutateGenome = (genome: Genome, amount: number): Genome => {
    const newGenome = { ...genome };

    // Mutate each gene
    (Object.keys(GENE_RANGES) as Array<keyof Genome>).forEach((key) => {
        const range = GENE_RANGES[key];
        const rangeSize = range.max - range.min;
        const offset = randomUniform(-1, 1) * amount * rangeSize;

        let newVal = genome[key] + offset;

        // Special handling for integer genes
        if (key === 'spikeCount') {
            newVal = Math.round(newVal);
        }

        newGenome[key] = clamp(newVal, range.min, range.max);
    });

    return newGenome;
};

// --- Components ---

const MutationVariationSimulation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const historyCanvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

    const [genome, setGenome] = useState<Genome>(DEFAULT_GENOME);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Draw creature on a canvas
    const drawCreature = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, g: Genome) => {
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        // Determine theme-based lightness
        // We can check for dark mode by looking at document class or computed style, 
        // but for simplicity in canvas we'll assume a standard lightness that works on both
        // or adapt if we can detect it. Let's use a safe middle-ground or slightly high lightness
        // to stand out on dark backgrounds and not be too faint on light ones.
        // Actually, the prompt specifies:
        // Dark mode bg: deep blue/charcoal. Creature: lighter, saturated.
        // Light mode bg: soft off-white. Creature: slightly deeper hues.
        // Since we don't have easy access to the current theme context here without a hook,
        // we'll use a lightness that works reasonably well for both, or try to detect.
        const isDarkMode = document.documentElement.classList.contains('dark');
        const lightness = isDarkMode ? 60 : 50;

        ctx.fillStyle = `hsl(${g.hue}, ${g.saturation * 100}%, ${lightness}%)`;
        ctx.strokeStyle = `hsl(${g.hue}, ${g.saturation * 100}%, ${Math.max(0, lightness - 20)}%)`;
        ctx.lineWidth = 2;

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${g.hue}, ${g.saturation * 100}%, ${lightness}%)`;

        ctx.beginPath();

        const points: { x: number, y: number }[] = [];
        const numPoints = g.spikeCount * 2; // * 2 because we have tips and valleys

        // We'll use a seeded random for wobble so it's consistent for the same genome frame
        // But here we want "wobble" to be a gene that affects the *amount* of irregularity.
        // If we want the shape to be static for a given genome, we need a consistent noise function.
        // For simplicity, we'll just use Math.random() seeded by the angle index for now,
        // but to make it truly "wobble" (animate) we'd need a time factor.
        // The prompt implies "wobble" is a static trait of the shape (irregularity).
        // So we should use a pseudo-random function based on index.

        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;

            // Base radius
            const rBase = g.radius;

            // Spike logic
            const isSpikeTip = i % 2 === 0;
            const spikeFactor = 1 + g.spikeLength;
            let r = rBase * (isSpikeTip ? spikeFactor : 1);

            // Wobble / Noise
            // Use a simple hash of i to get deterministic noise
            const pseudoRandom = Math.sin(i * 12.9898 + g.hue) * 43758.5453;
            const noiseVal = pseudoRandom - Math.floor(pseudoRandom); // 0..1
            const noise = (noiseVal - 0.5) * g.wobble * rBase;

            const rFinal = r + noise;

            const x = cx + rFinal * Math.cos(angle);
            const y = cy + rFinal * Math.sin(angle);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                // Use quadratic curves for smoother look? Or just lines?
                // Prompt says "Build a path...". Lines are simpler and show the spikes better.
                // But let's try to make it slightly organic if wobble is high.
                // For now, straight lines to clearly show the spikes.
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();
        // ctx.stroke(); // Optional stroke

        // Reset shadow for other drawing
        ctx.shadowBlur = 0;
    }, []);

    // Main canvas render
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        drawCreature(ctx, rect.width, rect.height, genome);

    }, [genome, drawCreature]);

    // History thumbnails render
    useEffect(() => {
        history.forEach(item => {
            const canvas = historyCanvasRefs.current[item.id];
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const dpr = window.devicePixelRatio || 1;
                    // Set fixed small size for thumbnails
                    const width = 60;
                    const height = 60;

                    if (canvas.width !== width * dpr) {
                        canvas.width = width * dpr;
                        canvas.height = height * dpr;
                        ctx.scale(dpr, dpr);
                    }

                    // Scale down the genome radius for the thumbnail
                    const scaledGenome = {
                        ...item.genome,
                        radius: item.genome.radius * 0.25 // Scale down radius
                    };

                    drawCreature(ctx, width, height, scaledGenome);
                }
            }
        });
    }, [history, drawCreature]);

    const handleGeneChange = (key: keyof Genome, value: number) => {
        setGenome(prev => ({ ...prev, [key]: value }));
    };

    const handleSmallMutation = () => {
        const mutated = mutateGenome(genome, 0.05); // 5% mutation
        setGenome(mutated);
    };

    const handleRandomise = () => {
        setGenome(generateRandomGenome());
    };

    const handleReset = () => {
        setGenome(DEFAULT_GENOME);
    };

    const handleSaveToHistory = () => {
        const newItem: HistoryItem = {
            genome: { ...genome },
            id: Date.now(),
            timestamp: Date.now(),
        };

        setHistory(prev => {
            const newHistory = [newItem, ...prev];
            if (newHistory.length > HISTORY_LIMIT) {
                return newHistory.slice(0, HISTORY_LIMIT);
            }
            return newHistory;
        });
    };

    const loadFromHistory = (item: HistoryItem) => {
        setGenome(item.genome);
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Main Simulation Area */}
            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Canvas Container */}
                <div className="flex-1 w-full flex flex-col items-center gap-4">
                    <div className="relative w-full aspect-square max-w-[400px] rounded-2xl overflow-hidden bg-surface-paper dark:bg-[#050712] border border-ink-muted/20 dark:border-paper-light/10 shadow-inner">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full block"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 w-full">
                        <button
                            onClick={handleSmallMutation}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium hover:opacity-90 transition-opacity"
                        >
                            <Shuffle className="w-4 h-4" />
                            Small Mutation
                        </button>

                        <button
                            onClick={handleRandomise}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-primary dark:text-paper-light hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Randomise All
                        </button>

                        <button
                            onClick={handleSaveToHistory}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-primary dark:text-paper-light hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>

                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-primary dark:text-paper-light hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors"
                            title="Reset to Default"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="w-full md:w-80 flex flex-col gap-6 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/10 dark:border-paper-light/10">
                    <h3 className="text-lg font-serif text-ink-primary dark:text-paper-light">Genome Editor</h3>

                    <div className="space-y-5">
                        {(Object.keys(GENE_RANGES) as Array<keyof Genome>).map((key) => {
                            const range = GENE_RANGES[key];
                            return (
                                <div key={key} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <label className="text-ink-secondary dark:text-ink-muted font-medium">
                                            {range.label}
                                        </label>
                                        <span className="font-mono text-ink-primary dark:text-paper-light opacity-70">
                                            {key === 'hue' ? `${Math.round(genome[key])}°` :
                                                key === 'saturation' || key === 'spikeLength' || key === 'wobble' ? genome[key].toFixed(2) :
                                                    Math.round(genome[key])}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={range.min}
                                        max={range.max}
                                        step={range.step}
                                        value={genome[key]}
                                        onChange={(e) => handleGeneChange(key, parseFloat(e.target.value))}
                                        className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* History Strip */}
            {history.length > 0 && (
                <div className="w-full space-y-3">
                    <h3 className="text-sm font-medium text-ink-secondary dark:text-ink-muted uppercase tracking-wider">Variation History</h3>
                    <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                        {history.map((item) => (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => loadFromHistory(item)}
                                className="flex-shrink-0 w-[70px] h-[70px] rounded-lg bg-surface-paper dark:bg-[#050712] border border-ink-muted/20 dark:border-paper-light/10 hover:border-ink-primary dark:hover:border-paper-light transition-colors relative overflow-hidden snap-start"
                            >
                                <canvas
                                    ref={(el) => { historyCanvasRefs.current[item.id] = el; }}
                                    className="w-full h-full"
                                />
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MutationVariationSimulation;
