import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Physics constants
const DT_FIXED = 1 / 60; // Fixed timestep
const PARTICLE_RADIUS = 2.5; // Pixels
const NUM_PARTICLES = 200;
const FRICTION = 0.8; // Damping coefficient
const SIM_BOUNDS = { xMin: -6, xMax: 6, yMin: -4, yMax: 4 };

// Potential function: double-well with optional barrier
const getPotential = (x: number, y: number, barrierHeight: number = 0): number => {
  // Deep Narrow Well (Left) - low energy, low entropy
  const well1 = -10 * Math.exp(-((x + 2) ** 2 + y ** 2) / 0.2);
  // Shallow Wide Well (Right) - higher energy, high entropy
  const well2 = -5 * Math.exp(-((x - 2) ** 2 + y ** 2) / 4.0);
  // Central barrier (Gaussian ridge)
  const barrier = barrierHeight * Math.exp(-(x ** 2 + y ** 2) / 1.0);
  return well1 + well2 + barrier;
};

// Compute gradient via central finite differences
const getGradient = (x: number, y: number, barrierHeight: number = 0): { fx: number; fy: number } => {
  const h = 0.01;
  const fx = -(getPotential(x + h, y, barrierHeight) - getPotential(x - h, y, barrierHeight)) / (2 * h);
  const fy = -(getPotential(x, y + h, barrierHeight) - getPotential(x, y - h, barrierHeight)) / (2 * h);
  return { fx, fy };
};

// Normal random number generator (Box-Muller)
const randNormal = (): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface FreeEnergyState {
  particles: Particle[];
  speedMultiplier: number;
  temperature: number;
  barrierHeight: number;
  isPlaying: boolean;
}

const FreeEnergySimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FreeEnergyState>({
    particles: [],
    speedMultiplier: 1,
    temperature: 0.5,
    barrierHeight: 0,
    isPlaying: true,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [temperature, setTemperature] = useState(0.5);
  const [barrierHeight, setBarrierHeight] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Initialize particles randomly across domain
  const initializeParticles = useCallback((): Particle[] => {
    const particles: Particle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: SIM_BOUNDS.xMin + Math.random() * (SIM_BOUNDS.xMax - SIM_BOUNDS.xMin),
        y: SIM_BOUNDS.yMin + Math.random() * (SIM_BOUNDS.yMax - SIM_BOUNDS.yMin),
        vx: 0,
        vy: 0,
      });
    }
    return particles;
  }, []);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    stateRef.current.particles = initializeParticles();
    accumulatorRef.current = 0;
  }, [initializeParticles]);

  // Update state refs when controls change
  useEffect(() => {
    stateRef.current.speedMultiplier = speed;
    stateRef.current.temperature = temperature;
    stateRef.current.barrierHeight = barrierHeight;
    stateRef.current.isPlaying = isPlaying;
  }, [speed, temperature, barrierHeight, isPlaying]);

  // Initialize on mount
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Calculate occupancy percentages
  const calculateOccupancy = useCallback((): { leftPercent: number; rightPercent: number } => {
    const state = stateRef.current;
    let leftCount = 0;
    let rightCount = 0;

    for (const p of state.particles) {
      if (p.x < 0) {
        leftCount++;
      } else {
        rightCount++;
      }
    }

    const total = state.particles.length;
    return {
      leftPercent: (leftCount / total) * 100,
      rightPercent: (rightCount / total) * 100,
    };
  }, []);

  // Determine free energy state
  const getFreeEnergyState = useCallback((): string => {
    const { leftPercent, rightPercent } = calculateOccupancy();
    const temp = stateRef.current.temperature;

    if (temp < 0.3) {
      return 'Energy dominated';
    } else if (temp > 1.5) {
      return 'Entropy dominated';
    } else {
      return 'Balanced';
    }
  }, [calculateOccupancy]);

  // Update physics (overdamped Langevin dynamics)
  const updatePhysics = useCallback((dt: number) => {
    const state = stateRef.current;
    const dtScaled = dt * state.speedMultiplier;

    for (const p of state.particles) {
      // Get potential force (gradient)
      const { fx, fy } = getGradient(p.x, p.y, state.barrierHeight);

      // Thermal noise
      const noiseScale = state.temperature * 0.3;
      const fxNoise = noiseScale * randNormal();
      const fyNoise = noiseScale * randNormal();

      // Total force
      const fxTotal = fx + fxNoise;
      const fyTotal = fy + fyNoise;

      // Overdamped update: v = v + (F - friction * v) * dt
      p.vx = p.vx + (fxTotal - FRICTION * p.vx) * dtScaled;
      p.vy = p.vy + (fyTotal - FRICTION * p.vy) * dtScaled;

      // Update position
      p.x += p.vx * dtScaled;
      p.y += p.vy * dtScaled;

      // Clamp to bounds
      p.x = Math.max(SIM_BOUNDS.xMin, Math.min(SIM_BOUNDS.xMax, p.x));
      p.y = Math.max(SIM_BOUNDS.yMin, Math.min(SIM_BOUNDS.yMax, p.y));

      // Bounce off walls (optional, or just clamp)
      if (p.x <= SIM_BOUNDS.xMin || p.x >= SIM_BOUNDS.xMax) {
        p.vx *= -0.5;
      }
      if (p.y <= SIM_BOUNDS.yMin || p.y >= SIM_BOUNDS.yMax) {
        p.vy *= -0.5;
      }
    }
  }, []);

  // Get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  // World to screen coordinates
  const worldToScreen = useCallback((x: number, y: number, width: number, height: number) => {
    const scaleX = width / (SIM_BOUNDS.xMax - SIM_BOUNDS.xMin);
    const scaleY = height / (SIM_BOUNDS.yMax - SIM_BOUNDS.yMin);
    const screenX = (x - SIM_BOUNDS.xMin) * scaleX;
    const screenY = height - (y - SIM_BOUNDS.yMin) * scaleY; // Flip Y
    return { x: screenX, y: screenY };
  }, []);

  // Draw simulation
  const draw = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;

    const { canvas, ctx } = context;
    const state = stateRef.current;
    const isDark = document.documentElement.classList.contains('dark');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background colors (theme-aware, no pure black)
    const bgColor = isDark ? '#070b14' : '#f4f5f8';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw potential heatmap
    const heatmapResolution = 60;
    const cellWidth = canvas.width / heatmapResolution;
    const cellHeight = canvas.height / heatmapResolution;

    for (let i = 0; i < heatmapResolution; i++) {
      for (let j = 0; j < heatmapResolution; j++) {
        const screenX = i * cellWidth;
        const screenY = j * cellHeight;
        const worldX = SIM_BOUNDS.xMin + (i / heatmapResolution) * (SIM_BOUNDS.xMax - SIM_BOUNDS.xMin);
        const worldY = SIM_BOUNDS.yMin + (1 - j / heatmapResolution) * (SIM_BOUNDS.yMax - SIM_BOUNDS.yMin);

        const potential = getPotential(worldX, worldY, state.barrierHeight);
        const normalized = (potential + 10) / 10; // Normalize to 0-1 range

        if (isDark) {
          // Dark mode: saturated colors for deep well, softer for wide well
          if (normalized < 0.3) {
            // Deep well - saturated blue/purple
            ctx.fillStyle = `rgba(100, 150, 255, ${0.4 + normalized * 0.3})`;
          } else {
            // Wide well - softer gradient
            ctx.fillStyle = `rgba(150, 200, 255, ${0.1 + normalized * 0.2})`;
          }
        } else {
          // Light mode: pastel gradients
          if (normalized < 0.3) {
            ctx.fillStyle = `rgba(200, 220, 255, ${0.3 + normalized * 0.4})`;
          } else {
            ctx.fillStyle = `rgba(230, 240, 255, ${0.2 + normalized * 0.3})`;
          }
        }

        ctx.fillRect(screenX, screenY, cellWidth, cellHeight);
      }
    }

    // Draw particles
    for (const p of state.particles) {
      const screen = worldToScreen(p.x, p.y, canvas.width, canvas.height);

      // Particle glow
      ctx.save();
      const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, PARTICLE_RADIUS * 3);
      
      if (isDark) {
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 180, 80, 0.6)');
        gradient.addColorStop(1, 'transparent');
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 200, 100, 0.8)';
      } else {
        gradient.addColorStop(0, 'rgba(50, 80, 150, 0.9)');
        gradient.addColorStop(0.5, 'rgba(80, 120, 200, 0.6)');
        gradient.addColorStop(1, 'transparent');
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(50, 80, 150, 0.6)';
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, PARTICLE_RADIUS * 3, 0, 2 * Math.PI);
      ctx.fill();

      // Core particle
      ctx.fillStyle = isDark ? '#ffc864' : '#3250a0';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, PARTICLE_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();
    }

    // Draw HUD: Occupancy bar
    const { leftPercent, rightPercent } = calculateOccupancy();
    const hudY = 20;
    const hudHeight = 30;
    const hudWidth = canvas.width * 0.6;
    const hudX = (canvas.width - hudWidth) / 2;

    // Background
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(hudX, hudY, hudWidth, hudHeight);

    // Left well (deep)
    const leftWidth = (leftPercent / 100) * hudWidth;
    ctx.fillStyle = isDark ? 'rgba(100, 150, 255, 0.8)' : 'rgba(100, 150, 255, 0.6)';
    ctx.fillRect(hudX, hudY, leftWidth, hudHeight);

    // Right well (wide)
    const rightWidth = (rightPercent / 100) * hudWidth;
    ctx.fillStyle = isDark ? 'rgba(150, 200, 255, 0.6)' : 'rgba(150, 200, 255, 0.5)';
    ctx.fillRect(hudX + leftWidth, hudY, rightWidth, hudHeight);

    // Divider
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hudX + hudWidth / 2, hudY);
    ctx.lineTo(hudX + hudWidth / 2, hudY + hudHeight);
    ctx.stroke();

    // Labels
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Deep: ${leftPercent.toFixed(1)}%`, hudX + hudWidth / 4, hudY + hudHeight / 2 + 4);
    ctx.fillText(`Wide: ${rightPercent.toFixed(1)}%`, hudX + (3 * hudWidth) / 4, hudY + hudHeight / 2 + 4);

    // Free Energy Indicator
    const freeEnergyState = getFreeEnergyState();
    const indicatorY = hudY + hudHeight + 15;
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Free Energy: ${freeEnergyState}`, canvas.width / 2, indicatorY);
  }, [getCanvasContext, worldToScreen, calculateOccupancy, getFreeEnergyState]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      draw(); // Still draw when paused
      return;
    }

    const animate = () => {
      const now = performance.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      accumulatorRef.current += deltaTime;

      while (accumulatorRef.current >= DT_FIXED) {
        updatePhysics(DT_FIXED);
        accumulatorRef.current -= DT_FIXED;
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
  }, [isPlaying, updatePhysics, draw]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] aspect-[4/3] bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
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
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-sm">{isPlaying ? 'Pause' : 'Play'}</span>
          </motion.button>

          <motion.button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset</span>
          </motion.button>
        </div>

        {/* Temperature slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Temperature: {temperature.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Barrier Height slider (optional) */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Barrier Height: {barrierHeight.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={barrierHeight}
            onChange={(e) => setBarrierHeight(parseFloat(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Speed slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Speed: {speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
      </div>
    </div>
  );
};

export default FreeEnergySimulation;

