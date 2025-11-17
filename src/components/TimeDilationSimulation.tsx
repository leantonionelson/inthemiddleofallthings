import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Physics constants
const EPS = 20; // Softening parameter (pixels^2)
const DT = 1 / 60; // Time step (60 fps)

// Field visualization grid
const SROWS = 30;
const SCOLS = 40;

// Clock grid for visualization
const CLOCK_ROWS = 8;
const CLOCK_COLS = 10;

// Visual constants
const MASS_RADIUS = 8;
const PARTICLE_RADIUS = 6;
const CLOCK_RADIUS = 3;
const MASS_STRENGTH = 1; // Default mass value

type Mass = {
  x: number;
  y: number;
  mass: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Clock = {
  x: number;
  y: number;
  phase: number; // 0 to 1 for animation
};

const TimeDilationSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const massesRef = useRef<Mass[]>([]);
  const particleRef = useRef<Particle>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  });
  const clocksRef = useRef<Clock[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);
  const animationTimeRef = useRef<number>(0);

  const [timeStrength, setTimeStrength] = useState(60); // 0-100, maps to β
  const [damping, setDamping] = useState(30); // 0-100
  const [showClocks, setShowClocks] = useState(true);

  // Compute time dilation field T(x,y) = Σ(m_i / √(r_i² + ε))
  const computeTimeDilation = useCallback((x: number, y: number, masses: Mass[]) => {
    let T = 0;

    for (const m of masses) {
      const dx = x - m.x;
      const dy = y - m.y;
      const distSq = dx * dx + dy * dy + EPS;
      const invDist = 1 / Math.sqrt(distSq);
      T += m.mass * invDist;
    }

    return T;
  }, []);

  // Compute time speed τ(x,y) = 1 / (1 + β·T(x,y))
  const computeTimeSpeed = useCallback((x: number, y: number, masses: Mass[], beta: number) => {
    const T = computeTimeDilation(x, y, masses);
    return 1 / (1 + beta * T);
  }, [computeTimeDilation]);

  // Compute time gradient ∇T
  const computeTimeGradient = useCallback((x: number, y: number, masses: Mass[]) => {
    let gx = 0;
    let gy = 0;

    for (const m of masses) {
      const dx = x - m.x;
      const dy = y - m.y;
      const distSq = dx * dx + dy * dy + EPS;
      const invDenom = 1 / Math.pow(distSq, 1.5);
      const factor = -m.mass * invDenom;
      
      // gradient of T_i = -m_i * (x-x_i, y-y_i) / (r^2 + eps)^(3/2)
      gx += factor * dx;
      gy += factor * dy;
    }

    return { gx, gy };
  }, []);

  // Update particle physics
  const updateParticle = useCallback((dt: number) => {
    const particle = particleRef.current;
    const masses = massesRef.current;

    // Map Time Strength slider to β parameter
    const betaMin = 0.0;
    const betaMax = 0.5;
    const beta = betaMin + (timeStrength / 100) * (betaMax - betaMin);

    // Map Time Strength to acceleration scale α
    const alphaMin = 0.0;
    const alphaMax = 400.0;
    const alpha = alphaMin + (timeStrength / 100) * (alphaMax - alphaMin);

    // Map damping slider
    const dampMin = 0.0;
    const dampMax = 0.06;
    const dampingValue = dampMin + (damping / 100) * (dampMax - dampMin);

    // Compute time gradient at particle position
    const { gx, gy } = computeTimeGradient(particle.x, particle.y, masses);

    // Acceleration = -α * gradient (toward slower time)
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
  }, [timeStrength, damping, computeTimeGradient]);

  // Update clock animations
  const updateClocks = useCallback((dt: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !showClocks) return;

    const masses = massesRef.current;
    const betaMin = 0.0;
    const betaMax = 0.5;
    const beta = betaMin + (timeStrength / 100) * (betaMax - betaMin);

    const dx = canvas.width / CLOCK_COLS;
    const dy = canvas.height / CLOCK_ROWS;

    // Update clock phases based on local time speed
    for (let i = 0; i < CLOCK_ROWS; i++) {
      for (let j = 0; j < CLOCK_COLS; j++) {
        const x = (j + 0.5) * dx;
        const y = (i + 0.5) * dy;
        const timeSpeed = computeTimeSpeed(x, y, masses, beta);
        
        const clockIndex = i * CLOCK_COLS + j;
        if (!clocksRef.current[clockIndex]) {
          clocksRef.current[clockIndex] = { x, y, phase: 0 };
        }
        
        // Update phase: faster time = faster phase progression
        clocksRef.current[clockIndex].phase += dt * timeSpeed * 2; // 2 is animation speed multiplier
        clocksRef.current[clockIndex].phase = clocksRef.current[clockIndex].phase % 1;
        clocksRef.current[clockIndex].x = x;
        clocksRef.current[clockIndex].y = y;
      }
    }
  }, [showClocks, timeStrength, computeTimeSpeed]);

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
    const masses = massesRef.current;
    const particle = particleRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains('dark');

    // Map Time Strength to β for visualization
    const betaMin = 0.0;
    const betaMax = 0.5;
    const beta = betaMin + (timeStrength / 100) * (betaMax - betaMin);

    // Compute time speed values for visualization
    const dx = canvas.width / SCOLS;
    const dy = canvas.height / SROWS;
    
    // Find min/max time speed for normalization
    let minTau = Infinity;
    let maxTau = -Infinity;
    const timeSpeedValues: number[][] = [];

    for (let i = 0; i < SROWS; i++) {
      timeSpeedValues[i] = [];
      for (let j = 0; j < SCOLS; j++) {
        const x = (j + 0.5) * dx;
        const y = (i + 0.5) * dy;
        const tau = computeTimeSpeed(x, y, masses, beta);
        timeSpeedValues[i][j] = tau;
        if (tau < minTau) minTau = tau;
        if (tau > maxTau) maxTau = tau;
      }
    }

    // Normalize range (add padding to avoid division by zero)
    const range = Math.max(maxTau - minTau, 1e-6);

    // Draw time flow field as shading (bright = fast time, dark = slow time)
    for (let i = 0; i < SROWS; i++) {
      for (let j = 0; j < SCOLS; j++) {
        const x = j * dx;
        const y = i * dy;
        const tau = timeSpeedValues[i][j];
        
        // Normalize to [0, 1]
        const normalized = (tau - minTau) / range;
        
        // Map to brightness: higher tau (faster time) = brighter
        const brightness = normalized;
        
        // Create gradient from light to dark
        const alpha = isDark ? 0.5 : 0.4;
        const r = Math.floor(255 * brightness);
        const g = Math.floor(255 * brightness);
        const b = Math.floor(255 * brightness);

        ctx.fillStyle = isDark
          ? `rgba(${r}, ${g}, ${b}, ${alpha})`
          : `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
        ctx.fillRect(x, y, dx, dy);
      }
    }

    // Draw pulsing rings around masses (ripple effect)
    if (masses.length > 0) {
      const time = animationTimeRef.current;
      for (const mass of masses) {
        // Draw multiple rings
        for (let ring = 1; ring <= 3; ring++) {
          const ringRadius = (ring * 30 + (time * 20 * computeTimeSpeed(mass.x, mass.y, masses, beta)) % 60);
          const ringAlpha = Math.max(0, 0.3 * (1 - ringRadius / 120));
          
          ctx.strokeStyle = isDark
            ? `rgba(150, 150, 255, ${ringAlpha})`
            : `rgba(100, 100, 200, ${ringAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(mass.x, mass.y, ringRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    }

    // Draw masses
    for (const mass of masses) {
      // Glow effect
      const gradient = ctx.createRadialGradient(
        mass.x,
        mass.y,
        0,
        mass.x,
        mass.y,
        MASS_RADIUS * 2.5
      );

      // Dark purple/indigo for masses (representing slow time)
      gradient.addColorStop(0, isDark ? 'rgba(100, 50, 150, 0.9)' : 'rgba(80, 40, 120, 0.9)');
      gradient.addColorStop(0.5, isDark ? 'rgba(100, 50, 150, 0.5)' : 'rgba(80, 40, 120, 0.5)');
      gradient.addColorStop(1, isDark ? 'rgba(100, 50, 150, 0)' : 'rgba(80, 40, 120, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mass.x, mass.y, MASS_RADIUS * 2.5, 0, 2 * Math.PI);
      ctx.fill();

      // Mass circle
      ctx.fillStyle = isDark ? 'rgba(100, 50, 150, 0.9)' : 'rgba(80, 40, 120, 0.9)';
      ctx.beginPath();
      ctx.arc(mass.x, mass.y, MASS_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      // Mass symbol (M for mass)
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 1)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', mass.x, mass.y);
    }

    // Draw clocks if enabled
    if (showClocks) {
      const clocks = clocksRef.current;
      for (const clock of clocks) {
        const timeSpeed = computeTimeSpeed(clock.x, clock.y, masses, beta);
        
        // Clock circle
        const clockAlpha = 0.6 + 0.4 * timeSpeed; // Faster time = more visible
        ctx.strokeStyle = isDark
          ? `rgba(200, 200, 255, ${clockAlpha})`
          : `rgba(100, 100, 200, ${clockAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(clock.x, clock.y, CLOCK_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();

        // Clock hand (rotating based on phase)
        const handAngle = clock.phase * 2 * Math.PI;
        const handLength = CLOCK_RADIUS * 0.7;
        ctx.strokeStyle = isDark
          ? `rgba(200, 200, 255, ${clockAlpha})`
          : `rgba(100, 100, 200, ${clockAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(clock.x, clock.y);
        ctx.lineTo(
          clock.x + handLength * Math.cos(handAngle),
          clock.y + handLength * Math.sin(handAngle)
        );
        ctx.stroke();

        // Pulsing dot in center (blinks faster for faster time)
        const pulseAlpha = 0.3 + 0.7 * Math.sin(clock.phase * Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(200, 200, 255, ${pulseAlpha * clockAlpha})`
          : `rgba(100, 100, 200, ${pulseAlpha * clockAlpha})`;
        ctx.beginPath();
        ctx.arc(clock.x, clock.y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
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
  }, [getCanvasContext, computeTimeSpeed, timeStrength, showClocks]);

  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Cap dt to prevent large jumps
      lastTimeRef.current = now;
      animationTimeRef.current += dt;

      updateParticle(dt);
      updateClocks(dt);
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
  }, [updateParticle, updateClocks, draw]);

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

      // Initialize clocks
      clocksRef.current = [];
      const dx = canvas.width / CLOCK_COLS;
      const dy = canvas.height / CLOCK_ROWS;
      for (let i = 0; i < CLOCK_ROWS; i++) {
        for (let j = 0; j < CLOCK_COLS; j++) {
          clocksRef.current.push({
            x: (j + 0.5) * dx,
            y: (i + 0.5) * dy,
            phase: Math.random(), // Random initial phase
          });
        }
      }

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
      // Remove nearest mass
      const masses = massesRef.current;
      if (masses.length > 0) {
        let minDist = Infinity;
        let nearestIndex = -1;

        for (let i = 0; i < masses.length; i++) {
          const dx = px - masses[i].x;
          const dy = py - masses[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist && dist < MASS_RADIUS * 3) {
            minDist = dist;
            nearestIndex = i;
          }
        }

        if (nearestIndex >= 0) {
          masses.splice(nearestIndex, 1);
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

    // If not a long press, add a mass
    if (!isLongPressRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Add mass at tap position
      massesRef.current.push({
        x: px,
        y: py,
        mass: MASS_STRENGTH,
      });

      draw();
    }

    isLongPressRef.current = false;
  }, [draw]);

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

  const handleClearMasses = useCallback(() => {
    massesRef.current = [];
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
        {/* Time Strength Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Time Strength: {timeStrength}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={timeStrength}
            onChange={(e) => setTimeStrength(Number(e.target.value))}
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

        {/* Clock Visualization Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showClocks}
              onChange={(e) => setShowClocks(e.target.checked)}
              className="w-4 h-4 rounded accent-ink-primary dark:accent-paper-light"
            />
            <span className="text-sm font-medium text-ink-primary dark:text-paper-light">
              Clock Visualization
            </span>
          </label>
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
            onClick={handleClearMasses}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear Masses
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TimeDilationSimulation;

