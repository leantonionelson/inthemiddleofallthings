import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';

// Configuration
const ROWS = 80;
const COLS = 80;
const FADE_DECAY = 0.1;
const MAX_AGE = 100;

type CellState = 0 | 1;

type LifePresetId = 'random' | 'glider' | 'pulsar' | 'glider-gun';

interface LifeConfig {
  rows: number;
  cols: number;
  wrapEdges: boolean;
}

interface GameOfLifeState {
  currentGrid: Uint8Array;
  nextGrid: Uint8Array;
  ages: Uint16Array;
  fade: Float32Array;
  generation: number;
  isRunning: boolean;
  speed: number;
  mode: 'standard' | 'biological';
  drawMode: 'pen' | 'erase';
  selectedPreset: LifePresetId | null;
}

// Count neighbours with toroidal wrapping
function countNeighbours(
  grid: Uint8Array,
  r: number,
  c: number,
  rows: number,
  cols: number,
  wrapEdges: boolean
): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      
      let rr = r + dr;
      let cc = c + dc;
      
      if (wrapEdges) {
        rr = (rr + rows) % rows;
        cc = (cc + cols) % cols;
      } else {
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      }
      
      count += grid[rr * cols + cc];
    }
  }
  return count;
}

// Compute next generation
function nextGeneration(
  state: GameOfLifeState,
  config: LifeConfig
): void {
  const { currentGrid, nextGrid, ages, fade } = state;
  const { rows, cols, wrapEdges } = config;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const alive = currentGrid[idx];
      const neighbours = countNeighbours(currentGrid, r, c, rows, cols, wrapEdges);
      
      // Conway's rules: B3/S23
      let aliveNext: CellState;
      if (alive === 1) {
        // Survival: 2 or 3 neighbours
        aliveNext = (neighbours === 2 || neighbours === 3) ? 1 : 0;
      } else {
        // Reproduction: exactly 3 neighbours
        aliveNext = neighbours === 3 ? 1 : 0;
      }
      
      nextGrid[idx] = aliveNext;
      
      // Update age and fade
      if (aliveNext === 1) {
        ages[idx] = alive ? ages[idx] + 1 : 1;
        fade[idx] = 1.0;
      } else {
        ages[idx] = 0;
        fade[idx] = Math.max(0, fade[idx] - FADE_DECAY);
      }
    }
  }
  
  // Swap buffers
  const temp = state.currentGrid;
  state.currentGrid = state.nextGrid;
  state.nextGrid = temp;
}

// Preset patterns
function stampPattern(
  grid: Uint8Array,
  ages: Uint16Array,
  fade: Float32Array,
  pattern: number[][],
  startR: number,
  startC: number,
  rows: number,
  cols: number
): void {
  for (let i = 0; i < pattern.length; i++) {
    const [r, c] = pattern[i];
    const rr = startR + r;
    const cc = startC + c;
    
    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
      const idx = rr * cols + cc;
      grid[idx] = 1;
      ages[idx] = 1;
      fade[idx] = 1.0;
    }
  }
}

// Glider pattern
const GLIDER_PATTERN: number[][] = [
  [0, 1], [1, 2], [2, 0], [2, 1], [2, 2]
];

// Pulsar pattern (period-3 oscillator, 15x15)
const PULSAR_PATTERN: number[][] = [
  // Top left block
  [2, 4], [2, 5], [2, 6],
  [3, 4], [3, 5], [3, 6],
  [4, 4], [4, 5], [4, 6],
  // Top right block
  [2, 10], [2, 11], [2, 12],
  [3, 10], [3, 11], [3, 12],
  [4, 10], [4, 11], [4, 12],
  // Bottom left block
  [10, 4], [10, 5], [10, 6],
  [11, 4], [11, 5], [11, 6],
  [12, 4], [12, 5], [12, 6],
  // Bottom right block
  [10, 10], [10, 11], [10, 12],
  [11, 10], [11, 11], [11, 12],
  [12, 10], [12, 11], [12, 12],
  // Horizontal arms
  [0, 6], [0, 10],
  [5, 2], [5, 14],
  [7, 2], [7, 14],
  [9, 6], [9, 10],
  [14, 6], [14, 10],
  // Vertical arms
  [6, 0], [10, 0],
  [2, 7], [2, 9],
  [12, 7], [12, 9],
  [6, 14], [10, 14]
];

// Gosper Glider Gun pattern (36x9)
const GOSPER_GLIDER_GUN_PATTERN: number[][] = [
  // Left square
  [5, 1], [5, 2], [6, 1], [6, 2],
  // Left block
  [3, 13], [3, 14], [4, 12], [4, 16],
  [5, 11], [5, 17], [6, 11], [6, 15], [6, 17], [6, 18],
  [7, 11], [7, 17], [8, 12], [8, 16],
  [9, 13], [9, 14],
  // Right block
  [1, 25], [2, 23], [2, 25],
  [3, 21], [3, 22], [4, 21], [4, 22],
  [5, 21], [5, 22], [6, 23], [6, 25],
  [7, 25],
  // Right square
  [3, 35], [3, 36], [4, 35], [4, 36]
];

const GameOfLifeSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameOfLifeState>({
    currentGrid: new Uint8Array(ROWS * COLS),
    nextGrid: new Uint8Array(ROWS * COLS),
    ages: new Uint16Array(ROWS * COLS),
    fade: new Float32Array(ROWS * COLS),
    generation: 0,
    isRunning: false,
    speed: 10,
    mode: 'standard',
    drawMode: 'pen',
    selectedPreset: null,
  });
  const configRef = useRef<LifeConfig>({
    rows: ROWS,
    cols: COLS,
    wrapEdges: true,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);
  const isDrawingRef = useRef<boolean>(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [mode, setMode] = useState<'standard' | 'biological'>('standard');
  const [drawMode, setDrawMode] = useState<'pen' | 'erase'>('pen');
  const [generation, setGeneration] = useState(0);
  
  // Sync state refs
  useEffect(() => {
    stateRef.current.isRunning = isRunning;
    stateRef.current.speed = speed;
    stateRef.current.mode = mode;
    stateRef.current.drawMode = drawMode;
  }, [isRunning, speed, mode, drawMode]);
  
  // Get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);
  
  // Render function
  const render = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;
    
    const { canvas, ctx } = context;
    const state = stateRef.current;
    const { currentGrid, ages, fade, mode } = state;
    const { rows, cols } = configRef.current;
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    
    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const alive = currentGrid[idx];
        const age = ages[idx];
        const fadeValue = fade[idx];
        
        if (alive === 1 || fadeValue > 0) {
          const x = c * cellWidth;
          const y = r * cellHeight;
          
          let color: string;
          let alpha: number;
          
          if (alive === 1) {
            // Alive cell
            if (mode === 'standard') {
              color = '#FFFFFF';
              alpha = 1.0;
            } else {
              // Biological mode: age-based color
              const normalizedAge = Math.min(age, MAX_AGE) / MAX_AGE;
              // Gradient: bright white/cyan (newborn) -> blue -> purple (old)
              const hue = 200 + normalizedAge * 100; // 200 (cyan) to 300 (magenta)
              const saturation = 0.8;
              const lightness = 0.9 - normalizedAge * 0.4; // 0.9 (bright) to 0.5 (darker)
              
              // Convert HSL to RGB
              const h = hue / 360;
              const s = saturation;
              const l = lightness;
              const c = (1 - Math.abs(2 * l - 1)) * s;
              const x = c * (1 - Math.abs((h * 6) % 2 - 1));
              const m = l - c / 2;
              
              let r, g, b;
              if (h < 1/6) { r = c; g = x; b = 0; }
              else if (h < 2/6) { r = x; g = c; b = 0; }
              else if (h < 3/6) { r = 0; g = c; b = x; }
              else if (h < 4/6) { r = 0; g = x; b = c; }
              else if (h < 5/6) { r = x; g = 0; b = c; }
              else { r = c; g = 0; b = x; }
              
              const R = Math.round((r + m) * 255);
              const G = Math.round((g + m) * 255);
              const B = Math.round((b + m) * 255);
              color = `rgb(${R}, ${G}, ${B})`;
              alpha = 1.0;
            }
          } else {
            // Ghost trail
            if (mode === 'standard') {
              color = '#6666AA';
              alpha = fadeValue * 0.5;
            } else {
              color = '#4444AA';
              alpha = fadeValue * 0.3;
            }
          }
          
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          
          // Draw rounded cell with glow
          ctx.shadowBlur = alive === 1 ? 8 : 4;
          ctx.shadowColor = color;
          
          ctx.beginPath();
          const radius = Math.min(cellWidth, cellHeight) * 0.4;
          const centerX = x + cellWidth / 2;
          const centerY = y + cellHeight / 2;
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    
    // Draw very faint grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
      const x = i * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      const y = i * cellHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [getCanvasContext, mode]);
  
  // Clear grid
  const clearGrid = useCallback(() => {
    const state = stateRef.current;
    state.currentGrid.fill(0);
    state.nextGrid.fill(0);
    state.ages.fill(0);
    state.fade.fill(0);
    state.generation = 0;
    setGeneration(0);
    render();
  }, [render]);
  
  // Apply preset
  const applyPreset = useCallback((presetId: LifePresetId) => {
    const state = stateRef.current;
    const config = configRef.current;
    const { rows, cols } = config;
    
    // Clear first
    clearGrid();
    
    let pattern: number[][];
    let startR: number;
    let startC: number;
    
    switch (presetId) {
      case 'random': {
        // Random soup with ~35% density
        for (let i = 0; i < rows * cols; i++) {
          if (Math.random() < 0.35) {
            state.currentGrid[i] = 1;
            state.ages[i] = 1;
            state.fade[i] = 1.0;
          }
        }
        state.selectedPreset = presetId;
        render();
        return;
      }
      case 'glider': {
        pattern = GLIDER_PATTERN;
        startR = Math.floor(rows / 2);
        startC = Math.floor(cols / 2);
        break;
      }
      case 'pulsar': {
        pattern = PULSAR_PATTERN;
        startR = Math.floor((rows - 15) / 2);
        startC = Math.floor((cols - 15) / 2);
        break;
      }
      case 'glider-gun': {
        pattern = GOSPER_GLIDER_GUN_PATTERN;
        startR = Math.floor((rows - 9) / 2);
        startC = Math.floor((cols - 36) / 2);
        break;
      }
    }
    
    if (pattern!) {
      stampPattern(
        state.currentGrid,
        state.ages,
        state.fade,
        pattern!,
        startR!,
        startC!,
        rows,
        cols
      );
    }
    
    state.selectedPreset = presetId;
    render();
  }, [clearGrid, render]);
  
  // Get cell coordinates from mouse position
  const getCellFromMouse = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const context = getCanvasContext();
    if (!context) return null;
    
    const { canvas } = context;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellWidth = canvas.width / COLS;
    const cellHeight = canvas.height / ROWS;
    
    const c = Math.floor(x / cellWidth);
    const r = Math.floor(y / cellHeight);
    
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      return { r, c };
    }
    return null;
  }, [getCanvasContext]);
  
  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left click
    
    const cell = getCellFromMouse(e);
    if (!cell) return;
    
    isDrawingRef.current = true;
    const state = stateRef.current;
    const { drawMode } = state;
    const idx = cell.r * COLS + cell.c;
    
    if (drawMode === 'pen') {
      state.currentGrid[idx] = 1;
      state.ages[idx] = 1;
      state.fade[idx] = 1.0;
    } else {
      state.currentGrid[idx] = 0;
      state.ages[idx] = 0;
      state.fade[idx] = 0;
    }
    
    render();
  }, [getCellFromMouse, render]);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    
    const cell = getCellFromMouse(e);
    if (!cell) return;
    
    const state = stateRef.current;
    const { drawMode } = state;
    const idx = cell.r * COLS + cell.c;
    
    if (drawMode === 'pen') {
      state.currentGrid[idx] = 1;
      state.ages[idx] = 1;
      state.fade[idx] = 1.0;
    } else {
      state.currentGrid[idx] = 0;
      state.ages[idx] = 0;
      state.fade[idx] = 0;
    }
    
    render();
  }, [getCellFromMouse, render]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);
  
  // Step one generation
  const stepGeneration = useCallback(() => {
    const state = stateRef.current;
    const config = configRef.current;
    
    nextGeneration(state, config);
    state.generation++;
    setGeneration(state.generation);
    render();
  }, [render]);
  
  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;
      
      const state = stateRef.current;
      
      if (state.isRunning) {
        accumulatorRef.current += dt;
        const genInterval = 1 / state.speed;
        
        while (accumulatorRef.current >= genInterval) {
          nextGeneration(state, configRef.current);
          state.generation++;
          setGeneration(state.generation);
          accumulatorRef.current -= genInterval;
        }
      }
      
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [render]);
  
  // Handle canvas resize and initial render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const maxSize = Math.min(container.clientWidth - 32, 600);
      canvas.width = maxSize;
      canvas.height = maxSize;
      
      render();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [render]);
  
  // Initial render
  useEffect(() => {
    render();
  }, [render]);
  
  // Initialize with random configuration on mount
  useEffect(() => {
    const state = stateRef.current;
    const { rows, cols } = configRef.current;
    
    // Random soup with ~35% density
    for (let i = 0; i < rows * cols; i++) {
      if (Math.random() < 0.35) {
        state.currentGrid[i] = 1;
        state.ages[i] = 1;
        state.fade[i] = 1.0;
      }
    }
    state.selectedPreset = 'random';
    render();
  }, []); // Run only once on mount
  
  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] aspect-square bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
      
      {/* Generation counter */}
      <div className="text-center mb-4 text-sm text-ink-secondary dark:text-ink-muted">
        Generation: {generation}
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        {/* Play/Pause/Step */}
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
            onClick={stepGeneration}
            disabled={isRunning}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 disabled:opacity-50 disabled:cursor-not-allowed text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Step one generation"
          >
            <StepForward className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={clearGrid}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Clear grid"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
        
        {/* Speed Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Speed: {speed} gen/s
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
        
        {/* Visual Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Visual Mode
          </label>
          <div className="flex gap-2">
            {(['standard', 'biological'] as const).map((m) => (
              <motion.button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                  mode === m
                    ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {m === 'standard' ? 'Standard' : 'Biological'}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Draw Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Draw Mode
          </label>
          <div className="flex gap-2">
            {(['pen', 'erase'] as const).map((dm) => (
              <motion.button
                key={dm}
                onClick={() => setDrawMode(dm)}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                  drawMode === dm
                    ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {dm === 'pen' ? 'Pen' : 'Erase'}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Presets */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['random', 'glider', 'pulsar', 'glider-gun'] as LifePresetId[]).map((preset) => (
              <motion.button
                key={preset}
                onClick={() => applyPreset(preset)}
                className="px-3 py-2 rounded-full text-xs font-medium transition-colors bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {preset === 'glider-gun' ? 'Glider Gun' : preset.charAt(0).toUpperCase() + preset.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOfLifeSimulation;

