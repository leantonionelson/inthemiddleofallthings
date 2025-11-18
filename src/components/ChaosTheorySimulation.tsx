import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Lorenz parameters
const SIGMA = 10;
const BETA = 8 / 3;
const RHO_DEFAULT = 28;
const EPSILON_SLIDER_DEFAULT = 50; // Slider value (0-100), maps to ~1e-4
const BASE_DT = 0.005;
const MAX_HISTORY = 800;
const MAX_TRAIL_LENGTH = 3000;

// Initial conditions
const A0 = { x: 1, y: 1, z: 1 };

interface LorenzState {
  x: number;
  y: number;
  z: number;
}

interface TrailPoint {
  x: number;
  y: number;
  z: number;
  age: number;
}

type ViewMode = 'attractor' | 'separation';

// RK4 integration for Lorenz system
function lorenzDerivative(
  state: LorenzState,
  sigma: number,
  rho: number,
  beta: number
): LorenzState {
  return {
    x: sigma * (state.y - state.x),
    y: state.x * (rho - state.z) - state.y,
    z: state.x * state.y - beta * state.z,
  };
}

function rk4Step(
  state: LorenzState,
  sigma: number,
  rho: number,
  beta: number,
  dt: number
): LorenzState {
  const k1 = lorenzDerivative(state, sigma, rho, beta);
  const k2 = lorenzDerivative(
    {
      x: state.x + (dt / 2) * k1.x,
      y: state.y + (dt / 2) * k1.y,
      z: state.z + (dt / 2) * k1.z,
    },
    sigma,
    rho,
    beta
  );
  const k3 = lorenzDerivative(
    {
      x: state.x + (dt / 2) * k2.x,
      y: state.y + (dt / 2) * k2.y,
      z: state.z + (dt / 2) * k2.z,
    },
    sigma,
    rho,
    beta
  );
  const k4 = lorenzDerivative(
    {
      x: state.x + dt * k3.x,
      y: state.y + dt * k3.y,
      z: state.z + dt * k3.z,
    },
    sigma,
    rho,
    beta
  );

  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: state.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: state.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

const ChaosTheorySimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // State
  const stateARef = useRef<LorenzState>({ ...A0 });
  const stateBRef = useRef<LorenzState>({ ...A0 });
  const trailARef = useRef<TrailPoint[]>([]);
  const trailBRef = useRef<TrailPoint[]>([]);
  const separationHistoryRef = useRef<number[]>([]);
  const rotationAngleRef = useRef<number>(0);

  // Parameters
  const [rho, setRho] = useState(RHO_DEFAULT);
  const [epsilon, setEpsilon] = useState(EPSILON_SLIDER_DEFAULT);
  const [speed, setSpeed] = useState(1.0);
  const [isRunning, setIsRunning] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('attractor');

  // Convert epsilon slider value (0-100) to actual epsilon (1e-6 to 1e-1)
  const epsilonValue = useCallback(() => {
    const sliderValue = epsilon;
    // Logarithmic mapping: 0 -> 1e-6, 100 -> 1e-1
    const logMin = Math.log10(1e-6);
    const logMax = Math.log10(1e-1);
    const logValue = logMin + (sliderValue / 100) * (logMax - logMin);
    return Math.pow(10, logValue);
  }, [epsilon]);

  // Reset to initial conditions
  const reset = useCallback(() => {
    const eps = epsilonValue();
    stateARef.current = { ...A0 };
    stateBRef.current = { x: A0.x + eps, y: A0.y, z: A0.z };
    trailARef.current = [];
    trailBRef.current = [];
    separationHistoryRef.current = [];
    rotationAngleRef.current = 0;
  }, [epsilonValue]);

  // Initialize
  useEffect(() => {
    reset();
  }, [reset]);

  // Reset when rho changes
  useEffect(() => {
    reset();
  }, [rho, reset]);

  // Compute separation
  const computeSeparation = useCallback((): number => {
    const dx = stateARef.current.x - stateBRef.current.x;
    const dy = stateARef.current.y - stateBRef.current.y;
    const dz = stateARef.current.z - stateBRef.current.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, []);

  // Update simulation step
  const updateStep = useCallback(() => {
    const dt = BASE_DT * speed;
    const eps = epsilonValue();

    // Update both trajectories
    stateARef.current = rk4Step(stateARef.current, SIGMA, rho, BETA, dt);
    stateBRef.current = rk4Step(stateBRef.current, SIGMA, rho, BETA, dt);

    // Add to trails
    trailARef.current.push({ ...stateARef.current, age: 0 });
    trailBRef.current.push({ ...stateBRef.current, age: 0 });

    // Age trails
    trailARef.current.forEach((p) => p.age++);
    trailBRef.current.forEach((p) => p.age++);

    // Trim trails
    if (trailARef.current.length > MAX_TRAIL_LENGTH) {
      trailARef.current = trailARef.current.slice(-MAX_TRAIL_LENGTH);
    }
    if (trailBRef.current.length > MAX_TRAIL_LENGTH) {
      trailBRef.current = trailBRef.current.slice(-MAX_TRAIL_LENGTH);
    }

    // Compute and store separation
    const separation = computeSeparation();
    separationHistoryRef.current.push(separation);
    if (separationHistoryRef.current.length > MAX_HISTORY) {
      separationHistoryRef.current = separationHistoryRef.current.slice(-MAX_HISTORY);
    }

    // Slow rotation for depth
    rotationAngleRef.current += 0.002;
  }, [speed, rho, epsilonValue, computeSeparation]);

  // Draw attractor view
  const drawAttractor = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Clear with transparent background (container provides background)
      ctx.clearRect(0, 0, width, height);

      // Projection parameters
      const scale = Math.min(width, height) * 0.15;
      const centerX = width / 2;
      const centerY = height / 2;

      // Rotation for depth
      const cos = Math.cos(rotationAngleRef.current);
      const sin = Math.sin(rotationAngleRef.current);

      // Project 3D to 2D with rotation
      const project = (x: number, y: number, z: number): [number, number] => {
        // Rotate around Y axis
        const xr = x * cos - z * sin;
        const zr = x * sin + z * cos;
        return [xr * scale + centerX, zr * scale + centerY];
      };

      // Draw trails with fade
      const drawTrail = (
        trail: TrailPoint[],
        color: string,
        glowColor: string
      ) => {
        if (trail.length < 2) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Draw trail segments
        for (let i = 1; i < trail.length; i++) {
          const p0 = trail[i - 1];
          const p1 = trail[i];
          const [x0, y0] = project(p0.x, p0.y, p0.z);
          const [x1, y1] = project(p1.x, p1.y, p1.z);

          // Alpha based on age (newer = brighter)
          const maxAge = Math.min(trail.length, 2000);
          const alpha0 = Math.max(0, 1 - p0.age / maxAge);
          const alpha1 = Math.max(0, 1 - p1.age / maxAge);

          // Glow effect
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 3;
          ctx.globalAlpha = alpha0 * 0.3;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          // Main line
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = Math.max(alpha0, alpha1) * 0.8;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }

        // Draw head orb
        if (trail.length > 0) {
          const head = trail[trail.length - 1];
          const [hx, hy] = project(head.x, head.y, head.z);

          // Glow
          const gradient = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8);
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(hx, hy, 8, 0, Math.PI * 2);
          ctx.fill();

          // Bright center
          ctx.fillStyle = color;
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.arc(hx, hy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      };

      // Draw both trails
      drawTrail(trailARef.current, '#00ffff', '#00ffff');
      drawTrail(trailBRef.current, '#ff00ff', '#ff00ff');
    },
    []
  );

  // Draw separation view
  const drawSeparation = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Clear with transparent background (container provides background)
      ctx.clearRect(0, 0, width, height);

      const history = separationHistoryRef.current;
      if (history.length < 2) return;

      const padding = 40;
      const plotWidth = width - 2 * padding;
      const plotHeight = height - 2 * padding;
      const plotX = padding;
      const plotY = padding;

      // Background - use semi-transparent instead of solid black
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(plotX, plotY, plotWidth, plotHeight);

      // Grid lines - adapt to theme
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = plotY + (plotHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(plotX, y);
        ctx.lineTo(plotX + plotWidth, y);
        ctx.stroke();
      }

      // Find min/max for scaling (log scale)
      const logValues = history.map((v) => Math.log10(Math.max(1e-10, v)));
      const minLog = Math.min(...logValues);
      const maxLog = Math.max(...logValues);
      const logRange = maxLog - minLog || 1;

      // Draw line
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < history.length; i++) {
        const x = plotX + (plotWidth / (history.length - 1)) * i;
        const logValue = Math.log10(Math.max(1e-10, history[i]));
        const y = plotY + plotHeight - ((logValue - minLog) / logRange) * plotHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Labels - adapt to theme
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Time', plotX + plotWidth / 2, height - 10);
      ctx.save();
      ctx.translate(10, plotY + plotHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Separation (log scale)', 0, 0);
      ctx.restore();

      // Y-axis labels
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const logValue = minLog + (logRange / 5) * i;
        const value = Math.pow(10, logValue);
        const y = plotY + plotHeight - (i / 5) * plotHeight;
        ctx.fillText(value.toExponential(1), plotX - 5, y + 4);
      }
    },
    []
  );

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (viewMode === 'attractor') {
      drawAttractor(ctx, width, height);
    } else {
      drawSeparation(ctx, width, height);
    }
  }, [viewMode, drawAttractor, drawSeparation]);

  // Animation loop
  useEffect(() => {
    const animate = (currentTime: number) => {
      if (isRunning) {
        const deltaTime = currentTime - lastTimeRef.current;
        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;

        if (deltaTime >= frameTime) {
          updateStep();
          lastTimeRef.current = currentTime;
        }
      }

      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, updateStep, draw]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.width * dpr; // Square aspect ratio
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.width}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      draw();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  // Format epsilon for display
  const formatEpsilon = (value: number): string => {
    const eps = Math.pow(10, Math.log10(1e-6) + (value / 100) * (Math.log10(1e-1) - Math.log10(1e-6)));
    if (eps < 1e-3) {
      return eps.toExponential(2);
    }
    return eps.toFixed(4);
  };

  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] aspect-square bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Primary controls */}
        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm">{isRunning ? 'Pause' : 'Play'}</span>
          </motion.button>

          <motion.button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Restart</span>
          </motion.button>
        </div>

        {/* View Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            View Mode
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setViewMode('attractor')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'attractor'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Attractor
            </motion.button>
            <motion.button
              onClick={() => setViewMode('separation')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'separation'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Separation Graph
            </motion.button>
          </div>
        </div>

        {/* Separation Slider (ε) */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Initial difference (ε): {formatEpsilon(epsilon)}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={epsilon}
            onChange={(e) => setEpsilon(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Speed Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Speed: {speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* ρ (Rho) Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            ρ (Rho): {rho.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={rho}
            onChange={(e) => setRho(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
      </div>
    </div>
  );
};

export default ChaosTheorySimulation;

