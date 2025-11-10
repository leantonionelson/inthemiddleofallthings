import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
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

// Extended descriptions for the drawer (structured with title and prose content)
interface PartDescription {
  title: string;
  content: string;
}

const extendedPartDescriptions: Record<string, PartDescription> = {
  'Introduction': {
    title: 'Prelude – When Stillness Begins to Move',
    content: `You are not searching for answers.
You're circling the right questions.
You've started noticing that silence has a texture –
that awareness itself feels like motion.
You don't want escape, only clarity enough to stay.
This is where you begin: not by doing, but by noticing what already stirs.`
  },
  'Part I: The Axis of Becoming': {
    title: 'Part I – The Weight of Becoming',
    content: `You are somewhere between what was and what wants to be.
Change is no longer a choice – it's happening through you.
Discipline is whispering your name,
and you're beginning to see that resistance is not the enemy but the edge of growth.
You are learning to let friction polish rather than punish.
You are being shaped by your own becoming.`
  },
  'Part II: The Spiral Path': {
    title: 'Part II – The Shape of Return',
    content: `You've realised that progress sometimes looks like circling back.
You no longer chase transformation; you trace its rhythm.
You're beginning to see patterns not as prisons but as teachers.
You are softer with yourself, but sharper in awareness.
Your pace slows; your depth widens.
Here, you begin to trust what repeats.`
  },
  'Part III: The Living Axis': {
    title: 'Part III – The Practice of Presence',
    content: `You want to live inside your body again – not as a cage, but as a compass.
You're noticing how breath anchors thought,
how stillness can hold a storm.
You don't seek balance as symmetry,
but as responsiveness – a poised readiness for change.
Here, you learn to meet life where it happens: in motion, in matter, in now.`
  },
  'Part IV: The Horizon Beyond': {
    title: 'Part IV – The Edge That Opens',
    content: `You feel the horizon drawing near –
not as distance, but as invitation.
You're ready to live with open hands.
Mortality no longer frightens you; it clarifies you.
Meaning doesn't need to be found – it unfolds when you stop chasing.
You are no longer seeking the centre. You are living from it.`
  }
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
  const currentPartDescription = extendedPartDescriptions[currentPart];

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

  // Drag functionality - same as WelcomeDrawer
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 200], [1, 0]);
  const DRAG_THRESHOLD = 100; // pixels to drag before closing

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged down more than threshold, close drawer
    if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
      onClose();
    } else {
      // Snap back to original position
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
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              type: 'tween',
              ease: 'easeOut',
              duration: 0.25
            }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
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
              {/* Left spacer for centering drag handle */}
              <div className="w-10"></div>
              
              {/* Drag Handle - visual indicator */}
              <div className="flex justify-center flex-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              
              {/* Close Button */}
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
                // Prevent drag when scrolling content
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
                      {currentPartDescription?.title || currentPart}
                    </h2>
                  </div>
                </div>

                {/* Description Content */}
                <div className="mb-6">
                  {currentPartDescription ? (
                    <div className="space-y-4">
                      <div className="text-base text-ink-secondary dark:text-ink-muted leading-relaxed whitespace-pre-line">
                        {renderTextWithItalics(currentPartDescription.content)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-base text-ink-secondary dark:text-ink-muted leading-relaxed">
                      {partDescriptions[currentPart] || ''}
                    </p>
                  )}
                </div>

                {/* Navigation and Action Buttons */}
                <div className="pt-6 border-t border-ink-muted/20 dark:border-paper-light/20">
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

