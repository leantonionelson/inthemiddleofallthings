import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';

// Configuration - reduced for memory efficiency
const DEFAULT_ROWS = 40;
const DEFAULT_COLS = 40;
const THRESHOLD = 4;
const MAX_HISTORY = 500;

type CellHeight = number;
type DropMode = 'center' | 'random';
type ViewMode = 'height' | 'avalanche';

interface SOCState {
  grid: CellHeight[];
  isRunning: boolean;
  autoDrop: boolean;
  dropSpeed: number;
  dropMode: DropMode;
  lastAvalancheSize: number;
  avalancheHistory: number[];
  viewMode: ViewMode;
  totalDrops: number;
  toppledThisFrame: boolean[];
}

// Color palette for height map (0-8)
const HEIGHT_COLORS: string[] = [
  '#000000', // 0: deep black
  '#1a1a3e', // 1: dark blue/purple
  '#2d5aa0', // 2: blue
  '#4a90e2', // 3: cyan/teal
  '#7dd3fc', // 4: light cyan
  '#fbbf24', // 5: yellow
  '#f59e0b', // 6: orange
  '#ef4444', // 7: red
  '#ffffff', // 8+: bright white
];

// Avalanche view colors
const AVALANCHE_ACTIVE = '#00ff88'; // bright green for active toppling
const AVALANCHE_DIM = '#111111'; // very dark for non-active

const SelfOrganisedCriticalitySimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  const stateRef = useRef<SOCState>({
    grid: new Array(DEFAULT_ROWS * DEFAULT_COLS).fill(0),
    isRunning: false,
    autoDrop: false,
    dropSpeed: 1,
    dropMode: 'center',
    lastAvalancheSize: 0,
    avalancheHistory: [],
    viewMode: 'height',
    totalDrops: 0,
    toppledThisFrame: new Array(DEFAULT_ROWS * DEFAULT_COLS).fill(false),
  });

  const [isRunning, setIsRunning] = useState(false);
  const [dropSpeed, setDropSpeed] = useState(1);
  const [dropMode, setDropMode] = useState<DropMode>('center');
  const [viewMode, setViewMode] = useState<ViewMode>('height');
  const [lastAvalancheSize, setLastAvalancheSize] = useState(0);
  const [totalDrops, setTotalDrops] = useState(0);
  const [avalancheHistory, setAvalancheHistory] = useState<number[]>([]);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update state refs when React state changes
  useEffect(() => {
    stateRef.current.isRunning = isRunning;
    stateRef.current.autoDrop = dropSpeed > 0;
    stateRef.current.dropSpeed = dropSpeed;
    stateRef.current.dropMode = dropMode;
    stateRef.current.viewMode = viewMode;
  }, [isRunning, dropSpeed, dropMode, viewMode]);

  // Add grain to neighbor (with boundary check)
  const addGrainToNeighbor = useCallback(
    (r: number, c: number, rows: number, cols: number, grid: CellHeight[]): boolean => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        // Grain falls off edge (dissipated)
        return false;
      }
      const idx = r * cols + c;
      grid[idx] += 1;
      return grid[idx] >= THRESHOLD;
    },
    []
  );

  // Perform one drop and settle (topple until stable)
  const performDropAndSettle = useCallback(() => {
    const state = stateRef.current;
    const { grid } = state;
    const rows = DEFAULT_ROWS;
    const cols = DEFAULT_COLS;

    // Clear toppled tracking
    state.toppledThisFrame.fill(false);

    // Determine drop location
    let dropR: number, dropC: number;
    if (state.dropMode === 'center') {
      dropR = Math.floor(rows / 2);
      dropC = Math.floor(cols / 2);
    } else {
      dropR = Math.floor(Math.random() * rows);
      dropC = Math.floor(Math.random() * cols);
    }

    const dropIdx = dropR * cols + dropC;
    grid[dropIdx] += 1;
    state.totalDrops += 1;

    // Toppling phase
    const queue: number[] = [];
    let avalancheSize = 0;

    // Check if drop cell is unstable
    if (grid[dropIdx] >= THRESHOLD) {
      queue.push(dropIdx);
    }

    // Process toppling queue
    while (queue.length > 0) {
      const idx = queue.shift()!;
      if (grid[idx] < THRESHOLD) continue; // Already stable

      const r = Math.floor(idx / cols);
      const c = idx % cols;

      // Topple: remove 4 grains
      grid[idx] -= 4;
      avalancheSize += 1;
      state.toppledThisFrame[idx] = true;

      // Distribute to neighbors
      if (addGrainToNeighbor(r + 1, c, rows, cols, grid)) {
        queue.push((r + 1) * cols + c);
      }
      if (addGrainToNeighbor(r - 1, c, rows, cols, grid)) {
        queue.push((r - 1) * cols + c);
      }
      if (addGrainToNeighbor(r, c + 1, rows, cols, grid)) {
        queue.push(r * cols + (c + 1));
      }
      if (addGrainToNeighbor(r, c - 1, rows, cols, grid)) {
        queue.push(r * cols + (c - 1));
      }
    }

    // Record avalanche
    state.lastAvalancheSize = avalancheSize;
    state.avalancheHistory.push(avalancheSize);
    if (state.avalancheHistory.length > MAX_HISTORY) {
      state.avalancheHistory.shift();
    }

    // Update React state
    setLastAvalancheSize(avalancheSize);
    setTotalDrops(state.totalDrops);
    setAvalancheHistory([...state.avalancheHistory]);
  }, [addGrainToNeighbor]);

  // Manual drop handler
  const handleManualDrop = useCallback(() => {
    performDropAndSettle();
    render();
  }, [performDropAndSettle]);

  // Reset simulation
  const handleReset = useCallback(() => {
    const state = stateRef.current;
    state.grid.fill(0);
    state.lastAvalancheSize = 0;
    state.avalancheHistory = [];
    state.totalDrops = 0;
    state.toppledThisFrame.fill(false);
    setLastAvalancheSize(0);
    setTotalDrops(0);
    setAvalancheHistory([]);
    render();
  }, []);

  // Render to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;
    const { grid, viewMode, toppledThisFrame } = state;
    const rows = DEFAULT_ROWS;
    const cols = DEFAULT_COLS;

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    // Clear with transparent background (container provides background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const height = grid[idx];
        const x = c * cellWidth;
        const y = r * cellHeight;

        let color: string;

        if (viewMode === 'height') {
          // Height map view
          const colorIdx = Math.min(height, HEIGHT_COLORS.length - 1);
          color = HEIGHT_COLORS[colorIdx];
        } else {
          // Avalanche view
          if (toppledThisFrame[idx]) {
            color = AVALANCHE_ACTIVE;
          } else {
            // Dim based on height but much darker
            const dimLevel = Math.min(height / 3, 0.3);
            const r = Math.floor(17 * dimLevel);
            const g = Math.floor(17 * dimLevel);
            const b = Math.floor(17 * dimLevel);
            color = `rgb(${r}, ${g}, ${b})`;
          }
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    }
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const state = stateRef.current;
      if (state.isRunning && state.autoDrop && state.dropSpeed > 0) {
        accumulatorRef.current += dt;
        const dropInterval = 1 / state.dropSpeed;
        while (accumulatorRef.current >= dropInterval) {
          performDropAndSettle();
          accumulatorRef.current -= dropInterval;
        }
      }

      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, performDropAndSettle, render]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const maxWidth = Math.min(container.clientWidth - 32, 800);
      const aspectRatio = DEFAULT_COLS / DEFAULT_ROWS;
      canvas.width = maxWidth;
      canvas.height = maxWidth / aspectRatio;

      render();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [render]);

  // Convert canvas coordinates to grid coordinates
  const canvasToGrid = useCallback((clientX: number, clientY: number): { r: number; c: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cellWidth = canvas.width / DEFAULT_COLS;
    const cellHeight = canvas.height / DEFAULT_ROWS;

    const c = Math.floor(x / cellWidth);
    const r = Math.floor(y / cellHeight);

    if (r >= 0 && r < DEFAULT_ROWS && c >= 0 && c < DEFAULT_COLS) {
      return { r, c };
    }
    return null;
  }, []);

  // Handle canvas click for manual drop
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const gridPos = canvasToGrid(e.clientX, e.clientY);
      if (!gridPos) return;

      // Temporarily set drop mode to this position
      const state = stateRef.current;
      const oldDropMode = state.dropMode;
      const oldDropSpeed = state.dropSpeed;

      // Force center mode and set position
      const rows = DEFAULT_ROWS;
      const cols = DEFAULT_COLS;
      const targetIdx = gridPos.r * cols + gridPos.c;

      // Add grain at clicked position
      state.grid[targetIdx] += 1;
      state.totalDrops += 1;

      // Topple
      const queue: number[] = [];
      let avalancheSize = 0;
      state.toppledThisFrame.fill(false);

      if (state.grid[targetIdx] >= THRESHOLD) {
        queue.push(targetIdx);
      }

      while (queue.length > 0) {
        const idx = queue.shift()!;
        if (state.grid[idx] < THRESHOLD) continue;

        const r = Math.floor(idx / cols);
        const c = idx % cols;

        state.grid[idx] -= 4;
        avalancheSize += 1;
        state.toppledThisFrame[idx] = true;

        if (addGrainToNeighbor(r + 1, c, rows, cols, state.grid)) {
          queue.push((r + 1) * cols + c);
        }
        if (addGrainToNeighbor(r - 1, c, rows, cols, state.grid)) {
          queue.push((r - 1) * cols + c);
        }
        if (addGrainToNeighbor(r, c + 1, rows, cols, state.grid)) {
          queue.push(r * cols + (c + 1));
        }
        if (addGrainToNeighbor(r, c - 1, rows, cols, state.grid)) {
          queue.push(r * cols + (c - 1));
        }
      }

      state.lastAvalancheSize = avalancheSize;
      state.avalancheHistory.push(avalancheSize);
      if (state.avalancheHistory.length > MAX_HISTORY) {
        state.avalancheHistory.shift();
      }

      setLastAvalancheSize(avalancheSize);
      setTotalDrops(state.totalDrops);
      setAvalancheHistory([...state.avalancheHistory]);

      render();
    },
    [canvasToGrid, addGrainToNeighbor, render]
  );

  // Draw mini histogram/sparkline
  const drawAvalancheGraph = useCallback(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas || avalancheHistory.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = 10;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    const plotX = padding;
    const plotY = padding;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background - use semi-transparent to match theme
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(plotX, plotY, plotWidth, plotHeight);

    // Find max for scaling (log scale)
    const maxVal = Math.max(...avalancheHistory, 1);
    const logMax = Math.log10(Math.max(maxVal, 1));

    // Draw line/sparkline
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < avalancheHistory.length; i++) {
      const x = plotX + (plotWidth / (avalancheHistory.length - 1)) * i;
      const logValue = Math.log10(Math.max(avalancheHistory[i], 1));
      const y = plotY + plotHeight - (logValue / logMax) * plotHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [avalancheHistory]);

  // Update graph when history changes
  useEffect(() => {
    drawAvalancheGraph();
  }, [drawAvalancheGraph]);

  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] aspect-square bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair touch-none"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Avalanche Analytics Panel */}
      <div className="mb-4 p-4 rounded-lg bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-ink-secondary dark:text-ink-muted mb-1">Last Avalanche</div>
            <div className="text-lg font-mono text-ink-primary dark:text-paper-light">
              {lastAvalancheSize}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-secondary dark:text-ink-muted mb-1">Total Drops</div>
            <div className="text-lg font-mono text-ink-primary dark:text-paper-light">{totalDrops}</div>
          </div>
        </div>
        {avalancheHistory.length > 0 && (
          <div className="h-20">
            <canvas ref={graphCanvasRef} className="w-full h-full" />
          </div>
        )}
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
            onClick={handleManualDrop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Drop Grain</span>
          </motion.button>

          <motion.button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset</span>
          </motion.button>
        </div>

        {/* Drop Speed Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Drop Speed: {dropSpeed === 0 ? 'Manual' : `${dropSpeed.toFixed(1)}/s`}
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            value={dropSpeed}
            onChange={(e) => setDropSpeed(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Drop Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Drop Mode
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setDropMode('center')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                dropMode === 'center'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Center
            </motion.button>
            <motion.button
              onClick={() => setDropMode('random')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                dropMode === 'random'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Random
            </motion.button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            View Mode
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setViewMode('height')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'height'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Height Map
            </motion.button>
            <motion.button
              onClick={() => setViewMode('avalanche')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'avalanche'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Avalanche
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfOrganisedCriticalitySimulation;

