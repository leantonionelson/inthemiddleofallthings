import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// Physics constants
const K = 1500; // Curvature exaggeration constant
const EPS = 25; // Softening parameter (pixels^2)
const CURVATURE_SCALE = 300; // Scale factor for acceleration

// Grid for visualization
const GRID_ROWS = 20;
const GRID_COLS = 20;

// Visual constants
const CENTRAL_MASS_RADIUS = 12;
const PARTICLE_RADIUS = 6;
const PARTICLE_DRAG_THRESHOLD = 15; // Distance to detect particle drag

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type VisualizationMode = 'fabric' | 'contour' | 'refractive';

const SpacetimeCurvatureSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<Particle>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const isDraggingParticleRef = useRef(false);

  const [mass, setMass] = useState(50); // 0-100
  const [damping, setDamping] = useState(20); // 0-100
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('fabric');

  // Compute height at a point: h(r) = -kM / sqrt(r² + ε)
  const computeHeight = useCallback((x: number, y: number, centerX: number, centerY: number, massM: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const r2 = dx * dx + dy * dy + EPS;
    const r = Math.sqrt(r2);
    return -(K * massM) / r;
  }, []);

  // Compute surface gradient: ∇h = kM * (x-xc, y-yc) / (r² + ε)^(3/2)
  const computeSurfaceGradient = useCallback((x: number, y: number, centerX: number, centerY: number, massM: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const r2 = dx * dx + dy * dy + EPS;
    const r3 = Math.pow(r2, 1.5);
    const factor = (K * massM) / r3;
    return { gx: factor * dx, gy: factor * dy };
  }, []);

  // Update particle physics
  const updateParticle = useCallback((dt: number) => {
    const particle = particleRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Map mass slider to physics parameter
    const massMin = 0.1;
    const massMax = 2.0;
    const massM = massMin + (mass / 100) * (massMax - massMin);

    // Map damping slider
    const dampMin = 0.0;
    const dampMax = 0.05;
    const dampingValue = dampMin + (damping / 100) * (dampMax - dampMin);

    // Compute surface gradient at particle position
    const { gx, gy } = computeSurfaceGradient(particle.x, particle.y, centerX, centerY, massM);

    // Acceleration = -α * gradient (downhill)
    const ax = -CURVATURE_SCALE * gx;
    const ay = -CURVATURE_SCALE * gy;

    // Semi-implicit Euler with damping
    particle.vx = (1 - dampingValue) * particle.vx + ax * dt;
    particle.vy = (1 - dampingValue) * particle.vy + ay * dt;

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    // Handle boundaries (wrap around)
    if (particle.x < 0) particle.x += canvas.width;
    if (particle.x > canvas.width) particle.x -= canvas.width;
    if (particle.y < 0) particle.y += canvas.height;
    if (particle.y > canvas.height) particle.y -= canvas.height;
  }, [mass, damping, computeSurfaceGradient]);

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
    const particle = particleRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains('dark');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Map mass slider to physics parameter
    const massMin = 0.1;
    const massMax = 2.0;
    const massM = massMin + (mass / 100) * (massMax - massMin);

    // Draw visualization based on mode
    if (visualizationMode === 'fabric') {
      // Fabric mode: Warped grid mesh
      const dx = canvas.width / GRID_COLS;
      const dy = canvas.height / GRID_ROWS;
      const projectionScale = 0.3; // How much height affects visual position

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;

      // Draw horizontal grid lines
      for (let i = 0; i <= GRID_ROWS; i++) {
        const baseY = i * dy;
        ctx.beginPath();
        let first = true;
        for (let j = 0; j <= GRID_COLS; j++) {
          const baseX = j * dx;
          const h = computeHeight(baseX, baseY, centerX, centerY, massM);
          const renderY = baseY + h * projectionScale;
          
          if (first) {
            ctx.moveTo(baseX, renderY);
            first = false;
          } else {
            ctx.lineTo(baseX, renderY);
          }
        }
        ctx.stroke();
      }

      // Draw vertical grid lines
      for (let j = 0; j <= GRID_COLS; j++) {
        const baseX = j * dx;
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= GRID_ROWS; i++) {
          const baseY = i * dy;
          const h = computeHeight(baseX, baseY, centerX, centerY, massM);
          const renderY = baseY + h * projectionScale;
          
          if (first) {
            ctx.moveTo(baseX, renderY);
            first = false;
          } else {
            ctx.lineTo(baseX, renderY);
          }
        }
        ctx.stroke();
      }
    } else if (visualizationMode === 'contour') {
      // Contour mode: Height level lines
      const numContours = 12;
      const hMin = computeHeight(0, 0, centerX, centerY, massM);
      const hMax = computeHeight(centerX, centerY, centerX, centerY, massM);
      const hRange = hMax - hMin;

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;

      for (let c = 0; c < numContours; c++) {
        const targetHeight = hMin + (c / (numContours - 1)) * hRange;
        
        // Sample points and draw contour
        const samples = 100;
        ctx.beginPath();
        let first = true;
        
        for (let s = 0; s < samples; s++) {
          const angle = (s / samples) * Math.PI * 2;
          let r = 10;
          const maxR = Math.max(canvas.width, canvas.height) / 2;
          
          // Binary search for contour point at this angle
          for (let iter = 0; iter < 20; iter++) {
            const testR = r;
            const testX = centerX + testR * Math.cos(angle);
            const testY = centerY + testR * Math.sin(angle);
            const testH = computeHeight(testX, testY, centerX, centerY, massM);
            
            if (Math.abs(testH - targetHeight) < 0.5 || r > maxR) break;
            if (testH < targetHeight) r += (maxR - r) / 2;
            else r -= r / 2;
          }
          
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else if (visualizationMode === 'refractive') {
      // Refractive mode: Background distortion
      const dx = canvas.width / GRID_COLS;
      const dy = canvas.height / GRID_ROWS;
      const distortionScale = 8;

      // Draw a background pattern
      ctx.fillStyle = isDark ? 'rgba(100, 100, 100, 0.1)' : 'rgba(200, 200, 200, 0.1)';
      for (let i = 0; i < GRID_ROWS; i++) {
        for (let j = 0; j < GRID_COLS; j++) {
          const baseX = j * dx;
          const baseY = i * dy;
          const h = computeHeight(baseX, baseY, centerX, centerY, massM);
          
          // Displace based on gradient
          const { gx, gy } = computeSurfaceGradient(baseX, baseY, centerX, centerY, massM);
          const dispX = gx * distortionScale;
          const dispY = gy * distortionScale;
          
          ctx.fillRect(baseX + dispX, baseY + dispY, dx, dy);
        }
      }
    }

    // Draw central mass (dark orb / well mouth)
    const massGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      CENTRAL_MASS_RADIUS * 2.5
    );
    massGradient.addColorStop(0, isDark ? 'rgba(20, 20, 30, 0.95)' : 'rgba(30, 30, 40, 0.95)');
    massGradient.addColorStop(0.5, isDark ? 'rgba(20, 20, 30, 0.6)' : 'rgba(30, 30, 40, 0.7)');
    massGradient.addColorStop(1, 'rgba(20, 20, 30, 0)');

    ctx.fillStyle = massGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CENTRAL_MASS_RADIUS * 2.5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw central mass circle
    ctx.fillStyle = isDark ? 'rgba(20, 20, 30, 1)' : 'rgba(30, 30, 40, 1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, CENTRAL_MASS_RADIUS, 0, 2 * Math.PI);
    ctx.fill();

    // Draw particle
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, PARTICLE_RADIUS - 1, 0, 2 * Math.PI);
    ctx.fill();

    // Draw drag preview
    if (isDraggingRef.current && isDraggingParticleRef.current && dragStartRef.current && dragCurrentRef.current) {
      const startX = dragStartRef.current.x;
      const startY = dragStartRef.current.y;
      const endX = dragCurrentRef.current.x;
      const endY = dragCurrentRef.current.y;

      ctx.strokeStyle = isDark ? 'rgba(100, 200, 255, 0.5)' : 'rgba(50, 150, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [mass, visualizationMode, getCanvasContext, computeHeight, computeSurfaceGradient]);

  // Animation loop
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
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

  // Handle pointer events for drag-to-launch
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const particle = particleRef.current;
    const distToParticle = Math.hypot(px - particle.x, py - particle.y);

    if (distToParticle < PARTICLE_DRAG_THRESHOLD) {
      isDraggingParticleRef.current = true;
      dragStartRef.current = { x: particle.x, y: particle.y };
      dragCurrentRef.current = { x: px, y: py };
      isDraggingRef.current = true;
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    dragCurrentRef.current = { x: px, y: py };
    draw();
  }, [draw]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current || !dragCurrentRef.current) {
      isDraggingRef.current = false;
      isDraggingParticleRef.current = false;
      dragStartRef.current = null;
      dragCurrentRef.current = null;
      draw();
      return;
    }

    if (isDraggingParticleRef.current) {
      // Launch particle with velocity based on drag
      const dx = dragCurrentRef.current.x - dragStartRef.current.x;
      const dy = dragCurrentRef.current.y - dragStartRef.current.y;
      const launchScale = 0.8;

      particleRef.current.vx = dx * launchScale;
      particleRef.current.vy = dy * launchScale;
    }

    isDraggingRef.current = false;
    isDraggingParticleRef.current = false;
    dragStartRef.current = null;
    dragCurrentRef.current = null;
    draw();
  }, [draw]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
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

  const handleResetCurvature = useCallback(() => {
    setMass(0);
  }, []);

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
            Mass / Curvature: {mass}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
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

        {/* Visualization Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Visualization Mode
          </label>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setVisualizationMode('fabric')}
              className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
                visualizationMode === 'fabric'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Fabric
            </motion.button>
            <motion.button
              onClick={() => setVisualizationMode('contour')}
              className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
                visualizationMode === 'contour'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Contour
            </motion.button>
            <motion.button
              onClick={() => setVisualizationMode('refractive')}
              className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
                visualizationMode === 'refractive'
                  ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                  : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Refractive
            </motion.button>
          </div>
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
            onClick={handleResetCurvature}
            className="flex-1 px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Reset Curvature
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SpacetimeCurvatureSimulation;

