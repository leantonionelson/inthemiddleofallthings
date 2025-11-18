import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Physics constants
const DT_FIXED = 1 / 120; // Fixed timestep for stability
const ARENA_PADDING = 0.05; // Padding at arena boundaries

type VisualizationMode = 'standard' | 'vector' | 'system';

type Body = {
  r: { x: number; y: number }; // Position [0, 1]
  v: { x: number; y: number }; // Velocity
  m: number; // Mass
  radius: number; // Radius (scales with mass)
  color: string; // Color for rendering
};

type MomentumState = {
  P_total: { x: number; y: number }; // Total momentum
  R_com: { x: number; y: number }; // Center of mass position
  V_com: { x: number; y: number }; // Center of mass velocity
};

type ComTrailPoint = {
  x: number;
  y: number;
  t: number; // Time for fade-out
};

const ConservationMomentumSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const body1Ref = useRef<Body>({
    r: { x: 0.3, y: 0.5 },
    v: { x: 0.3, y: 0 },
    m: 1,
    radius: 0.03,
    color: '#64C8FF', // Cyan/blue
  });
  const body2Ref = useRef<Body>({
    r: { x: 0.7, y: 0.5 },
    v: { x: -0.3, y: 0 },
    m: 1,
    radius: 0.03,
    color: '#FF9A64', // Orange
  });
  const momentumRef = useRef<MomentumState>({
    P_total: { x: 0, y: 0 },
    R_com: { x: 0.5, y: 0.5 },
    V_com: { x: 0, y: 0 },
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const isPlayingRef = useRef<boolean>(true);
  const comTrailRef = useRef<ComTrailPoint[]>([]);
  const maxTrailLength = 200;
  
  // Drag state
  const dragStartRef = useRef<{ body: 'body1' | 'body2' | null; x: number; y: number; clientX: number; clientY: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isSlingshotRef = useRef<boolean>(false);
  
  const [elasticity, setElasticity] = useState(1); // 0-1
  const [mass1, setMass1] = useState(1); // 0.5-5
  const [mass2, setMass2] = useState(1); // 0.5-5
  const [timeScale, setTimeScale] = useState(1); // 1 or 0.25
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('standard');
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Update body radii based on mass
  useEffect(() => {
    const baseRadius = 0.03;
    body1Ref.current.m = mass1;
    body1Ref.current.radius = baseRadius * (0.7 + 0.3 * (mass1 / 5));
    body2Ref.current.m = mass2;
    body2Ref.current.radius = baseRadius * (0.7 + 0.3 * (mass2 / 5));
  }, [mass1, mass2]);
  
  // Recalculate momentum and COM
  const recalculateMomentum = useCallback(() => {
    const body1 = body1Ref.current;
    const body2 = body2Ref.current;
    
    const p1 = { x: body1.m * body1.v.x, y: body1.m * body1.v.y };
    const p2 = { x: body2.m * body2.v.x, y: body2.m * body2.v.y };
    
    const P_total = { x: p1.x + p2.x, y: p1.y + p2.y };
    const M = body1.m + body2.m;
    const R_com = {
      x: (body1.m * body1.r.x + body2.m * body2.r.x) / M,
      y: (body1.m * body1.r.y + body2.m * body2.r.y) / M,
    };
    const V_com = {
      x: P_total.x / M,
      y: P_total.y / M,
    };
    
    momentumRef.current = { P_total, R_com, V_com };
  }, []);
  
  // Initialize momentum
  useEffect(() => {
    recalculateMomentum();
  }, [recalculateMomentum]);
  
  // Update physics
  const updatePhysics = useCallback((dt: number) => {
    if (!isPlayingRef.current) return;
    
    const body1 = body1Ref.current;
    const body2 = body2Ref.current;
    const dtScaled = dt * timeScale;
    
    // Integrate positions
    body1.r.x += body1.v.x * dtScaled;
    body1.r.y += body1.v.y * dtScaled;
    body2.r.x += body2.v.x * dtScaled;
    body2.r.y += body2.v.y * dtScaled;
    
    // Wall collisions
    const e_wall = 1; // Perfect reflection
    
    // Body 1 walls
    if (body1.r.x - body1.radius < ARENA_PADDING) {
      body1.r.x = ARENA_PADDING + body1.radius;
      body1.v.x *= -e_wall;
    }
    if (body1.r.x + body1.radius > 1 - ARENA_PADDING) {
      body1.r.x = 1 - ARENA_PADDING - body1.radius;
      body1.v.x *= -e_wall;
    }
    if (body1.r.y - body1.radius < ARENA_PADDING) {
      body1.r.y = ARENA_PADDING + body1.radius;
      body1.v.y *= -e_wall;
    }
    if (body1.r.y + body1.radius > 1 - ARENA_PADDING) {
      body1.r.y = 1 - ARENA_PADDING - body1.radius;
      body1.v.y *= -e_wall;
    }
    
    // Body 2 walls
    if (body2.r.x - body2.radius < ARENA_PADDING) {
      body2.r.x = ARENA_PADDING + body2.radius;
      body2.v.x *= -e_wall;
    }
    if (body2.r.x + body2.radius > 1 - ARENA_PADDING) {
      body2.r.x = 1 - ARENA_PADDING - body2.radius;
      body2.v.x *= -e_wall;
    }
    if (body2.r.y - body2.radius < ARENA_PADDING) {
      body2.r.y = ARENA_PADDING + body2.radius;
      body2.v.y *= -e_wall;
    }
    if (body2.r.y + body2.radius > 1 - ARENA_PADDING) {
      body2.r.y = 1 - ARENA_PADDING - body2.radius;
      body2.v.y *= -e_wall;
    }
    
    // Body-body collision detection
    const dx = body2.r.x - body1.r.x;
    const dy = body2.r.y - body1.r.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = body1.radius + body2.radius;
    
    if (dist < minDist && dist > 0.001) {
      // Collision normal (from body1 to body2)
      const n = { x: dx / dist, y: dy / dist };
      
      // Relative velocity
      const rv = { x: body1.v.x - body2.v.x, y: body1.v.y - body2.v.y };
      
      // Relative speed along normal
      const vRel = rv.x * n.x + rv.y * n.y;
      
      // Only resolve if bodies are moving towards each other
      if (vRel < 0) {
        // Impulse scalar
        const j = -(1 + elasticity) * vRel / (1 / body1.m + 1 / body2.m);
        
        // Impulse vector
        const J = { x: j * n.x, y: j * n.y };
        
        // Update velocities
        body1.v.x += J.x / body1.m;
        body1.v.y += J.y / body1.m;
        body2.v.x -= J.x / body2.m;
        body2.v.y -= J.y / body2.m;
        
        // Positional correction
        const penetration = minDist - dist;
        const correctionRatio = 0.5;
        const corr = (penetration * correctionRatio) / (1 / body1.m + 1 / body2.m);
        
        body1.r.x -= corr * (1 / body1.m) * n.x;
        body1.r.y -= corr * (1 / body1.m) * n.y;
        body2.r.x += corr * (1 / body2.m) * n.x;
        body2.r.y += corr * (1 / body2.m) * n.y;
      }
    }
    
    // Recalculate momentum and COM
    recalculateMomentum();
    
    // Add to COM trail
    const now = performance.now() / 1000;
    comTrailRef.current.push({
      x: momentumRef.current.R_com.x,
      y: momentumRef.current.R_com.y,
      t: now,
    });
    
    // Keep trail bounded
    if (comTrailRef.current.length > maxTrailLength) {
      comTrailRef.current.shift();
    }
  }, [elasticity, timeScale, recalculateMomentum]);
  
  // Get canvas context
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);
  
  // Draw arrow
  const drawArrow = useCallback((
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth: number
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = lineWidth * 3;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle - arrowAngle),
      y2 - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle + arrowAngle),
      y2 - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }, []);
  
  // Draw the simulation
  const draw = useCallback(() => {
    const context = getCanvasContext();
    if (!context) return;
    
    const { canvas, ctx } = context;
    const body1 = body1Ref.current;
    const body2 = body2Ref.current;
    const momentum = momentumRef.current;
    const isDark = document.documentElement.classList.contains('dark');
    
    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Convert normalized coordinates to canvas
    const toCanvasX = (x: number) => x * canvas.width;
    const toCanvasY = (y: number) => y * canvas.height;
    
    // Draw arena background
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(
      toCanvasX(ARENA_PADDING),
      toCanvasY(ARENA_PADDING),
      toCanvasX(1 - 2 * ARENA_PADDING),
      toCanvasY(1 - 2 * ARENA_PADDING)
    );
    
    // Draw COM trail (System View)
    if (visualizationMode === 'system' && comTrailRef.current.length > 1) {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const now = performance.now() / 1000;
      comTrailRef.current.forEach((point, i) => {
        const age = now - point.t;
        const alpha = Math.max(0, 1 - age / 2); // Fade over 2 seconds
        ctx.globalAlpha = alpha * 0.5;
        const x = toCanvasX(point.x);
        const y = toCanvasY(point.y);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    
    // Draw total momentum vector (System View)
    if (visualizationMode === 'system') {
      const comX = toCanvasX(momentum.R_com.x);
      const comY = toCanvasY(momentum.R_com.y);
      const scale = 50; // Scale factor for momentum vector
      const endX = comX + momentum.P_total.x * scale;
      const endY = comY + momentum.P_total.y * scale;
      
      drawArrow(
        ctx,
        comX,
        comY,
        endX,
        endY,
        isDark ? '#FFD700' : '#FF8C00',
        4
      );
    }
    
    // Draw velocity vectors (Vector View)
    if (visualizationMode === 'vector') {
      const scale = 30; // Scale factor for velocity vectors
      
      // Body 1 velocity
      const v1X = toCanvasX(body1.r.x);
      const v1Y = toCanvasY(body1.r.y);
      const v1EndX = v1X + body1.v.x * scale;
      const v1EndY = v1Y + body1.v.y * scale;
      drawArrow(ctx, v1X, v1Y, v1EndX, v1EndY, isDark ? '#64C8FF' : '#0066CC', 2);
      
      // Body 2 velocity
      const v2X = toCanvasX(body2.r.x);
      const v2Y = toCanvasY(body2.r.y);
      const v2EndX = v2X + body2.v.x * scale;
      const v2EndY = v2Y + body2.v.y * scale;
      drawArrow(ctx, v2X, v2Y, v2EndX, v2EndY, isDark ? '#64C8FF' : '#0066CC', 2);
    }
    
    // Draw momentum vectors (Vector View)
    if (visualizationMode === 'vector') {
      const scale = 20; // Scale factor for momentum vectors
      
      // Body 1 momentum
      const p1X = toCanvasX(body1.r.x);
      const p1Y = toCanvasY(body1.r.y);
      const p1 = { x: body1.m * body1.v.x, y: body1.m * body1.v.y };
      const p1EndX = p1X + p1.x * scale;
      const p1EndY = p1Y + p1.y * scale;
      drawArrow(ctx, p1X, p1Y, p1EndX, p1EndY, isDark ? '#FF9A64' : '#CC5500', 3);
      
      // Body 2 momentum
      const p2X = toCanvasX(body2.r.x);
      const p2Y = toCanvasY(body2.r.y);
      const p2 = { x: body2.m * body2.v.x, y: body2.m * body2.v.y };
      const p2EndX = p2X + p2.x * scale;
      const p2EndY = p2Y + p2.y * scale;
      drawArrow(ctx, p2X, p2Y, p2EndX, p2EndY, isDark ? '#FF9A64' : '#CC5500', 3);
    }
    
    // Draw bodies
    const drawBody = (body: Body) => {
      const x = toCanvasX(body.r.x);
      const y = toCanvasY(body.r.y);
      const radius = body.radius * Math.min(canvas.width, canvas.height);
      
      // Glowing orb
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
      gradient.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.9)' : `${body.color}CC`);
      gradient.addColorStop(0.5, isDark ? `${body.color}80` : `${body.color}99`);
      gradient.addColorStop(1, `${body.color}00`);
      
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = isDark ? `${body.color}80` : `${body.color}60`;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      
      // Body circle
      ctx.fillStyle = isDark ? `${body.color}FF` : `${body.color}DD`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    };
    
    drawBody(body1);
    drawBody(body2);
    
    // Draw COM crosshair
    const comX = toCanvasX(momentum.R_com.x);
    const comY = toCanvasY(momentum.R_com.y);
    const crosshairSize = 8;
    
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    
    ctx.beginPath();
    ctx.moveTo(comX - crosshairSize, comY);
    ctx.lineTo(comX + crosshairSize, comY);
    ctx.moveTo(comX, comY - crosshairSize);
    ctx.lineTo(comX, comY + crosshairSize);
    ctx.stroke();
    
    // COM orb
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(comX, comY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
  }, [visualizationMode, getCanvasContext, drawArrow]);
  
  // Animation loop
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;
      
      if (isPlayingRef.current) {
        // Fixed timestep integration
        let remainingDt = dt;
        while (remainingDt > 0) {
          const stepDt = Math.min(DT_FIXED, remainingDt);
          updatePhysics(stepDt);
          remainingDt -= stepDt;
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
      canvas.height = maxSize; // Square canvas
      
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);
  
  // Handle pointer events
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // Convert to normalized coordinates
    const x = clientX / canvas.width;
    const y = clientY / canvas.height;
    
    // Check if clicking on a body
    const body1 = body1Ref.current;
    const body2 = body2Ref.current;
    const dist1 = Math.sqrt((x - body1.r.x) ** 2 + (y - body1.r.y) ** 2);
    const dist2 = Math.sqrt((x - body2.r.x) ** 2 + (y - body2.r.y) ** 2);
    
    if (dist1 < body1.radius * 2) {
      dragStartRef.current = { body: 'body1', x: body1.r.x, y: body1.r.y, clientX, clientY };
      isDraggingRef.current = true;
      isSlingshotRef.current = false;
    } else if (dist2 < body2.radius * 2) {
      dragStartRef.current = { body: 'body2', x: body2.r.x, y: body2.r.y, clientX, clientY };
      isDraggingRef.current = true;
      isSlingshotRef.current = false;
    } else {
      // Start slingshot from empty space
      dragStartRef.current = { body: null, x, y, clientX, clientY };
      isDraggingRef.current = true;
      isSlingshotRef.current = true;
    }
  }, []);
  
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    if (!isPlayingRef.current) {
      // Paused mode: drag bodies or set velocity
      if (dragStartRef.current.body && !isSlingshotRef.current) {
        // Drag body position
        const x = clientX / canvas.width;
        const y = clientY / canvas.height;
        const body = dragStartRef.current.body === 'body1' ? body1Ref.current : body2Ref.current;
        body.r.x = Math.max(ARENA_PADDING + body.radius, Math.min(1 - ARENA_PADDING - body.radius, x));
        body.r.y = Math.max(ARENA_PADDING + body.radius, Math.min(1 - ARENA_PADDING - body.radius, y));
        recalculateMomentum();
      } else if (isSlingshotRef.current) {
        // Slingshot: set velocity based on drag
        const dx = (clientX - dragStartRef.current.clientX) / canvas.width;
        const dy = (clientY - dragStartRef.current.clientY) / canvas.height;
        const speed = Math.sqrt(dx * dx + dy * dy) * 5; // Scale factor
        const angle = Math.atan2(dy, dx);
        
        // Find nearest body
        const x = dragStartRef.current.x;
        const y = dragStartRef.current.y;
        const body1 = body1Ref.current;
        const body2 = body2Ref.current;
        const dist1 = Math.sqrt((x - body1.r.x) ** 2 + (y - body1.r.y) ** 2);
        const dist2 = Math.sqrt((x - body2.r.x) ** 2 + (y - body2.r.y) ** 2);
        
        if (dist1 < dist2 && dist1 < 0.1) {
          body1.v.x = speed * Math.cos(angle);
          body1.v.y = speed * Math.sin(angle);
        } else if (dist2 < 0.1) {
          body2.v.x = speed * Math.cos(angle);
          body2.v.y = speed * Math.sin(angle);
        }
        recalculateMomentum();
      }
    }
    
    draw();
  }, [draw, recalculateMomentum]);
  
  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    isSlingshotRef.current = false;
    draw();
  }, [draw]);
  
  const handleResetScenario = useCallback(() => {
    body1Ref.current.r = { x: 0.3, y: 0.5 };
    body1Ref.current.v = { x: 0.3, y: 0 };
    body2Ref.current.r = { x: 0.7, y: 0.5 };
    body2Ref.current.v = { x: -0.3, y: 0 };
    comTrailRef.current = [];
    recalculateMomentum();
  }, [recalculateMomentum]);
  
  const handleFullReset = useCallback(() => {
    setElasticity(1);
    setMass1(1);
    setMass2(1);
    setTimeScale(1);
    setVisualizationMode('standard');
    handleResetScenario();
  }, [handleResetScenario]);
  
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
            className="w-full h-full cursor-crosshair touch-none"
          />
        </div>
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        {/* Elasticity Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Elasticity: {elasticity === 0 ? 'Sticky' : elasticity < 0.8 ? 'Real world' : 'Bouncy'} ({elasticity.toFixed(2)})
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={elasticity}
            onChange={(e) => setElasticity(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
        
        {/* Mass Sliders */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
              Mass A: {mass1.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={mass1}
              onChange={(e) => setMass1(Number(e.target.value))}
              className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
              Mass B: {mass2.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={mass2}
              onChange={(e) => setMass2(Number(e.target.value))}
              className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
            />
          </div>
        </div>
        
        {/* Time Scale Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Time Scale
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setTimeScale(1)}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                timeScale === 1
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Normal
            </motion.button>
            <motion.button
              onClick={() => setTimeScale(0.25)}
              className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                timeScale === 0.25
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Slow Motion (0.25x)
            </motion.button>
          </div>
        </div>
        
        {/* Visual Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Visual Mode
          </label>
          <div className="flex gap-2">
            {(['standard', 'vector', 'system'] as VisualizationMode[]).map((mode) => (
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
            onClick={handleResetScenario}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Reset scenario"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleFullReset}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Reset all"
          >
            Reset All
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ConservationMomentumSimulation;

