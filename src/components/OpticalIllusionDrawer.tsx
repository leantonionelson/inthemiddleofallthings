import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { X, Play, Square } from 'lucide-react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

interface OpticalIllusion {
  id: string;
  name: string;
  description: string;
  instruction: string;
  cycleDurationMs: number;
}

interface OpticalIllusionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const opticalIllusions: OpticalIllusion[] = [
  {
    id: 'breathing-tunnel',
    name: 'Breathing Tunnel',
    description: 'Concentric rings that appear to breathe and expand',
    instruction: 'Soften your gaze and rest it on the centre. Let the tunnel breathe.',
    cycleDurationMs: 8000
  },
  {
    id: 'warping-sun',
    name: 'Warping Sun',
    description: 'Radial field that appears to warp when you focus on the centre',
    instruction: 'Rest your eyes on the centre. Let everything around it move.',
    cycleDurationMs: 10000
  }
];

const OpticalIllusionDrawer: React.FC<OpticalIllusionDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentIllusionIndex, setCurrentIllusionIndex] = useState(0);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const currentIllusion = opticalIllusions[currentIllusionIndex];
  const cycleSeconds = currentIllusion.cycleDurationMs / 1000;

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Drag functionality
  const y = useMotionValue(0);
  const DRAG_THRESHOLD = 100;
  
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

  // Stop illusion when drawer closes
  useEffect(() => {
    if (!isOpen && isActive) {
      setIsActive(false);
    }
  }, [isOpen, isActive]);

  const handleStartStop = () => {
    setIsActive(!isActive);
  };

  const handleIllusionChange = (index: number) => {
    if (isActive) {
      setIsActive(false);
    }
    setCurrentIllusionIndex(index);
  };

  const handlePreviousIllusion = () => {
    const newIndex = (currentIllusionIndex - 1 + opticalIllusions.length) % opticalIllusions.length;
    handleIllusionChange(newIndex);
  };

  const handleNextIllusion = () => {
    const newIndex = (currentIllusionIndex + 1) % opticalIllusions.length;
    handleIllusionChange(newIndex);
  };

  // Swipe navigation for illusions
  const swipeNavigation = useSwipeNavigation({
    onSwipeLeft: handleNextIllusion,
    onSwipeRight: handlePreviousIllusion,
    threshold: 50
  });

  // Render illusion visualization
  const renderIllusion = () => {
    if (!isActive) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-3 h-3 rounded-full bg-ink-primary dark:bg-paper-light opacity-50" />
        </div>
      );
    }

    switch (currentIllusion.id) {
      case 'breathing-tunnel':
        const tunnelColor = isDarkMode ? 'white' : '#0F0F0F';
        return (
          <div className="relative w-full h-full breathing-tunnel">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full"
              aria-hidden="true"
            >
              {Array.from({ length: 18 }).map((_, i) => {
                const radius = 15 + i * 10; // 15, 25, 35, ...
                const isEven = i % 2 === 0;

                return (
                  <circle
                    key={i}
                    cx="200"
                    cy="200"
                    r={radius}
                    fill="none"
                    stroke={tunnelColor}
                    strokeWidth={isEven ? 2 : 1}
                    opacity={isEven ? 0.5 : 0.18}
                  />
                );
              })}

              {/* Central anchor dot */}
              <circle cx="200" cy="200" r="4" fill={tunnelColor} opacity={0.9} />
            </svg>
          </div>
        );

      case 'warping-sun':
        const sunColor = isDarkMode ? 'white' : '#0F0F0F';
        return (
          <div className="relative w-full h-full centre-warp">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full"
              aria-hidden="true"
            >
              {/* Central anchor circle */}
              <circle
                cx="200"
                cy="200"
                r="12"
                fill={sunColor}
                opacity={0.95}
              />

              {/* Slight halo around centre */}
              <circle
                cx="200"
                cy="200"
                r="40"
                fill="none"
                stroke={sunColor}
                strokeWidth={0.5}
                opacity={0.4}
              />

              {/* Radial spokes */}
              {Array.from({ length: 64 }).map((_, i) => {
                const angle = (i / 64) * Math.PI * 2;
                const innerRadius = 45;
                const outerRadius = 180;

                const x1 = 200 + innerRadius * Math.cos(angle);
                const y1 = 200 + innerRadius * Math.sin(angle);
                const x2 = 200 + outerRadius * Math.cos(angle);
                const y2 = 200 + outerRadius * Math.sin(angle);

                const isEven = i % 2 === 0;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={sunColor}
                    strokeWidth={isEven ? 1.2 : 0.6}
                    opacity={isEven ? 0.55 : 0.25}
                  />
                );
              })}

              {/* Outer rings to enhance the warp effect */}
              {Array.from({ length: 6 }).map((_, i) => {
                const radius = 70 + i * 20;
                return (
                  <circle
                    key={`ring-${i}`}
                    cx="200"
                    cy="200"
                    r={radius}
                    fill="none"
                    stroke={sunColor}
                    strokeWidth={i % 2 === 0 ? 0.7 : 0.4}
                    opacity={i % 2 === 0 ? 0.35 : 0.18}
                  />
                );
              })}
            </svg>
          </div>
        );

      default:
        return null;
    }
  };

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
                      key={currentIllusion.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-3xl sm:text-4xl font-semibold text-ink-primary dark:text-paper-light"
                    >
                      {currentIllusion.name}
                    </motion.h3>
                  </AnimatePresence>
                </div>
                <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
                  <p className="text-sm sm:text-sm text-ink-secondary dark:text-ink-muted">
                    {isActive ? currentIllusion.instruction : currentIllusion.description}
                  </p>
                </div>

                {/* Illusion Visualization */}
                <div className="flex-1 flex flex-col items-center justify-center mb-4 sm:mb-6 min-h-0" style={{ maxHeight: 'calc(40vh - 2rem)' }}>
                  <div 
                    className="relative flex items-center justify-center aspect-square w-full max-w-[400px] rounded-2xl"
                    style={{ 
                      minWidth: '150px', 
                      minHeight: '150px',
                      maxHeight: '35vh',
                      maxWidth: '35vh'
                    }}
                  >
                    {renderIllusion()}
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

                {/* Illusion Carousel */}
                <div className="space-y-2 sm:space-y-3 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-medium text-ink-secondary dark:text-ink-muted mb-2 sm:mb-3">
                      Optical Illusion
                    </p>
                  </div>
                  
                  {/* Carousel Container */}
                  <div 
                    className="relative overflow-hidden"
                    onTouchStart={swipeNavigation.handleTouchStart}
                    onTouchMove={swipeNavigation.handleTouchMove}
                    onTouchEnd={swipeNavigation.handleTouchEnd}
                  >
                    {/* Illusion Cards Container */}
                    <div className="overflow-hidden px-10 sm:px-12">
                      <motion.div 
                        className="flex"
                        animate={{
                          x: `-${currentIllusionIndex * 100}%`
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      >
                        {opticalIllusions.map((illusion, index) => (
                          <div
                            key={illusion.id}
                            className="flex-shrink-0 w-full px-1 sm:px-2"
                          >
                            <motion.div
                              className={`p-3 sm:p-4 rounded-lg border-2 transition-all flex flex-col ${
                                index === currentIllusionIndex
                                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                              }`}
                              whileHover={index === currentIllusionIndex ? {} : { scale: 1.02 }}
                              onClick={() => handleIllusionChange(index)}
                            >
                              <h4 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex-shrink-0 ${
                                index === currentIllusionIndex
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-ink-primary dark:text-paper-light'
                              }`}>
                                {illusion.name}
                              </h4>
                              <p className={`text-xs sm:text-sm ${
                                index === currentIllusionIndex
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-ink-secondary dark:text-ink-muted'
                              }`}>
                                {illusion.description}
                              </p>
                            </motion.div>
                          </div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      {opticalIllusions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleIllusionChange(index)}
                          className={`h-1.5 sm:h-2 rounded-full transition-all ${
                            index === currentIllusionIndex
                              ? 'bg-blue-500 dark:bg-blue-400 w-5 sm:w-6'
                              : 'bg-gray-300 dark:bg-gray-600 w-1.5 sm:w-2'
                          }`}
                          aria-label={`Select ${opticalIllusions[index].name}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Full-screen illusion overlay when active */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`fixed inset-0 z-50 flex items-center justify-center ${
                isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              {/* Optional instruction */}
              <div className={`absolute top-8 inset-x-4 text-center text-xs sm:text-sm z-10 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                {currentIllusion.instruction}
              </div>

              <div className="relative w-[80vmin] h-[80vmin] flex items-center justify-center">
                {/* Aura */}
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-70 ${
                  isDarkMode 
                    ? 'bg-gradient-to-tr from-white/10 via-transparent to-white/10' 
                    : 'bg-gradient-to-tr from-black/10 via-transparent to-black/10'
                }`} />

                {/* Illusion container */}
                <div className="relative w-full h-full" style={{ transform: 'scale(1)' }}>
                  {renderIllusion()}
                </div>
              </div>
            </motion.div>
          )}

          {/* CSS Animations */}
          <style>{`
            .breathing-tunnel {
              animation: tunnel-breathe ${cycleSeconds}s ease-in-out infinite,
                         tunnel-rotate ${cycleSeconds * 4}s ease-in-out infinite;
            }

            @keyframes tunnel-breathe {
              0% {
                filter: blur(0px);
              }
              50% {
                filter: blur(1.5px);
              }
              100% {
                filter: blur(0px);
              }
            }

            @keyframes tunnel-rotate {
              0% {
                transform: scale(1) rotate(0deg);
              }
              25% {
                transform: scale(1.03) rotate(0.75deg);
              }
              50% {
                transform: scale(1.06) rotate(1.5deg);
              }
              75% {
                transform: scale(1.03) rotate(0.75deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
              }
            }

            .centre-warp {
              animation: centre-warp-breathe ${cycleSeconds}s ease-in-out infinite,
                         centre-warp-rotate ${cycleSeconds * 3}s ease-in-out infinite;
            }

            @keyframes centre-warp-breathe {
              0% {
                filter: blur(0px);
              }
              50% {
                filter: blur(1px);
              }
              100% {
                filter: blur(0px);
              }
            }

            @keyframes centre-warp-rotate {
              0% {
                transform: scale(1) rotate(0deg);
              }
              25% {
                transform: scale(1.03) rotate(-1deg);
              }
              50% {
                transform: scale(1.06) rotate(-2deg);
              }
              75% {
                transform: scale(1.03) rotate(-1deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level, outside stacking context
  return typeof document !== 'undefined' 
    ? createPortal(drawerContent, document.body)
    : null;
};

export default OpticalIllusionDrawer;

