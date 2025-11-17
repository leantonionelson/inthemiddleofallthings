import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Physics constants
const G_eff = 2500; // Effective gravitational constant (increased for stronger gravity)
const EPS = 25; // Softening parameter (pixels^2)

// Visual constants
const CENTRAL_MASS_RADIUS = 10;
const PARTICLE_RADIUS = 3;
const MAX_TRAIL_LENGTH = 150;
const MIN_LAUNCH_RADIUS = 30; // Minimum distance from center to launch
const SPEED_SCALE = 0.6; // Scale factor for drag-to-velocity conversion (reduced for slower initial speeds)

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  _dead?: boolean;
};

const GeodesicSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const [massSlider, setMassSlider] = useState(50); // 0-100
  const [dampingSlider, setDampingSlider] = useState(1); // 0-100 (very low default for stable orbits)

  // Get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return { canvas, ctx };
  }, []);

  // Compute gravitational acceleration at a point
  const computeAcceleration = useCallback((x: number, y: number, centerX: number, centerY: number, massM: number) => {
    const dx = centerX - x;
    const dy = centerY - y;
    const distSq = dx * dx + dy * dy + EPS;
    const dist = Math.sqrt(distSq);

    const dirX = dx / (dist || 1); // avoid NaN
    const dirY = dy / (dist || 1);

    // a magnitude: G_eff * M / (r^2 + EPS)
    const mag = (G_eff * massM) / distSq;

    const ax = mag * dirX;
    const ay = mag * dirY;
    return { ax, ay };
  }, []);

  // Update a single particle
  const updateParticle = useCallback((p: Particle, dt: number, damping: number, centerX: number, centerY: number, massM: number) => {
    const { ax, ay } = computeAcceleration(p.x, p.y, centerX, centerY, massM);

    // Update velocity with damping
    p.vx = (1 - damping) * p.vx + ax * dt;
    p.vy = (1 - damping) * p.vy + ay * dt;

    // Update position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Update trail
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > MAX_TRAIL_LENGTH) {
      p.trail.shift();
    }

    // Handle bounds (mark for removal if off-canvas)
    const canvas = canvasRef.current;
    if (canvas) {
      const margin = 50;
      if (
        p.x < -margin || p.x > canvas.width + margin ||
        p.y < -margin || p.y > canvas.height + margin
      ) {
        p._dead = true;
      }
    }
  }, [computeAcceleration]);

  // Draw the simulation
  const draw = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;

    const { canvas, ctx } = context;
    const particles = particlesRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains('dark');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Optional: Draw subtle background shading (darker toward center)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvas.width, canvas.height) / 2);
    gradient.addColorStop(0, isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw particle trails
    for (const p of particles) {
      const trail = p.trail;
      if (trail.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw particles
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
      ctx.fill();
    }

    // Draw drag preview (orbital direction hint)
    if (isDraggingRef.current && dragStartRef.current && dragCurrentRef.current) {
      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;
      const endX = dragCurrentRef.current.x;
      const endY = dragCurrentRef.current.y;
      
      const distFromCenter = Math.hypot(startX - centerX, startY - centerY);
      if (distFromCenter >= MIN_LAUNCH_RADIUS) {
        // Calculate radial and tangential directions
        const radialX = (startX - centerX) / distFromCenter;
        const radialY = (startY - centerY) / distFromCenter;
        
        const dragX = endX - startX;
        const dragY = endY - startY;
        const dragLength = Math.hypot(dragX, dragY);
        
        if (dragLength > 0) {
          const dragDirX = dragX / dragLength;
          const dragDirY = dragY / dragLength;
          const radialComponent = dragDirX * radialX + dragDirY * radialY;
          const tangentialComponent = Math.sqrt(1 - radialComponent * radialComponent);
          
          // Show tangential direction hint for orbital trajectories
          if (tangentialComponent > 0.7) {
            const tangentialX = -radialY;
            const tangentialY = radialX;
            const previewLength = 40;
            
            ctx.strokeStyle = isDark ? 'rgba(100, 200, 255, 0.5)' : 'rgba(50, 150, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + tangentialX * previewLength, startY + tangentialY * previewLength);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        
        // Draw drag line
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    // Draw central mass with glow
    const massGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      CENTRAL_MASS_RADIUS * 3
    );
    massGradient.addColorStop(0, isDark ? 'rgba(253, 186, 116, 0.9)' : 'rgba(251, 146, 60, 0.9)');
    massGradient.addColorStop(0.5, isDark ? 'rgba(253, 186, 116, 0.4)' : 'rgba(251, 146, 60, 0.5)');
    massGradient.addColorStop(1, 'rgba(253, 186, 116, 0)');

    ctx.fillStyle = massGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CENTRAL_MASS_RADIUS * 3, 0, 2 * Math.PI);
    ctx.fill();

    // Draw central mass circle
    ctx.fillStyle = isDark ? 'rgba(253, 186, 116, 0.95)' : 'rgba(251, 146, 60, 1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, CENTRAL_MASS_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }, [getCanvasContext]);

  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Cap dt to prevent large jumps
      lastTimeRef.current = now;

      const context = getCanvasContext();
      if (!context) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const { canvas } = context;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Map sliders to physics parameters
      const massMin = 0.2;
      const massMax = 3.0;
      const massM = massMin + (massSlider / 100) * (massMax - massMin);

      const dampMin = 0.0;
      const dampMax = 0.02; // Reduced max damping for more stable orbits
      const damping = dampMin + (dampingSlider / 100) * (dampMax - dampMin);

      // Update all particles
      const particles = particlesRef.current;
      for (const p of particles) {
        updateParticle(p, dt, damping, centerX, centerY, massM);
      }

      // Remove dead particles
      particlesRef.current = particles.filter(p => !p._dead);

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
  }, [massSlider, dampingSlider, updateParticle, draw, getCanvasContext]);

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

  // Calculate orbital velocity for circular orbit at distance r
  const calculateOrbitalVelocity = useCallback((r: number, massM: number) => {
    // For circular orbit with softened potential: v = sqrt(G*M/r)
    // Use actual distance for orbital velocity calculation
    // The softening (EPS) prevents singularity but orbital velocity should use actual r
    const actualR = Math.max(r, 1); // Minimum 1 to avoid division by zero
    return Math.sqrt((G_eff * massM) / actualR);
  }, []);

  // Launch a new particle
  const launchParticle = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Check if launch point is too close to center
    const distFromCenter = Math.hypot(startX - centerX, startY - centerY);
    if (distFromCenter < MIN_LAUNCH_RADIUS) {
      return; // Ignore launches too close to the singular region
    }

    // Get current mass value
    const massMin = 0.2;
    const massMax = 3.0;
    const massM = massMin + (massSlider / 100) * (massMax - massMin);

    // Calculate radial vector from center to start point
    const radialX = (startX - centerX) / distFromCenter;
    const radialY = (startY - centerY) / distFromCenter;

    // Calculate drag vector
    const dragX = endX - startX;
    const dragY = endY - startY;
    const dragLength = Math.hypot(dragX, dragY);
    
    if (dragLength < 5) {
      // Very short drag - launch with perfect orbital velocity in tangential direction
      // Tangential direction is perpendicular to radial (clockwise)
      const tangentialX = -radialY;
      const tangentialY = radialX;
      const orbitalVel = calculateOrbitalVelocity(distFromCenter, massM);
      
      const p: Particle = {
        x: startX,
        y: startY,
        vx: tangentialX * orbitalVel, // Perfect orbital velocity for stable circular orbit
        vy: tangentialY * orbitalVel,
        trail: [],
      };
      particlesRef.current.push(p);
      return;
    }

    // Normalize drag direction
    const dragDirX = dragX / dragLength;
    const dragDirY = dragY / dragLength;

    // Calculate how much of drag is tangential vs radial
    const radialComponent = dragDirX * radialX + dragDirY * radialY;
    const tangentialComponent = Math.sqrt(1 - radialComponent * radialComponent);

    // If drag is mostly tangential (perpendicular to radial), create stable orbit
    if (tangentialComponent > 0.7) {
      // Mostly tangential - create stable orbital trajectory
      const tangentialX = -radialY;
      const tangentialY = radialX;
      const orbitalVel = calculateOrbitalVelocity(distFromCenter, massM);
      const dragSpeed = dragLength * SPEED_SCALE;
      
      // Use orbital velocity for stable orbits, but allow slight variation from drag
      // Keep within 80-120% of orbital velocity for visible orbits
      const finalSpeed = Math.max(orbitalVel * 0.8, Math.min(orbitalVel * 1.2, dragSpeed));
      
      const p: Particle = {
        x: startX,
        y: startY,
        vx: tangentialX * finalSpeed,
        vy: tangentialY * finalSpeed,
        trail: [],
      };
      particlesRef.current.push(p);
    } else {
      // Radial or mixed - use drag direction directly
      const vx0 = dragX * SPEED_SCALE;
      const vy0 = dragY * SPEED_SCALE;

      const p: Particle = {
        x: startX,
        y: startY,
        vx: vx0,
        vy: vy0,
        trail: [],
      };
      particlesRef.current.push(p);
    }
  }, [massSlider, calculateOrbitalVelocity]);

  // Handle pointer events for tap-and-drag
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    dragStartRef.current = { x: px, y: py };
    dragCurrentRef.current = { x: px, y: py };
    isDraggingRef.current = true;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    dragCurrentRef.current = { x: px, y: py };
    draw(); // Redraw to show preview
  }, [draw]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current) {
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragCurrentRef.current = null;
      draw();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragCurrentRef.current = null;
      draw();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    launchParticle(dragStartRef.current.x, dragStartRef.current.y, endX, endY);

    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragCurrentRef.current = null;
    draw();
  }, [launchParticle, draw]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent context menu
  }, []);

  const handleClearPaths = useCallback(() => {
    particlesRef.current = [];
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
        {/* Mass / Curvature Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Mass / Curvature: {massSlider}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={massSlider}
            onChange={(e) => setMassSlider(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Damping Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Damping: {dampingSlider}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={dampingSlider}
            onChange={(e) => setDampingSlider(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>

        {/* Clear Paths Button */}
        <motion.button
          onClick={handleClearPaths}
          className="w-full px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Clear Paths
        </motion.button>
      </div>
    </div>
  );
};

export default GeodesicSimulation;

