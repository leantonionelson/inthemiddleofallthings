import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Physics constants
const K = 1000; // Coulomb-like constant
const EPS = 20; // Softening parameter (pixels^2)
const DT = 1 / 60; // Time step (60 fps)

// Field visualization grid
const SROWS = 12;
const SCOLS = 20;

// Visual constants
const CHARGE_RADIUS = 8;
const PARTICLE_RADIUS = 6;
const ARROW_MIN_LEN = 4;
const ARROW_MAX_LEN = 22;
const ARROW_VISUAL_SCALE = 60;

type Charge = {
  x: number;
  y: number;
  q: number; // +1 for positive, -1 for negative
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const ElectromagneticFieldSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chargesRef = useRef<Charge[]>([]);
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

  const [chargeMode, setChargeMode] = useState<'positive' | 'negative'>('positive');
  const [fieldStrength, setFieldStrength] = useState(60); // 0-100
  const [damping, setDamping] = useState(30); // 0-100

  // Compute electric field at a point
  const computeFieldAt = useCallback((x: number, y: number, charges: Charge[]) => {
    let Ex = 0;
    let Ey = 0;

    for (const c of charges) {
      const dx = x - c.x;
      const dy = y - c.y;
      const distSq = dx * dx + dy * dy + EPS;
      const invDist = 1 / Math.sqrt(distSq);
      const dirX = dx * invDist;
      const dirY = dy * invDist;

      const mag = (K * c.q) / distSq;

      Ex += mag * dirX;
      Ey += mag * dirY;
    }

    return { Ex, Ey };
  }, []);

  // Update particle physics
  const updateParticle = useCallback((dt: number) => {
    const particle = particleRef.current;
    const charges = chargesRef.current;

    // Map sliders to physics parameters
    const alphaMin = 0.0;
    const alphaMax = 400.0;
    const alpha = alphaMin + (fieldStrength / 100) * (alphaMax - alphaMin);

    const dampMin = 0.0;
    const dampMax = 0.08;
    const dampingValue = dampMin + (damping / 100) * (dampMax - dampMin);

    // Compute field at particle position
    const { Ex, Ey } = computeFieldAt(particle.x, particle.y, charges);

    // Compute acceleration
    const ax = alpha * Ex;
    const ay = alpha * Ey;

    // Update velocity with damping
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
  }, [fieldStrength, damping, computeFieldAt]);

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
    const charges = chargesRef.current;
    const particle = particleRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains('dark');

    // Draw field arrows
    const dx = canvas.width / SCOLS;
    const dy = canvas.height / SROWS;

    ctx.strokeStyle = isDark
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (let i = 0; i < SROWS; i++) {
      for (let j = 0; j < SCOLS; j++) {
        const x = (j + 0.5) * dx;
        const y = (i + 0.5) * dy;

        const { Ex, Ey } = computeFieldAt(x, y, charges);
        const mag = Math.sqrt(Ex * Ex + Ey * Ey);

        if (mag < 1e-3) continue;

        const ux = Ex / mag;
        const uy = Ey / mag;

        let len = mag * ARROW_VISUAL_SCALE;
        if (len < ARROW_MIN_LEN) len = ARROW_MIN_LEN;
        if (len > ARROW_MAX_LEN) len = ARROW_MAX_LEN;

        const ex = x + ux * len;
        const ey = y + uy * len;

        // Draw arrow line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Draw arrowhead
        const arrowheadAngle = Math.PI / 6;
        const arrowheadLength = len * 0.25;

        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - arrowheadLength * Math.cos(Math.atan2(uy, ux) - arrowheadAngle),
          ey - arrowheadLength * Math.sin(Math.atan2(uy, ux) - arrowheadAngle)
        );
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - arrowheadLength * Math.cos(Math.atan2(uy, ux) + arrowheadAngle),
          ey - arrowheadLength * Math.sin(Math.atan2(uy, ux) + arrowheadAngle)
        );
        ctx.stroke();
      }
    }

    // Draw charges
    for (const charge of charges) {
      // Glow effect
      const gradient = ctx.createRadialGradient(
        charge.x,
        charge.y,
        0,
        charge.x,
        charge.y,
        CHARGE_RADIUS * 2
      );

      if (charge.q > 0) {
        // Positive: warm/amber/red
        gradient.addColorStop(0, isDark ? 'rgba(255, 140, 0, 0.8)' : 'rgba(255, 100, 0, 0.9)');
        gradient.addColorStop(0.5, isDark ? 'rgba(255, 140, 0, 0.4)' : 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, isDark ? 'rgba(255, 140, 0, 0)' : 'rgba(255, 100, 0, 0)');
      } else {
        // Negative: cool/blue
        gradient.addColorStop(0, isDark ? 'rgba(100, 150, 255, 0.8)' : 'rgba(50, 100, 255, 0.9)');
        gradient.addColorStop(0.5, isDark ? 'rgba(100, 150, 255, 0.4)' : 'rgba(50, 100, 255, 0.5)');
        gradient.addColorStop(1, isDark ? 'rgba(100, 150, 255, 0)' : 'rgba(50, 100, 255, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, CHARGE_RADIUS * 2, 0, 2 * Math.PI);
      ctx.fill();

      // Charge circle
      ctx.fillStyle = charge.q > 0
        ? (isDark ? 'rgba(255, 140, 0, 0.9)' : 'rgba(255, 100, 0, 1)')
        : (isDark ? 'rgba(100, 150, 255, 0.9)' : 'rgba(50, 100, 255, 1)');
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, CHARGE_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      // Charge symbol
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 1)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charge.q > 0 ? '+' : '−', charge.x, charge.y);
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
  }, [getCanvasContext, computeFieldAt]);

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
      // Remove nearest charge
      const charges = chargesRef.current;
      if (charges.length > 0) {
        let minDist = Infinity;
        let nearestIndex = -1;

        for (let i = 0; i < charges.length; i++) {
          const dx = px - charges[i].x;
          const dy = py - charges[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist && dist < CHARGE_RADIUS * 3) {
            minDist = dist;
            nearestIndex = i;
          }
        }

        if (nearestIndex >= 0) {
          charges.splice(nearestIndex, 1);
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

    // If not a long press, add a charge
    if (!isLongPressRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Add charge at tap position
      chargesRef.current.push({
        x: px,
        y: py,
        q: chargeMode === 'positive' ? 1 : -1,
      });

      draw();
    }

    isLongPressRef.current = false;
  }, [chargeMode, draw]);

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

  const handleClearCharges = useCallback(() => {
    chargesRef.current = [];
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
        {/* Charge Mode Toggle */}
        <div className="flex gap-2 mb-2">
          <motion.button
            onClick={() => setChargeMode('positive')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              chargeMode === 'positive'
                ? 'bg-amber-500/20 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add +
          </motion.button>
          <motion.button
            onClick={() => setChargeMode('negative')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              chargeMode === 'negative'
                ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add −
          </motion.button>
        </div>

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
            onClick={handleClearCharges}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear Charges
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ElectromagneticFieldSimulation;



