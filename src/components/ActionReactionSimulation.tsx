import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Physics constants
const DT_FIXED = 0.01; // Fixed timestep for stability
const MAX_WALL_MASS = 10000; // Effectively infinite mass for wall
const FORCE_SCALE = 0.5; // Scale factor for force visualization (N to pixels)
const MAX_FORCE_ARROW_LENGTH = 200; // Maximum force arrow length in pixels
const VELOCITY_SCALE = 2; // Scale factor for velocity arrow
const ENTITY_SIZE = 40; // Size of entity icons
const NUM_STARS = 100; // Number of stars in starfield

interface EntityState {
  x: number;
  v: number;
  m: number;
}

type InteractionMode = 'push' | 'pull';
type TargetType = 'astronaut' | 'crate' | 'wall';

interface ActionReactionState {
  entityA: EntityState;
  entityB: EntityState;
  interactionMode: InteractionMode;
  targetType: TargetType;
  isActiveForce: boolean;
  forceMagnitude: number;
  comX: number;
  isRunning: boolean;
  worldWidth: number;
  worldHeight: number;
  stars: Array<{ x: number; y: number; brightness: number }>;
}

const ActionReactionSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ActionReactionState>({
    entityA: { x: 0, v: 0, m: 5 },
    entityB: { x: 0, v: 0, m: 5 },
    interactionMode: 'push',
    targetType: 'astronaut',
    isActiveForce: false,
    forceMagnitude: 50,
    comX: 0,
    isRunning: true,
    worldWidth: 800,
    worldHeight: 400,
    stars: [],
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  // UI state
  const [massA, setMassA] = useState(5);
  const [massB, setMassB] = useState(5);
  const [forceMagnitude, setForceMagnitude] = useState(50);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('push');
  const [targetType, setTargetType] = useState<TargetType>('astronaut');
  const [isRunning, setIsRunning] = useState(true);
  const [isPushing, setIsPushing] = useState(false);

  // Initialize starfield
  const initializeStarfield = useCallback((width: number, height: number) => {
    const stars: Array<{ x: number; y: number; brightness: number }> = [];
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    return stars;
  }, []);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const worldWidth = canvas.width;
    const worldHeight = canvas.height;

    // Set entity B mass based on target type
    let entityBMass = massB;
    if (targetType === 'wall') {
      entityBMass = MAX_WALL_MASS;
    }

    // Start positions: A on left, B on right
    const startA = worldWidth * 0.25;
    const startB = worldWidth * 0.75;

    stateRef.current = {
      entityA: { x: startA, v: 0, m: massA },
      entityB: { x: startB, v: 0, m: entityBMass },
      interactionMode: interactionMode,
      targetType: targetType,
      isActiveForce: false,
      forceMagnitude: forceMagnitude,
      comX: (massA * startA + entityBMass * startB) / (massA + entityBMass),
      isRunning: isRunning,
      worldWidth,
      worldHeight,
      stars: initializeStarfield(worldWidth, worldHeight),
    };
    accumulatorRef.current = 0;
  }, [massA, massB, forceMagnitude, interactionMode, targetType, isRunning, initializeStarfield]);

  // Update state refs when UI changes
  useEffect(() => {
    stateRef.current.entityA.m = massA;
    let entityBMass = massB;
    if (targetType === 'wall') {
      entityBMass = MAX_WALL_MASS;
    }
    stateRef.current.entityB.m = entityBMass;
    stateRef.current.forceMagnitude = forceMagnitude;
    stateRef.current.interactionMode = interactionMode;
    stateRef.current.targetType = targetType;
    stateRef.current.isRunning = isRunning;
    stateRef.current.isActiveForce = isPushing;
  }, [massA, massB, forceMagnitude, interactionMode, targetType, isRunning, isPushing]);

  // Initialize on mount
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Physics update
  const updatePhysics = useCallback((dt: number) => {
    const state = stateRef.current;

    // Update entity B mass if target type changed
    if (state.targetType === 'wall') {
      state.entityB.m = MAX_WALL_MASS;
    }

    // Calculate forces (action-reaction pair)
    let F_A = 0;
    let F_B = 0;

    if (state.isActiveForce) {
      // Determine force direction based on mode
      // Push: A pushes left (-), B pushes right (+)
      // Pull: A pulls right (+), B pulls left (-)
      const direction = state.interactionMode === 'push' ? -1 : 1;
      F_B = state.forceMagnitude * direction;
      F_A = -F_B; // Always equal and opposite
    }

    // Calculate accelerations
    const aA = F_A / state.entityA.m;
    const aB = F_B / state.entityB.m;

    // Integrate velocities
    state.entityA.v += aA * dt;
    state.entityB.v += aB * dt;

    // Integrate positions
    state.entityA.x += state.entityA.v * dt;
    state.entityB.x += state.entityB.v * dt;

    // Update centre of mass
    const totalM = state.entityA.m + state.entityB.m;
    state.comX = (state.entityA.m * state.entityA.x + state.entityB.m * state.entityB.x) / totalM;

    // Handle boundaries (wrap around for continuous motion)
    if (state.entityA.x < -ENTITY_SIZE) {
      state.entityA.x = state.worldWidth + ENTITY_SIZE;
    } else if (state.entityA.x > state.worldWidth + ENTITY_SIZE) {
      state.entityA.x = -ENTITY_SIZE;
    }

    if (state.entityB.x < -ENTITY_SIZE) {
      state.entityB.x = state.worldWidth + ENTITY_SIZE;
    } else if (state.entityB.x > state.worldWidth + ENTITY_SIZE) {
      state.entityB.x = -ENTITY_SIZE;
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

  // Draw entity helper
  const drawEntity = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: 'astronaut' | 'crate' | 'wall',
    isDark: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);

    if (type === 'astronaut') {
      // Draw astronaut (simple person icon)
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 15, 15, 0.9)';
      ctx.strokeStyle = isDark ? '#60a5fa' : '#2563eb';
      ctx.lineWidth = 2;

      // Head
      ctx.beginPath();
      ctx.arc(0, -ENTITY_SIZE / 2, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(0, -ENTITY_SIZE / 2 + 8);
      ctx.lineTo(0, ENTITY_SIZE / 2 - 8);
      ctx.stroke();

      // Arms
      ctx.beginPath();
      ctx.moveTo(0, -ENTITY_SIZE / 2 + 12);
      ctx.lineTo(-12, -ENTITY_SIZE / 2 + 20);
      ctx.moveTo(0, -ENTITY_SIZE / 2 + 12);
      ctx.lineTo(12, -ENTITY_SIZE / 2 + 20);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(0, ENTITY_SIZE / 2 - 8);
      ctx.lineTo(-10, ENTITY_SIZE / 2);
      ctx.moveTo(0, ENTITY_SIZE / 2 - 8);
      ctx.lineTo(10, ENTITY_SIZE / 2);
      ctx.stroke();
    } else if (type === 'crate') {
      // Draw crate (box)
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 15, 15, 0.9)';
      ctx.strokeStyle = isDark ? '#fb923c' : '#ea580c';
      ctx.lineWidth = 2;

      const size = ENTITY_SIZE * 1.2;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.strokeRect(-size / 2, -size / 2, size, size);

      // Draw crate lines
      ctx.beginPath();
      ctx.moveTo(-size / 2, -size / 4);
      ctx.lineTo(size / 2, -size / 4);
      ctx.moveTo(-size / 2, size / 4);
      ctx.lineTo(size / 2, size / 4);
      ctx.moveTo(-size / 4, -size / 2);
      ctx.lineTo(-size / 4, size / 2);
      ctx.moveTo(size / 4, -size / 2);
      ctx.lineTo(size / 4, size / 2);
      ctx.stroke();
    } else if (type === 'wall') {
      // Draw wall (vertical slab)
      ctx.fillStyle = isDark ? 'rgba(100, 100, 100, 0.8)' : 'rgba(150, 150, 150, 0.8)';
      ctx.strokeStyle = isDark ? 'rgba(200, 200, 200, 0.9)' : 'rgba(50, 50, 50, 0.9)';
      ctx.lineWidth = 3;

      const width = ENTITY_SIZE * 0.8;
      const height = ENTITY_SIZE * 2;
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.strokeRect(-width / 2, -height / 2, width, height);

      // Draw wall texture lines
      ctx.strokeStyle = isDark ? 'rgba(150, 150, 150, 0.5)' : 'rgba(100, 100, 100, 0.5)';
      ctx.lineWidth = 1;
      for (let i = -height / 2 + 10; i < height / 2; i += 15) {
        ctx.beginPath();
        ctx.moveTo(-width / 2, i);
        ctx.lineTo(width / 2, i);
        ctx.stroke();
      }
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
    ctx.fillStyle = isDark ? '#050712' : '#f4f5f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.2)';
    state.stars.forEach(star => {
      ctx.globalAlpha = star.brightness;
      ctx.beginPath();
      ctx.arc(star.x, star.y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw interaction axis (horizontal line)
    const axisY = canvas.height / 2;
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(canvas.width, axisY);
    ctx.stroke();

    // Draw centre of mass marker
    const comX = state.comX;
    ctx.strokeStyle = isDark ? '#8b5cf6' : '#14b8a6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(comX, 0);
    ctx.lineTo(comX, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw COM label
    ctx.fillStyle = isDark ? '#8b5cf6' : '#14b8a6';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('COM', comX, 5);

    // Calculate midpoint for force arrows
    const midX = (state.entityA.x + state.entityB.x) / 2;
    const midY = axisY;

    // Draw interaction link (bar/piston) when force is active
    if (state.isActiveForce) {
      ctx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.6)' : 'rgba(20, 184, 166, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(state.entityA.x, axisY);
      ctx.lineTo(state.entityB.x, axisY);
      ctx.stroke();
    }

    // Draw force arrows (action-reaction pair from midpoint)
    if (state.isActiveForce) {
      const forceLength = Math.min(state.forceMagnitude * FORCE_SCALE, MAX_FORCE_ARROW_LENGTH);
      
      // Determine arrow directions based on mode
      if (state.interactionMode === 'push') {
        // Push: A left, B right
        drawArrow(
          ctx,
          midX,
          midY,
          midX - forceLength,
          midY,
          isDark ? '#ec4899' : '#db2777',
          3,
          'F_A'
        );
        drawArrow(
          ctx,
          midX,
          midY,
          midX + forceLength,
          midY,
          isDark ? '#ec4899' : '#db2777',
          3,
          'F_B'
        );
      } else {
        // Pull: A right, B left
        drawArrow(
          ctx,
          midX,
          midY,
          midX + forceLength,
          midY,
          isDark ? '#ec4899' : '#db2777',
          3,
          'F_A'
        );
        drawArrow(
          ctx,
          midX,
          midY,
          midX - forceLength,
          midY,
          isDark ? '#ec4899' : '#db2777',
          3,
          'F_B'
        );
      }
    }

    // Draw velocity arrows (attached to entities)
    if (Math.abs(state.entityA.v) > 0.1) {
      const velLength = Math.min(Math.abs(state.entityA.v) * VELOCITY_SCALE, 100);
      drawArrow(
        ctx,
        state.entityA.x,
        axisY + ENTITY_SIZE / 2 + 15,
        state.entityA.x + Math.sign(state.entityA.v) * velLength,
        axisY + ENTITY_SIZE / 2 + 15,
        isDark ? '#4ade80' : '#16a34a',
        2,
        'v_A'
      );
    }

    if (Math.abs(state.entityB.v) > 0.1) {
      const velLength = Math.min(Math.abs(state.entityB.v) * VELOCITY_SCALE, 100);
      drawArrow(
        ctx,
        state.entityB.x,
        axisY + ENTITY_SIZE / 2 + 15,
        state.entityB.x + Math.sign(state.entityB.v) * velLength,
        axisY + ENTITY_SIZE / 2 + 15,
        isDark ? '#4ade80' : '#16a34a',
        2,
        'v_B'
      );
    }

    // Draw entities
    drawEntity(ctx, state.entityA.x, axisY, 'astronaut', isDark);
    drawEntity(ctx, state.entityB.x, axisY, state.targetType, isDark);
  }, [getCanvasContext, drawArrow, drawEntity]);

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

      // Update world dimensions
      stateRef.current.worldWidth = canvas.width;
      stateRef.current.worldHeight = canvas.height;

      // Regenerate starfield
      stateRef.current.stars = initializeStarfield(canvas.width, canvas.height);

      // Reset positions
      const startA = canvas.width * 0.25;
      const startB = canvas.width * 0.75;
      stateRef.current.entityA.x = startA;
      stateRef.current.entityB.x = startB;

      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw, initializeStarfield]);

  // Handle push/pull button (hold to apply force)
  const handleForceStart = useCallback(() => {
    setIsPushing(true);
  }, []);

  const handleForceEnd = useCallback(() => {
    setIsPushing(false);
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
        {/* Mass A Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Mass A (Player): {massA.toFixed(1)} kg
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={massA}
            onChange={(e) => setMassA(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Mass B Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Mass B (Target): {targetType === 'wall' ? 'Wall (∞)' : `${massB.toFixed(1)} kg`}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={targetType === 'wall' ? 100 : massB}
            onChange={(e) => {
              if (targetType !== 'wall') {
                setMassB(Number(e.target.value));
              }
            }}
            disabled={targetType === 'wall'}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light disabled:opacity-50"
          />
        </div>

        {/* Force Magnitude Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Force Magnitude: {forceMagnitude.toFixed(1)} N
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={forceMagnitude}
            onChange={(e) => setForceMagnitude(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Interaction Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Interaction Mode
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setInteractionMode('push')}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                interactionMode === 'push'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Push
            </motion.button>
            <motion.button
              onClick={() => setInteractionMode('pull')}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                interactionMode === 'pull'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Pull
            </motion.button>
          </div>
        </div>

        {/* Target Type Selector */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Target Type
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setTargetType('astronaut')}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                targetType === 'astronaut'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Astronaut
            </motion.button>
            <motion.button
              onClick={() => setTargetType('crate')}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                targetType === 'crate'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Crate
            </motion.button>
            <motion.button
              onClick={() => setTargetType('wall')}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                targetType === 'wall'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Wall
            </motion.button>
          </div>
        </div>

        {/* Push/Pull Button (hold to apply) */}
        <div>
          <motion.button
            onMouseDown={handleForceStart}
            onMouseUp={handleForceEnd}
            onMouseLeave={handleForceEnd}
            onTouchStart={handleForceStart}
            onTouchEnd={handleForceEnd}
            className={`w-full px-4 py-3 rounded-full font-medium transition-colors ${
              isPushing
                ? 'bg-ink-primary/30 dark:bg-paper-light/30 text-ink-primary dark:text-paper-light border-2 border-ink-primary dark:border-paper-light'
                : 'bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light'
            }`}
            whileHover={{ scale: isPushing ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {interactionMode === 'push' ? 'Push (Hold)' : 'Pull (Hold)'}
          </motion.button>
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

export default ActionReactionSimulation;

