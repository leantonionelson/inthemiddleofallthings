import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCw, RotateCcw, Mountain, Activity } from 'lucide-react';

// --- Types ---

interface Agent {
    x: number; // 0..GRID_SIZE
    y: number; // 0..GRID_SIZE
    z: number; // Height at (x,y)
    colorHue?: number; // Optional individual hue
}

interface Point3D {
    x: number;
    y: number;
    z: number;
}

interface Point2D {
    x: number;
    y: number;
}

// --- Constants ---

const GRID_SIZE = 40; // 40x40 grid
const POPULATION_SIZE = 100;
const CANVAS_WIDTH = 800; // Internal resolution
const CANVAS_HEIGHT = 600;

// --- Helper Functions ---

// Height function: sum of smooth waves + ruggedness noise
const getHeight = (x: number, y: number, time: number, ruggedness: number): number => {
    // Scale coordinates to be somewhat independent of grid size
    const sx = x * 0.15;
    const sy = y * 0.15;

    // Base wavy mountain (smooth, large features)
    // Center peak
    const dx = x - GRID_SIZE / 2;
    const dy = y - GRID_SIZE / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // A main central hill
    let z = Math.exp(-dist * dist * 0.01) * 15;

    // Add some rolling waves
    z += Math.sin(sx * 0.8) * Math.cos(sy * 0.8) * 5;

    // Rugged noise on top, scaled by ruggedness
    // We use multiple frequencies for "noise" look without Perlin lib
    const noise =
        Math.sin(sx * 2.5 + time) * Math.cos(sy * 2.5) * 2 +
        Math.sin(sx * 5.0 - time * 0.5) * Math.sin(sy * 5.0) * 1;

    z += noise * (ruggedness * 3);

    return z;
};

// Isometric-like projection
const projectPoint = (x: number, y: number, z: number, width: number, height: number): Point2D => {
    const scale = 12; // Zoom level
    const heightScale = 4; // Vertical exaggeration

    const centerX = width / 2;
    const centerY = height * 0.3; // Move terrain up a bit

    // Center the grid in world space
    const wx = x - GRID_SIZE / 2;
    const wy = y - GRID_SIZE / 2;

    // Isometric projection
    const sx = (wx - wy) * scale + centerX;
    const sy = (wx + wy) * scale * 0.5 - z * heightScale + centerY;

    return { x: sx, y: sy };
};

const FitnessLandscapeSimulation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [ruggedness, setRuggedness] = useState(0.2);
    const [mutationSize, setMutationSize] = useState(0.5);
    const [shiftLandscape, setShiftLandscape] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);

    // Initialize population
    const initPopulation = useCallback(() => {
        const newAgents: Agent[] = [];
        for (let i = 0; i < POPULATION_SIZE; i++) {
            const x = Math.random() * (GRID_SIZE - 1);
            const y = Math.random() * (GRID_SIZE - 1);
            newAgents.push({
                x,
                y,
                z: getHeight(x, y, 0, ruggedness),
                colorHue: Math.random() * 60 + 40 // Yellow/Orange range
            });
        }
        setAgents(newAgents);
    }, [ruggedness]);

    // Initial setup
    useEffect(() => {
        initPopulation();
    }, []); // Run once on mount

    // Simulation Loop
    const update = useCallback(() => {
        // Update time if shifting
        if (shiftLandscape) {
            timeRef.current += 0.02;
        }

        const currentTime = timeRef.current;

        // Evolve agents
        setAgents(prevAgents => {
            return prevAgents.map(agent => {
                // 1. Mutation Proposal
                const angle = Math.random() * 2 * Math.PI;
                // Scale mutation size relative to grid
                const step = mutationSize * 1.5;

                let newX = agent.x + step * Math.cos(angle);
                let newY = agent.y + step * Math.sin(angle);

                // Clamp to grid
                newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
                newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));

                // 2. Evaluate New Height
                const currentZ = getHeight(agent.x, agent.y, currentTime, ruggedness);
                const newZ = getHeight(newX, newY, currentTime, ruggedness);

                // 3. Selection (Hill Climber)
                // Always accept uphill.
                if (newZ > currentZ) {
                    return { ...agent, x: newX, y: newY, z: newZ };
                } else {
                    // Stay put, but update Z in case landscape shifted under feet
                    return { ...agent, z: currentZ };
                }
            });
        });
    }, [mutationSize, ruggedness, shiftLandscape]);

    // Animation Frame Loop
    // Use a ref for the update function to avoid resetting the loop when update changes
    const updateRef = useRef(update);
    useEffect(() => {
        updateRef.current = update;
    }, [update]);

    useEffect(() => {
        if (!isPlaying) return;

        const loop = () => {
            updateRef.current();
            requestRef.current = requestAnimationFrame(loop);
        };

        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying]);

    // Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Theme colors
        const isDarkMode = document.documentElement.classList.contains('dark');

        // Grid styling
        const gridColor = isDarkMode ? 'rgba(100, 200, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

        ctx.lineWidth = 1;

        // Pre-calculate grid points using current time from ref
        const points: Point2D[][] = [];
        const currentTime = timeRef.current;

        for (let x = 0; x < GRID_SIZE; x++) {
            points[x] = [];
            for (let y = 0; y < GRID_SIZE; y++) {
                const z = getHeight(x, y, currentTime, ruggedness);
                points[x][y] = projectPoint(x, y, z, width, height);
            }
        }

        // Draw Grid Lines
        ctx.beginPath();
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const p = points[x][y];

                // Draw to right
                if (x < GRID_SIZE - 1) {
                    const pRight = points[x + 1][y];
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(pRight.x, pRight.y);
                }

                // Draw down
                if (y < GRID_SIZE - 1) {
                    const pDown = points[x][y + 1];
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(pDown.x, pDown.y);
                }
            }
        }
        ctx.strokeStyle = gridColor;
        ctx.stroke();

        // Draw Agents
        agents.forEach(agent => {
            const p = projectPoint(agent.x, agent.y, agent.z, width, height);

            // Glow
            const hue = agent.colorHue || 50;
            const color = isDarkMode ? `hsl(${hue}, 100%, 70%)` : `hsl(${hue}, 100%, 40%)`;

            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = color;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        });

    }, [agents, ruggedness]); // Redraw when agents change (which happens every frame if playing) or ruggedness changes

    // Handlers
    const handleResetPopulation = () => {
        initPopulation();
    };

    const handleResetAll = () => {
        setRuggedness(0.2);
        setMutationSize(0.5);
        setShiftLandscape(false);
        timeRef.current = 0;
        initPopulation();
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Simulation Area */}
            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Canvas Container */}
                <div className="flex-1 w-full flex flex-col items-center gap-4">
                    <div className="relative w-full aspect-[4/3] max-w-[600px] rounded-2xl overflow-hidden bg-surface-paper dark:bg-[#050712] border border-ink-muted/20 dark:border-paper-light/10 shadow-inner">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full block"
                        />

                        {/* Overlay Status */}
                        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
                            <div className={`text-xs font-mono px-2 py-1 rounded bg-black/10 dark:bg-white/10 backdrop-blur-sm ${shiftLandscape ? 'text-green-600 dark:text-green-400' : 'text-ink-muted'}`}>
                                {shiftLandscape ? 'LANDSCAPE SHIFTING' : 'LANDSCAPE STATIC'}
                            </div>
                        </div>
                    </div>

                    {/* Main Actions */}
                    <div className="flex flex-wrap justify-center gap-3 w-full">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium hover:opacity-90 transition-opacity shadow-lg shadow-ink-primary/20"
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isPlaying ? 'Pause' : 'Play Evolution'}
                        </button>

                        <button
                            onClick={handleResetPopulation}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-primary dark:text-paper-light hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset Population
                        </button>

                        <button
                            onClick={handleResetAll}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-primary dark:text-paper-light hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors"
                            title="Reset All"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="w-full md:w-80 flex flex-col gap-6 p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/10 dark:border-paper-light/10">
                    <h3 className="text-lg font-serif text-ink-primary dark:text-paper-light flex items-center gap-2">
                        <Mountain className="w-5 h-5" />
                        Landscape Controls
                    </h3>

                    <div className="space-y-6">
                        {/* Ruggedness Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <label className="text-ink-secondary dark:text-ink-muted font-medium">
                                    Ruggedness
                                </label>
                                <span className="font-mono text-ink-primary dark:text-paper-light opacity-70">
                                    {Math.round(ruggedness * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={ruggedness}
                                onChange={(e) => setRuggedness(parseFloat(e.target.value))}
                                className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
                            />
                            <p className="text-xs text-ink-muted">
                                Low: Smooth hills. High: Jagged peaks & valleys.
                            </p>
                        </div>

                        {/* Mutation Size Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <label className="text-ink-secondary dark:text-ink-muted font-medium">
                                    Mutation Size
                                </label>
                                <span className="font-mono text-ink-primary dark:text-paper-light opacity-70">
                                    {mutationSize.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="2.0"
                                step="0.1"
                                value={mutationSize}
                                onChange={(e) => setMutationSize(parseFloat(e.target.value))}
                                className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
                            />
                            <p className="text-xs text-ink-muted">
                                How far agents can jump. Larger jumps cross valleys.
                            </p>
                        </div>

                        {/* Shift Landscape Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-ink-muted/10 dark:border-paper-light/10">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-ink-primary dark:text-paper-light flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Shift Landscape
                                </span>
                                <span className="text-xs text-ink-muted">Animate the terrain over time</span>
                            </div>
                            <button
                                onClick={() => setShiftLandscape(!shiftLandscape)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${shiftLandscape ? 'bg-ink-primary dark:bg-paper-light' : 'bg-ink-muted/30 dark:bg-paper-light/30'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${shiftLandscape ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FitnessLandscapeSimulation;
