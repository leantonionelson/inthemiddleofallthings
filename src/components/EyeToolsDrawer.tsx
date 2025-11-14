import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { X, Play, Square } from 'lucide-react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

interface EyeExercise {
  id: string;
  name: string;
  category: 'regulate' | 'restore' | 'expand';
  description: string;
  effect: string;
}

interface EyeToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const eyeExercises: EyeExercise[] = [
  {
    id: 'horizon-reset',
    name: 'Horizon Reset',
    category: 'regulate',
    description: 'Follow the line as it glides across the screen',
    effect: 'Resets the midbrain. Regulates emotional overload. Great for anxiety and overthinking.'
  },
  {
    id: 'vertical-drop',
    name: 'Vertical Drop',
    category: 'regulate',
    description: 'Watch the dot descend and rise like a falling bead',
    effect: 'Anchors attention downward, creating a grounding effect. Softens neck tension.'
  },
  {
    id: 'peripheral-bloom',
    name: 'Peripheral Bloom',
    category: 'regulate',
    description: 'Look at the centre. Notice the edges.',
    effect: 'Widens the visual field. Instant parasympathetic activation. Classic trauma therapy tool.'
  },
  {
    id: 'blink-conditioning',
    name: 'Blink Conditioning',
    category: 'regulate',
    description: 'Blink naturally in sync with the pulsing dot',
    effect: 'Restores natural blinking rhythm lost during screen use. Lubricates the eyes. Reduces headaches.'
  },
  {
    id: 'circular-drift',
    name: 'Circular Drift',
    category: 'restore',
    description: 'Follow the dot as it orbits the circle',
    effect: 'Releases strain in the extraocular muscles. Very calming, especially for over-focus or overthink.'
  },
  {
    id: 'infinity-trace',
    name: 'Infinity Trace',
    category: 'restore',
    description: 'Track the orb along the figure-8 path',
    effect: 'Rebalances eye muscles. Improves visual–vestibular integration. Calms mental spiralling.'
  },
  {
    id: 'cross-scan',
    name: 'Cross Scan',
    category: 'restore',
    description: 'Follow each direction like a compass',
    effect: 'Resets eye movement patterns. Improves cognitive fluidity. Gentle activation without overwhelm.'
  },
  {
    id: 'spiral-pulse',
    name: 'Follow the Pulse',
    category: 'restore',
    description: 'Follow the slow spiral flow with your eyes',
    effect: 'Relieves tightness in the forehead and temples. Drops the mind into a more absorbed state.'
  },
  {
    id: 'near-far-shift',
    name: 'Near–Far Focus Shift',
    category: 'expand',
    description: 'Look "into" the screen then "through" the screen',
    effect: 'Relaxes eye tension. Helps with screen fatigue. Engages the oculomotor system.'
  },
  {
    id: 'micro-saccade',
    name: 'Micro-Saccade Trainer',
    category: 'expand',
    description: 'Keep eyes soft, allowing micro-saccades',
    effect: 'Re-sets the visual system without conscious movement. Perfect for grounding without active effort.'
  }
];

const getCategoryColor = (category: 'regulate' | 'restore' | 'expand') => {
  switch (category) {
    case 'regulate':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
    case 'restore':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
    case 'expand':
      return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400';
  }
};

const EyeToolsDrawer: React.FC<EyeToolsDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [, setAnimationFrame] = useState(0); // Force re-render on each frame
  const [isCompleting, setIsCompleting] = useState(false); // Track completion fade-out
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Exercise-specific state tracking
  const exerciseStateRef = useRef<{
    passes?: number; // Horizon Reset
    cycles?: number; // Vertical Drop, Near-Far Focus Shift
    rotations?: number; // Circular Drift
    direction?: number; // Circular Drift direction (1 = clockwise, -1 = counterclockwise)
    spiralMode?: 'outward' | 'inward'; // Spiral Flow
    lastFlickerTime?: number; // Micro-Saccade
    phase?: number; // Cross Scan
    peripheralPulses?: Array<{ x: number; y: number; startTime: number }>; // Peripheral Bloom
  }>({});
  
  // Drag functionality
  const y = useMotionValue(0);
  const DRAG_THRESHOLD = 100;
  
  // Ensure backdrop is visible when drawer is open
  const [backdropVisible, setBackdropVisible] = useState(false);
  
  useEffect(() => {
    setBackdropVisible(isOpen);
  }, [isOpen]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
      onClose();
    } else {
      y.set(0);
    }
  };

  const currentExercise = eyeExercises[currentExerciseIndex];

  // Cleanup function
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  };

  // Stop eye tools session when drawer closes
  useEffect(() => {
    if (!isOpen && isActive) {
      setIsActive(false);
      cleanup();
    }
  }, [isOpen, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleStartStop = () => {
    if (isActive) {
      setIsActive(false);
      cleanup();
      setIsCompleting(false);
      exerciseStateRef.current = {};
    } else {
      setIsActive(true);
      setIsCompleting(false);
      startTimeRef.current = Date.now();
      // Initialize exercise-specific state
      const exerciseId = currentExercise.id;
      if (exerciseId === 'spiral-pulse') {
        exerciseStateRef.current.spiralMode = Math.random() > 0.5 ? 'outward' : 'inward';
      } else if (exerciseId === 'circular-drift') {
        exerciseStateRef.current.direction = 1; // Start clockwise
        exerciseStateRef.current.rotations = 0;
      } else if (exerciseId === 'peripheral-bloom') {
        exerciseStateRef.current.peripheralPulses = [];
      } else if (exerciseId === 'micro-saccade') {
        exerciseStateRef.current.lastFlickerTime = 0;
      }
    }
  };

  const handleExerciseChange = (index: number) => {
    if (isActive) {
      setIsActive(false);
      cleanup();
    }
    setCurrentExerciseIndex(index);
  };

  const handlePreviousExercise = () => {
    const newIndex = (currentExerciseIndex - 1 + eyeExercises.length) % eyeExercises.length;
    handleExerciseChange(newIndex);
  };

  const handleNextExercise = () => {
    const newIndex = (currentExerciseIndex + 1) % eyeExercises.length;
    handleExerciseChange(newIndex);
  };

  // Swipe navigation for exercises
  const swipeNavigation = useSwipeNavigation({
    onSwipeLeft: handleNextExercise,
    onSwipeRight: handlePreviousExercise,
    threshold: 50
  });

  // Helper function to check completion and trigger fade-out
  const checkCompletion = (exerciseId: string, elapsed: number) => {
    if (isCompleting) return true;
    
    let shouldComplete = false;
    switch (exerciseId) {
      case 'horizon-reset': {
        const passes = exerciseStateRef.current.passes || 0;
        if (passes >= 8 && passes <= 10) {
          shouldComplete = true;
        }
        break;
      }
      case 'vertical-drop': {
        const cycles = exerciseStateRef.current.cycles || 0;
        if (cycles >= 6 && cycles <= 8) {
          shouldComplete = true;
        }
        break;
      }
      case 'blink-conditioning': {
        if (elapsed >= 20 && elapsed <= 30) {
          shouldComplete = true;
        }
        break;
      }
      case 'circular-drift': {
        const rotations = exerciseStateRef.current.rotations || 0;
        if (rotations >= 6 && rotations <= 10) {
          shouldComplete = true;
        }
        break;
      }
    }
    
    if (shouldComplete && !isCompleting) {
      setIsCompleting(true);
      setTimeout(() => {
        setIsActive(false);
        cleanup();
        setIsCompleting(false);
        exerciseStateRef.current = {};
      }, 2000); // 2 second fade-out
    }
    
    return isCompleting;
  };

  // Render exercise-specific visualizations
  const renderExerciseVisual = () => {
    if (!isActive) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-3 h-3 rounded-full bg-ink-primary dark:bg-paper-light opacity-50" />
        </div>
      );
    }

    const exerciseId = currentExercise.id;
    const now = Date.now();
    const elapsed = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
    const containerWidth = containerRef.current?.offsetWidth || 400;
    const containerHeight = containerRef.current?.offsetHeight || 400;
    const completing = checkCompletion(exerciseId, elapsed);
    const fadeOpacity = completing ? Math.max(0, 1 - (elapsed % 2)) : 1;

    switch (exerciseId) {
      case 'horizon-reset': {
        // Thin horizontal line with glowing dot on left edge
        // Dot moves left→right in 5-7 seconds, pauses 0.5s at edge with brightness pulse
        // Alternates direction, auto-fades after 8-10 passes
        {
          const TRAVERSE_TIME = 6; // 5-7 seconds average
          const PAUSE_TIME = 0.5;
          const CYCLE_TIME = TRAVERSE_TIME + PAUSE_TIME;
          const cycleIndex = Math.floor(elapsed / CYCLE_TIME);
          const cycleElapsed = elapsed % CYCLE_TIME;
          const direction = cycleIndex % 2 === 0 ? 1 : -1; // 1 = left→right, -1 = right→left
          
          // Track passes
          if (cycleIndex !== (exerciseStateRef.current.passes || 0)) {
            exerciseStateRef.current.passes = cycleIndex;
          }
          
          let progress = 0;
          let brightness = 1;
          
          if (cycleElapsed < TRAVERSE_TIME) {
            progress = cycleElapsed / TRAVERSE_TIME;
          } else {
            progress = direction === 1 ? 1 : 0; // At edge
            const pauseProgress = (cycleElapsed - TRAVERSE_TIME) / PAUSE_TIME;
            brightness = 1 + Math.sin(pauseProgress * Math.PI) * 0.5; // Brightness pulse
          }
          
          const xPos = direction === 1 ? progress : 1 - progress;
          const translateX = (xPos - 0.5) * containerWidth * 0.7;
          const lineWidth = containerWidth * 0.4;
          
          return (
            <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
              {/* Horizontal line */}
              <motion.div
                className="absolute top-1/2 left-1/2 h-0.5 bg-blue-500 dark:bg-blue-400"
                style={{
                  width: lineWidth,
                  transform: `translate(${translateX - lineWidth / 2}px, -50%)`,
                  opacity: 1
                }}
              />
              {/* Glowing dot on left edge of line */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400"
                style={{
                  transform: `translate(${translateX - lineWidth / 2 - 6}px, -50%)`,
                  opacity: brightness,
                  boxShadow: `0 0 ${8 * brightness}px rgba(59, 130, 246, ${0.8 * brightness})`
                }}
              />
            </div>
          );
        }
      }

      case 'vertical-drop': {
        // Dot descends top→bottom in 5-6 seconds, brightness increases as drops
        // Upward movement slightly slower, loops 6-8 cycles then ends
        {
          const DESCEND_TIME = 5.5;
          const ASCEND_TIME = 6.5; // Slightly slower
          const CYCLE_TIME = DESCEND_TIME + ASCEND_TIME;
          const cycleIndex = Math.floor(elapsed / CYCLE_TIME);
          const cycleElapsed = elapsed % CYCLE_TIME;
          
          // Track cycles
          if (cycleIndex !== (exerciseStateRef.current.cycles || 0)) {
            exerciseStateRef.current.cycles = cycleIndex;
          }
          
          let progress = 0;
          let brightness = 1;
          
          if (cycleElapsed < DESCEND_TIME) {
            progress = cycleElapsed / DESCEND_TIME; // 0 to 1 (top to bottom)
            brightness = 0.5 + progress * 0.5; // Increases as drops
          } else {
            const ascendProgress = (cycleElapsed - DESCEND_TIME) / ASCEND_TIME;
            progress = 1 - ascendProgress; // 1 to 0 (bottom to top)
            brightness = 0.5 + (1 - progress) * 0.5; // Decreases as rises
          }
          
          const translateY = (progress - 0.5) * containerHeight * 0.7;
          
          return (
            <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
              <motion.div
                className="absolute left-1/2 top-1/2 w-5 h-5 rounded-full bg-blue-500 dark:bg-blue-400"
                style={{
                  transform: `translate(-50%, ${translateY}px)`,
                  opacity: brightness,
                  boxShadow: `0 0 ${10 + brightness * 15}px rgba(59, 130, 246, ${0.6 + brightness * 0.4})`
                }}
              />
            </div>
          );
        }
      }

      case 'peripheral-bloom': {
        // Central dot stays still, very gentle pulse (barely visible)
        // Pulses only in outer 20-30% of screen (never near center)
        // Fade-in 1s, fade-out 2s, zero movement, random positions around edges
        const FADE_IN = 1;
        const FADE_OUT = 2;
        const PULSE_DURATION = FADE_IN + FADE_OUT;
        
        // Generate new pulses randomly
        if (!exerciseStateRef.current.peripheralPulses) {
          exerciseStateRef.current.peripheralPulses = [];
        }
        
        const pulses = exerciseStateRef.current.peripheralPulses;
        const now = Date.now();
        
        // Add new pulse every 2-3 seconds
        if (pulses.length === 0 || (now - (pulses[pulses.length - 1]?.startTime || 0)) > 2500) {
          const angle = Math.random() * Math.PI * 2;
          const minRadius = Math.min(containerWidth, containerHeight) * 0.35; // Outer 20-30% starts at 35%
          const maxRadius = Math.min(containerWidth, containerHeight) * 0.45;
          const radius = minRadius + Math.random() * (maxRadius - minRadius);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          pulses.push({ x, y, startTime: now });
          // Keep only recent pulses
          exerciseStateRef.current.peripheralPulses = pulses.filter(p => (now - p.startTime) / 1000 < PULSE_DURATION);
        }
        
        // Central dot with very gentle pulse
        const centralPulse = Math.sin(elapsed * 0.5) * 0.05 + 0.95; // Barely visible
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            {/* Central dot - very gentle pulse */}
            <div 
              className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-ink-primary dark:bg-paper-light transform -translate-x-1/2 -translate-y-1/2"
              style={{ opacity: centralPulse }}
            />
            
            {/* Peripheral pulses */}
            {pulses.map((pulse, i) => {
              const pulseAge = (now - pulse.startTime) / 1000;
              let opacity = 0;
              
              if (pulseAge < FADE_IN) {
                opacity = pulseAge / FADE_IN; // Fade in
              } else if (pulseAge < PULSE_DURATION) {
                const fadeOutProgress = (pulseAge - FADE_IN) / FADE_OUT;
                opacity = 1 - fadeOutProgress; // Fade out
              }
              
              return (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"
                  style={{
                    transform: `translate(${pulse.x - 4}px, ${pulse.y - 4}px)`,
                    opacity: opacity * 0.4 // Very faint
                  }}
                />
              );
            })}
          </div>
        );
      }

      case 'infinity-trace': {
        // Large sideways figure-8 fades in at center
        // Orb starts on leftmost loop, glides continuously
        // Full cycle 8-10 seconds, slight ease-in/out on crossovers
        // Path lines fade subtly, orb remains bright
        const CYCLE_TIME = 9; // 8-10 seconds
        const t = (elapsed % CYCLE_TIME) / CYCLE_TIME * Math.PI * 2;
        const scale = Math.min(containerWidth, containerHeight) * 0.2;
        
        // Ease-in/out on crossovers (at t = 0, π/2, π, 3π/2)
        let easedT = t;
        const crossoverPoints = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, Math.PI * 2];
        for (let i = 0; i < crossoverPoints.length - 1; i++) {
          const start = crossoverPoints[i];
          const end = crossoverPoints[i + 1];
          if (t >= start && t < end) {
            const localT = (t - start) / (end - start);
            // Ease in/out cubic
            const eased = localT < 0.5 
              ? 4 * localT * localT * localT 
              : 1 - Math.pow(-2 * localT + 2, 3) / 2;
            easedT = start + eased * (end - start);
            break;
          }
        }
        
        const x = Math.sin(easedT) * scale;
        const y = Math.sin(easedT * 2) * scale * 0.5;
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            {/* Figure-8 path - fades subtly */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
              <path
                d={Array.from({ length: 100 }).map((_, i) => {
                  const t = (i / 100) * Math.PI * 2;
                  const px = Math.sin(t) * scale + containerWidth / 2;
                  const py = Math.sin(t * 2) * scale * 0.5 + containerHeight / 2;
                  return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
                }).join(' ')}
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-blue-500 dark:text-blue-400"
              />
            </svg>
            
            {/* Orb - remains bright */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400"
              style={{
                transform: `translate(${x - 8}px, ${y - 8}px)`,
                opacity: 1
              }}
            />
          </div>
        );
      }

      case 'near-far-shift': {
        // Sharp→blur over 2s, hold blurred 2s, sharpen over 1s
        // Blur/dim/reduce contrast for "distance" illusion
        // Repeats 8-12 cycles
        const BLUR_TIME = 2;
        const HOLD_TIME = 2;
        const SHARPEN_TIME = 1;
        const CYCLE_TIME = BLUR_TIME + HOLD_TIME + SHARPEN_TIME;
        const cycleIndex = Math.floor(elapsed / CYCLE_TIME);
        const cycleElapsed = elapsed % CYCLE_TIME;
        
        // Track cycles
        if (cycleIndex !== (exerciseStateRef.current.cycles || 0)) {
          exerciseStateRef.current.cycles = cycleIndex;
        }
        
        let blur = 0;
        let opacity = 1;
        let contrast = 1;
        
        if (cycleElapsed < BLUR_TIME) {
          // Sharpening to blur
          const progress = cycleElapsed / BLUR_TIME;
          blur = progress * 3;
          opacity = 1 - progress * 0.3;
          contrast = 1 - progress * 0.4;
        } else if (cycleElapsed < BLUR_TIME + HOLD_TIME) {
          // Hold blurred
          blur = 3;
          opacity = 0.7;
          contrast = 0.6;
        } else {
          // Blur to sharp
          const progress = (cycleElapsed - BLUR_TIME - HOLD_TIME) / SHARPEN_TIME;
          blur = 3 * (1 - progress);
          opacity = 0.7 + progress * 0.3;
          contrast = 0.6 + progress * 0.4;
        }
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            <motion.div
              className="absolute left-1/2 top-1/2 w-5 h-5 rounded-full bg-blue-500 dark:bg-blue-400"
              style={{
                transform: 'translate(-50%, -50%)',
                opacity,
                filter: `blur(${blur}px) contrast(${contrast})`
              }}
            />
          </div>
        );
      }

      case 'circular-drift': {
        // Dot orbits invisible circle clockwise
        // Full rotation 8-12 seconds, brightness pulse at each quarter turn
        // After 3-5 rotations, reverses direction (counterclockwise)
        // Ends after 6-10 total rotations
        const ROTATION_TIME = 10; // 8-12 seconds average
        const direction = exerciseStateRef.current.direction || 1;
        const rotationProgress = (elapsed % ROTATION_TIME) / ROTATION_TIME;
        const currentRotation = Math.floor(elapsed / ROTATION_TIME);
        
        // Track rotations and reverse direction
        if (currentRotation !== (exerciseStateRef.current.rotations || 0)) {
          exerciseStateRef.current.rotations = currentRotation;
          
          // Reverse after 3-5 rotations in current direction
          if (currentRotation > 0 && currentRotation % 4 === 0) {
            exerciseStateRef.current.direction = -direction;
          }
        }
        
        const angle = direction * rotationProgress * Math.PI * 2;
        const radius = Math.min(containerWidth, containerHeight) * 0.2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Brightness pulse at quarter turns (0, π/2, π, 3π/2)
        const quarterAngle = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const quarterProgress = (quarterAngle % (Math.PI / 2)) / (Math.PI / 2);
        const brightness = 1 + Math.sin(quarterProgress * Math.PI) * 0.3 * (quarterProgress < 0.2 ? 1 : 0);
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            {/* Orbiting dot - invisible circle, only dot visible */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400"
              style={{
                transform: `translate(${x - 8}px, ${y - 8}px)`,
                opacity: brightness,
                boxShadow: `0 0 ${8 * brightness}px rgba(59, 130, 246, ${0.6 * brightness})`
              }}
            />
          </div>
        );
      }

      case 'cross-scan': {
        // 4 sequential phases: horizontal, vertical, diagonal 1, diagonal 2
        // Each sweep 4-5 seconds per direction with brightness pulse at endpoints
        // Background darkens slightly for each axis to mark progression
        // Same dot used throughout
        const SWEEP_TIME = 4.5; // 4-5 seconds per direction
        const PHASE_TIME = SWEEP_TIME * 2; // Left→right→left or up→down→up
        const TOTAL_PHASE_TIME = PHASE_TIME * 4; // 4 phases
        
        const phaseElapsed = elapsed % TOTAL_PHASE_TIME;
        const phaseIndex = Math.floor(phaseElapsed / PHASE_TIME);
        const phaseProgress = (phaseElapsed % PHASE_TIME) / PHASE_TIME;
        
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const range = Math.min(containerWidth, containerHeight) * 0.35;
        
        const phases = [
          { // Horizontal
            x1: centerX - range, y1: centerY, x2: centerX + range, y2: centerY,
            x: centerX + (phaseProgress < 0.5 ? (phaseProgress * 2 - 0.5) * range * 2 : (1.5 - phaseProgress * 2) * range * 2),
            y: centerY
          },
          { // Vertical
            x1: centerX, y1: centerY - range, x2: centerX, y2: centerY + range,
            x: centerX,
            y: centerY + (phaseProgress < 0.5 ? (phaseProgress * 2 - 0.5) * range * 2 : (1.5 - phaseProgress * 2) * range * 2)
          },
          { // Diagonal 1
            x1: centerX - range * 0.7, y1: centerY - range * 0.7, x2: centerX + range * 0.7, y2: centerY + range * 0.7,
            x: centerX + (phaseProgress < 0.5 ? (phaseProgress * 2 - 0.5) : (1.5 - phaseProgress * 2)) * range * 0.7 * 2,
            y: centerY + (phaseProgress < 0.5 ? (phaseProgress * 2 - 0.5) : (1.5 - phaseProgress * 2)) * range * 0.7 * 2
          },
          { // Diagonal 2
            x1: centerX - range * 0.7, y1: centerY + range * 0.7, x2: centerX + range * 0.7, y2: centerY - range * 0.7,
            x: centerX + (phaseProgress < 0.5 ? (phaseProgress * 2 - 0.5) : (1.5 - phaseProgress * 2)) * range * 0.7 * 2,
            y: centerY - (phaseProgress < 0.5 ? (phaseProgress * 2 - 0.5) : (1.5 - phaseProgress * 2)) * range * 0.7 * 2
          }
        ];
        
        const currentPhase = phases[phaseIndex % 4];
        const isAtEndpoint = phaseProgress < 0.1 || phaseProgress > 0.9;
        const brightness = isAtEndpoint ? 1.5 : 1;
        const bgDarkness = phaseIndex * 0.1; // Darken background per phase
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            {/* Background darkening */}
            <div 
              className="absolute inset-0 bg-black rounded-2xl"
              style={{ opacity: bgDarkness * 0.2 }}
            />
            {/* Line */}
            <svg className="absolute inset-0 w-full h-full">
              <line
                x1={currentPhase.x1}
                y1={currentPhase.y1}
                x2={currentPhase.x2}
                y2={currentPhase.y2}
                stroke="currentColor"
                strokeWidth="3"
                opacity={0.6}
                className="text-blue-500 dark:text-blue-400"
              />
            </svg>
            {/* Dot */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400"
              style={{
                transform: `translate(${currentPhase.x - centerX - 8}px, ${currentPhase.y - centerY - 8}px)`,
                opacity: brightness,
                boxShadow: `0 0 ${8 * brightness}px rgba(59, 130, 246, ${0.6 * brightness})`
              }}
            />
          </div>
        );
      }

      case 'blink-conditioning': {
        // Fade-in 1s, hold 1s, fade-out 0.5s, pause 1s
        // Matched to healthy blink timing, runs 20-30 seconds
        // Optional faint halo synced with fade
        const FADE_IN = 1;
        const HOLD = 1;
        const FADE_OUT = 0.5;
        const PAUSE = 1;
        const CYCLE_TIME = FADE_IN + HOLD + FADE_OUT + PAUSE;
        const cycleElapsed = elapsed % CYCLE_TIME;
        
        let opacity = 0;
        let haloOpacity = 0;
        
        if (cycleElapsed < FADE_IN) {
          opacity = cycleElapsed / FADE_IN;
          haloOpacity = opacity * 0.3;
        } else if (cycleElapsed < FADE_IN + HOLD) {
          opacity = 1;
          haloOpacity = 0.3;
        } else if (cycleElapsed < FADE_IN + HOLD + FADE_OUT) {
          const fadeOutProgress = (cycleElapsed - FADE_IN - HOLD) / FADE_OUT;
          opacity = 1 - fadeOutProgress;
          haloOpacity = (1 - fadeOutProgress) * 0.3;
        } else {
          opacity = 0;
          haloOpacity = 0;
        }
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            {/* Optional faint halo */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-8 h-8 rounded-full border-2 border-blue-500 dark:border-blue-400"
              style={{
                transform: 'translate(-50%, -50%)',
                opacity: haloOpacity
              }}
            />
            {/* Dot */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-5 h-5 rounded-full bg-blue-500 dark:bg-blue-400"
              style={{
                transform: 'translate(-50%, -50%)',
                opacity
              }}
            />
          </div>
        );
      }

      case 'spiral-pulse': {
        // Two modes: Outward Spiral (expansion) and Inward Spiral (settling)
        // Outward: starts tight at center, expands to 80% of screen, constant speed
        // Inward: starts wide at edges, spirals inward to center dot
        // Randomize which mode serves first
        const mode = exerciseStateRef.current.spiralMode || 'outward';
        const maxRadius = Math.min(containerWidth, containerHeight) * 0.4; // 80% of screen
        const SPIRAL_TIME = 15; // Time for full spiral
        const progress = (elapsed % SPIRAL_TIME) / SPIRAL_TIME;
        
        let radius = 0;
        let angle = 0;
        
        if (mode === 'outward') {
          radius = progress * maxRadius;
          angle = progress * Math.PI * 6; // 3 full rotations
        } else {
          radius = (1 - progress) * maxRadius;
          angle = (1 - progress) * Math.PI * 6;
        }
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            {/* Spiral path - minimal lines like ink drifting */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
              <path
                d={Array.from({ length: 100 }).map((_, i) => {
                  const t = (i / 100) * Math.PI * 6;
                  const r = mode === 'outward' ? (i / 100) * maxRadius : (1 - i / 100) * maxRadius;
                  const px = Math.cos(t) * r + containerWidth / 2;
                  const py = Math.sin(t) * r + containerHeight / 2;
                  return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
                }).join(' ')}
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="text-blue-500 dark:text-blue-400"
              />
            </svg>
            
            {/* Orb */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400"
              style={{
                transform: `translate(${x - 8}px, ${y - 8}px)`,
                opacity: 1
              }}
            />
          </div>
        );
      }

      case 'micro-saccade': {
        // Central dot completely still, very subtle pulse
        // Tiny flickers at screen edges (far from central field)
        // Very faint, very slow, one at a time, every 2-3 seconds
        // Never too bright or fast
        const FLICKER_INTERVAL = 2.5; // 2-3 seconds
        const FLICKER_DURATION = 1; // Very slow fade
        const now = Date.now();
        const lastFlickerTime = exerciseStateRef.current.lastFlickerTime || 0;
        
        // Generate new flicker if enough time has passed
        if (now - lastFlickerTime > FLICKER_INTERVAL * 1000) {
          exerciseStateRef.current.lastFlickerTime = now;
        }
        
        const flickerAge = (now - lastFlickerTime) / 1000;
        const hasActiveFlicker = flickerAge < FLICKER_DURATION;
        
        // Central dot with very subtle pulse
        const centralPulse = Math.sin(elapsed * 0.3) * 0.02 + 0.98; // Extremely subtle
        
        // Flicker position at screen edge (far from center)
        let flickerX = 0;
        let flickerY = 0;
        let flickerOpacity = 0;
        
        if (hasActiveFlicker) {
          const angle = Math.random() * Math.PI * 2;
          const edgeDistance = Math.min(containerWidth, containerHeight) * 0.45; // Far from center
          flickerX = Math.cos(angle) * edgeDistance;
          flickerY = Math.sin(angle) * edgeDistance;
          flickerOpacity = Math.sin((flickerAge / FLICKER_DURATION) * Math.PI) * 0.2; // Very faint
        }
        
        return (
          <div className="relative w-full h-full" style={{ opacity: fadeOpacity }}>
            {/* Central dot - completely still, very subtle pulse */}
            <div 
              className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-ink-primary dark:bg-paper-light transform -translate-x-1/2 -translate-y-1/2"
              style={{ opacity: centralPulse }}
            />
            
            {/* Single flicker at edge - very faint, very slow */}
            {hasActiveFlicker && (
              <motion.div
                className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"
                style={{
                  transform: `translate(${flickerX - 4}px, ${flickerY - 4}px)`,
                  opacity: flickerOpacity
                }}
              />
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Animation loop
  useEffect(() => {
    if (!isActive) {
      cleanup();
      return;
    }

    const animate = () => {
      // Force re-render to update animations
      setAnimationFrame(prev => prev + 1);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, currentExerciseIndex]);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: backdropVisible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ 
              type: 'tween',
              ease: 'easeOut',
              duration: 0.25
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[55]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isOpen ? 0 : '100%' }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'tween',
              ease: [0.25, 0.1, 0.25, 1],
              duration: 0.3
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            dragDirectionLock={true}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-paper-light dark:bg-paper-dark rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700 h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Video Background */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-t-3xl">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-100"
              >
                <source src="/media/bg.mp4" type="video/mp4" />
              </video>
              {/* Dark overlay for better content readability */}
              <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
            </div>

            {/* Top Bar with Drag Handle and Close Button */}
            <div className="relative z-10 flex items-center justify-between pt-3 pb-2 px-4">
              <div className="w-10"></div>
              <div className="flex justify-center flex-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-ink-muted dark:text-paper-light" />
              </button>
            </div>

            {/* Content */}
            <div 
              className="relative z-10 flex-1 overflow-hidden flex flex-col" 
              style={{ touchAction: 'none' }}
            >
              <div className="flex-1 flex flex-col p-4 sm:p-6 pb-12 sm:pb-16">
                {/* Header */}
                <div className="text-center mb-1 flex-shrink-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.h3
                      key={currentExercise.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="font-semibold text-ink-primary dark:text-paper-light whitespace-nowrap overflow-hidden text-ellipsis px-2"
                      style={{ 
                        fontSize: 'clamp(1.25rem, 4vw, 2.25rem)',
                        lineHeight: '1.2'
                      }}
                    >
                      {currentExercise.name}
                    </motion.h3>
                  </AnimatePresence>
                </div>
                <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
                  <p 
                    className="text-ink-secondary dark:text-ink-muted whitespace-nowrap overflow-hidden text-ellipsis px-2"
                    style={{ 
                      fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                      lineHeight: '1.2'
                    }}
                  >
                    {currentExercise.description}
                  </p>
                </div>

                {/* Exercise Visualization */}
                <div className="flex-1 flex flex-col items-center justify-center mb-4 sm:mb-6 min-h-0" style={{ maxHeight: 'calc(40vh - 2rem)' }}>
                  <div 
                    ref={containerRef}
                    className="relative flex items-center justify-center aspect-square w-full max-w-[400px] rounded-2xl"
                    style={{ 
                      minWidth: '150px', 
                      minHeight: '150px',
                      maxHeight: '35vh',
                      maxWidth: '35vh'
                    }}
                  >
                    {renderExerciseVisual()}
                  </div>
                </div>

                {/* Start/Stop Button */}
                <div className="flex justify-center mb-3 sm:mb-4 flex-shrink-0">
                  <motion.button
                    onClick={handleStartStop}
                    className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium transition-all text-sm sm:text-base ${
                      isActive
                        ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
                        : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isActive ? (
                      <>
                        <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Start</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Exercise Carousel */}
                <div className="space-y-2 sm:space-y-3 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-medium text-ink-secondary dark:text-ink-muted mb-2 sm:mb-3">
                      Eye Exercise
                    </p>
                  </div>
                  
                  {/* Carousel Container */}
                  <div 
                    className="relative overflow-hidden"
                    onTouchStart={swipeNavigation.handleTouchStart}
                    onTouchMove={swipeNavigation.handleTouchMove}
                    onTouchEnd={swipeNavigation.handleTouchEnd}
                  >
                    {/* Exercise Cards Container */}
                    <div className="overflow-hidden px-10 sm:px-12">
                      <motion.div 
                        className="flex"
                        animate={{
                          x: `-${currentExerciseIndex * 100}%`
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      >
                        {eyeExercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className="flex-shrink-0 w-full px-1 sm:px-2"
                          >
                            <motion.div
                              className={`p-3 sm:p-4 rounded-lg border-2 transition-all flex flex-col ${
                                index === currentExerciseIndex
                                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                              }`}
                              whileHover={index === currentExerciseIndex ? {} : { scale: 1.02 }}
                              onClick={() => handleExerciseChange(index)}
                            >
                              <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-shrink-0">
                                <h4 className={`text-base sm:text-lg font-semibold flex-1 ${
                                  index === currentExerciseIndex
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-ink-primary dark:text-paper-light'
                                }`}>
                                  {exercise.name}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(exercise.category)}`}>
                                  {exercise.category}
                                </span>
                              </div>
                              <p className={`text-xs sm:text-sm ${
                                index === currentExerciseIndex
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-ink-secondary dark:text-ink-muted'
                              }`}>
                                {exercise.effect}
                              </p>
                            </motion.div>
                          </div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      {eyeExercises.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleExerciseChange(index)}
                          className={`h-1.5 sm:h-2 rounded-full transition-all ${
                            index === currentExerciseIndex
                              ? 'bg-blue-500 dark:bg-blue-400 w-5 sm:w-6'
                              : 'bg-gray-300 dark:bg-gray-600 w-1.5 sm:w-2'
                          }`}
                          aria-label={`Select ${eyeExercises[index].name}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level, outside stacking context
  return typeof document !== 'undefined' 
    ? createPortal(drawerContent, document.body)
    : null;
};

export default EyeToolsDrawer;

