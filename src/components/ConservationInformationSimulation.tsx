import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Physics constants
const DT_FIXED = 0.01; // Fixed timestep for stability
const NUM_PARTICLES = 2000; // Number of particles - reduced for memory efficiency
const GRID_SIZE = 16; // For entropy calculation
const MAX_NOISE = 0.02; // Maximum noise factor in world units

type Shape = 'square' | 'circle' | 'letterI';

type VisualizationMode = 'particles' | 'entropy';

interface InfoParticle {
  x: number;
  y: number;
  x0: number;
  y0: number;
}

interface ConservationInformationState {
  particles: InfoParticle[];
  t: number;
  direction: 1 | -1;
  noiseFactor: number;
  isPlaying: boolean;
  shape: Shape;
}

// Generate initial particles for a shape
const generateShapeParticles = (shape: Shape, count: number): InfoParticle[] => {
  const particles: InfoParticle[] = [];
  
  switch (shape) {
    case 'square': {
      // Square block in center
      const size = 0.2;
      const centerX = 0.5;
      const centerY = 0.5;
      const side = Math.ceil(Math.sqrt(count));
      
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / side);
        const col = i % side;
        const x = centerX - size / 2 + (col / side) * size;
        const y = centerY - size / 2 + (row / side) * size;
        particles.push({ x, y, x0: x, y0: y });
      }
      break;
    }
    
    case 'circle': {
      // Circular disc
      const radius = 0.15;
      const centerX = 0.5;
      const centerY = 0.5;
      
      for (let i = 0; i < count; i++) {
        // Use rejection sampling for uniform distribution in circle
        let x, y;
        do {
          x = centerX - radius + Math.random() * 2 * radius;
          y = centerY - radius + Math.random() * 2 * radius;
        } while ((x - centerX) ** 2 + (y - centerY) ** 2 > radius ** 2);
        
        particles.push({ x, y, x0: x, y0: y });
      }
      break;
    }
    
    case 'letterI': {
      // Letter "I" shape
      const barWidth = 0.05;
      const barHeight = 0.3;
      const centerX = 0.5;
      const centerY = 0.5;
      
      for (let i = 0; i < count; i++) {
        const x = centerX - barWidth / 2 + Math.random() * barWidth;
        const y = centerY - barHeight / 2 + Math.random() * barHeight;
        particles.push({ x, y, x0: x, y0: y });
      }
      break;
    }
  }
  
  return particles;
};

// Calculate entropy using coarse-grained grid
const calculateEntropy = (particles: InfoParticle[]): number => {
  const grid: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
  const total = particles.length;
  
  // Count particles in each bin
  particles.forEach(p => {
    const binX = Math.floor(p.x * GRID_SIZE);
    const binY = Math.floor(p.y * GRID_SIZE);
    const x = Math.max(0, Math.min(GRID_SIZE - 1, binX));
    const y = Math.max(0, Math.min(GRID_SIZE - 1, binY));
    grid[y][x]++;
  });
  
  // Calculate Shannon entropy
  let entropy = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const count = grid[y][x];
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    }
  }
  
  // Normalize by maximum possible entropy (log2(total_bins))
  const maxEntropy = Math.log2(GRID_SIZE * GRID_SIZE);
  return entropy / maxEntropy;
};

// Convert HSL to RGB
const hslToRgb = (h: number, s: number, l: number): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Get particle color from initial position
const getParticleColor = (x0: number, y0: number): string => {
  const hue = x0 * 360; // Full spectrum based on x0
  const saturation = 0.8;
  const lightness = 0.5 + y0 * 0.3; // Brightness based on y0
  return hslToRgb(hue, saturation, lightness);
};

const ConservationInformationSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ConservationInformationState>({
    particles: [],
    t: 0,
    direction: 1,
    noiseFactor: 0,
    isPlaying: true,
    shape: 'square',
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);
  
  const [shape, setShape] = useState<Shape>('square');
  const [noise, setNoise] = useState(0); // 0-100
  const [direction, setDirection] = useState<1 | -1>(1);
  const [speed, setSpeed] = useState(1); // Time scale multiplier
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('particles');
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Initialize particles when shape changes
  useEffect(() => {
    stateRef.current.particles = generateShapeParticles(shape, NUM_PARTICLES);
    stateRef.current.t = 0;
    stateRef.current.shape = shape;
  }, [shape]);
  
  // Update state refs when controls change
  useEffect(() => {
    stateRef.current.direction = direction;
    stateRef.current.noiseFactor = (noise / 100) * MAX_NOISE;
    stateRef.current.isPlaying = isPlaying;
  }, [direction, noise, isPlaying]);
  
  // Apply deterministic flow
  const applyFlow = useCallback((dt: number) => {
    const state = stateRef.current;
    const t = state.t;
    const dir = state.direction;
    
    state.particles.forEach(p => {
      // Compute velocity field
      const vx = Math.sin(2 * Math.PI * (p.y + t));
      const vy = Math.cos(2 * Math.PI * (p.x + t));
      
      // Update position
      p.x += vx * dt * dir * speed;
      p.y += vy * dt * dir * speed;
      
      // Periodic boundary (torus)
      p.x = ((p.x % 1) + 1) % 1;
      p.y = ((p.y % 1) + 1) % 1;
    });
    
    // Update time
    state.t += dt * dir * speed;
  }, [speed]);
  
  // Apply noise
  const applyNoise = useCallback(() => {
    const state = stateRef.current;
    const n = state.noiseFactor;
    
    if (n > 0) {
      state.particles.forEach(p => {
        p.x += (Math.random() * 2 - 1) * n;
        p.y += (Math.random() * 2 - 1) * n;
        
        // Re-wrap to [0,1)
        p.x = ((p.x % 1) + 1) % 1;
        p.y = ((p.y % 1) + 1) % 1;
      });
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
  
  // Draw the simulation
  const draw = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;
    
    const { canvas, ctx } = context;
    const state = stateRef.current;
    const isDark = document.documentElement.classList.contains('dark');
    
    // Clear canvas with transparent background (container provides background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Convert normalized coordinates to canvas
    const toCanvasX = (x: number) => x * canvas.width;
    const toCanvasY = (y: number) => y * canvas.height;
    
    // Draw particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    state.particles.forEach(p => {
      const x = toCanvasX(p.x);
      const y = toCanvasY(p.y);
      const color = getParticleColor(p.x0, p.y0);
      
      // Create radial gradient for glowing effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color.replace('rgb', 'rgba').replace(')', ', 0.5)'));
      gradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0)'));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.restore();
    
    // Draw entropy meter if in entropy mode
    if (visualizationMode === 'entropy') {
      const entropy = calculateEntropy(state.particles);
      
      // Draw entropy bar
      const barWidth = canvas.width * 0.6;
      const barHeight = 20;
      const barX = (canvas.width - barWidth) / 2;
      const barY = canvas.height - 40;
      
      // Background
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Entropy fill
      const fillWidth = barWidth * entropy;
      const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
      gradient.addColorStop(0, isDark ? '#64C8FF' : '#0066CC');
      gradient.addColorStop(1, isDark ? '#FF9A64' : '#FF6600');
      ctx.fillStyle = gradient;
      ctx.fillRect(barX, barY, fillWidth, barHeight);
      
      // Border
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      // Label
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Entropy: ${(entropy * 100).toFixed(1)}%`, canvas.width / 2, barY - 5);
      
      // Optional grid overlay
      if (entropy > 0.3) {
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        const cellWidth = canvas.width / GRID_SIZE;
        const cellHeight = canvas.height / GRID_SIZE;
        
        for (let i = 0; i <= GRID_SIZE; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cellWidth, 0);
          ctx.lineTo(i * cellWidth, canvas.height);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, i * cellHeight);
          ctx.lineTo(canvas.width, i * cellHeight);
          ctx.stroke();
        }
      }
    }
  }, [visualizationMode, getCanvasContext]);
  
  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;
      
      if (stateRef.current.isPlaying) {
        // Fixed timestep integration
        accumulatorRef.current += dt;
        while (accumulatorRef.current >= DT_FIXED) {
          applyFlow(DT_FIXED);
          applyNoise();
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
  }, [applyFlow, applyNoise, draw]);
  
  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const maxSize = Math.min(container.clientWidth - 32, 600);
      canvas.width = maxSize;
      canvas.height = maxSize; // Square canvas
      
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);
  
  const handleResetShape = useCallback(() => {
    stateRef.current.particles = generateShapeParticles(shape, NUM_PARTICLES);
    stateRef.current.t = 0;
    accumulatorRef.current = 0;
  }, [shape]);
  
  const handleFullReset = useCallback(() => {
    setShape('square');
    setNoise(0);
    setDirection(1);
    setSpeed(1);
    setVisualizationMode('particles');
    setIsPlaying(true);
    stateRef.current.particles = generateShapeParticles('square', NUM_PARTICLES);
    stateRef.current.t = 0;
    accumulatorRef.current = 0;
  }, []);
  
  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] aspect-square bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        {/* Shape Selector */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Shape Preset
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['square', 'circle', 'letterI'] as Shape[]).map((s) => (
              <motion.button
                key={s}
                onClick={() => setShape(s)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                  shape === s
                    ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {s === 'letterI' ? 'Letter I' : s.charAt(0).toUpperCase() + s.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Direction Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Direction
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setDirection(1)}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                direction === 1
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Forward
            </motion.button>
            <motion.button
              onClick={() => setDirection(-1)}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                direction === -1
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Reverse
            </motion.button>
          </div>
        </div>
        
        {/* Noise Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Noise: {noise}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={noise}
            onChange={(e) => setNoise(Number(e.target.value))}
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
            min="0.25"
            max="2"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
        
        {/* Visualization Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Visualization Mode
          </label>
          <div className="flex gap-2">
            {(['particles', 'entropy'] as VisualizationMode[]).map((mode) => (
              <motion.button
                key={mode}
                onClick={() => setVisualizationMode(mode)}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                  visualizationMode === mode
                    ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Play/Pause/Reset Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </motion.button>
          <motion.button
            onClick={handleResetShape}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Reset shape"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleFullReset}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Full reset"
          >
            Reset All
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ConservationInformationSimulation;

