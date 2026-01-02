import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Physics constants
const DT_FIXED = 0.01; // Fixed timestep for stability
const GRAVITY = 9.8; // m/s²
const EPSILON = 0.01; // Small threshold for near-zero checks
const TRACK_Y_POSITION = 0.5; // Track position as fraction of canvas height (middle)
const SLED_WIDTH = 60;
const SLED_HEIGHT = 40;
const VECTOR_SCALE = 0.1; // Scale factor for force visualization (N to pixels)
const MAX_VECTOR_LENGTH = 150; // Maximum vector arrow length in pixels
const ACCELERATION_SCALE = 5; // Scale factor for acceleration arrow
const VELOCITY_SCALE = 0.5; // Scale factor for velocity arrow

interface ForceAccelerationState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  mass: number;
  frictionCoeff: number;
  pushRight: number; // N
  pushLeft: number; // N
  isRunning: boolean;
  trackWidth: number;
  trackHeight: number;
}

const ForceAccelerationSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ForceAccelerationState>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    mass: 2.0,
    frictionCoeff: 0.2,
    pushRight: 0,
    pushLeft: 0,
    isRunning: true,
    trackWidth: 800,
    trackHeight: 100,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  // UI state
  const [mass, setMass] = useState(2.0);
  const [pushRight, setPushRight] = useState(0);
  const [pushLeft, setPushLeft] = useState(0);
  const [frictionCoeff, setFrictionCoeff] = useState(0.2);
  const [isRunning, setIsRunning] = useState(true);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const trackWidth = canvas.width * 0.9;
    const trackHeight = 100;

    stateRef.current = {
      position: { x: canvas.width / 2, y: canvas.height * TRACK_Y_POSITION },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: mass,
      frictionCoeff: frictionCoeff,
      pushRight: pushRight,
      pushLeft: pushLeft,
      isRunning: isRunning,
      trackWidth,
      trackHeight,
    };
    accumulatorRef.current = 0;
  }, [mass, frictionCoeff, pushRight, pushLeft, isRunning]);

  // Update state refs when UI changes
  useEffect(() => {
    stateRef.current.mass = mass;
    stateRef.current.frictionCoeff = frictionCoeff;
    stateRef.current.pushRight = pushRight;
    stateRef.current.pushLeft = pushLeft;
    stateRef.current.isRunning = isRunning;
  }, [mass, frictionCoeff, pushRight, pushLeft, isRunning]);

  // Initialize on mount
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Physics update
  const updatePhysics = useCallback((dt: number) => {
    const state = stateRef.current;

    // Compute forces
    const F_push_x = state.pushRight - state.pushLeft; // Net push force (horizontal)
    const v = state.velocity.x;
    const speed = Math.abs(v);
    const N = state.mass * GRAVITY; // Normal force
    const F_max_friction = state.frictionCoeff * N;

    let F_friction_x = 0;

    if (speed > EPSILON) {
      // Kinetic friction: opposes motion
      const frictionDir = -Math.sign(v);
      F_friction_x = frictionDir * F_max_friction;
    } else {
      // Static friction: cancels push if push is small enough
      if (Math.abs(F_push_x) < F_max_friction) {
        // Static friction cancels push
        F_friction_x = -F_push_x;
      } else {
        // Push overcomes static friction, block starts moving
        const frictionDir = -Math.sign(F_push_x);
        F_friction_x = frictionDir * F_max_friction;
      }
    }

    const F_net_x = F_push_x + F_friction_x;

    // Vertical forces (simplified - track keeps sled at constant y)
    const F_weight_y = -state.mass * GRAVITY;
    const F_normal_y = -F_weight_y; // Normal balances weight
    const F_net_y = F_weight_y + F_normal_y; // ~0

    // Acceleration from F = ma
    state.acceleration.x = F_net_x / state.mass;
    state.acceleration.y = F_net_y / state.mass; // ~0

    // Integrate velocity
    state.velocity.x += state.acceleration.x * dt;
    state.velocity.y += state.acceleration.y * dt;

    // Integrate position
    state.position.x += state.velocity.x * dt;
    state.position.y += state.velocity.y * dt; // Should stay constant, but track keeps it in place

    // Keep sled on track (y position fixed)
    state.position.y = stateRef.current.trackWidth > 0 
      ? (canvasRef.current?.height || 400) * TRACK_Y_POSITION 
      : state.position.y;

    // Track boundaries (bounce or clamp)
    const canvas = canvasRef.current;
    if (canvas) {
      const trackLeft = (canvas.width - state.trackWidth) / 2;
      const trackRight = trackLeft + state.trackWidth;

      if (state.position.x < trackLeft + SLED_WIDTH / 2) {
        state.position.x = trackLeft + SLED_WIDTH / 2;
        state.velocity.x = -state.velocity.x * 0.5; // Bounce with damping
      } else if (state.position.x > trackRight - SLED_WIDTH / 2) {
        state.position.x = trackRight - SLED_WIDTH / 2;
        state.velocity.x = -state.velocity.x * 0.5; // Bounce with damping
      }
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

  // Draw arrow helper
  const drawArrow = useCallback((
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    lineWidth: number = 2,
    label?: string
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    const arrowLength = 10;
    const arrowAngle = 0.5;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle - arrowAngle),
      toY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle + arrowAngle),
      toY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();

    // Draw label if provided
    if (label) {
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, toX, toY - 15);
    }

    ctx.restore();
  }, []);

  // Draw function
  const draw = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;

    const { canvas, ctx } = context;
    const state = stateRef.current;
    const isDark = document.documentElement.classList.contains('dark');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (theme-aware)
    ctx.fillStyle = isDark ? '#050710' : '#f4f5f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate track position
    const trackY = canvas.height * TRACK_Y_POSITION;
    const trackLeft = (canvas.width - state.trackWidth) / 2;
    const trackRight = trackLeft + state.trackWidth;

    // Draw track
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(trackLeft, trackY - state.trackHeight / 2, state.trackWidth, state.trackHeight);

    // Draw track border
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(trackLeft, trackY - state.trackHeight / 2, state.trackWidth, state.trackHeight);

    // Draw tick marks on track
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    const numTicks = 10;
    for (let i = 0; i <= numTicks; i++) {
      const x = trackLeft + (state.trackWidth / numTicks) * i;
      ctx.beginPath();
      ctx.moveTo(x, trackY - state.trackHeight / 2);
      ctx.lineTo(x, trackY - state.trackHeight / 2 - 10);
      ctx.stroke();
    }

    // Sled center position
    const sledX = state.position.x;
    const sledY = state.position.y;

    // Compute forces for visualization
    const F_push_x = state.pushRight - state.pushLeft;
    const v = state.velocity.x;
    const speed = Math.abs(v);
    const N = state.mass * GRAVITY;
    const F_max_friction = state.frictionCoeff * N;

    let F_friction_x = 0;
    if (speed > EPSILON) {
      F_friction_x = -Math.sign(v) * F_max_friction;
    } else {
      if (Math.abs(F_push_x) < F_max_friction) {
        F_friction_x = -F_push_x;
      } else {
        F_friction_x = -Math.sign(F_push_x) * F_max_friction;
      }
    }

    const F_net_x = F_push_x + F_friction_x;

    // Draw weight arrow (vertical, downward, faint)
    if (state.mass > 0) {
      const weightY = sledY + 30;
      drawArrow(
        ctx,
        sledX,
        sledY,
        sledX,
        weightY,
        isDark ? 'rgba(150, 150, 150, 0.3)' : 'rgba(100, 100, 100, 0.3)',
        1
      );
    }

    // Draw normal arrow (vertical, upward, faint)
    if (state.mass > 0) {
      const normalY = sledY - 30;
      drawArrow(
        ctx,
        sledX,
        sledY,
        sledX,
        normalY,
        isDark ? 'rgba(150, 150, 150, 0.3)' : 'rgba(100, 100, 100, 0.3)',
        1
      );
    }

    // Draw push right arrow (blue)
    if (state.pushRight > 0) {
      const pushLength = Math.min(state.pushRight * VECTOR_SCALE, MAX_VECTOR_LENGTH);
      drawArrow(
        ctx,
        sledX,
        sledY,
        sledX + pushLength,
        sledY,
        isDark ? '#3b82f6' : '#2563eb',
        2
      );
    }

    // Draw push left arrow (orange)
    if (state.pushLeft > 0) {
      const pushLength = Math.min(state.pushLeft * VECTOR_SCALE, MAX_VECTOR_LENGTH);
      drawArrow(
        ctx,
        sledX,
        sledY,
        sledX - pushLength,
        sledY,
        isDark ? '#fb923c' : '#ea580c',
        2
      );
    }

    // Draw friction arrow (red)
    if (Math.abs(F_friction_x) > 0.1) {
      const frictionLength = Math.min(Math.abs(F_friction_x) * VECTOR_SCALE, MAX_VECTOR_LENGTH);
      drawArrow(
        ctx,
        sledX,
        sledY,
        sledX + Math.sign(F_friction_x) * frictionLength,
        sledY,
        isDark ? '#ef4444' : '#dc2626',
        2
      );
    }

    // Draw net force arrow (purple/teal, thick)
    if (Math.abs(F_net_x) > 0.1) {
      const netLength = Math.min(Math.abs(F_net_x) * VECTOR_SCALE, MAX_VECTOR_LENGTH);
      drawArrow(
        ctx,
        sledX,
        sledY - 20,
        sledX + Math.sign(F_net_x) * netLength,
        sledY - 20,
        isDark ? '#8b5cf6' : '#14b8a6',
        4,
        'F_net'
      );
    }

    // Draw acceleration arrow (smaller, labeled "a")
    if (Math.abs(state.acceleration.x) > 0.01) {
      const accelLength = Math.min(
        Math.abs(state.acceleration.x) * ACCELERATION_SCALE,
        MAX_VECTOR_LENGTH * 0.6
      );
      drawArrow(
        ctx,
        sledX,
        sledY + 20,
        sledX + Math.sign(state.acceleration.x) * accelLength,
        sledY + 20,
        isDark ? '#8b5cf6' : '#14b8a6',
        2,
        'a'
      );
    }

    // Draw velocity arrow (green, beneath track)
    if (Math.abs(state.velocity.x) > 0.1) {
      const velLength = Math.min(
        Math.abs(state.velocity.x) * VELOCITY_SCALE,
        MAX_VECTOR_LENGTH * 0.8
      );
      drawArrow(
        ctx,
        sledX,
        trackY + state.trackHeight / 2 + 20,
        sledX + Math.sign(state.velocity.x) * velLength,
        trackY + state.trackHeight / 2 + 20,
        isDark ? '#4ade80' : '#16a34a',
        2,
        'v'
      );
    }

    // Draw sled (rounded rectangle)
    ctx.save();
    ctx.translate(sledX, sledY);

    // Sled body
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 15, 15, 0.9)';
    ctx.strokeStyle = isDark ? '#60a5fa' : '#2563eb';
    ctx.lineWidth = 2;

    const cornerRadius = 8;
    ctx.beginPath();
    ctx.moveTo(-SLED_WIDTH / 2 + cornerRadius, -SLED_HEIGHT / 2);
    ctx.lineTo(SLED_WIDTH / 2 - cornerRadius, -SLED_HEIGHT / 2);
    ctx.quadraticCurveTo(SLED_WIDTH / 2, -SLED_HEIGHT / 2, SLED_WIDTH / 2, -SLED_HEIGHT / 2 + cornerRadius);
    ctx.lineTo(SLED_WIDTH / 2, SLED_HEIGHT / 2 - cornerRadius);
    ctx.quadraticCurveTo(SLED_WIDTH / 2, SLED_HEIGHT / 2, SLED_WIDTH / 2 - cornerRadius, SLED_HEIGHT / 2);
    ctx.lineTo(-SLED_WIDTH / 2 + cornerRadius, SLED_HEIGHT / 2);
    ctx.quadraticCurveTo(-SLED_WIDTH / 2, SLED_HEIGHT / 2, -SLED_WIDTH / 2, SLED_HEIGHT / 2 - cornerRadius);
    ctx.lineTo(-SLED_WIDTH / 2, -SLED_HEIGHT / 2 + cornerRadius);
    ctx.quadraticCurveTo(-SLED_WIDTH / 2, -SLED_HEIGHT / 2, -SLED_WIDTH / 2 + cornerRadius, -SLED_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }, [getCanvasContext, drawArrow]);

  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      if (stateRef.current.isRunning) {
        accumulatorRef.current += dt;
        while (accumulatorRef.current >= DT_FIXED) {
          updatePhysics(DT_FIXED);
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
  }, [updatePhysics, draw]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const maxSize = Math.min(container.clientWidth - 32, 800);
      canvas.width = maxSize;
      canvas.height = 400;

      // Update track dimensions
      stateRef.current.trackWidth = canvas.width * 0.9;
      stateRef.current.trackHeight = 100;

      // Reset position to center
      stateRef.current.position.x = canvas.width / 2;
      stateRef.current.position.y = canvas.height * TRACK_Y_POSITION;

      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  // Preset handlers
  const applyPreset = useCallback((preset: 'gentle' | 'heavy' | 'highFriction') => {
    if (preset === 'gentle') {
      setMass(1);
      setPushRight(5);
      setPushLeft(0);
      setFrictionCoeff(0.1);
    } else if (preset === 'heavy') {
      setMass(8);
      setPushRight(10);
      setPushLeft(0);
      setFrictionCoeff(0.2);
    } else if (preset === 'highFriction') {
      setMass(2);
      setPushRight(0);
      setPushLeft(0);
      setFrictionCoeff(0.8);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[800px] bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '400px' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Mass Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Mass: {mass.toFixed(1)} kg
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Push Right Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Push Right: {pushRight.toFixed(1)} N
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={pushRight}
            onChange={(e) => setPushRight(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Push Left Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Push Left: {pushLeft.toFixed(1)} N
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={pushLeft}
            onChange={(e) => setPushLeft(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Friction Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Friction (μ): {frictionCoeff.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={frictionCoeff}
            onChange={(e) => setFrictionCoeff(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Presets */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Presets
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => applyPreset('gentle')}
              className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Gentle Push
            </motion.button>
            <motion.button
              onClick={() => applyPreset('heavy')}
              className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Heavy Sled
            </motion.button>
            <motion.button
              onClick={() => applyPreset('highFriction')}
              className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              High Friction
            </motion.button>
          </div>
        </div>

        {/* Play/Pause/Reset Buttons */}
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
            onClick={resetSimulation}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ForceAccelerationSimulation;







