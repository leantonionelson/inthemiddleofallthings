import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';

// Constants
const DT_FIXED = 0.016; // ~60fps timestep
const DEFAULT_POPULATION_SIZE = 150;
const HISTOGRAM_BINS = 30;
const TICKS_PER_GENERATION = 30; // frames per generation step

interface Individual {
  trait: number; // 0..1
  yJitter: number; // Fixed vertical jitter for visualization
}

type LandscapeId = 'single-peak' | 'two-niches' | 'edge-seekers' | 'centre-avoiding';

interface NaturalSelectionState {
  population: Individual[];
  populationSize: number;
  generation: number;
  mutationRate: number;
  selectionStrength: number;
  landscapeId: LandscapeId;
  environmentParam: number; // peak centre for single-peak (0..1)
  traitHistogram: number[];
  isRunning: boolean;
  tickCounter: number;
}

// Gaussian random number generator (Box-Muller transform)
function randomGaussian(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// Fitness function
function fitness(t: number, state: NaturalSelectionState): number {
  const s = state.selectionStrength;
  switch (state.landscapeId) {
    case 'single-peak': {
      const mu = state.environmentParam; // peak position
      const sigma = 0.12;
      const base = Math.exp(-0.5 * Math.pow((t - mu) / sigma, 2));
      return 1 + s * base;
    }
    case 'two-niches': {
      const mu1 = 0.25;
      const mu2 = 0.75;
      const sigma = 0.1;
      const base1 = Math.exp(-0.5 * Math.pow((t - mu1) / sigma, 2));
      const base2 = Math.exp(-0.5 * Math.pow((t - mu2) / sigma, 2));
      return 1 + s * Math.max(base1, base2);
    }
    case 'edge-seekers': {
      const base = Math.max(t, 1 - t); // favours extremes
      return 1 + s * base;
    }
    case 'centre-avoiding': {
      const distFromCentre = Math.abs(t - 0.5);
      const base = distFromCentre; // disfavour near 0.5
      return 1 + s * base;
    }
    default:
      return 1; // neutral
  }
}

// Calculate histogram
function calculateHistogram(population: Individual[], bins: number): number[] {
  const hist = new Array(bins).fill(0);
  population.forEach(ind => {
    const idx = Math.min(bins - 1, Math.floor(ind.trait * bins));
    hist[idx]++;
  });
  return hist;
}

const NaturalSelectionSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<NaturalSelectionState>({
    population: [],
    populationSize: DEFAULT_POPULATION_SIZE,
    generation: 0,
    mutationRate: 0.02,
    selectionStrength: 1.0,
    landscapeId: 'single-peak',
    environmentParam: 0.5,
    traitHistogram: [],
    isRunning: true,
    tickCounter: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  // UI state
  const [mutationRate, setMutationRate] = useState(0.02);
  const [selectionStrength, setSelectionStrength] = useState(1.0);
  const [environmentParam, setEnvironmentParam] = useState(0.5);
  const [landscapeId, setLandscapeId] = useState<LandscapeId>('single-peak');
  const [isRunning, setIsRunning] = useState(true);
  const [populationSize, setPopulationSize] = useState(DEFAULT_POPULATION_SIZE);

  // Initialize population
  const initializePopulation = useCallback((size: number): Individual[] => {
    const pop: Individual[] = [];
    for (let i = 0; i < size; i++) {
      pop.push({ 
        trait: Math.random(),
        yJitter: (Math.random() - 0.5) * 40 // Fixed vertical jitter
      });
    }
    return pop;
  }, []);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    const newPopulation = initializePopulation(populationSize);
    const hist = calculateHistogram(newPopulation, HISTOGRAM_BINS);
    stateRef.current = {
      population: newPopulation,
      populationSize: populationSize,
      generation: 0,
      mutationRate: mutationRate,
      selectionStrength: selectionStrength,
      landscapeId: landscapeId,
      environmentParam: environmentParam,
      traitHistogram: hist,
      isRunning: isRunning,
      tickCounter: 0,
    };
    accumulatorRef.current = 0;
  }, [populationSize, mutationRate, selectionStrength, landscapeId, environmentParam, isRunning, initializePopulation]);

  // Update state refs when UI changes
  useEffect(() => {
    stateRef.current.mutationRate = mutationRate;
    stateRef.current.selectionStrength = selectionStrength;
    stateRef.current.landscapeId = landscapeId;
    stateRef.current.environmentParam = environmentParam;
    stateRef.current.isRunning = isRunning;
    stateRef.current.populationSize = populationSize;
  }, [mutationRate, selectionStrength, landscapeId, environmentParam, isRunning, populationSize]);

  // Initialize on mount
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Step one generation
  const stepGeneration = useCallback(() => {
    const state = stateRef.current;
    const population = state.population;

    // Compute fitness for each individual
    const fitnesses = population.map(ind => fitness(ind.trait, state));
    const totalFitness = fitnesses.reduce((a, b) => a + b, 0);

    // Sample new population by fitness (roulette-wheel selection)
    const newPopulation: Individual[] = [];
    for (let i = 0; i < state.populationSize; i++) {
      // Roulette-wheel selection
      let r = Math.random() * totalFitness;
      let parentIndex = 0;
      while (r > fitnesses[parentIndex] && parentIndex < population.length - 1) {
        r -= fitnesses[parentIndex];
        parentIndex++;
      }

      const parentTrait = population[parentIndex].trait;

      // Mutation
      const mutatedTrait = parentTrait + randomGaussian(0, state.mutationRate);
      const childTrait = Math.min(1, Math.max(0, mutatedTrait));

      newPopulation.push({ 
        trait: childTrait,
        yJitter: (Math.random() - 0.5) * 40 // New jitter for offspring
      });
    }

    // Update histogram
    const hist = calculateHistogram(newPopulation, HISTOGRAM_BINS);

    // Update state
    state.population = newPopulation;
    state.traitHistogram = hist;
    state.generation++;
  }, []);

  // Get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  // Draw function
  const draw = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;

    const { canvas, ctx } = context;
    const state = stateRef.current;
    const isDark = document.documentElement.classList.contains('dark');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (theme-aware)
    ctx.fillStyle = isDark ? '#050712' : '#f4f5f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = 50;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const padding = 40;
    const plotWidth = canvas.width - 2 * padding;
    const plotHeight = canvas.height - 2 * padding;
    const plotX = padding;
    const plotY = padding;

    // Draw fitness landscape curve
    ctx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const curvePoints = 100;
    let maxFitness = 0;
    for (let i = 0; i <= curvePoints; i++) {
      const t = i / curvePoints;
      const f = fitness(t, state);
      maxFitness = Math.max(maxFitness, f);
    }
    for (let i = 0; i <= curvePoints; i++) {
      const t = i / curvePoints;
      const f = fitness(t, state);
      const x = plotX + t * plotWidth;
      const y = plotY + plotHeight - (f / maxFitness) * plotHeight * 0.6; // Use 60% of height for curve
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw histogram bars
    const maxHistValue = Math.max(...state.traitHistogram, 1);
    state.traitHistogram.forEach((count, binIndex) => {
      const binWidth = plotWidth / HISTOGRAM_BINS;
      const barHeight = (count / maxHistValue) * plotHeight * 0.8;
      const x = plotX + binIndex * binWidth;
      const y = plotY + plotHeight - barHeight;

      // Color based on trait value
      const traitValue = (binIndex + 0.5) / HISTOGRAM_BINS;
      const hue = traitValue * 30; // 0 (blue) to 30 (orange)
      ctx.fillStyle = isDark
        ? `hsla(${hue}, 70%, 60%, 0.4)`
        : `hsla(${hue}, 70%, 50%, 0.5)`;
      ctx.fillRect(x, y, binWidth - 1, barHeight);

      // Border
      ctx.strokeStyle = isDark
        ? `hsla(${hue}, 70%, 60%, 0.6)`
        : `hsla(${hue}, 70%, 40%, 0.7)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, binWidth - 1, barHeight);
    });

    // Draw trait cloud (dots)
    const dotSize = 3;
    state.population.forEach(ind => {
      const x = plotX + ind.trait * plotWidth;
      const y = plotY + plotHeight / 2 + ind.yJitter; // Fixed vertical jitter

      // Color based on trait value
      const hue = ind.trait * 30; // 0 (blue) to 30 (orange)
      ctx.fillStyle = isDark
        ? `hsla(${hue}, 80%, 70%, 0.8)`
        : `hsla(${hue}, 80%, 50%, 0.9)`;

      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw axis labels
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('0', plotX, plotY + plotHeight + 5);
    ctx.fillText('1', plotX + plotWidth, plotY + plotHeight + 5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Generation: ${state.generation}`, 10, 20);
  }, [getCanvasContext]);

  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      if (stateRef.current.isRunning) {
        accumulatorRef.current += dt;
        while (accumulatorRef.current >= DT_FIXED) {
          stateRef.current.tickCounter++;
          if (stateRef.current.tickCounter >= TICKS_PER_GENERATION) {
            stepGeneration();
            stateRef.current.tickCounter = 0;
          }
          accumulatorRef.current -= DT_FIXED;
        }
      }

      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [draw, stepGeneration]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const maxSize = Math.min(container.clientWidth - 32, 800);
      canvas.width = maxSize;
      canvas.height = 400;

      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  // Manual step function
  const handleStep = useCallback(() => {
    stepGeneration();
  }, [stepGeneration]);

  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[800px] bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '400px' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Landscape Presets */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Environment Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => setLandscapeId('single-peak')}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                landscapeId === 'single-peak'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Single niche
            </motion.button>
            <motion.button
              onClick={() => setLandscapeId('two-niches')}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                landscapeId === 'two-niches'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Two niches
            </motion.button>
            <motion.button
              onClick={() => setLandscapeId('edge-seekers')}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                landscapeId === 'edge-seekers'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Edge seekers
            </motion.button>
            <motion.button
              onClick={() => setLandscapeId('centre-avoiding')}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                landscapeId === 'centre-avoiding'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Centre-avoiding
            </motion.button>
          </div>
        </div>

        {/* Mutation Rate Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Mutation rate: {mutationRate.toFixed(3)}
          </label>
          <input
            type="range"
            min="0.005"
            max="0.08"
            step="0.001"
            value={mutationRate}
            onChange={(e) => setMutationRate(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Selection Strength Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Selection strength: {selectionStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={selectionStrength}
            onChange={(e) => setSelectionStrength(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Environment Peak Slider (only for single-peak) */}
        {landscapeId === 'single-peak' && (
          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
              Environment peak: {environmentParam.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={environmentParam}
              onChange={(e) => setEnvironmentParam(Number(e.target.value))}
              className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
            />
          </div>
        )}

        {/* Population Size Slider (optional) */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Population size: {populationSize}
          </label>
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={populationSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPopulationSize(newSize);
              // Reset when population size changes
              setTimeout(() => resetSimulation(), 0);
            }}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Play/Pause/Step/Reset Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pause' : 'Play'}
          </motion.button>
          <motion.button
            onClick={handleStep}
            disabled={isRunning}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
            title="Step one generation (only when paused)"
          >
            <StepForward className="w-4 h-4" />
            Step
          </motion.button>
          <motion.button
            onClick={resetSimulation}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default NaturalSelectionSimulation;

