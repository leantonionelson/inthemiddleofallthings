import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { LearnModule } from '../types';
import { sectionOrder, sectionDescriptions, sectionDrawerContent } from '../data/learnContent';

interface LearnIntroDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  modules: LearnModule[];
  initialSectionIndex?: number;
}

// Helper function to render text with markdown-style italics
const renderTextWithItalics = (text: string): React.ReactNode => {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part}</span>;
  });
};

const LearnIntroDrawer: React.FC<LearnIntroDrawerProps> = ({
  isOpen,
  onClose,
  modules,
  initialSectionIndex = 0
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(initialSectionIndex);

  // Update current section index when initialSectionIndex changes
  useEffect(() => {
    if (isOpen && initialSectionIndex !== undefined) {
      setCurrentSectionIndex(initialSectionIndex);
    }
  }, [isOpen, initialSectionIndex]);

  const currentSection = sectionOrder[currentSectionIndex];
  const currentSectionDescription = sectionDescriptions[currentSection] || '';
  const currentSectionDrawerContent = sectionDrawerContent[currentSection] || '';


  // Drag functionality
  const y = useMotionValue(0);
  const DRAG_THRESHOLD = 100;
  
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
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-paper-light dark:bg-paper-dark rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col overflow-hidden"
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
              className="relative z-10 flex-1 overflow-y-auto" 
              style={{ touchAction: 'pan-y' }}
              onTouchStart={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('input, textarea, button, a')) {
                  return;
                }
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold font-heading text-ink-primary dark:text-paper-light mb-2">
                      {currentSection}
                    </h2>
                  </div>
                </div>

                {/* Description Content */}
                <div>
                  <p className="text-base text-ink-secondary dark:text-ink-muted leading-relaxed whitespace-pre-line">
                    {currentSectionDrawerContent || currentSectionDescription}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level
  return typeof document !== 'undefined' 
    ? createPortal(drawerContent, document.body)
    : null;
};

export default LearnIntroDrawer;

