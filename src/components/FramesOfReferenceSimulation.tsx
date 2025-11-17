import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Physics constants
const C = 300; // Speed of light constant (pixels per second, scaled for visualization)
const DT = 1 / 60; // Time step (60 fps)

// Visual constants
const OBSERVER_RADIUS = 12;
const SHIP_RADIUS = 10;
const WORLD_LINE_Y = 0.5; // Fraction of canvas height for worldline

type SimulationState = {
  x_s: number; // ship position
  v_s: number; // ship velocity
  x_b: number; // observer B position
  v_b: number; // observer B velocity
  t: number; // simulation time
};

const FramesOfReferenceSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimulationState>({
    x_s: 100,
    v_s: 50,
    x_b: 300,
    v_b: 0,
    t: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const [frame, setFrame] = useState<'A' | 'B'>('A');
  const [mode, setMode] = useState<'classical' | 'relativistic'>('classical');
  const [shipVelocity, setShipVelocity] = useState(50); // -100 to 100
  const [observerBVelocity, setObserverBVelocity] = useState(0); // -100 to 100

  // Lorentz transform function
  const lorentzTransform = useCallback((xs: number, vs: number, t: number, vb: number) => {
    const beta = vb / C;
    const betaSq = beta * beta;
    
    if (Math.abs(betaSq) >= 1) {
      // Prevent division by zero or invalid values
      return { xsPrime: xs - vb * t, vsPrime: vs - vb, tPrime: t };
    }

    const gamma = 1 / Math.sqrt(1 - betaSq);
    
    // Velocity addition (relativistic)
    const vsPrime = (vs - vb) / (1 - (vs * vb) / (C * C));
    
    // Position transform
    const xsPrime = gamma * (xs - vb * t);
    
    // Time transform
    const tPrime = gamma * (t - (vb * xs) / (C * C));

    return { xsPrime, vsPrime, tPrime };
  }, []);

  // Update simulation state
  const updateSimulation = useCallback((dt: number) => {
    const state = stateRef.current;
    
    // Update velocities from sliders
    state.v_s = (shipVelocity / 100) * 150; // Scale to -150 to 150 pixels/sec
    state.v_b = (observerBVelocity / 100) * 150;

    // Always compute in Observer A's frame (absolute coordinates)
    state.x_s += state.v_s * dt;
    state.x_b += state.v_b * dt;
    state.t += dt;

    // Handle boundaries (wrap around)
    const canvas = canvasRef.current;
    if (canvas) {
      if (state.x_s < -50) state.x_s = canvas.width + 50;
      if (state.x_s > canvas.width + 50) state.x_s = -50;
      if (state.x_b < -50) state.x_b = canvas.width + 50;
      if (state.x_b > canvas.width + 50) state.x_b = -50;
    }
  }, [shipVelocity, observerBVelocity]);

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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains('dark');
    const worldLineY = canvas.height * WORLD_LINE_Y;

    // Draw worldline (horizontal line)
    ctx.strokeStyle = isDark
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, worldLineY);
    ctx.lineTo(canvas.width, worldLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Transform coordinates based on frame
    let x_a_draw: number;
    let x_b_draw: number;
    let x_s_draw: number;
    let v_s_display: number;

    if (frame === 'A') {
      // Observer A view: everything in absolute coordinates
      x_a_draw = 50; // Observer A at fixed position
      x_b_draw = state.x_b;
      x_s_draw = state.x_s;
      v_s_display = state.v_s;
    } else {
      // Observer B view: transform everything
      const centerX = canvas.width / 2; // Observer B always at center in their own frame
      
      if (mode === 'classical') {
        // Galilean transform
        x_a_draw = centerX + (0 - state.x_b); // Observer A relative to B
        x_b_draw = centerX; // Observer B at center
        x_s_draw = centerX + (state.x_s - state.x_b);
        v_s_display = state.v_s - state.v_b;
      } else {
        // Lorentz transform
        const { xsPrime: xsShip } = lorentzTransform(state.x_s, state.v_s, state.t, state.v_b);
        const { xsPrime: xsA } = lorentzTransform(0, 0, state.t, state.v_b);
        
        x_a_draw = centerX + xsA;
        x_b_draw = centerX; // Observer B at center
        x_s_draw = centerX + xsShip;
        
        const { vsPrime } = lorentzTransform(state.x_s, state.v_s, state.t, state.v_b);
        v_s_display = vsPrime;
      }
    }

    // Draw grid in relativistic mode (optional visual)
    if (mode === 'relativistic' && frame === 'B') {
      ctx.strokeStyle = isDark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      
      const beta = state.v_b / C;
      const gamma = Math.abs(beta) < 0.999 ? 1 / Math.sqrt(1 - (beta * beta)) : 1;
      const gridSpacing = 50 / gamma; // Compressed grid spacing
      
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }

    // Draw Observer A
    const observerAColor = isDark ? 'rgba(100, 150, 255, 0.9)' : 'rgba(50, 100, 255, 1)';
    ctx.fillStyle = observerAColor;
    ctx.beginPath();
    ctx.arc(x_a_draw, worldLineY, OBSERVER_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label Observer A
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', x_a_draw, worldLineY);

    // Draw Observer B
    const observerBColor = isDark ? 'rgba(255, 140, 0, 0.9)' : 'rgba(255, 100, 0, 1)';
    ctx.fillStyle = observerBColor;
    ctx.beginPath();
    ctx.arc(x_b_draw, worldLineY, OBSERVER_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label Observer B
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.fillText('B', x_b_draw, worldLineY);

    // Draw Ship
    const shipColor = isDark ? 'rgba(150, 255, 150, 0.9)' : 'rgba(50, 200, 50, 1)';
    ctx.fillStyle = shipColor;
    ctx.beginPath();
    ctx.arc(x_s_draw, worldLineY, SHIP_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw ship direction indicator
    const direction = v_s_display > 0 ? 1 : -1;
    ctx.strokeStyle = shipColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x_s_draw, worldLineY);
    ctx.lineTo(x_s_draw + direction * 15, worldLineY);
    ctx.stroke();

    // Draw velocity vectors
    if (frame === 'A') {
      // Show velocities in Observer A frame
      const arrowLength = Math.abs(state.v_s) * 0.3;
      if (arrowLength > 2) {
        ctx.strokeStyle = shipColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x_s_draw, worldLineY - 30);
        ctx.lineTo(x_s_draw + (state.v_s > 0 ? 1 : -1) * arrowLength, worldLineY - 30);
        ctx.stroke();
      }
    }
  }, [frame, mode, lorentzTransform, getCanvasContext]);

  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Cap dt to prevent large jumps
      lastTimeRef.current = now;

      updateSimulation(dt);
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
  }, [updateSimulation, draw]);

  // Handle canvas resize and initial setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const maxSize = Math.min(container.clientWidth - 32, 600);
      canvas.width = maxSize;
      canvas.height = maxSize * 0.6; // Aspect ratio for horizontal layout

      // Reset positions relative to new canvas size
      stateRef.current.x_s = canvas.width * 0.2;
      stateRef.current.x_b = canvas.width * 0.5;
      stateRef.current.t = 0;

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

  // Reset function
  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      stateRef.current = {
        x_s: canvas.width * 0.2,
        v_s: 50,
        x_b: canvas.width * 0.5,
        v_b: 0,
        t: 0,
      };
      setShipVelocity(50);
      setObserverBVelocity(0);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-default touch-none"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Frame Toggle */}
        <div className="flex gap-2 mb-2">
          <motion.button
            onClick={() => setFrame('A')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              frame === 'A'
                ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View as Observer A
          </motion.button>
          <motion.button
            onClick={() => setFrame('B')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              frame === 'B'
                ? 'bg-amber-500/20 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View as Observer B
          </motion.button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-2">
          <motion.button
            onClick={() => setMode('classical')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              mode === 'classical'
                ? 'bg-green-500/20 dark:bg-green-400/20 text-green-700 dark:text-green-300 border border-green-500/30 dark:border-green-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Classical
          </motion.button>
          <motion.button
            onClick={() => setMode('relativistic')}
            className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
              mode === 'relativistic'
                ? 'bg-purple-500/20 dark:bg-purple-400/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 dark:border-purple-400/30'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Relativistic
          </motion.button>
        </div>

        {/* Ship Velocity Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Ship Velocity: {shipVelocity}
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={shipVelocity}
            onChange={(e) => setShipVelocity(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Observer B Velocity Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Observer B Velocity: {observerBVelocity}
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={observerBVelocity}
            onChange={(e) => setObserverBVelocity(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Reset Button */}
        <motion.button
          onClick={handleReset}
          className="w-full px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Reset Simulation
        </motion.button>
      </div>
    </div>
  );
};

export default FramesOfReferenceSimulation;

