import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Play, Square, ChevronLeft, ChevronRight } from 'lucide-react';

interface BreathingTechnique {
  id: string;
  name: string;
  inhale: number; // seconds
  hold?: number;  // optional hold after inhale
  exhale: number; // seconds
  holdAfterExhale?: number; // optional hold after exhale
}

interface BreathworkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale' | 'idle';

const breathingTechniques: BreathingTechnique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 4
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    inhale: 4,
    hold: 7,
    exhale: 8
  },
  {
    id: 'deep',
    name: 'Deep Breathing',
    inhale: 4,
    exhale: 4
  },
  {
    id: 'equal',
    name: 'Equal Breathing',
    inhale: 4,
    exhale: 4
  },
  {
    id: 'triangle',
    name: 'Triangle Breathing',
    inhale: 4,
    hold: 4,
    exhale: 4
  }
];

const BreathworkDrawer: React.FC<BreathworkDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentTechniqueIndex, setCurrentTechniqueIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('idle');
  const [circleScale, setCircleScale] = useState(0);
  const [circleOpacity, setCircleOpacity] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [colorIntensity, setColorIntensity] = useState(1); // 1 = normal, >1 = darker during hold
  
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentPhaseStartTimeRef = useRef<number | null>(null);
  const currentPhaseRef = useRef<BreathingPhase>('idle');
  const previousPhaseEndScaleRef = useRef<number>(0);
  const previousPhaseEndOpacityRef = useRef<number>(0);
  const previousPhaseEndColorIntensityRef = useRef<number>(1);
  const currentScaleRef = useRef<number>(0);
  const currentOpacityRef = useRef<number>(0);
  const currentColorIntensityRef = useRef<number>(1);
  const actualRenderedScaleRef = useRef<number>(0);
  const actualRenderedOpacityRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dot size in pixels
  const DOT_SIZE = 12;
  
  // Calculate max scale based on container size (will be updated responsively)
  const [maxScale, setMaxScale] = useState(21.3); // Default fallback

  const currentTechnique = breathingTechniques[currentTechniqueIndex];

  // Calculate max scale based on container size
  useEffect(() => {
    if (!containerRef.current || !isOpen) return;

    let resizeTimeout: NodeJS.Timeout;

    const updateMaxScale = () => {
      if (containerRef.current) {
        // Use the smaller dimension to ensure circle fits in container
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        // Fallback to clientWidth/clientHeight if offsetWidth/Height are 0
        const width = containerWidth || containerRef.current.clientWidth || 200;
        const height = containerHeight || containerRef.current.clientHeight || 200;
        const containerSize = Math.min(width, height);
        const calculatedMaxScale = Math.max(containerSize / DOT_SIZE, 10); // Minimum scale of 10
        setMaxScale(calculatedMaxScale);
      }
    };

    // Initial calculation with small delay to ensure container is rendered
    resizeTimeout = setTimeout(updateMaxScale, 50);
    
    // Update on resize
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize updates
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateMaxScale, 50);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  // Drag functionality
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 200], [1, 0]);
  const DRAG_THRESHOLD = 100;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
      onClose();
    } else {
      y.set(0);
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
    currentPhaseStartTimeRef.current = null;
  };

  // Easing functions
  const easeOut = (t: number): number => {
    return 1 - Math.pow(1 - t, 3); // Cubic ease-out
  };

  const easeIn = (t: number): number => {
    return t * t * t; // Cubic ease-in
  };

  // Animation loop for smooth circle expansion/contraction
  useEffect(() => {
    if (!isActive || currentPhase === 'idle') {
      setCircleScale(0);
      setCircleOpacity(0);
      setPulseScale(1);
      setColorIntensity(1);
      currentScaleRef.current = 0;
      currentOpacityRef.current = 0;
      currentColorIntensityRef.current = 1;
      currentPhaseRef.current = 'idle';
      actualRenderedScaleRef.current = 0;
      actualRenderedOpacityRef.current = 0;
      return;
    }

    const animate = () => {
      // Phase start time is set immediately on transition, so animation continues seamlessly
      const now = Date.now();
      const elapsed = (now - (currentPhaseStartTimeRef.current || now)) / 1000; // seconds
      
      // Use ref for phase to avoid animation loop restart on state change
      const activePhase = currentPhaseRef.current;
      
      let phaseDuration = 0;
      let startScale = previousPhaseEndScaleRef.current;
      let startOpacity = previousPhaseEndOpacityRef.current;
      let targetScale = 0;
      let targetOpacity = 0;

      switch (activePhase) {
        case 'inhale':
          phaseDuration = currentTechnique.inhale;
          targetScale = maxScale;
          targetOpacity = 0.5;
          break;
        case 'hold':
          // Make hold animation complete faster so exhale can start earlier
          phaseDuration = (currentTechnique.hold || 0) * 0.7; // Complete animation in 70% of hold time
          // Softly drop slightly from maxScale (to ~98% of maxScale - minimal contraction)
          targetScale = maxScale * 0.98;
          targetOpacity = 0.5;
          break;
        case 'exhale':
          phaseDuration = currentTechnique.exhale;
          // Start from wherever we actually are (may include pulse from hold phase)
          // End at 0.1 if there's a holdAfterExhale, otherwise 0
          targetScale = currentTechnique.holdAfterExhale ? 0.1 : 0;
          targetOpacity = currentTechnique.holdAfterExhale ? 0.15 : 0;
          break;
        case 'holdAfterExhale':
          phaseDuration = currentTechnique.holdAfterExhale || 0;
          // Maintain small scale, no drop needed for hold after exhale
          targetScale = 0.1;
          targetOpacity = 0.15;
          break;
      }

      const progress = Math.min(elapsed / phaseDuration, 1);
      
      let newScale: number;
      let newOpacity: number;
      
      let currentPulseAmount = 1;
      
      let newColorIntensity = 1;
      
      if (activePhase === 'inhale') {
        // Ease-out: gentle opening, soft arrival at max
        const easedProgress = easeOut(progress);
        newScale = startScale + (targetScale - startScale) * easedProgress;
        newOpacity = startOpacity + (targetOpacity - startOpacity) * easedProgress;
        currentPulseAmount = 1;
        setPulseScale(1);
        newColorIntensity = 1; // Normal color during inhale
      } else if (activePhase === 'exhale') {
        // Ease-in: gentle start, calm settling
        const easedProgress = easeIn(progress);
        newScale = startScale + (targetScale - startScale) * easedProgress;
        newOpacity = startOpacity + (targetOpacity - startOpacity) * easedProgress;
        currentPulseAmount = 1;
        setPulseScale(1);
        // Start with the darker color from hold (if there was a hold), then smoothly transition back to normal
        // Use the captured value from transition, ensuring smooth continuation
        const startColorIntensity = previousPhaseEndColorIntensityRef.current;
        const targetColorIntensity = 1; // Normal color
        // Use linear interpolation for color to ensure smooth, predictable transition
        // This prevents abrupt changes at the start
        newColorIntensity = startColorIntensity + (targetColorIntensity - startColorIntensity) * progress;
      } else if (activePhase === 'hold') {
        // Hold: softly drop slightly and darken color
        // Smooth ease-in to drop the circle slightly
        const easedProgress = easeIn(progress);
        newScale = startScale + (targetScale - startScale) * easedProgress;
        newOpacity = startOpacity + (targetOpacity - startOpacity) * easedProgress;
        currentPulseAmount = 1;
        setPulseScale(1);
        // Darken color during hold (1.0 = normal, 1.6 = darkest)
        const colorProgress = Math.min(progress * 1.5, 1); // Darken over first 2/3 of hold
        newColorIntensity = 1 + colorProgress * 0.6; // Range from 1.0 to 1.6
      } else {
        // holdAfterExhale: maintain small scale, no special effects
        newScale = targetScale;
        newOpacity = targetOpacity;
        currentPulseAmount = 1;
        setPulseScale(1);
        newColorIntensity = 1;
      }
      
      // Update color intensity ref and state
      currentColorIntensityRef.current = newColorIntensity;
      setColorIntensity(newColorIntensity);

      // Update refs immediately for next frame
      currentScaleRef.current = newScale;
      currentOpacityRef.current = newOpacity;
      
      // Track actual rendered scale (including pulse effect) - use calculated pulse amount
      const actualScale = newScale * currentPulseAmount;
      const actualOpacity = newOpacity;
      actualRenderedScaleRef.current = actualScale;
      actualRenderedOpacityRef.current = actualOpacity;
      
      // Update state
      setCircleScale(newScale);
      setCircleOpacity(newOpacity);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, currentPhase, currentTechnique, maxScale]);

  // Phase management
  useEffect(() => {
    if (!isActive) {
      cleanup();
      setCurrentPhase('idle');
      setCircleScale(0);
      setCircleOpacity(0);
      setPulseScale(1);
      setColorIntensity(1);
      return;
    }

    const transitionToPhase = (phase: BreathingPhase) => {
      const transitionTime = Date.now();
      
      // Capture ACTUAL rendered scale/opacity (including pulse) at the moment of transition
      // This ensures smooth continuation from wherever the circle is, even mid-oscillation
      previousPhaseEndScaleRef.current = actualRenderedScaleRef.current;
      previousPhaseEndOpacityRef.current = actualRenderedOpacityRef.current;
      // Capture current color intensity from ref (actual current value, not state)
      // Ensure we have the most recent value
      previousPhaseEndColorIntensityRef.current = currentColorIntensityRef.current;
      
      // Set phase start time immediately for seamless transition (no pause)
      // Use the exact transition time to avoid any frame delay
      currentPhaseStartTimeRef.current = transitionTime;
      
      // Update phase ref immediately (for animation loop) and state (for rendering)
      currentPhaseRef.current = phase;
      setCurrentPhase(phase);
      
      let duration = 0;
      switch (phase) {
        case 'inhale':
          duration = currentTechnique.inhale * 1000;
          break;
        case 'hold':
          // Start exhale transition earlier - 70% through the hold duration
          // This makes exhale start while hold is still visually happening
          duration = ((currentTechnique.hold || 0) * 1000) * 0.7;
          break;
        case 'exhale':
          duration = currentTechnique.exhale * 1000;
          break;
        case 'holdAfterExhale':
          duration = (currentTechnique.holdAfterExhale || 0) * 1000;
          break;
      }

      phaseTimeoutRef.current = setTimeout(() => {
        // Move to next phase
        if (phase === 'inhale') {
          if (currentTechnique.hold) {
            transitionToPhase('hold');
          } else {
            transitionToPhase('exhale');
          }
        } else if (phase === 'hold') {
          transitionToPhase('exhale');
        } else if (phase === 'exhale') {
          if (currentTechnique.holdAfterExhale) {
            transitionToPhase('holdAfterExhale');
          } else {
            transitionToPhase('inhale'); // Loop back
          }
        } else if (phase === 'holdAfterExhale') {
          transitionToPhase('inhale'); // Loop back
        }
      }, duration);
    };

    // Start the cycle - initialize previous scale/opacity to 0
    previousPhaseEndScaleRef.current = 0;
    previousPhaseEndOpacityRef.current = 0;
    previousPhaseEndColorIntensityRef.current = 1;
    currentScaleRef.current = 0;
    currentOpacityRef.current = 0;
    currentColorIntensityRef.current = 1;
    currentPhaseRef.current = 'idle';
    actualRenderedScaleRef.current = 0;
    actualRenderedOpacityRef.current = 0;
    transitionToPhase('inhale');

    return cleanup;
  }, [isActive, currentTechnique, maxScale]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleStartStop = () => {
    if (isActive) {
      setIsActive(false);
      cleanup();
    } else {
      setIsActive(true);
      startTimeRef.current = Date.now();
    }
  };

  const handleTechniqueChange = (index: number) => {
    if (isActive) {
      // Stop current session if changing technique
      setIsActive(false);
      cleanup();
    }
    setCurrentTechniqueIndex(index);
  };

  const handlePreviousTechnique = () => {
    const newIndex = (currentTechniqueIndex - 1 + breathingTechniques.length) % breathingTechniques.length;
    handleTechniqueChange(newIndex);
  };

  const handleNextTechnique = () => {
    const newIndex = (currentTechniqueIndex + 1) % breathingTechniques.length;
    handleTechniqueChange(newIndex);
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'holdAfterExhale':
        return 'Hold';
      default:
        return '';
    }
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              type: 'tween',
              ease: 'easeOut',
              duration: 0.25
            }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[55]"
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

            {/* Scrollable Content */}
            <div 
              className="relative z-10 flex-1 overflow-y-auto flex flex-col" 
              style={{ touchAction: 'pan-y' }}
              onTouchStart={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('input, textarea, button, a')) {
                  return;
                }
              }}
            >
              <div className="flex-1 flex flex-col p-4 sm:p-6">
                {/* Header - transitions between "Breathwork" and phase text */}
                <div className="text-center mb-3 sm:mb-4 flex-shrink-0 min-h-[3.5rem] sm:min-h-[4rem] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isActive ? (
                      <motion.h3
                        key={currentPhase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl sm:text-4xl font-semibold text-ink-primary dark:text-paper-light"
                      >
                        {getPhaseText()}
                      </motion.h3>
                    ) : (
                      <motion.h3
                        key="breathwork"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl sm:text-4xl font-semibold text-ink-primary dark:text-paper-light"
                      >
                        Breathwork
                      </motion.h3>
                    )}
                  </AnimatePresence>
                </div>
                <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
                  <p className="text-xs sm:text-sm text-ink-secondary dark:text-ink-muted">
                    Focus on the dot and breath
                  </p>
                </div>

                {/* Breathing Visualization */}
                <div className="flex-1 flex flex-col items-center justify-center mb-4 sm:mb-6 min-h-0">

                  {/* Breathing Circle Container - responsive */}
                  <div 
                    ref={containerRef}
                    className="relative flex items-center justify-center flex-1 w-full max-w-full aspect-square"
                    style={{ minWidth: '200px', minHeight: '200px' }}
                  >
                    {/* Animated Circle - expands from center dot with wave effect */}
                    <motion.div
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        scale: circleScale * pulseScale,
                        opacity: circleOpacity,
                        transformOrigin: 'center center',
                        border: `0.5px solid rgba(59, 130, 246, ${0.6 * colorIntensity})`,
                        background: `radial-gradient(circle, 
                          transparent 0%, 
                          transparent 30%, 
                          rgba(59, 130, 246, ${circleOpacity * 0.2 * colorIntensity}) 30%, 
                          rgba(59, 130, 246, ${circleOpacity * 0.15 * colorIntensity}) 35%, 
                          transparent 35%, 
                          transparent 65%, 
                          rgba(59, 130, 246, ${circleOpacity * 0.1 * colorIntensity}) 65%, 
                          rgba(59, 130, 246, ${circleOpacity * 0.08 * colorIntensity}) 70%, 
                          transparent 70%
                        )`,
                        boxShadow: currentPhase === 'hold' || currentPhase === 'holdAfterExhale' 
                          ? `0 0 ${12 * pulseScale}px rgba(59, 130, 246, ${circleOpacity * 0.4 * colorIntensity})`
                          : `0 0 ${8 * pulseScale}px rgba(59, 130, 246, ${circleOpacity * 0.3 * colorIntensity})`,
                      }}
                      transition={{
                        type: 'tween',
                        ease: 'linear',
                        duration: 0
                      }}
                    />
                    
                    {/* Center Dot - focal point */}
                    <div className="absolute w-3 h-3 rounded-full bg-ink-primary dark:bg-paper-light z-10" />
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

                {/* Technique Carousel */}
                <div className="space-y-2 sm:space-y-3 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-medium text-ink-secondary dark:text-ink-muted mb-2 sm:mb-3">
                      Breathing Technique
                    </p>
                  </div>
                  
                  {/* Carousel Container */}
                  <div className="relative">
                    {/* Navigation Buttons */}
                    <button
                      onClick={handlePreviousTechnique}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Previous technique"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-ink-primary dark:text-paper-light" />
                    </button>
                    
                    <button
                      onClick={handleNextTechnique}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Next technique"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink-primary dark:text-paper-light" />
                    </button>

                    {/* Technique Cards Container */}
                    <div className="overflow-hidden px-8 sm:px-10">
                      <div 
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{
                          transform: `translateX(-${currentTechniqueIndex * 100}%)`
                        }}
                      >
                        {breathingTechniques.map((technique, index) => (
                          <div
                            key={technique.id}
                            className="flex-shrink-0 w-full px-1 sm:px-2"
                          >
                            <motion.div
                              className={`p-3 sm:p-4 rounded-lg border-2 transition-all flex flex-col ${
                                index === currentTechniqueIndex
                                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                              }`}
                              style={{ minHeight: '120px' }}
                              whileHover={index === currentTechniqueIndex ? {} : { scale: 1.02 }}
                              onClick={() => handleTechniqueChange(index)}
                            >
                              <h4 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex-shrink-0 ${
                                index === currentTechniqueIndex
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-ink-primary dark:text-paper-light'
                              }`}>
                                {technique.name}
                              </h4>
                              <div className="flex flex-row gap-1.5 sm:gap-2">
                                <div className={`flex-1 rounded-md p-1.5 sm:p-2 text-center border ${
                                  index === currentTechniqueIndex
                                    ? 'border-blue-300 dark:border-blue-500 bg-blue-100/50 dark:bg-blue-800/30'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                }`}>
                                  <div className="text-[10px] sm:text-xs font-medium text-ink-secondary dark:text-ink-muted mb-0.5">
                                    Inhale
                                  </div>
                                  <div className="text-xs sm:text-sm font-semibold text-ink-primary dark:text-paper-light">
                                    {technique.inhale}s
                                  </div>
                                </div>
                                {technique.hold && (
                                  <div className={`flex-1 rounded-md p-1.5 sm:p-2 text-center border ${
                                    index === currentTechniqueIndex
                                      ? 'border-blue-300 dark:border-blue-500 bg-blue-100/50 dark:bg-blue-800/30'
                                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                  }`}>
                                    <div className="text-[10px] sm:text-xs font-medium text-ink-secondary dark:text-ink-muted mb-0.5">
                                      Hold
                                    </div>
                                    <div className="text-xs sm:text-sm font-semibold text-ink-primary dark:text-paper-light">
                                      {technique.hold}s
                                    </div>
                                  </div>
                                )}
                                <div className={`flex-1 rounded-md p-1.5 sm:p-2 text-center border ${
                                  index === currentTechniqueIndex
                                    ? 'border-blue-300 dark:border-blue-500 bg-blue-100/50 dark:bg-blue-800/30'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                }`}>
                                  <div className="text-[10px] sm:text-xs font-medium text-ink-secondary dark:text-ink-muted mb-0.5">
                                    Exhale
                                  </div>
                                  <div className="text-xs sm:text-sm font-semibold text-ink-primary dark:text-paper-light">
                                    {technique.exhale}s
                                  </div>
                                </div>
                                {technique.holdAfterExhale && (
                                  <div className={`flex-1 rounded-md p-1.5 sm:p-2 text-center border ${
                                    index === currentTechniqueIndex
                                      ? 'border-blue-300 dark:border-blue-500 bg-blue-100/50 dark:bg-blue-800/30'
                                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                  }`}>
                                    <div className="text-[10px] sm:text-xs font-medium text-ink-secondary dark:text-ink-muted mb-0.5">
                                      Hold
                                    </div>
                                    <div className="text-xs sm:text-sm font-semibold text-ink-primary dark:text-paper-light">
                                      {technique.holdAfterExhale}s
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      {breathingTechniques.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleTechniqueChange(index)}
                          className={`h-1.5 sm:h-2 rounded-full transition-all ${
                            index === currentTechniqueIndex
                              ? 'bg-blue-500 dark:bg-blue-400 w-5 sm:w-6'
                              : 'bg-gray-300 dark:bg-gray-600 w-1.5 sm:w-2'
                          }`}
                          aria-label={`Select ${breathingTechniques[index].name}`}
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

export default BreathworkDrawer;

