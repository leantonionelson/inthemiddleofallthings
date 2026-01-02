import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, RotateCw } from 'lucide-react';

// Physics constants
const DT_FIXED = 1 / 60; // Fixed timestep
const PARTICLE_RADIUS = 3; // Pixels
const NUM_PARTICLES = 200;
const BOX_PADDING = 20; // Padding inside box
const PARTITION_WIDTH = 2; // Partition line width

// Particle speeds (hot = faster, cold = slower)
const HOT_SPEED_MIN = 0.8;
const HOT_SPEED_MAX = 1.5;
const COLD_SPEED_MIN = 0.3;
const COLD_SPEED_MAX = 0.7;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'red' | 'blue';
}

interface EntropyState {
  particles: Particle[];
  partitionActive: boolean;
  timeReversed: boolean;
  speedMultiplier: number;
  entropyHistory: number[];
  boxWidth: number;
  boxHeight: number;
  boxX: number;
  boxY: number;
}

const EntropySimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<EntropyState>({
    particles: [],
    partitionActive: true,
    timeReversed: false,
    speedMultiplier: 1,
    entropyHistory: [],
    boxWidth: 0,
    boxHeight: 0,
    boxX: 0,
    boxY: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);
  const maxHistoryLength = 500;

  const [partitionActive, setPartitionActive] = useState(true);
  const [speed, setSpeed] = useState(1); // 0.1 to 3

  // Initialize particles
  const initializeParticles = useCallback((boxWidth: number, boxHeight: number) => {
    const particles: Particle[] = [];
    const halfWidth = boxWidth / 2;
    
    // Red particles (hot) - left side
    const numRed = Math.floor(NUM_PARTICLES / 2);
    for (let i = 0; i < numRed; i++) {
      const speed = HOT_SPEED_MIN + Math.random() * (HOT_SPEED_MAX - HOT_SPEED_MIN);
      const angle = Math.random() * 2 * Math.PI;
      particles.push({
        x: BOX_PADDING + Math.random() * (halfWidth - BOX_PADDING * 2),
        y: BOX_PADDING + Math.random() * (boxHeight - BOX_PADDING * 2),
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        type: 'red',
      });
    }
    
    // Blue particles (cold) - right side
    const numBlue = NUM_PARTICLES - numRed;
    for (let i = 0; i < numBlue; i++) {
      const speed = COLD_SPEED_MIN + Math.random() * (COLD_SPEED_MAX - COLD_SPEED_MIN);
      const angle = Math.random() * 2 * Math.PI;
      particles.push({
        x: halfWidth + BOX_PADDING + Math.random() * (halfWidth - BOX_PADDING * 2),
        y: BOX_PADDING + Math.random() * (boxHeight - BOX_PADDING * 2),
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        type: 'blue',
      });
    }
    
    return particles;
  }, []);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate box dimensions (leave space for graph at bottom)
    const graphHeight = 80;
    const availableHeight = canvas.height - graphHeight;
    const boxWidth = canvas.width * 0.9;
    const boxHeight = availableHeight * 0.8;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (availableHeight - boxHeight) / 2;

    stateRef.current = {
      particles: initializeParticles(boxWidth, boxHeight),
      partitionActive: true,
      timeReversed: false,
      speedMultiplier: speed,
      entropyHistory: [],
      boxWidth,
      boxHeight,
      boxX,
      boxY,
    };
    setPartitionActive(true);
    accumulatorRef.current = 0;
  }, [initializeParticles, speed]);

  // Update state refs when controls change
  useEffect(() => {
    stateRef.current.partitionActive = partitionActive;
    stateRef.current.speedMultiplier = speed;
  }, [partitionActive, speed]);

  // Initialize on mount
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Calculate entropy (mixing metric)
  const calculateEntropy = useCallback((): number => {
    const state = stateRef.current;
    const halfWidth = state.boxWidth / 2;
    const centerX = state.boxX + halfWidth;
    
    let leftRed = 0;
    let rightBlue = 0;
    
    for (const p of state.particles) {
      const worldX = state.boxX + p.x;
      if (worldX < centerX && p.type === 'red') {
        leftRed++;
      } else if (worldX > centerX && p.type === 'blue') {
        rightBlue++;
      }
    }
    
    // Segregation: 1.0 = perfectly ordered, 0.0 = perfectly mixed
    const segregation = (leftRed + rightBlue) / NUM_PARTICLES;
    // Entropy: 0 = ordered, 100 = mixed
    const entropyPercent = (1 - segregation) * 100;
    
    return entropyPercent;
  }, []);

  // Update physics
  const updatePhysics = useCallback((dt: number) => {
    const state = stateRef.current;
    const dtScaled = dt * state.speedMultiplier;
    const centerX = state.boxX + state.boxWidth / 2;
    
    for (const p of state.particles) {
      // Update position
      p.x += p.vx * dtScaled;
      p.y += p.vy * dtScaled;
      
      // Wall collisions (box boundaries)
      const worldX = state.boxX + p.x;
      const worldY = state.boxY + p.y;
      
      if (p.x <= 0) {
        p.x = 0;
        p.vx = -p.vx;
      } else if (p.x >= state.boxWidth) {
        p.x = state.boxWidth;
        p.vx = -p.vx;
      }
      
      if (p.y <= 0) {
        p.y = 0;
        p.vy = -p.vy;
      } else if (p.y >= state.boxHeight) {
        p.y = state.boxHeight;
        p.vy = -p.vy;
      }
      
      // Partition collision
      if (state.partitionActive) {
        const particleWorldX = state.boxX + p.x;
        const wasLeft = particleWorldX < centerX;
        const isLeft = particleWorldX < centerX;
        
        // Check if particle crossed the partition
        if (wasLeft !== isLeft || Math.abs(particleWorldX - centerX) < PARTICLE_RADIUS) {
          // Reflect off partition
          if (particleWorldX < centerX) {
            p.x = Math.max(0, p.x - (centerX - particleWorldX));
          } else {
            p.x = Math.min(state.boxWidth, p.x + (particleWorldX - centerX));
          }
          p.vx = -p.vx;
        }
      }
    }
    
    // Calculate and store entropy
    const entropy = calculateEntropy();
    state.entropyHistory.push(entropy);
    if (state.entropyHistory.length > maxHistoryLength) {
      state.entropyHistory.shift();
    }
  }, [calculateEntropy]);

  // Reverse time (Maxwell's Demon)
  const reverseTime = useCallback(() => {
    const state = stateRef.current;
    state.timeReversed = !state.timeReversed;
    
    for (const p of state.particles) {
      p.vx *= -1;
      p.vy *= -1;
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
    const bgColor = isDark ? '#050712' : '#f4f5f8';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw box outline
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(state.boxX, state.boxY, state.boxWidth, state.boxHeight);
    
    // Draw partition
    if (state.partitionActive) {
      const centerX = state.boxX + state.boxWidth / 2;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = PARTITION_WIDTH;
      if (isDark) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      }
      ctx.beginPath();
      ctx.moveTo(centerX, state.boxY);
      ctx.lineTo(centerX, state.boxY + state.boxHeight);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Draw particles
    for (const p of state.particles) {
      const worldX = state.boxX + p.x;
      const worldY = state.boxY + p.y;
      
      // Particle glow
      ctx.save();
      if (p.type === 'red') {
        // Red (hot) particles - warm glow
        const gradient = ctx.createRadialGradient(worldX, worldY, 0, worldX, worldY, PARTICLE_RADIUS * 2);
        gradient.addColorStop(0, isDark ? 'rgba(255, 100, 100, 0.9)' : 'rgba(255, 80, 80, 0.9)');
        gradient.addColorStop(0.5, isDark ? 'rgba(255, 150, 100, 0.6)' : 'rgba(255, 120, 100, 0.6)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 8;
        ctx.shadowColor = isDark ? 'rgba(255, 100, 100, 0.8)' : 'rgba(255, 80, 80, 0.6)';
      } else {
        // Blue (cold) particles - cool glow
        const gradient = ctx.createRadialGradient(worldX, worldY, 0, worldX, worldY, PARTICLE_RADIUS * 2);
        gradient.addColorStop(0, isDark ? 'rgba(100, 150, 255, 0.9)' : 'rgba(80, 120, 255, 0.9)');
        gradient.addColorStop(0.5, isDark ? 'rgba(100, 180, 255, 0.6)' : 'rgba(80, 150, 255, 0.6)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 6;
        ctx.shadowColor = isDark ? 'rgba(100, 150, 255, 0.8)' : 'rgba(80, 120, 255, 0.6)';
      }
      
      ctx.beginPath();
      ctx.arc(worldX, worldY, PARTICLE_RADIUS * 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Core particle
      ctx.fillStyle = p.type === 'red' 
        ? (isDark ? '#ff6464' : '#ff5050')
        : (isDark ? '#6496ff' : '#5078ff');
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(worldX, worldY, PARTICLE_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
    }
    
    // Draw entropy graph
    const graphHeight = 80;
    const graphY = canvas.height - graphHeight;
    const graphWidth = canvas.width * 0.9;
    const graphX = (canvas.width - graphWidth) / 2;
    
    // Graph background
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
    
    // Graph border
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
    
    // Draw entropy line
    if (state.entropyHistory.length > 1) {
      ctx.strokeStyle = isDark ? 'rgba(100, 200, 255, 0.8)' : 'rgba(50, 150, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const stepX = graphWidth / maxHistoryLength;
      for (let i = 0; i < state.entropyHistory.length; i++) {
        const x = graphX + i * stepX;
        const y = graphY + graphHeight - (state.entropyHistory[i] / 100) * graphHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Graph labels
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0%', graphX + 5, graphY + graphHeight - 5);
    ctx.textAlign = 'right';
    ctx.fillText('100%', graphX + graphWidth - 5, graphY + 15);
    
    // Current entropy value
    const currentEntropy = state.entropyHistory.length > 0 
      ? state.entropyHistory[state.entropyHistory.length - 1]
      : 0;
    ctx.textAlign = 'center';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = isDark ? 'rgba(100, 200, 255, 1)' : 'rgba(50, 150, 255, 1)';
    ctx.fillText(
      `Entropy: ${currentEntropy.toFixed(1)}%`,
      graphX + graphWidth / 2,
      graphY - 10
    );
  }, []);

  // Animation loop
  useEffect(() => {
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
  }, [updatePhysics, draw]);

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
      
      // Recalculate box dimensions
      const graphHeight = 80;
      const availableHeight = canvas.height - graphHeight;
      const boxWidth = canvas.width * 0.9;
      const boxHeight = availableHeight * 0.8;
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = (availableHeight - boxHeight) / 2;
      
      stateRef.current.boxWidth = boxWidth;
      stateRef.current.boxHeight = boxHeight;
      stateRef.current.boxX = boxX;
      stateRef.current.boxY = boxY;
      
      // Reposition particles to stay within box
      for (const p of stateRef.current.particles) {
        p.x = Math.max(0, Math.min(boxWidth, p.x));
        p.y = Math.max(0, Math.min(boxHeight, p.y));
      }
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
            onClick={() => {
              setPartitionActive(!partitionActive);
              stateRef.current.partitionActive = !partitionActive;
            }}
            disabled={!partitionActive && stateRef.current.entropyHistory.length > 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${
              partitionActive
                ? 'bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light border-ink-muted/20 dark:border-paper-light/20'
                : 'bg-ink-muted/5 dark:bg-paper-light/5 text-ink-secondary dark:text-ink-muted border-ink-muted/10 dark:border-paper-light/10 cursor-not-allowed'
            }`}
            whileHover={partitionActive ? { scale: 1.02 } : {}}
            whileTap={partitionActive ? { scale: 0.98 } : {}}
          >
            <span>{partitionActive ? 'Remove Partition' : 'Partition Removed'}</span>
          </motion.button>

          <motion.button
            onClick={reverseTime}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm">Reverse Time</span>
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

export default EntropySimulation;



