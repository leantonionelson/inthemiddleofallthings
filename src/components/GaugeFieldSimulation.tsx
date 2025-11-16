import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const ROWS = 24;
const COLS = 24;
const BASE_ALPHA = 0.15;

type GaugeCell = {
  angle: number; // in radians, range [0, 2π)
};

type GaugeGrid = GaugeCell[][];

// Neighbor offsets for 8-neighborhood (Moore)
const neighborOffsets = [
  [-1, 0], [1, 0],  // up, down
  [0, -1], [0, 1],  // left, right
  [-1, -1], [-1, 1], // diagonals
  [1, -1], [1, 1],
];

// Compute shortest signed angle difference on circle
function shortestAngleDelta(from: number, to: number): number {
  let diff = to - from;
  // Wrap into [-π, π]
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

// Normalize angle to [0, 2π)
function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized < 0) normalized += 2 * Math.PI;
  while (normalized >= 2 * Math.PI) normalized -= 2 * Math.PI;
  return normalized;
}

// Create initial grid (all aligned)
function createAlignedGrid(): GaugeGrid {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({ angle: 0 }))
  );
}

// Create random grid
function createRandomGrid(): GaugeGrid {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({ angle: Math.random() * 2 * Math.PI }))
  );
}

// Compute circular mean of angles
function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;
  
  let sx = 0;
  let sy = 0;
  for (const a of angles) {
    sx += Math.cos(a);
    sy += Math.sin(a);
  }
  
  let meanAngle = Math.atan2(sy, sx);
  if (meanAngle < 0) meanAngle += 2 * Math.PI;
  return meanAngle;
}

const GaugeFieldSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<GaugeGrid>(createAlignedGrid());
  const nextGridRef = useRef<GaugeGrid>(createAlignedGrid());
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);

  const [fieldStrength, setFieldStrength] = useState(65);
  const [gaugeFreedom, setGaugeFreedom] = useState(45);
  const [isRunning, setIsRunning] = useState(true);

  // Initialize nextGridRef
  useEffect(() => {
    nextGridRef.current = createAlignedGrid();
  }, []);

  // Get canvas context and cell dimensions
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    return { canvas, ctx };
  }, []);

  // Update grid based on field dynamics
  const updateGrid = useCallback(() => {
    const grid = gridRef.current;
    const nextGrid = nextGridRef.current;
    
    const fieldStrengthValue = fieldStrength / 100;
    const freedomValue = gaugeFreedom / 100;
    const effectiveAlpha = BASE_ALPHA * fieldStrengthValue * (1 - freedomValue * 0.5);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const angles: number[] = [];

        // Collect neighbor angles
        for (const [dr, dc] of neighborOffsets) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            angles.push(grid[nr][nc].angle);
          }
        }

        // Compute neighbor mean
        let neighbourMean: number;
        if (angles.length === 0) {
          neighbourMean = grid[r][c].angle;
        } else {
          neighbourMean = circularMean(angles);
        }

        // Interpolate towards neighbour mean
        const θ_self = grid[r][c].angle;
        const delta = shortestAngleDelta(θ_self, neighbourMean);
        const newAngle = normalizeAngle(θ_self + delta * effectiveAlpha);
        
        nextGrid[r][c].angle = newAngle;
      }
    }

    // Swap grids
    const temp = gridRef.current;
    gridRef.current = nextGridRef.current;
    nextGridRef.current = temp;
  }, [fieldStrength, gaugeFreedom]);

  // Draw the grid on canvas
  const drawGrid = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;

    const { canvas, ctx } = context;
    const cellWidth = canvas.width / COLS;
    const cellHeight = canvas.height / ROWS;
    const arrowLength = Math.min(cellWidth, cellHeight) * 0.35;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set drawing style
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    const grid = gridRef.current;

    // Draw each cell
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        const cx = c * cellWidth + cellWidth / 2;
        const cy = r * cellHeight + cellHeight / 2;

        // Optional: color by angle (hue)
        const hue = (cell.angle / (2 * Math.PI)) * 360;
        ctx.strokeStyle = isDark 
          ? `hsla(${hue}, 70%, 60%, 0.7)`
          : `hsla(${hue}, 70%, 40%, 0.7)`;

        // Draw arrow
        const ex = cx + Math.cos(cell.angle) * arrowLength;
        const ey = cy + Math.sin(cell.angle) * arrowLength;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Draw arrowhead
        const arrowheadAngle = Math.PI / 6;
        const arrowheadLength = arrowLength * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - arrowheadLength * Math.cos(cell.angle - arrowheadAngle),
          ey - arrowheadLength * Math.sin(cell.angle - arrowheadAngle)
        );
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - arrowheadLength * Math.cos(cell.angle + arrowheadAngle),
          ey - arrowheadLength * Math.sin(cell.angle + arrowheadAngle)
        );
        ctx.stroke();
      }
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isRunning) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      updateGrid();
      drawGrid();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRunning, updateGrid, drawGrid]);

  // Handle canvas resize and initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const maxSize = Math.min(container.clientWidth - 32, 600);
      canvas.width = maxSize;
      canvas.height = maxSize;
      // Draw initial state
      drawGrid();
    };

    // Initial setup
    resizeCanvas();
    
    // Redraw on resize
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawGrid]);

  // Initial draw when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Small delay to ensure canvas is rendered
      const timer = setTimeout(() => {
        drawGrid();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [drawGrid]);

  // Handle pointer events (tap/drag)
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDraggingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const cellWidth = canvas.width / COLS;
    const cellHeight = canvas.height / ROWS;
    const col = Math.floor(px / cellWidth);
    const row = Math.floor(py / cellHeight);

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      const cx = col * cellWidth + cellWidth / 2;
      const cy = row * cellHeight + cellHeight / 2;
      const dx = px - cx;
      const dy = py - cy;
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;

      gridRef.current[row][col].angle = angle;
      lastCellRef.current = { row, col };
      drawGrid();
    }
  }, [drawGrid]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const cellWidth = canvas.width / COLS;
    const cellHeight = canvas.height / ROWS;
    const col = Math.floor(px / cellWidth);
    const row = Math.floor(py / cellHeight);

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      // Only update if moved to a different cell
      if (!lastCellRef.current || lastCellRef.current.row !== row || lastCellRef.current.col !== col) {
        const cx = col * cellWidth + cellWidth / 2;
        const cy = row * cellHeight + cellHeight / 2;
        const dx = px - cx;
        const dy = py - cy;
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;

        gridRef.current[row][col].angle = angle;
        lastCellRef.current = { row, col };
        drawGrid();
      }
    }
  }, [drawGrid]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    lastCellRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    gridRef.current = createAlignedGrid();
    nextGridRef.current = createAlignedGrid();
    drawGrid();
  }, [drawGrid]);

  const handleRandomise = useCallback(() => {
    gridRef.current = createRandomGrid();
    nextGridRef.current = createRandomGrid();
    drawGrid();
  }, [drawGrid]);

  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] aspect-square bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-crosshair touch-none"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Field Strength Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Field Strength: {fieldStrength}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={fieldStrength}
            onChange={(e) => setFieldStrength(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Gauge Freedom Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Gauge Freedom: {gaugeFreedom}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={gaugeFreedom}
            onChange={(e) => setGaugeFreedom(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleRandomise}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Play
          </motion.button>
          <motion.button
            onClick={handleReset}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Reset
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default GaugeFieldSimulation;

