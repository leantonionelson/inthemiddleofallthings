import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Physics constants
const EPS = 20; // Softening parameter (pixels^2)
const DT = 1 / 60; // Time step (60 fps)

// Field visualization grid
const SROWS = 30;
const SCOLS = 40;

// Visual constants
const SOURCE_RADIUS = 8;
const PARTICLE_RADIUS = 6;
const SOURCE_STRENGTH = 2000; // Base strength for sources

type Source = {
  x: number;
  y: number;
  strength: number; // positive = hill/barrier, negative = well/attractor
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const PotentialLandscapeSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourcesRef = useRef<Source[]>([]);
  const particleRef = useRef<Particle>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  const [sourceMode, setSourceMode] = useState<'positive' | 'negative'>('positive');
  const [potentialStrength, setPotentialStrength] = useState(60); // 0-100
  const [damping, setDamping] = useState(30); // 0-100

  // Compute potential value at a point
  const computePotential = useCallback((x: number, y: number, sources: Source[]) => {
    let V = 0;

    for (const s of sources) {
      const dx = x - s.x;
      const dy = y - s.y;
      const distSq = dx * dx + dy * dy + EPS;
      const invDist = 1 / Math.sqrt(distSq);
      V += s.strength * invDist;
    }

    return V;
  }, []);

  // Compute gradient of potential at a point
  const computeGradient = useCallback((x: number, y: number, sources: Source[]) => {
    let gx = 0;
    let gy = 0;

    for (const s of sources) {
      const dx = x - s.x;
      const dy = y - s.y;
      const distSq = dx * dx + dy * dy + EPS;
      const invDenom = 1 / Math.pow(distSq, 1.5);
      const factor = -s.strength * invDenom;
      
      // gradient of V_i = -s_i * (x-x_i, y-y_i) / (r^2 + eps)^(3/2)
      gx += factor * dx;
      gy += factor * dy;
    }

    return { gx, gy };
  }, []);

  // Update particle physics
  const updateParticle = useCallback((dt: number) => {
    const particle = particleRef.current;
    const sources = sourcesRef.current;

    // Map sliders to physics parameters
    const alphaMin = 0.0;
    const alphaMax = 400.0;
    const alpha = alphaMin + (potentialStrength / 100) * (alphaMax - alphaMin);

    const dampMin = 0.0;
    const dampMax = 0.06;
    const dampingValue = dampMin + (damping / 100) * (dampMax - dampMin);

    // Compute gradient at particle position
    const { gx, gy } = computeGradient(particle.x, particle.y, sources);

    // Acceleration = -alpha * gradient (downhill motion)
    const ax = -alpha * gx;
    const ay = -alpha * gy;

    // Update velocity with damping (semi-implicit Euler)
    particle.vx = (1 - dampingValue) * particle.vx + ax * dt;
    particle.vy = (1 - dampingValue) * particle.vy + ay * dt;

    // Update position
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    // Handle boundaries (wrap around)
    const canvas = canvasRef.current;
    if (canvas) {
      if (particle.x < 0) particle.x += canvas.width;
      if (particle.x > canvas.width) particle.x -= canvas.width;
      if (particle.y < 0) particle.y += canvas.height;
      if (particle.y > canvas.height) particle.y -= canvas.height;
    }
  }, [potentialStrength, damping, computeGradient]);

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
    const sources = sourcesRef.current;
    const particle = particleRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains('dark');

    // Compute potential values for visualization
    const dx = canvas.width / SCOLS;
    const dy = canvas.height / SROWS;
    
    // Find min/max for normalization
    let minV = Infinity;
    let maxV = -Infinity;
    const potentialValues: number[][] = [];

    for (let i = 0; i < SROWS; i++) {
      potentialValues[i] = [];
      for (let j = 0; j < SCOLS; j++) {
        const x = (j + 0.5) * dx;
        const y = (i + 0.5) * dy;
        const V = computePotential(x, y, sources);
        potentialValues[i][j] = V;
        if (V < minV) minV = V;
        if (V > maxV) maxV = V;
      }
    }

    // Normalize range (add padding to avoid division by zero)
    const range = Math.max(maxV - minV, 1e-6);

    // Draw field as heat map / height map
    for (let i = 0; i < SROWS; i++) {
      for (let j = 0; j < SCOLS; j++) {
        const x = j * dx;
        const y = i * dy;
        const V = potentialValues[i][j];
        
        // Normalize to [0, 1]
        const normalized = (V - minV) / range;
        
        // Map to color: positive = warm (hills/barriers), negative = cool (wells)
        // Use a diverging color scheme
        let r, g, b;
        if (normalized < 0.5) {
          // Lower values (wells) - cool colors
          const t = normalized * 2;
          r = Math.floor(50 + t * 50);
          g = Math.floor(100 + t * 50);
          b = Math.floor(200 + t * 55);
        } else {
          // Higher values (hills) - warm colors
          const t = (normalized - 0.5) * 2;
          r = Math.floor(100 + t * 155);
          g = Math.floor(150 + t * 105);
          b = Math.floor(255 - t * 255);
        }

        ctx.fillStyle = isDark
          ? `rgba(${r}, ${g}, ${b}, 0.4)`
          : `rgba(${r}, ${g}, ${b}, 0.3)`;
        ctx.fillRect(x, y, dx, dy);
      }
    }

    // Draw sources
    for (const source of sources) {
      // Glow effect
      const gradient = ctx.createRadialGradient(
        source.x,
        source.y,
        0,
        source.x,
        source.y,
        SOURCE_RADIUS * 2.5
      );

      if (source.strength > 0) {
        // Positive: warm/amber/red (hills/barriers)
        gradient.addColorStop(0, isDark ? 'rgba(255, 140, 0, 0.8)' : 'rgba(255, 100, 0, 0.9)');
        gradient.addColorStop(0.5, isDark ? 'rgba(255, 140, 0, 0.4)' : 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, isDark ? 'rgba(255, 140, 0, 0)' : 'rgba(255, 100, 0, 0)');
      } else {
        // Negative: cool/blue (wells/attractors)
        gradient.addColorStop(0, isDark ? 'rgba(100, 150, 255, 0.8)' : 'rgba(50, 100, 255, 0.9)');
        gradient.addColorStop(0.5, isDark ? 'rgba(100, 150, 255, 0.4)' : 'rgba(50, 100, 255, 0.5)');
        gradient.addColorStop(1, isDark ? 'rgba(100, 150, 255, 0)' : 'rgba(50, 100, 255, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(source.x, source.y, SOURCE_RADIUS * 2.5, 0, 2 * Math.PI);
      ctx.fill();

      // Source circle
      ctx.fillStyle = source.strength > 0
        ? (isDark ? 'rgba(255, 140, 0, 0.9)' : 'rgba(255, 100, 0, 1)')
        : (isDark ? 'rgba(100, 150, 255, 0.9)' : 'rgba(50, 100, 255, 1)');
      ctx.beginPath();
      ctx.arc(source.x, source.y, SOURCE_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      // Source symbol
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 1)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(source.strength > 0 ? '+' : '−', source.x, source.y);
    }

    // Draw test particle
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();

    // Fill particle
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, PARTICLE_RADIUS - 1, 0, 2 * Math.PI);
    ctx.fill();
  }, [getCanvasContext, computePotential]);

  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Cap dt to prevent large jumps
      lastTimeRef.current = now;

      updateParticle(dt);
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
  }, [updateParticle, draw]);

  // Handle canvas resize and initial setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const maxSize = Math.min(container.clientWidth - 32, 600);
      canvas.width = maxSize;
      canvas.height = maxSize;

      // Initialize particle to center
      particleRef.current = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: 0,
        vy: 0,
      };

      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  // Initial draw
  useEffect(() => {
    const timer = setTimeout(() => {
      draw();
    }, 100);
    return () => clearTimeout(timer);
  }, [draw]);

  // Handle pointer events
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isLongPressRef.current = false;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Start long-press timer
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      // Remove nearest source
      const sources = sourcesRef.current;
      if (sources.length > 0) {
        let minDist = Infinity;
        let nearestIndex = -1;

        for (let i = 0; i < sources.length; i++) {
          const dx = px - sources[i].x;
          const dy = py - sources[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist && dist < SOURCE_RADIUS * 3) {
            minDist = dist;
            nearestIndex = i;
          }
        }

        if (nearestIndex >= 0) {
          sources.splice(nearestIndex, 1);
          draw();
        }
      }
    }, 500); // 500ms for long press
  }, [draw]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Cancel long press if moving
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If not a long press, add a source
    if (!isLongPressRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Add source at tap position
      sourcesRef.current.push({
        x: px,
        y: py,
        strength: sourceMode === 'positive' ? SOURCE_STRENGTH : -SOURCE_STRENGTH,
      });

      draw();
    }

    isLongPressRef.current = false;
  }, [sourceMode, draw]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent context menu
  }, []);

  const handleResetParticle = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      particleRef.current = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: 0,
        vy: 0,
      };
    }
  }, []);

  const handleClearSources = useCallback(() => {
    sourcesRef.current = [];
    draw();
  }, [draw]);

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
            onContextMenu={handleContextMenu}
            className="w-full h-full cursor-crosshair touch-none"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Source Mode Toggle */}
        <div className="flex gap-2 mb-2">
          <motion.button
            onClick={() => setSourceMode('positive')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              sourceMode === 'positive'
                ? 'bg-amber-500/20 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add +
          </motion.button>
          <motion.button
            onClick={() => setSourceMode('negative')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              sourceMode === 'negative'
                ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add −
          </motion.button>
        </div>

        {/* Potential Strength Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Potential Strength: {potentialStrength}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={potentialStrength}
            onChange={(e) => setPotentialStrength(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Damping Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Damping: {damping}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={damping}
            onChange={(e) => setDamping(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleResetParticle}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Reset Particle
          </motion.button>
          <motion.button
            onClick={handleClearSources}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear Sources
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default PotentialLandscapeSimulation;

