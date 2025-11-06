import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookChapter } from '../types';
import { partDescriptions } from '../data/bookContent';
import { readingProgressService } from '../services/readingProgressService';

interface BookIntroDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: BookChapter[];
  onNavigate: (chapterIndex: number) => void;
  initialPartIndex?: number;
}

const partOrder = [
  'Introduction',
  'Part I: The Axis of Becoming',
  'Part II: The Spiral Path',
  'Part III: The Living Axis',
  'Part IV: The Horizon Beyond'
];

// Extended descriptions for the drawer (longer, more detailed versions)
const extendedPartDescriptions: Record<string, string> = {
  'Introduction': 'An orientation to the journey ahead, setting the foundation for exploration. This opening section invites you into a space between certainty and doubt, where questions matter more than answers. Here, you\'ll discover how to hold the tension of opposites, finding center not as a fixed point but as a dynamic balance. The introduction prepares you for a philosophical journey that asks you to examine your assumptions, embrace uncertainty, and explore what it means to exist in the middle of all things—neither fully knowing nor fully unknowing, but present to the unfolding moment.',
  'Part I: The Axis of Becoming': 'Exploring the fundamental forces that shape our existence and the choices that define who we become. This section examines the invisible axes around which our lives revolve—the pull of consequence, the shape of desire, the weight of choice. You\'ll explore how every action creates ripples through time, how our deepest longings reveal our true nature, and how the discipline of becoming requires us to choose ourselves again and again. Through reflection on the axis of consequence, the nature of desire, and the transformative power of committed choice, you\'ll begin to understand how we actively participate in our own becoming.',
  'Part II: The Spiral Path': 'Understanding the cyclical nature of growth, the return of old patterns, and the sacred pauses that allow integration. Growth is not linear—it spirals. We return to familiar territories but at different elevations, seeing old challenges with new eyes. This part explores how the spiral path honors both progress and return, how old versions of ourselves resurface not as failures but as teachers, and how rest and pause are essential to integration. You\'ll discover the wisdom in repetition, the grace in returning, and the necessity of allowing time for what you\'ve learned to take root.',
  'Part III: The Living Axis': 'Discovering how to live fully in the present moment, using the body and emotions as guides to authentic being. The body is not separate from consciousness—it is consciousness embodied. This section teaches you to listen to the wisdom of sensation, to honor emotion as messenger rather than master, and to find your center amidst the chaos of daily life. You\'ll explore how the present moment is the only place where life actually happens, how the world itself becomes a field of practice, and how authentic being emerges when we stop performing and start inhabiting ourselves fully.',
  'Part IV: The Horizon Beyond': 'Contemplating mortality, transcendence, and our place within something larger than ourselves. Every life leaves traces—echoes and imprints that ripple beyond our knowing. This final section invites you to face mortality with courage, to explore transcendence without escape, and to recognize yourself as part of an infinite web of connection. You\'ll contemplate the shape of your mortality, the possibility of transcendence that doesn\'t abandon the world, and the profound belonging that comes from knowing you are held by something larger than yourself. The spiral never truly ends—it continues beyond the horizon of individual existence.'
};

const BookIntroDrawer: React.FC<BookIntroDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  onNavigate,
  initialPartIndex = 0
}) => {
  const [currentPartIndex, setCurrentPartIndex] = useState(initialPartIndex);

  // Update current part index when initialPartIndex changes (when drawer opens with a specific part)
  useEffect(() => {
    if (isOpen && initialPartIndex !== undefined) {
      setCurrentPartIndex(initialPartIndex);
    }
  }, [isOpen, initialPartIndex]);

  const currentPart = partOrder[currentPartIndex];
  const currentPartDescription = extendedPartDescriptions[currentPart] || partDescriptions[currentPart] || '';

  // Get chapters for current part
  const currentPartChapters = chapters.filter(
    ch => ch.part === currentPart
  );

  // Find first chapter of current part or first unread chapter
  const getTargetChapter = (): number => {
    if (currentPartChapters.length === 0) return 0;

    // Find first unread chapter in this part
    const unreadChapter = currentPartChapters.find(
      ch => !readingProgressService.isRead(ch.id)
    );

    if (unreadChapter) {
      const progress = readingProgressService.getProgress(unreadChapter.id);
      // If chapter has been started (has progress), return its index
      if (progress && progress.lastPosition > 0 && progress.lastPosition < 100) {
        return chapters.findIndex(ch => ch.id === unreadChapter.id);
      }
      // Otherwise return first unread chapter
      return chapters.findIndex(ch => ch.id === unreadChapter.id);
    }

    // If all chapters are read, return first chapter of part
    return chapters.findIndex(ch => ch.id === currentPartChapters[0].id);
  };

  const handleStartReading = () => {
    const targetIndex = getTargetChapter();
    onNavigate(targetIndex);
    onClose();
  };

  const handlePreviousPart = () => {
    setCurrentPartIndex(prev => (prev === 0 ? partOrder.length - 1 : prev - 1));
  };

  const handleNextPart = () => {
    setCurrentPartIndex(prev => (prev === partOrder.length - 1 ? 0 : prev + 1));
  };

  // Determine button text based on reading progress
  const getButtonText = (): string => {
    if (currentPartChapters.length === 0) return 'Start Reading';

    const unreadChapter = currentPartChapters.find(
      ch => !readingProgressService.isRead(ch.id)
    );

    if (!unreadChapter) {
      // All chapters read
      return 'Start Reading';
    }

    const progress = readingProgressService.getProgress(unreadChapter.id);
    if (progress && progress.lastPosition > 0 && progress.lastPosition < 100) {
      return 'Continue Reading';
    }

    // Check if any chapter in this part has been started
    const hasStartedChapter = currentPartChapters.some(ch => {
      const chProgress = readingProgressService.getProgress(ch.id);
      return chProgress && chProgress.lastPosition > 0;
    });

    return hasStartedChapter ? 'Continue Reading' : 'Start Reading';
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 drawer-backdrop z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 rounded-t-3xl z-[100] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-ink-muted/20 dark:border-paper-light/20">
                <h2 className="text-xl font-heading text-ink-primary dark:text-paper-light">
                  {currentPart}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 transition-colors"
                >
                  <X className="w-5 h-5 text-ink-primary dark:text-paper-light" />
                </button>
              </div>

              {/* Description Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-8">
                <p className="text-base lg:text-lg text-ink-secondary dark:text-ink-muted leading-relaxed">
                  {currentPartDescription}
                </p>
              </div>

              {/* Navigation and Action Buttons */}
              <div className="p-6 border-t border-ink-muted/20 dark:border-paper-light/20">
                <div className="flex items-center justify-center gap-4">
                  {/* Previous Part Button */}
                  <button
                    onClick={handlePreviousPart}
                    className="p-2 rounded-full hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 transition-colors"
                    aria-label="Previous part"
                  >
                    <ChevronLeft className="w-6 h-6 text-ink-primary dark:text-paper-light" />
                  </button>

                  {/* Start/Continue Reading Button */}
                  <button
                    onClick={handleStartReading}
                    className="px-6 py-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg"
                  >
                    {getButtonText()}
                  </button>

                  {/* Next Part Button */}
                  <button
                    onClick={handleNextPart}
                    className="p-2 rounded-full hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 transition-colors"
                    aria-label="Next part"
                  >
                    <ChevronRight className="w-6 h-6 text-ink-primary dark:text-paper-light" />
                  </button>
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

export default BookIntroDrawer;

