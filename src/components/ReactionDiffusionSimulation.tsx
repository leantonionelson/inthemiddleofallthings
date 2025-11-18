import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

// Grid configuration - reduced for memory efficiency
const DEFAULT_ROWS = 80;
const DEFAULT_COLS = 80;
const DT = 1.0; // Fixed time step

type ViewMode = 'U' | 'V' | 'combined' | 'edges';
type ReactionDiffusionPresetId = 'coral' | 'fingerprints' | 'mitosis' | 'black-hole' | 'chaotic';

interface ReactionDiffusionConfig {
  rows: number;
  cols: number;
  Du: number;
  Dv: number;
  F: number;
  K: number;
  wrapEdges: boolean;
}

interface ReactionDiffusionPreset {
  id: ReactionDiffusionPresetId;
  name: string;
  Du: number;
  Dv: number;
  F: number;
  K: number;
}

interface ReactionDiffusionState {
  U: Float32Array;
  V: Float32Array;
  U_next: Float32Array;
  V_next: Float32Array;
  isRunning: boolean;
  speed: number; // steps per frame multiplier
  viewMode: ViewMode;
  preset: ReactionDiffusionPresetId;
}

// Gray-Scott presets
const PRESETS: ReactionDiffusionPreset[] = [
  { id: 'coral', name: 'Coral', Du: 0.16, Dv: 0.08, F: 0.035, K: 0.065 },
  { id: 'fingerprints', name: 'Fingerprints', Du: 0.16, Dv: 0.08, F: 0.030, K: 0.060 },
  { id: 'mitosis', name: 'Mitosis', Du: 0.18, Dv: 0.09, F: 0.037, K: 0.065 },
  { id: 'black-hole', name: 'Black Hole', Du: 0.16, Dv: 0.08, F: 0.022, K: 0.051 },
  { id: 'chaotic', name: 'Chaotic', Du: 0.16, Dv: 0.08, F: 0.012, K: 0.050 },
];

// Compute discrete Laplacian using 5-point stencil
function computeLaplacian(
  field: Float32Array,
  r: number,
  c: number,
  rows: number,
  cols: number,
  wrapEdges: boolean
): number {
  const idx = r * cols + c;
  const center = field[idx];
  
  let sum = 0;
  let count = 0;
  
  // 4-neighbor stencil
  const neighbors = [
    { dr: -1, dc: 0 }, // up
    { dr: 1, dc: 0 },  // down
    { dr: 0, dc: -1 }, // left
    { dr: 0, dc: 1 },  // right
  ];
  
  for (const { dr, dc } of neighbors) {
    let rr = r + dr;
    let cc = c + dc;
    
    if (wrapEdges) {
      rr = (rr + rows) % rows;
      cc = (cc + cols) % cols;
    } else {
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
    }
    
    const neighborIdx = rr * cols + cc;
    sum += field[neighborIdx];
    count++;
  }
  
  // Laplacian: sum of neighbors - 4 * center
  return (sum - count * center) / (count || 1);
}

// Compute edge magnitude (gradient)
function computeEdgeMagnitude(
  field: Float32Array,
  r: number,
  c: number,
  rows: number,
  cols: number,
  wrapEdges: boolean
): number {
  const idx = r * cols + c;
  const center = field[idx];
  
  let maxDiff = 0;
  
  const neighbors = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  
  for (const { dr, dc } of neighbors) {
    let rr = r + dr;
    let cc = c + dc;
    
    if (wrapEdges) {
      rr = (rr + rows) % rows;
      cc = (cc + cols) % cols;
    } else {
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
    }
    
    const neighborIdx = rr * cols + cc;
    const diff = Math.abs(field[neighborIdx] - center);
    maxDiff = Math.max(maxDiff, diff);
  }
  
  return maxDiff;
}

const ReactionDiffusionSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  
  const configRef = useRef<ReactionDiffusionConfig>({
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    Du: PRESETS[0].Du,
    Dv: PRESETS[0].Dv,
    F: PRESETS[0].F,
    K: PRESETS[0].K,
    wrapEdges: true,
  });
  
  const stateRef = useRef<ReactionDiffusionState>({
    U: new Float32Array(DEFAULT_ROWS * DEFAULT_COLS),
    V: new Float32Array(DEFAULT_ROWS * DEFAULT_COLS),
    U_next: new Float32Array(DEFAULT_ROWS * DEFAULT_COLS),
    V_next: new Float32Array(DEFAULT_ROWS * DEFAULT_COLS),
    isRunning: false,
    speed: 1,
    viewMode: 'combined',
    preset: 'coral',
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [preset, setPreset] = useState<ReactionDiffusionPresetId>('coral');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [F, setF] = useState(PRESETS[0].F);
  const [K, setK] = useState(PRESETS[0].K);
  const [isBrushing, setIsBrushing] = useState(false);
  const brushRadius = 12; // pixels
  
  // Initialize grids
  const initializeGrids = useCallback((presetId: ReactionDiffusionPresetId) => {
    const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    const config = configRef.current;
    const size = config.rows * config.cols;
    
    // Update config
    config.Du = preset.Du;
    config.Dv = preset.Dv;
    config.F = preset.F;
    config.K = preset.K;
    
    // Update state
    setF(preset.F);
    setK(preset.K);
    
    // Initialize: U = 1, V = 0 everywhere
    for (let i = 0; i < size; i++) {
      stateRef.current.U[i] = 1.0;
      stateRef.current.V[i] = 0.0;
      stateRef.current.U_next[i] = 1.0;
      stateRef.current.V_next[i] = 0.0;
    }
    
    // Add center disturbance
    const centerR = Math.floor(config.rows / 2);
    const centerC = Math.floor(config.cols / 2);
    const radius = Math.min(config.rows, config.cols) * 0.1;
    
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const dr = r - centerR;
        const dc = c - centerC;
        const dist = Math.sqrt(dr * dr + dc * dc);
        
        if (dist < radius) {
          const idx = r * config.cols + c;
          const factor = 1 - (dist / radius);
          stateRef.current.U[idx] = 0.5 + 0.3 * factor;
          stateRef.current.V[idx] = 0.25 * factor;
        }
      }
    }
  }, []);
  
  // Perturb: inject random V patches
  const perturb = useCallback(() => {
    const config = configRef.current;
    const state = stateRef.current;
    
    // Add 3-5 small random patches
    const numPatches = 3 + Math.floor(Math.random() * 3);
    
    for (let p = 0; p < numPatches; p++) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);
      const radius = 3 + Math.floor(Math.random() * 5);
      
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const dist = Math.sqrt(dr * dr + dc * dc);
          if (dist > radius) continue;
          
          let rr = r + dr;
          let cc = c + dc;
          
          if (config.wrapEdges) {
            rr = (rr + config.rows) % config.rows;
            cc = (cc + config.cols) % config.cols;
          } else {
            if (rr < 0 || rr >= config.rows || cc < 0 || cc >= config.cols) continue;
          }
          
          const idx = rr * config.cols + cc;
          const factor = (1 - dist / radius) * 0.5;
          state.V[idx] = Math.min(1, state.V[idx] + factor);
          state.U[idx] = Math.max(0, state.U[idx] - factor * 0.5);
        }
      }
    }
  }, []);

  // Brush: inject B at pointer position
  const injectBAtPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const config = configRef.current;
    const state = stateRef.current;
    const { rows, cols } = config;
    
    // Convert screen coords to grid coords (use display dimensions, not pixel dimensions)
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const cellWidth = displayWidth / cols;
    const cellHeight = displayHeight / rows;
    const c = Math.floor(x / cellWidth);
    const r = Math.floor(y / cellHeight);
    
    // Convert brush radius from pixels to grid cells
    const gridRadius = Math.ceil(brushRadius / Math.min(cellWidth, cellHeight));
    
    // Inject B in radius around point
    for (let dr = -gridRadius; dr <= gridRadius; dr++) {
      for (let dc = -gridRadius; dc <= gridRadius; dc++) {
        const dist = Math.sqrt(dr * dr + dc * dc);
        if (dist > gridRadius) continue;
        
        let rr = r + dr;
        let cc = c + dc;
        
        if (config.wrapEdges) {
          rr = (rr + rows) % rows;
          cc = (cc + cols) % cols;
        } else {
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
        }
        
        const idx = rr * cols + cc;
        const factor = 1 - (dist / gridRadius);
        state.V[idx] = Math.max(state.V[idx], 0.9 * factor);
        state.U[idx] = Math.min(state.U[idx], 0.5);
      }
    }
  }, [brushRadius]);

  // Brush event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsBrushing(true);
    injectBAtPoint(e.clientX, e.clientY);
    e.preventDefault();
  }, [injectBAtPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isBrushing) {
      injectBAtPoint(e.clientX, e.clientY);
      e.preventDefault();
    }
  }, [isBrushing, injectBAtPoint]);

  const handlePointerUp = useCallback(() => {
    setIsBrushing(false);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsBrushing(false);
  }, []);
  
  // Update simulation step
  const updateStep = useCallback(() => {
    const config = configRef.current;
    const state = stateRef.current;
    const { rows, cols, Du, Dv, F, K, wrapEdges } = config;
    const { U, V, U_next, V_next } = state;
    
    // Compute next state
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const u = U[idx];
        const v = V[idx];
        
        // Compute Laplacians
        const lapU = computeLaplacian(U, r, c, rows, cols, wrapEdges);
        const lapV = computeLaplacian(V, r, c, rows, cols, wrapEdges);
        
        // Gray-Scott equations
        const uvv = u * v * v;
        const dU = Du * lapU - uvv + F * (1 - u);
        const dV = Dv * lapV + uvv - (F + K) * v;
        
        // Euler step
        U_next[idx] = Math.max(0, Math.min(1, u + dU * DT));
        V_next[idx] = Math.max(0, Math.min(1, v + dV * DT));
      }
    }
    
    // Swap buffers
    const tempU = U;
    const tempV = V;
    stateRef.current.U = U_next;
    stateRef.current.V = V_next;
    stateRef.current.U_next = tempU;
    stateRef.current.V_next = tempV;
  }, []);
  
  // Render to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const config = configRef.current;
    const state = stateRef.current;
    const { rows, cols } = config;
    const { U, V, viewMode } = state;
    
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    
    // Clear with transparent background (container provides background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create image data for faster rendering
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const u = U[idx];
        const v = V[idx];
        
        let rVal = 0, gVal = 0, bVal = 0;
        
        if (viewMode === 'U') {
          // Grayscale
          const gray = Math.floor(u * 255);
          rVal = gVal = bVal = gray;
        } else if (viewMode === 'V') {
          // Blue to magenta gradient
          rVal = Math.floor(v * 255);
          gVal = Math.floor(v * 100);
          bVal = Math.floor(100 + v * 155);
        } else if (viewMode === 'combined') {
          // Combined: V as primary, U as secondary
          rVal = Math.floor(v * 255);
          gVal = Math.floor((u * 0.5 + v * 0.5) * 255);
          bVal = Math.floor((1 - v) * 200 + u * 55);
        } else if (viewMode === 'edges') {
          // Edge detection on V field
          const edgeMag = computeEdgeMagnitude(V, r, c, rows, cols, config.wrapEdges);
          const intensity = Math.min(1, edgeMag * 5);
          rVal = Math.floor(intensity * 255);
          gVal = Math.floor(intensity * 200);
          bVal = Math.floor(intensity * 150);
        }
        
        // Draw cell
        const x = Math.floor(c * cellWidth);
        const y = Math.floor(r * cellHeight);
        const w = Math.ceil(cellWidth);
        const h = Math.ceil(cellHeight);
        
        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const pxX = x + px;
            const pyY = y + py;
            if (pxX >= canvas.width || pyY >= canvas.height) continue;
            
            const pixelIdx = (pyY * canvas.width + pxX) * 4;
            data[pixelIdx] = rVal;
            data[pixelIdx + 1] = gVal;
            data[pixelIdx + 2] = bVal;
            data[pixelIdx + 3] = 255;
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, []);
  
  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      const state = stateRef.current;
      
      if (state.isRunning) {
        // Run multiple steps per frame based on speed
        for (let step = 0; step < state.speed; step++) {
          updateStep();
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
  }, [updateStep, render]);
  
  // Update state refs when React state changes
  useEffect(() => {
    stateRef.current.isRunning = isPlaying;
    stateRef.current.speed = speed;
    stateRef.current.viewMode = viewMode;
    stateRef.current.preset = preset;
    configRef.current.F = F;
    configRef.current.K = K;
  }, [isPlaying, speed, viewMode, preset, F, K]);
  
  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const maxWidth = Math.min(container.clientWidth - 32, 800);
      const aspectRatio = configRef.current.cols / configRef.current.rows;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = maxWidth * dpr;
      canvas.height = (maxWidth / aspectRatio) * dpr;
      canvas.style.width = `${maxWidth}px`;
      canvas.style.height = `${maxWidth / aspectRatio}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      render();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [render]);
  
  // Initialize on mount
  useEffect(() => {
    initializeGrids(preset);
  }, [initializeGrids, preset]);
  
  // Handle preset change
  const handlePresetChange = useCallback((newPreset: ReactionDiffusionPresetId) => {
    setPreset(newPreset);
    initializeGrids(newPreset);
  }, [initializeGrids]);
  
  // Handle reset
  const handleReset = useCallback(() => {
    initializeGrids(preset);
  }, [initializeGrids, preset]);
  
  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] aspect-square bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair"
            style={{ imageRendering: 'auto' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          />
        </div>
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        {/* Brush hint */}
        <div className="text-sm text-ink-secondary dark:text-ink-muted mb-2">
          Paint Chemical B: click and drag on the dish
        </div>

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
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset</span>
          </motion.button>
          
          <motion.button
            onClick={perturb}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Perturb</span>
          </motion.button>
        </div>
        
        {/* Speed control */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-ink-secondary dark:text-ink-muted min-w-[60px]">
            Speed:
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="flex-1 h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
          <span className="text-sm font-mono text-ink-secondary dark:text-ink-muted min-w-[40px] text-right">
            {speed}x
          </span>
        </div>
        
        {/* View mode toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20">
            <span className="text-sm text-ink-secondary dark:text-ink-muted">View:</span>
            {(['U', 'V', 'combined', 'edges'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-sm transition-colors capitalize ${
                  viewMode === mode
                    ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                    : 'text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/10 dark:hover:bg-paper-light/10'
                }`}
              >
                {mode === 'combined' ? 'Pattern' : mode}
              </button>
            ))}
          </div>
        </div>
        
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-secondary dark:text-ink-muted">Presets:</span>
          {PRESETS.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors border border-ink-muted/20 dark:border-paper-light/20 ${
                preset === p.id
                  ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {p.name}
            </motion.button>
          ))}
        </div>
        
        {/* Advanced controls */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Parameters
          </button>
          
          {showAdvanced && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-ink-muted/20 dark:border-paper-light/20">
              <div className="flex items-center gap-3">
                <label className="text-sm text-ink-secondary dark:text-ink-muted min-w-[40px]">
                  F:
                </label>
                <input
                  type="range"
                  min="0.010"
                  max="0.100"
                  step="0.001"
                  value={F}
                  onChange={(e) => setF(Number(e.target.value))}
                  className="flex-1 h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
                />
                <span className="text-sm font-mono text-ink-secondary dark:text-ink-muted min-w-[60px] text-right">
                  {F.toFixed(3)}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-ink-secondary dark:text-ink-muted min-w-[40px]">
                  K:
                </label>
                <input
                  type="range"
                  min="0.045"
                  max="0.070"
                  step="0.001"
                  value={K}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="flex-1 h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
                />
                <span className="text-sm font-mono text-ink-secondary dark:text-ink-muted min-w-[60px] text-right">
                  {K.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionDiffusionSimulation;

