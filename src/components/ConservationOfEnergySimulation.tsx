import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';

// Physics constants
const DT_FIXED = 1 / 60; // Fixed timestep for stability
const M = 1; // Mass (constant)
const G_DEFAULT = 9.8; // Default gravity

// Track parameters
const TRACK_X_MIN = 0;
const TRACK_X_MAX = 1;
const TRACK_PADDING = 0.05; // Padding at track boundaries

type TrackShape = 'flat' | 'single-hill' | 'double-well' | 'steep-drop';

type VisualizationMode = 'bars' | 'time-graph' | 'energy-phase';

type ParticleState = {
  x: number; // Position along track [0, 1]
  v: number; // Velocity along track
};

type EnergyState = {
  K: number; // Kinetic energy
  U: number; // Potential energy
  Eloss: number; // Dissipated energy
  Etotal: number; // Total energy
  EtotalInitial: number; // Initial total energy (reference)
};

// Track height functions
const trackHeight = (x: number, mode: TrackShape): number => {
  const clampedX = Math.max(TRACK_X_MIN, Math.min(TRACK_X_MAX, x));
  
  switch (mode) {
    case 'flat':
      return 0;
    
    case 'single-hill': {
      // Gaussian bump: y(x) = h * exp(-((x - 0.5) / w)²)
      const h = 0.3;
      const w = 0.15;
      const center = 0.5;
      return h * Math.exp(-Math.pow((clampedX - center) / w, 2));
    }
    
    case 'double-well': {
      // Quartic: y(x) = a * (x - 0.5)⁴ - b * (x - 0.5)²
      const a = 8;
      const b = 2;
      const center = 0.5;
      const offset = clampedX - center;
      return a * Math.pow(offset, 4) - b * Math.pow(offset, 2);
    }
    
    case 'steep-drop': {
      // Piecewise: gentle ramp → deep trough → flatten
      if (clampedX < 0.3) {
        // Gentle ramp up
        return 0.2 * (clampedX / 0.3);
      } else if (clampedX < 0.7) {
        // Deep trough
        const t = (clampedX - 0.3) / 0.4;
        return 0.2 - 0.5 * (1 - Math.cos(Math.PI * t));
      } else {
        // Flatten out
        return -0.3;
      }
    }
    
    default:
      return 0;
  }
};

// Track slope (numerical derivative)
const trackSlope = (x: number, mode: TrackShape): number => {
  const dx = 0.001;
  return (trackHeight(x + dx, mode) - trackHeight(x - dx, mode)) / (2 * dx);
};

// Find minimum height for normalization
const findMinHeight = (mode: TrackShape): number => {
  let minH = Infinity;
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    const h = trackHeight(x, mode);
    minH = Math.min(minH, h);
  }
  return minH;
};

const ConservationOfEnergySimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleRef = useRef<ParticleState>({ x: 0.5, v: 0 });
  const energyRef = useRef<EnergyState>({
    K: 0,
    U: 0,
    Eloss: 0,
    Etotal: 0,
    EtotalInitial: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const isPlayingRef = useRef<boolean>(true);
  const timeHistoryRef = useRef<Array<{ t: number; K: number; U: number; Eloss: number }>>([]);
  const maxHistoryLength = 200;
  
  // Drag state
  const dragStartRef = useRef<{ x: number; clientX: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  
  const [trackShape, setTrackShape] = useState<TrackShape>('single-hill');
  const [friction, setFriction] = useState(0); // γ, 0-100
  const [gravity, setGravity] = useState(50); // g scale, 0-100
  const [initialEnergy, setInitialEnergy] = useState(50); // 0-100
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('bars');
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Normalize track height (relative to minimum)
  const minHeightRef = useRef<number>(0);
  
  useEffect(() => {
    minHeightRef.current = findMinHeight(trackShape);
    // Reset particle when track changes
    particleRef.current = { x: 0.5, v: 0 };
    energyRef.current.Eloss = 0;
    timeHistoryRef.current = [];
    recalculateEnergies();
  }, [trackShape]);
  
  // Recalculate energies from current state
  const recalculateEnergies = useCallback(() => {
    const particle = particleRef.current;
    const g = G_DEFAULT * (gravity / 100);
    const y = trackHeight(particle.x, trackShape) - minHeightRef.current;
    const U = M * g * y;
    const K = 0.5 * M * particle.v * particle.v;
    const Eloss = energyRef.current.Eloss;
    const Etotal = K + U + Eloss;
    
    // Set initial total energy if not set
    if (energyRef.current.EtotalInitial === 0) {
      energyRef.current.EtotalInitial = Etotal;
    }
    
    energyRef.current = {
      K,
      U,
      Eloss,
      Etotal,
      EtotalInitial: energyRef.current.EtotalInitial,
    };
  }, [trackShape, gravity]);
  
  // Initialize particle with given energy
  const initializeParticle = useCallback(() => {
    const g = G_DEFAULT * (gravity / 100);
    const energyScale = initialEnergy / 100;
    
    // Try to set initial energy by height first
    const maxHeight = Math.max(...Array.from({ length: 101 }, (_, i) => 
      trackHeight(i / 100, trackShape) - minHeightRef.current
    ));
    
    if (maxHeight > 0) {
      // Set initial height based on energy
      const targetHeight = maxHeight * energyScale;
      // Find x position with this height (approximate)
      let bestX = 0.5;
      let bestDiff = Infinity;
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        const h = trackHeight(x, trackShape) - minHeightRef.current;
        const diff = Math.abs(h - targetHeight);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestX = x;
        }
      }
      particleRef.current = { x: bestX, v: 0 };
    } else {
      // Flat track or negative heights - use velocity
      const targetE = energyScale * 0.5; // Normalized energy scale
      particleRef.current = { x: 0.5, v: Math.sqrt(2 * targetE / M) };
    }
    
    energyRef.current.Eloss = 0;
    recalculateEnergies();
    energyRef.current.EtotalInitial = energyRef.current.Etotal;
    timeHistoryRef.current = [];
  }, [initialEnergy, trackShape, gravity, recalculateEnergies]);
  
  useEffect(() => {
    initializeParticle();
  }, [initializeParticle]);
  
  // Update particle physics
  const updateParticle = useCallback((dt: number) => {
    if (!isPlayingRef.current) return;
    
    const particle = particleRef.current;
    const g = G_DEFAULT * (gravity / 100);
    const gamma = (friction / 100) * 0.5; // Friction coefficient
    
    // Clamp x to track boundaries
    particle.x = Math.max(TRACK_X_MIN + TRACK_PADDING, Math.min(TRACK_X_MAX - TRACK_PADDING, particle.x));
    
    // Get track slope
    const slope = trackSlope(particle.x, trackShape);
    
    // Forces
    const Fg = -M * g * slope; // Tangential gravitational force
    const Ffric = -gamma * particle.v; // Friction
    
    // Net force and acceleration
    const F = Fg + Ffric;
    const a = F / M;
    
    // Store old kinetic energy
    const K_old = 0.5 * M * particle.v * particle.v;
    
    // Semi-implicit Euler
    particle.v += a * dt;
    particle.x += particle.v * dt;
    
    // Clamp x again after update
    particle.x = Math.max(TRACK_X_MIN + TRACK_PADDING, Math.min(TRACK_X_MAX - TRACK_PADDING, particle.x));
    
    // Handle boundary collisions (reflect velocity)
    if (particle.x <= TRACK_X_MIN + TRACK_PADDING || particle.x >= TRACK_X_MAX - TRACK_PADDING) {
      particle.v *= -0.8; // Bounce with some energy loss
      particle.x = Math.max(TRACK_X_MIN + TRACK_PADDING, Math.min(TRACK_X_MAX - TRACK_PADDING, particle.x));
    }
    
    // Calculate energy dissipated from friction
    const K_new = 0.5 * M * particle.v * particle.v;
    const dEloss = Math.max(0, K_old - K_new);
    energyRef.current.Eloss += dEloss;
    
    // Recalculate all energies
    recalculateEnergies();
    
    // Add to time history
    const now = performance.now() / 1000;
    timeHistoryRef.current.push({
      t: now,
      K: energyRef.current.K,
      U: energyRef.current.U,
      Eloss: energyRef.current.Eloss,
    });
    
    // Keep history bounded
    if (timeHistoryRef.current.length > maxHistoryLength) {
      timeHistoryRef.current.shift();
    }
  }, [trackShape, friction, gravity, recalculateEnergies]);
  
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
    const energy = energyRef.current;
    const isDark = document.documentElement.classList.contains('dark');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const trackY = canvas.height * 0.4; // Track vertical position
    const trackHeight_px = canvas.height * 0.3; // Track height in pixels
    const trackWidth = canvas.width * 0.8;
    const trackX = (canvas.width - trackWidth) / 2;
    
    // Convert normalized x to canvas x
    const xToCanvas = (x: number) => trackX + (x - TRACK_X_MIN) / (TRACK_X_MAX - TRACK_X_MIN) * trackWidth;
    const yToCanvas = (y: number) => trackY - y * trackHeight_px;
    
    if (visualizationMode === 'bars' || visualizationMode === 'time-graph') {
      // Draw track
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(100, 200, 255, 0.8)' : 'rgba(50, 150, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = isDark ? 'rgba(100, 200, 255, 0.6)' : 'rgba(50, 150, 255, 0.6)';
      
      ctx.beginPath();
      const samples = 200;
      for (let i = 0; i <= samples; i++) {
        const x = TRACK_X_MIN + (i / samples) * (TRACK_X_MAX - TRACK_X_MIN);
        const y = trackHeight(x, trackShape) - minHeightRef.current;
        const cx = xToCanvas(x);
        const cy = yToCanvas(y);
        if (i === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();
      ctx.restore();
      
      // Draw particle
      const particleX = xToCanvas(particle.x);
      const particleY = yToCanvas(trackHeight(particle.x, trackShape) - minHeightRef.current);
      const speed = Math.abs(particle.v);
      const particleSize = 8 + speed * 5;
      
      // Glowing orb
      const gradient = ctx.createRadialGradient(
        particleX, particleY, 0,
        particleX, particleY, particleSize * 1.5
      );
      gradient.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(100, 200, 255, 0.9)');
      gradient.addColorStop(0.5, isDark ? 'rgba(100, 200, 255, 0.5)' : 'rgba(50, 150, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = isDark ? 'rgba(100, 200, 255, 0.8)' : 'rgba(50, 150, 255, 0.8)';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize * 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
      
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(100, 200, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    if (visualizationMode === 'bars') {
      // Draw energy bars
      const barsY = canvas.height * 0.75;
      const barsHeight = canvas.height * 0.2;
      const barsX = canvas.width * 0.1;
      const barsWidth = canvas.width * 0.8;
      const barWidth = barsWidth / 3;
      const maxEnergy = Math.max(energy.EtotalInitial, energy.K + energy.U + energy.Eloss);
      
      // Total energy reference line
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const refY = barsY - (energy.EtotalInitial / maxEnergy) * barsHeight;
      ctx.beginPath();
      ctx.moveTo(barsX, refY);
      ctx.lineTo(barsX + barsWidth, refY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Kinetic energy (blue)
      const kHeight = (energy.K / maxEnergy) * barsHeight;
      const kGradient = ctx.createLinearGradient(barsX, barsY, barsX, barsY - kHeight);
      kGradient.addColorStop(0, isDark ? 'rgba(100, 200, 255, 0.8)' : 'rgba(50, 150, 255, 0.8)');
      kGradient.addColorStop(1, isDark ? 'rgba(100, 200, 255, 1)' : 'rgba(50, 150, 255, 1)');
      ctx.fillStyle = kGradient;
      ctx.fillRect(barsX, barsY - kHeight, barWidth - 2, kHeight);
      ctx.strokeStyle = isDark ? 'rgba(100, 200, 255, 1)' : 'rgba(50, 150, 255, 1)';
      ctx.strokeRect(barsX, barsY - kHeight, barWidth - 2, kHeight);
      
      // Potential energy (green)
      const uHeight = (energy.U / maxEnergy) * barsHeight;
      const uGradient = ctx.createLinearGradient(barsX + barWidth, barsY, barsX + barWidth, barsY - uHeight);
      uGradient.addColorStop(0, isDark ? 'rgba(100, 255, 150, 0.8)' : 'rgba(50, 200, 100, 0.8)');
      uGradient.addColorStop(1, isDark ? 'rgba(100, 255, 150, 1)' : 'rgba(50, 200, 100, 1)');
      ctx.fillStyle = uGradient;
      ctx.fillRect(barsX + barWidth, barsY - uHeight, barWidth - 2, uHeight);
      ctx.strokeStyle = isDark ? 'rgba(100, 255, 150, 1)' : 'rgba(50, 200, 100, 1)';
      ctx.strokeRect(barsX + barWidth, barsY - uHeight, barWidth - 2, uHeight);
      
      // Dissipated energy (orange/red)
      const eHeight = (energy.Eloss / maxEnergy) * barsHeight;
      const eGradient = ctx.createLinearGradient(barsX + barWidth * 2, barsY, barsX + barWidth * 2, barsY - eHeight);
      eGradient.addColorStop(0, isDark ? 'rgba(255, 150, 100, 0.8)' : 'rgba(255, 100, 50, 0.8)');
      eGradient.addColorStop(1, isDark ? 'rgba(255, 150, 100, 1)' : 'rgba(255, 100, 50, 1)');
      ctx.fillStyle = eGradient;
      ctx.fillRect(barsX + barWidth * 2, barsY - eHeight, barWidth - 2, eHeight);
      ctx.strokeStyle = isDark ? 'rgba(255, 150, 100, 1)' : 'rgba(255, 100, 50, 1)';
      ctx.strokeRect(barsX + barWidth * 2, barsY - eHeight, barWidth - 2, eHeight);
      
      // Labels
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('K', barsX + barWidth / 2, barsY + 15);
      ctx.fillText('U', barsX + barWidth * 1.5, barsY + 15);
      ctx.fillText('E_loss', barsX + barWidth * 2.5, barsY + 15);
    } else if (visualizationMode === 'time-graph') {
      // Draw time graph
      const graphY = canvas.height * 0.7;
      const graphHeight = canvas.height * 0.25;
      const graphX = canvas.width * 0.1;
      const graphWidth = canvas.width * 0.8;
      
      const history = timeHistoryRef.current;
      if (history.length > 1) {
        const maxEnergy = Math.max(energy.EtotalInitial, ...history.flatMap(h => [h.K, h.U, h.Eloss]));
        const minT = history[0].t;
        const maxT = history[history.length - 1].t;
        const tRange = Math.max(maxT - minT, 1);
        
        // Draw reference line
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const refY = graphY - (energy.EtotalInitial / maxEnergy) * graphHeight;
        ctx.beginPath();
        ctx.moveTo(graphX, refY);
        ctx.lineTo(graphX + graphWidth, refY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw K line
        ctx.strokeStyle = isDark ? 'rgba(100, 200, 255, 1)' : 'rgba(50, 150, 255, 1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        history.forEach((h, i) => {
          const x = graphX + ((h.t - minT) / tRange) * graphWidth;
          const y = graphY - (h.K / maxEnergy) * graphHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw U line
        ctx.strokeStyle = isDark ? 'rgba(100, 255, 150, 1)' : 'rgba(50, 200, 100, 1)';
        ctx.beginPath();
        history.forEach((h, i) => {
          const x = graphX + ((h.t - minT) / tRange) * graphWidth;
          const y = graphY - (h.U / maxEnergy) * graphHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw Eloss line
        ctx.strokeStyle = isDark ? 'rgba(255, 150, 100, 1)' : 'rgba(255, 100, 50, 1)';
        ctx.beginPath();
        history.forEach((h, i) => {
          const x = graphX + ((h.t - minT) / tRange) * graphWidth;
          const y = graphY - (h.Eloss / maxEnergy) * graphHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    } else if (visualizationMode === 'energy-phase') {
      // Energy phase view
      const phaseY = canvas.height * 0.1;
      const phaseHeight = canvas.height * 0.7;
      const phaseX = canvas.width * 0.1;
      const phaseWidth = canvas.width * 0.8;
      
      // Draw potential curve background
      ctx.strokeStyle = isDark ? 'rgba(100, 255, 150, 0.4)' : 'rgba(50, 200, 100, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const g = G_DEFAULT * (gravity / 100);
      const samples = 200;
      let maxU = 0;
      for (let i = 0; i <= samples; i++) {
        const x = TRACK_X_MIN + (i / samples) * (TRACK_X_MAX - TRACK_X_MIN);
        const y = trackHeight(x, trackShape) - minHeightRef.current;
        const U = M * g * y;
        maxU = Math.max(maxU, U);
      }
      
      for (let i = 0; i <= samples; i++) {
        const x = TRACK_X_MIN + (i / samples) * (TRACK_X_MAX - TRACK_X_MIN);
        const y = trackHeight(x, trackShape) - minHeightRef.current;
        const U = M * g * y;
        const cx = phaseX + (x - TRACK_X_MIN) / (TRACK_X_MAX - TRACK_X_MIN) * phaseWidth;
        const cy = phaseY + phaseHeight - (U / Math.max(maxU, energy.EtotalInitial)) * phaseHeight;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      
      // Draw total energy budget line
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const budgetY = phaseY + phaseHeight - (energy.EtotalInitial / Math.max(maxU, energy.EtotalInitial)) * phaseHeight;
      ctx.beginPath();
      ctx.moveTo(phaseX, budgetY);
      ctx.lineTo(phaseX + phaseWidth, budgetY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw current state marker
      const currentX = phaseX + (particle.x - TRACK_X_MIN) / (TRACK_X_MAX - TRACK_X_MIN) * phaseWidth;
      const currentU = M * g * (trackHeight(particle.x, trackShape) - minHeightRef.current);
      const currentUY = phaseY + phaseHeight - (currentU / Math.max(maxU, energy.EtotalInitial)) * phaseHeight;
      const budgetLineY = phaseY + phaseHeight - (energy.EtotalInitial / Math.max(maxU, energy.EtotalInitial)) * phaseHeight;
      
      // Draw potential bar
      ctx.fillStyle = isDark ? 'rgba(100, 255, 150, 0.6)' : 'rgba(50, 200, 100, 0.6)';
      ctx.fillRect(currentX - 3, currentUY, 6, phaseHeight - currentUY);
      
      // Draw kinetic bar (gap to budget)
      ctx.fillStyle = isDark ? 'rgba(100, 200, 255, 0.6)' : 'rgba(50, 150, 255, 0.6)';
      ctx.fillRect(currentX - 3, budgetLineY, 6, currentUY - budgetLineY);
      
      // Draw particle marker
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
      ctx.beginPath();
      ctx.arc(currentX, currentUY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [visualizationMode, trackShape, gravity, getCanvasContext]);
  
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
          updateParticle(stepDt);
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
  }, [updateParticle, draw]);
  
  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const maxSize = Math.min(container.clientWidth - 32, 600);
      canvas.width = maxSize;
      canvas.height = maxSize * 0.8;
      
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
    
    if (visualizationMode === 'energy-phase') {
      // Convert canvas coordinates to track x
      const phaseX = canvas.width * 0.1;
      const phaseWidth = canvas.width * 0.8;
      if (clientX >= phaseX && clientX <= phaseX + phaseWidth) {
        const x = TRACK_X_MIN + ((clientX - phaseX) / phaseWidth) * (TRACK_X_MAX - TRACK_X_MIN);
        particleRef.current = { x: Math.max(TRACK_X_MIN + TRACK_PADDING, Math.min(TRACK_X_MAX - TRACK_PADDING, x)), v: 0 };
        recalculateEnergies();
        energyRef.current.EtotalInitial = energyRef.current.Etotal;
      }
    } else {
      // Tap on track
      const trackY = canvas.height * 0.4;
      const trackHeight_px = canvas.height * 0.3;
      const trackWidth = canvas.width * 0.8;
      const trackX = (canvas.width - trackWidth) / 2;
      
      if (clientX >= trackX && clientX <= trackX + trackWidth) {
        const x = TRACK_X_MIN + ((clientX - trackX) / trackWidth) * (TRACK_X_MAX - TRACK_X_MIN);
        particleRef.current = { x: Math.max(TRACK_X_MIN + TRACK_PADDING, Math.min(TRACK_X_MAX - TRACK_PADDING, x)), v: 0 };
        recalculateEnergies();
        energyRef.current.EtotalInitial = energyRef.current.Etotal;
      }
    }
    
    // Start drag
    dragStartRef.current = { x: particleRef.current.x, clientX };
    isDraggingRef.current = true;
  }, [visualizationMode, recalculateEnergies]);
  
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const dragDistance = clientX - dragStartRef.current.clientX;
    
    // Convert drag distance to velocity
    const trackWidth = canvas.width * 0.8;
    const velocityScale = 2.0 / trackWidth; // Normalize to track width
    particleRef.current.v = dragDistance * velocityScale;
    
    draw();
  }, [draw]);
  
  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    draw();
  }, [draw]);
  
  const handleResetParticle = useCallback(() => {
    initializeParticle();
  }, [initializeParticle]);
  
  const handleFullReset = useCallback(() => {
    setFriction(0);
    setGravity(50);
    setInitialEnergy(50);
    setTrackShape('single-hill');
    initializeParticle();
  }, [initializeParticle]);
  
  const handleStep = useCallback(() => {
    updateParticle(DT_FIXED);
    draw();
  }, [updateParticle, draw]);
  
  return (
    <div className="w-full">
      {/* Canvas */}
      <div className="w-full flex items-center justify-center mb-6">
        <div className="w-full max-w-[600px] bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
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
        {/* Track Shape Selector */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Track Shape
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['flat', 'single-hill', 'double-well', 'steep-drop'] as TrackShape[]).map((shape) => (
              <motion.button
                key={shape}
                onClick={() => setTrackShape(shape)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                  trackShape === shape
                    ? 'bg-ink-primary/20 dark:bg-paper-light/20 text-ink-primary dark:text-paper-light border border-ink-primary/30 dark:border-paper-light/30'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {shape.replace('-', ' ')}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Initial Energy Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Initial Energy: {initialEnergy}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={initialEnergy}
            onChange={(e) => setInitialEnergy(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
        
        {/* Friction Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Friction (γ): {friction}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={friction}
            onChange={(e) => setFriction(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
        
        {/* Gravity Slider */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Gravity (g): {gravity}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={gravity}
            onChange={(e) => setGravity(Number(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
        </div>
        
        {/* Visualization Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
            Visualization Mode
          </label>
          <div className="flex gap-2">
            {(['bars', 'time-graph', 'energy-phase'] as VisualizationMode[]).map((mode) => (
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
                {mode.replace('-', ' ')}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Play/Pause/Step/Reset Buttons */}
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
            onClick={handleStep}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Step forward one frame"
          >
            <RotateCw className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleResetParticle}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Reset particle"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleFullReset}
            className="px-4 py-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Full reset"
          >
            Reset All
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ConservationOfEnergySimulation;

