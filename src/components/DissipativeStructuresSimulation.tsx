import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Droplet } from 'lucide-react';

// Physics constants
const DT_FIXED = 1 / 60; // Fixed timestep
const GRID_WIDTH = 100;
const GRID_HEIGHT = 50;
const CELL_SIZE = 8; // Pixels per cell

// Physics parameters
const DIFFUSION_RATE = 0.1;
const BUOYANCY_STRENGTH = 0.5;
const VISCOSITY_BASE = 0.05;
const ADVECTION_STRENGTH = 0.8;
const CRITICAL_THRESHOLD = 0.3; // Minimum ΔT for convection

// Tracer particles
interface Tracer {
  x: number;
  y: number;
  age: number;
}

// Grid cell state
interface Cell {
  temperature: number; // 0 (cold) to 1 (hot)
  vx: number; // Velocity x
  vy: number; // Velocity y
}

const DissipativeStructuresSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Cell[][]>([]);
  const gridTempRef = useRef<Cell[][]>([]); // Temporary grid for updates
  const tracersRef = useRef<Tracer[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [heatInput, setHeatInput] = useState(0.2); // ΔT (0 to 1)
  const [viscosity, setViscosity] = useState(0.5); // 0 to 1
  const [noise, setNoise] = useState(0.1); // 0 to 1
  const [showVectors, setShowVectors] = useState(false);

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const grid: Cell[][] = [];
    const gridTemp: Cell[][] = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y] = [];
      gridTemp[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        // Linear temperature gradient from hot (bottom) to cold (top)
        const baseTemp = 1 - (y / GRID_HEIGHT);
        grid[y][x] = {
          temperature: baseTemp + (Math.random() - 0.5) * 0.1,
          vx: 0,
          vy: 0,
        };
        gridTemp[y][x] = {
          temperature: 0,
          vx: 0,
          vy: 0,
        };
      }
    }

    gridRef.current = grid;
    gridTempRef.current = gridTemp;
    tracersRef.current = [];
  }, []);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    initializeGrid();
    tracersRef.current = [];
    accumulatorRef.current = 0;
  }, [initializeGrid]);

  // Initialize on mount
  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  // Inject dye (tracer particles)
  const injectDye = useCallback(() => {
    const newTracers: Tracer[] = [];
    // Add tracers at random positions
    for (let i = 0; i < 50; i++) {
      newTracers.push({
        x: Math.random() * GRID_WIDTH,
        y: Math.random() * GRID_HEIGHT,
        age: 0,
      });
    }
    tracersRef.current.push(...newTracers);
  }, []);

  // Update physics
  const updatePhysics = useCallback((dt: number) => {
    const grid = gridRef.current;
    const gridTemp = gridTempRef.current;
    if (!grid || !gridTemp) return;

    const viscosityValue = VISCOSITY_BASE + viscosity * 0.2;
    const noiseStrength = noise * 0.02;

    // Apply boundary conditions (hot bottom, cold top)
    const bottomTemp = 0.5 + heatInput * 0.5; // Hot
    const topTemp = 0.5 - heatInput * 0.5; // Cold

    // Initialize gridTemp from grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        gridTemp[y][x].temperature = grid[y][x].temperature;
        gridTemp[y][x].vx = grid[y][x].vx;
        gridTemp[y][x].vy = grid[y][x].vy;
      }
    }

    // Step 1: Temperature diffusion
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
      for (let x = 1; x < GRID_WIDTH - 1; x++) {
        const cell = grid[y][x];
        const temp = gridTemp[y][x];

        // Diffusion to neighbors
        const laplacian =
          (grid[y - 1][x].temperature +
            grid[y + 1][x].temperature +
            grid[y][x - 1].temperature +
            grid[y][x + 1].temperature -
            4 * cell.temperature) *
          DIFFUSION_RATE;

        temp.temperature = cell.temperature + laplacian * dt;
      }
    }

    // Step 2: Buoyancy (hot rises, cold sinks)
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
      for (let x = 1; x < GRID_WIDTH - 1; x++) {
        const cell = grid[y][x];
        const temp = gridTemp[y][x];

        // Temperature difference from average
        const avgTemp = (grid[y - 1][x].temperature + grid[y + 1][x].temperature) / 2;
        const tempDiff = cell.temperature - avgTemp;

        // Buoyancy force (only if above critical threshold)
        if (heatInput > CRITICAL_THRESHOLD) {
          temp.vy += tempDiff * BUOYANCY_STRENGTH * dt;
        }

        // Add noise
        temp.vx += (Math.random() - 0.5) * noiseStrength;
        temp.vy += (Math.random() - 0.5) * noiseStrength;
      }
    }

    // Step 3: Velocity diffusion (viscosity)
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
      for (let x = 1; x < GRID_WIDTH - 1; x++) {
        const temp = gridTemp[y][x];

        // Viscosity smoothing
        const vxLaplacian =
          (grid[y - 1][x].vx +
            grid[y + 1][x].vx +
            grid[y][x - 1].vx +
            grid[y][x + 1].vx -
            4 * grid[y][x].vx) *
          viscosityValue;

        const vyLaplacian =
          (grid[y - 1][x].vy +
            grid[y + 1][x].vy +
            grid[y][x - 1].vy +
            grid[y][x + 1].vy -
            4 * grid[y][x].vy) *
          viscosityValue;

        temp.vx = grid[y][x].vx + vxLaplacian * dt;
        temp.vy = grid[y][x].vy + vyLaplacian * dt;

        // Damping
        temp.vx *= 0.98;
        temp.vy *= 0.98;
      }
    }

    // Step 4: Advection (velocity moves temperature)
    // Use updated velocity from gridTemp to advect temperature from original grid
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
      for (let x = 1; x < GRID_WIDTH - 1; x++) {
        const temp = gridTemp[y][x];
        const vx = temp.vx;
        const vy = temp.vy;

        // Backtrace position (where the temperature came from)
        const srcX = x - vx * ADVECTION_STRENGTH * dt;
        const srcY = y - vy * ADVECTION_STRENGTH * dt;

        // Bilinear interpolation
        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const x1 = Math.min(x0 + 1, GRID_WIDTH - 1);
        const y1 = Math.min(y0 + 1, GRID_HEIGHT - 1);

        const fx = srcX - x0;
        const fy = srcY - y0;

        if (x0 >= 0 && y0 >= 0 && x1 < GRID_WIDTH && y1 < GRID_HEIGHT) {
          // Read temperature from original grid (before this timestep)
          const temp00 = grid[y0][x0].temperature;
          const temp01 = grid[y0][x1].temperature;
          const temp10 = grid[y1][x0].temperature;
          const temp11 = grid[y1][x1].temperature;

          const advectedTemp =
            (1 - fx) * (1 - fy) * temp00 +
            fx * (1 - fy) * temp01 +
            (1 - fx) * fy * temp10 +
            fx * fy * temp11;

          // Combine advected temperature with diffused temperature
          temp.temperature = 0.5 * advectedTemp + 0.5 * temp.temperature;
        }
      }
    }

    // Step 5: Apply boundary conditions and swap grids
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (y === 0) {
          // Top: cold
          grid[y][x].temperature = topTemp;
          grid[y][x].vx = 0;
          grid[y][x].vy = 0;
        } else if (y === GRID_HEIGHT - 1) {
          // Bottom: hot
          grid[y][x].temperature = bottomTemp;
          grid[y][x].vx = 0;
          grid[y][x].vy = 0;
        } else if (x === 0 || x === GRID_WIDTH - 1) {
          // Sides: reflective
          grid[y][x].temperature = gridTemp[y][x].temperature;
          grid[y][x].vx = 0; // No-slip boundary
          grid[y][x].vy = gridTemp[y][x].vy;
        } else {
          // Interior: copy from temp
          grid[y][x].temperature = gridTemp[y][x].temperature;
          grid[y][x].vx = gridTemp[y][x].vx;
          grid[y][x].vy = gridTemp[y][x].vy;
        }
      }
    }

    // Update tracer particles
    for (let i = tracersRef.current.length - 1; i >= 0; i--) {
      const tracer = tracersRef.current[i];
      tracer.age += dt;

      // Remove old tracers
      if (tracer.age > 10) {
        tracersRef.current.splice(i, 1);
        continue;
      }

      // Advect tracer with velocity field
      const x = Math.floor(tracer.x);
      const y = Math.floor(tracer.y);

      if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
        const cell = grid[y][x];
        tracer.x += cell.vx * dt * 2;
        tracer.y += cell.vy * dt * 2;

        // Wrap around sides
        if (tracer.x < 0) tracer.x += GRID_WIDTH;
        if (tracer.x >= GRID_WIDTH) tracer.x -= GRID_WIDTH;
        if (tracer.y < 0) tracer.y = 0;
        if (tracer.y >= GRID_HEIGHT) tracer.y = GRID_HEIGHT - 1;
      }
    }
  }, [heatInput, viscosity, noise]);

  // Get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  // Draw simulation
  const draw = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;

    const { canvas, ctx } = context;
    const grid = gridRef.current;
    if (!grid) return;

    const isDark = document.documentElement.classList.contains('dark');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background (theme-aware, no pure black)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isDark) {
      bgGradient.addColorStop(0, '#070a12');
      bgGradient.addColorStop(1, '#0a0f1a');
    } else {
      bgGradient.addColorStop(0, '#f4f4f5');
      bgGradient.addColorStop(1, '#eaecef');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw temperature field
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const temp = grid[y][x].temperature;
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        // Color based on temperature and theme
        let r, g, b;
        if (isDark) {
          // Dark mode: magma to ice (red → orange → teal)
          if (temp > 0.5) {
            // Hot: red to orange
            const t = (temp - 0.5) * 2;
            r = 255;
            g = Math.floor(100 + t * 155);
            b = Math.floor(50 + t * 50);
          } else {
            // Cold: orange to teal
            const t = temp * 2;
            r = Math.floor(255 - t * 155);
            g = Math.floor(255 - t * 100);
            b = Math.floor(100 + t * 155);
          }
        } else {
          // Light mode: pastel yellow to blue
          if (temp > 0.5) {
            // Hot: yellow
            const t = (temp - 0.5) * 2;
            r = 255;
            g = Math.floor(240 + t * 15);
            b = Math.floor(200 - t * 100);
          } else {
            // Cold: blue
            const t = temp * 2;
            r = Math.floor(200 - t * 100);
            g = Math.floor(220 - t * 50);
            b = Math.floor(240 + t * 15);
          }
        }

        // Draw cell
        for (let dy = 0; dy < CELL_SIZE; dy++) {
          for (let dx = 0; dx < CELL_SIZE; dx++) {
            const idx = ((py + dy) * canvas.width + (px + dx)) * 4;
            if (idx >= 0 && idx < data.length - 3) {
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw velocity vectors (optional)
    if (showVectors) {
      ctx.strokeStyle = isDark ? 'rgba(0, 255, 255, 0.6)' : 'rgba(50, 50, 50, 0.6)';
      ctx.lineWidth = 1;

      for (let y = 5; y < GRID_HEIGHT - 5; y += 5) {
        for (let x = 5; x < GRID_WIDTH - 5; x += 5) {
          const cell = grid[y][x];
          const vx = cell.vx * 20;
          const vy = cell.vy * 20;
          const mag = Math.sqrt(vx * vx + vy * vy);

          if (mag > 0.1) {
            const px = x * CELL_SIZE + CELL_SIZE / 2;
            const py = y * CELL_SIZE + CELL_SIZE / 2;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + vx, py + vy);
            ctx.stroke();
          }
        }
      }
    }

    // Draw tracer particles
    for (const tracer of tracersRef.current) {
      const px = tracer.x * CELL_SIZE;
      const py = tracer.y * CELL_SIZE;
      const alpha = Math.max(0, 1 - tracer.age / 10);

      ctx.fillStyle = isDark
        ? `rgba(0, 255, 255, ${alpha * 0.8})`
        : `rgba(0, 100, 200, ${alpha * 0.8})`;

      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [showVectors, getCanvasContext]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      draw();
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
      // Maintain aspect ratio based on grid
      const aspectRatio = (GRID_WIDTH * CELL_SIZE) / (GRID_HEIGHT * CELL_SIZE);
      const maxWidth = rect.width;
      const maxHeight = rect.height;

      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;
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
        <div className="w-full max-w-[800px] bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full"
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
            onClick={injectDye}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Droplet className="w-4 h-4" />
            <span className="text-sm">Inject Dye</span>
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

          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 border border-ink-muted/20 dark:border-paper-light/20 cursor-pointer">
            <input
              type="checkbox"
              checked={showVectors}
              onChange={(e) => setShowVectors(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-ink-primary dark:text-paper-light">Show Vectors</span>
          </label>
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
              Heat Input (ΔT): {heatInput.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={heatInput}
              onChange={(e) => setHeatInput(parseFloat(e.target.value))}
              className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
              Viscosity: {viscosity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={viscosity}
              onChange={(e) => setViscosity(parseFloat(e.target.value))}
              className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
              Noise: {noise.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={noise}
              onChange={(e) => setNoise(parseFloat(e.target.value))}
              className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DissipativeStructuresSimulation;

