import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Physics constants
const DT_FIXED = 0.01; // Fixed timestep for stability
const THRUST_FORCE = 200; // Base thrust force magnitude
const DRAG_COEFFICIENT = 0.5; // Friction drag when Earth mode is on
const DOCKING_SPEED_THRESHOLD = 0.5; // Speed below which docking is possible
const NUM_STARS = 150; // Number of stars in starfield
const PARALLAX_FACTOR = 0.3; // How much stars move relative to ship
const SHIP_SIZE = 12; // Ship triangle size
const VECTOR_SCALE = 0.5; // Scale factor for vector visualization
const MAX_VECTOR_LENGTH = 80; // Maximum vector arrow length

interface Star {
  x: number;
  y: number;
  brightness: number;
}

interface ThrusterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface InertiaState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  angle: number; // Ship orientation (radians)
  mass: number;
  thrusting: boolean;
  thrustVector: { x: number; y: number } | null;
  frictionEnabled: boolean;
  isRunning: boolean;
  dockZone: { x: number; y: number; width: number; height: number };
  isDocked: boolean;
  starfield: Star[];
  thrusterParticles: ThrusterParticle[];
  worldWidth: number;
  worldHeight: number;
}

const InertiaSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<InertiaState>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    angle: 0,
    mass: 1.0,
    thrusting: false,
    thrustVector: null,
    frictionEnabled: false,
    isRunning: true,
    dockZone: { x: 0, y: 0, width: 100, height: 100 },
    isDocked: false,
    starfield: [],
    thrusterParticles: [],
    worldWidth: 1000,
    worldHeight: 1000,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);
  
  // Joystick state
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickRadius = 60;
  
  // UI state
  const [mass, setMass] = useState(1.0);
  const [frictionEnabled, setFrictionEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [isAutoBraking, setIsAutoBraking] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  
  // Initialize starfield
  const initializeStarfield = useCallback((worldWidth: number, worldHeight: number): Star[] => {
    const stars: Star[] = [];
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    return stars;
  }, []);
  
  // Initialize docking zone
  const initializeDockZone = useCallback((worldWidth: number, worldHeight: number) => {
    return {
      x: worldWidth * 0.7,
      y: worldHeight * 0.3,
      width: 120,
      height: 120,
    };
  }, []);
  
  // Reset simulation
  const resetSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const worldWidth = canvas.width * 2;
    const worldHeight = canvas.height * 2;
    
    stateRef.current = {
      position: { x: worldWidth / 2, y: worldHeight / 2 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      angle: 0,
      mass: mass,
      thrusting: false,
      thrustVector: null,
      frictionEnabled: frictionEnabled,
      isRunning: isRunning,
      dockZone: initializeDockZone(worldWidth, worldHeight),
      isDocked: false,
      starfield: initializeStarfield(worldWidth, worldHeight),
      thrusterParticles: [],
      worldWidth,
      worldHeight,
    };
    accumulatorRef.current = 0;
  }, [mass, frictionEnabled, isRunning, initializeStarfield, initializeDockZone]);
  
  // Update state refs when UI changes
  useEffect(() => {
    stateRef.current.mass = mass;
    stateRef.current.frictionEnabled = frictionEnabled;
    stateRef.current.isRunning = isRunning;
  }, [mass, frictionEnabled, isRunning]);
  
  // Initialize on mount
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);
  
  // Physics update
  const updatePhysics = useCallback((dt: number) => {
    const state = stateRef.current;
    
    // Auto-braking logic
    if (isAutoBraking) {
      const speed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);
      if (speed > 0.1) {
        // Apply reverse thrust
        const brakeForce = Math.min(THRUST_FORCE * 1.5, speed * state.mass * 10);
        state.thrustVector = {
          x: -state.velocity.x / speed * brakeForce,
          y: -state.velocity.y / speed * brakeForce,
        };
        state.thrusting = true;
      } else {
        // Stop braking when speed is low
        state.velocity.x = 0;
        state.velocity.y = 0;
        state.thrusting = false;
        state.thrustVector = null;
        setIsAutoBraking(false);
      }
    }
    
    // Compute acceleration from thrust
    if (state.thrusting && state.thrustVector) {
      state.acceleration.x = state.thrustVector.x / state.mass;
      state.acceleration.y = state.thrustVector.y / state.mass;
    } else {
      state.acceleration.x = 0;
      state.acceleration.y = 0;
    }
    
    // Apply friction if enabled
    if (state.frictionEnabled) {
      const drag = DRAG_COEFFICIENT;
      state.velocity.x *= 1 - drag * dt;
      state.velocity.y *= 1 - drag * dt;
    }
    
    // Integrate velocity
    state.velocity.x += state.acceleration.x * dt;
    state.velocity.y += state.acceleration.y * dt;
    
    // Integrate position
    state.position.x += state.velocity.x * dt;
    state.position.y += state.velocity.y * dt;
    
    // Screen wrapping
    if (state.position.x < 0) state.position.x += state.worldWidth;
    if (state.position.x > state.worldWidth) state.position.x -= state.worldWidth;
    if (state.position.y < 0) state.position.y += state.worldHeight;
    if (state.position.y > state.worldHeight) state.position.y -= state.worldHeight;
    
    // Update ship angle (point in direction of velocity, or thrust if no velocity)
    const speed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);
    if (speed > 0.1) {
      state.angle = Math.atan2(state.velocity.y, state.velocity.x);
    } else if (state.thrusting && state.thrustVector) {
      state.angle = Math.atan2(state.thrustVector.y, state.thrustVector.x);
    }
    
    // Update thruster particles
    if (state.thrusting && state.thrustVector) {
      // Add new particles
      const particleCount = 3;
      for (let i = 0; i < particleCount; i++) {
        const angle = state.angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const particleSpeed = 20 + Math.random() * 30;
        state.thrusterParticles.push({
          x: state.position.x,
          y: state.position.y,
          vx: Math.cos(angle) * particleSpeed,
          vy: Math.sin(angle) * particleSpeed,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.3 + Math.random() * 0.2,
        });
      }
    }
    
    // Update existing particles
    state.thrusterParticles = state.thrusterParticles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      return p.life > 0;
    });
    
    // Check docking (reuse speed variable from above)
    const inZone =
      state.position.x >= state.dockZone.x &&
      state.position.x <= state.dockZone.x + state.dockZone.width &&
      state.position.y >= state.dockZone.y &&
      state.position.y <= state.dockZone.y + state.dockZone.height;
    
    if (inZone && speed < DOCKING_SPEED_THRESHOLD && !state.isDocked) {
      state.isDocked = true;
    } else if (!inZone || speed >= DOCKING_SPEED_THRESHOLD) {
      state.isDocked = false;
    }
  }, [isAutoBraking]);
  
  // Get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
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
    ctx.fillStyle = isDark ? '#050712' : '#f5f7fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars with parallax
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.3)';
    state.starfield.forEach(star => {
      const screenX = (star.x - state.position.x) * PARALLAX_FACTOR + canvas.width / 2;
      const screenY = (star.y - state.position.y) * PARALLAX_FACTOR + canvas.height / 2;
      
      // Wrap stars around screen
      const wrappedX = ((screenX % canvas.width) + canvas.width) % canvas.width;
      const wrappedY = ((screenY % canvas.height) + canvas.height) % canvas.height;
      
      ctx.globalAlpha = star.brightness;
      ctx.beginPath();
      ctx.arc(wrappedX, wrappedY, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    
    // Draw docking zone with parallax
    const dockScreenX = (state.dockZone.x - state.position.x) * PARALLAX_FACTOR + canvas.width / 2;
    const dockScreenY = (state.dockZone.y - state.position.y) * PARALLAX_FACTOR + canvas.height / 2;
    const dockScreenW = state.dockZone.width * PARALLAX_FACTOR;
    const dockScreenH = state.dockZone.height * PARALLAX_FACTOR;
    
    ctx.strokeStyle = isDark ? 'rgba(100, 200, 255, 0.6)' : 'rgba(0, 100, 200, 0.6)';
    ctx.fillStyle = isDark ? 'rgba(100, 200, 255, 0.1)' : 'rgba(0, 100, 200, 0.1)';
    ctx.lineWidth = 2;
    ctx.fillRect(dockScreenX, dockScreenY, dockScreenW, dockScreenH);
    ctx.strokeRect(dockScreenX, dockScreenY, dockScreenW, dockScreenH);
    
    if (state.isDocked) {
      ctx.fillStyle = isDark ? 'rgba(100, 255, 100, 0.3)' : 'rgba(0, 200, 0, 0.3)';
      ctx.fillRect(dockScreenX, dockScreenY, dockScreenW, dockScreenH);
    }
    
    // Draw thruster particles
    state.thrusterParticles.forEach(particle => {
      const screenX = (particle.x - state.position.x) * PARALLAX_FACTOR + canvas.width / 2;
      const screenY = (particle.y - state.position.y) * PARALLAX_FACTOR + canvas.height / 2;
      
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = `rgba(255, ${150 + Math.random() * 50}, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 2 + Math.random() * 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Ship center in screen coordinates
    const shipScreenX = canvas.width / 2;
    const shipScreenY = canvas.height / 2;
    
    // Draw velocity vector (green)
    const speed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);
    if (speed > 0.1) {
      const vx = state.velocity.x * VECTOR_SCALE;
      const vy = state.velocity.y * VECTOR_SCALE;
      const length = Math.min(Math.sqrt(vx ** 2 + vy ** 2), MAX_VECTOR_LENGTH);
      const angle = Math.atan2(vy, vx);
      
      ctx.strokeStyle = isDark ? '#4ade80' : '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shipScreenX, shipScreenY);
      ctx.lineTo(
        shipScreenX + Math.cos(angle) * length,
        shipScreenY + Math.sin(angle) * length
      );
      ctx.stroke();
      
      // Arrowhead
      ctx.beginPath();
      const arrowX = shipScreenX + Math.cos(angle) * length;
      const arrowY = shipScreenY + Math.sin(angle) * length;
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - Math.cos(angle - 0.5) * 8,
        arrowY - Math.sin(angle - 0.5) * 8
      );
      ctx.lineTo(
        arrowX - Math.cos(angle + 0.5) * 8,
        arrowY - Math.sin(angle + 0.5) * 8
      );
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw thrust vector (orange, only when active)
    if (state.thrusting && state.thrustVector) {
      const fx = state.thrustVector.x * VECTOR_SCALE;
      const fy = state.thrustVector.y * VECTOR_SCALE;
      const length = Math.min(Math.sqrt(fx ** 2 + fy ** 2), MAX_VECTOR_LENGTH);
      const angle = Math.atan2(fy, fx);
      
      ctx.strokeStyle = isDark ? '#fb923c' : '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shipScreenX, shipScreenY);
      ctx.lineTo(
        shipScreenX + Math.cos(angle) * length,
        shipScreenY + Math.sin(angle) * length
      );
      ctx.stroke();
      
      // Arrowhead
      ctx.beginPath();
      const arrowX = shipScreenX + Math.cos(angle) * length;
      const arrowY = shipScreenY + Math.sin(angle) * length;
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - Math.cos(angle - 0.5) * 8,
        arrowY - Math.sin(angle - 0.5) * 8
      );
      ctx.lineTo(
        arrowX - Math.cos(angle + 0.5) * 8,
        arrowY - Math.sin(angle + 0.5) * 8
      );
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw ship (triangle)
    ctx.save();
    ctx.translate(shipScreenX, shipScreenY);
    ctx.rotate(state.angle);
    
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 15, 15, 0.9)';
    ctx.strokeStyle = isDark ? '#60a5fa' : '#2563eb';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.5);
    ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }, [getCanvasContext]);
  
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
      
      const maxSize = Math.min(container.clientWidth - 32, 600);
      canvas.width = maxSize;
      canvas.height = maxSize;
      
      // Update world dimensions
      stateRef.current.worldWidth = canvas.width * 2;
      stateRef.current.worldHeight = canvas.height * 2;
      
      // Regenerate starfield and dock zone
      stateRef.current.starfield = initializeStarfield(
        stateRef.current.worldWidth,
        stateRef.current.worldHeight
      );
      stateRef.current.dockZone = initializeDockZone(
        stateRef.current.worldWidth,
        stateRef.current.worldHeight
      );
      
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw, initializeStarfield, initializeDockZone]);
  
  // Joystick handlers
  const handleJoystickStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setJoystickPosition({ x: 0, y: 0 });
    }
    // Set pointer capture to track movement outside the element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, []);
  
  const handleJoystickMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const dx = e.clientX - joystickCenterRef.current.x;
    const dy = e.clientY - joystickCenterRef.current.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    const clampedDistance = Math.min(distance, joystickRadius);
    
    if (clampedDistance > 5) {
      const angle = Math.atan2(dy, dx);
      const magnitude = clampedDistance / joystickRadius;
      
      // Update joystick visual position
      setJoystickPosition({
        x: Math.cos(angle) * clampedDistance,
        y: Math.sin(angle) * clampedDistance,
      });
      
      stateRef.current.thrustVector = {
        x: Math.cos(angle) * THRUST_FORCE * magnitude,
        y: Math.sin(angle) * THRUST_FORCE * magnitude,
      };
      stateRef.current.thrusting = true;
    } else {
      setJoystickPosition({ x: 0, y: 0 });
      stateRef.current.thrusting = false;
      stateRef.current.thrustVector = null;
    }
  }, []);
  
  const handleJoystickEnd = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    setJoystickPosition({ x: 0, y: 0 });
    stateRef.current.thrusting = false;
    stateRef.current.thrustVector = null;
    // Release pointer capture
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);
  
  // Brake handler
  const handleBrake = useCallback(() => {
    setIsAutoBraking(true);
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
        {/* Virtual Joystick */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Thrust Control
          </label>
          <div className="flex items-center justify-center">
            <div
              ref={joystickRef}
              className="relative w-32 h-32 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 border-2 border-ink-muted/30 dark:border-paper-light/30 flex items-center justify-center cursor-pointer touch-none select-none"
              onPointerDown={handleJoystickStart}
              onPointerMove={handleJoystickMove}
              onPointerUp={handleJoystickEnd}
              onPointerCancel={handleJoystickEnd}
            >
              <div className="w-4 h-4 rounded-full bg-ink-primary/50 dark:bg-paper-light/50" />
              <motion.div
                className="absolute w-8 h-8 rounded-full bg-ink-primary/30 dark:bg-paper-light/30 border-2 border-ink-primary dark:border-paper-light pointer-events-none"
                animate={{
                  x: joystickPosition.x,
                  y: joystickPosition.y,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
          <p className="text-xs text-ink-secondary dark:text-ink-muted text-center mt-2">
            Drag to apply thrust
          </p>
        </div>
        
        {/* Mass Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Mass (Inertia): {mass.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
        
        {/* Friction Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Earth mode (friction)
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setFrictionEnabled(false)}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                !frictionEnabled
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Space
            </motion.button>
            <motion.button
              onClick={() => setFrictionEnabled(true)}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                frictionEnabled
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Earth
            </motion.button>
          </div>
        </div>
        
        {/* Brake Button */}
        <div>
          <motion.button
            onClick={handleBrake}
            disabled={isAutoBraking}
            className="w-full px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors disabled:opacity-50"
            whileHover={{ scale: isAutoBraking ? 1 : 1.02 }}
            whileTap={{ scale: isAutoBraking ? 1 : 0.98 }}
          >
            {isAutoBraking ? 'Braking...' : 'Brake to stop'}
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

export default InertiaSimulation;

