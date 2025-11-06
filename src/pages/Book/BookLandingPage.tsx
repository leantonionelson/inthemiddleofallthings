import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, BookChapter, Meditation, Story } from '../../types';
import { loadBookChapters, fallbackChapters, partDescriptions } from '../../data/bookContent';
import { readingProgressService } from '../../services/readingProgressService';
import CleanLayout from '../../components/CleanLayout';
import ContentCarousel from '../../components/ContentCarousel';
import { BookOpen } from 'lucide-react';

interface BookLandingPageProps {
  onOpenAI: () => void;
}

const BookLandingPage: React.FC<BookLandingPageProps> = ({ onOpenAI }) => {
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const navigate = useNavigate();

  // Listen for storage changes to update completion percentage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'readingProgress') {
        setProgressUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const checkProgress = () => {
      setProgressUpdateTrigger(prev => prev + 1);
    };
    
    document.addEventListener('visibilitychange', checkProgress);
    checkProgress();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', checkProgress);
    };
  }, []);

  useEffect(() => {
    const loadChapters = async () => {
      try {
        setIsLoading(true);
        const loadedChapters = await loadBookChapters();
        setChapters(loadedChapters);
      } catch (error) {
        console.error('Error loading chapters:', error);
        setChapters(fallbackChapters);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapters();
  }, []);

  const completion = useMemo(() => {
    if (chapters.length === 0) return 0;
    const readCount = chapters.filter(ch => readingProgressService.isRead(ch.id)).length;
    return Math.round((readCount / chapters.length) * 100);
  }, [chapters, progressUpdateTrigger]);

  // Group chapters by part
  const chaptersByPart = useMemo(() => {
    const grouped: Record<string, BookChapter[]> = {};
    chapters.forEach(chapter => {
      const part = chapter.part || 'Introduction';
      if (!grouped[part]) {
        grouped[part] = [];
      }
      grouped[part].push(chapter);
    });
    return grouped;
  }, [chapters]);

  // Get ordered list of parts
  const partOrder = useMemo(() => {
    const order = ['Introduction', 'Part I: The Axis of Becoming', 'Part II: The Spiral Path', 'Part III: The Living Axis', 'Part IV: The Horizon Beyond'];
    return order.filter(part => chaptersByPart[part] && chaptersByPart[part].length > 0);
  }, [chaptersByPart]);

  const handleChapterClick = (item: BookChapter | Meditation | Story, _index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // Type guard: ensure this is a BookChapter
    if (!('chapterNumber' in item)) {
      return; // Not a chapter, ignore
    }
    const chapter = item as BookChapter;
    // Save the chapter index to localStorage for ReaderPage to use
    const actualIndex = chapters.findIndex(c => c.id === chapter.id);
    localStorage.setItem('currentChapterIndex', actualIndex.toString());
    navigate(AppRoute.READER);
  };

  if (isLoading) {
    return (
      <CleanLayout
        currentPage="book"
        onRead={() => navigate(AppRoute.READER)}
        isReading={false}
        onOpenAI={onOpenAI}
      >
        <div className="min-h-screen bg-paper-light dark:bg-paper-dark paper-texture flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
            <p className="text-ink-secondary dark:text-ink-muted">Loading book content...</p>
          </div>
        </div>
      </CleanLayout>
    );
  }

  return (
    <CleanLayout
      currentPage="book"
      onRead={() => navigate(AppRoute.READER)}
      isReading={false}
      onOpenAI={onOpenAI}
    >
      <div className="flex-1 flex flex-col p-6 lg:p-10 pt-6 pb-24 max-w-7xl mx-auto w-full">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 mt-4 text-left"
        >
          <div className="mb-4">
            <BookOpen className="w-8 h-8 text-ink-primary dark:text-paper-light mb-3" />
            <h1 className="text-3xl lg:text-4xl font-serif text-ink-primary dark:text-paper-light">
              In the Middle of All Things
            </h1>
          </div>
          <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
            A philosophical exploration of existence, consciousness, and the nature of being. 
            Journey through four parts that examine the axis of becoming, the spiral path, 
            the living axis, and the horizon beyond.
          </p>
        </motion.div>

        {/* Completion Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <div className="flex-1 bg-ink-muted/20 dark:bg-paper-light/20 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-sm text-ink-secondary dark:text-ink-muted whitespace-nowrap">
              {completion}% Complete
            </span>
          </div>
        </motion.div>

        {/* Chapters by Section */}
        <div className="space-y-12 mt-8">
          {partOrder.map((part, partIndex) => {
            const partChapters = chaptersByPart[part];
            const description = partDescriptions[part] || '';
            
            return (
              <motion.div
                key={part}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + partIndex * 0.1 }}
                className="w-full"
              >
                {/* Section Header */}
                <div className="mb-4 text-left">
                  <h2 className="text-xl lg:text-2xl font-serif text-ink-primary dark:text-paper-light mb-2">
                    {part}
                  </h2>
                  {description && (
                    <p className="text-sm lg:text-base text-ink-secondary dark:text-ink-muted italic max-w-3xl leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>

                {/* Chapters Carousel for this Section */}
                <ContentCarousel
                  items={partChapters}
                  contentType="chapter"
                  onItemClick={handleChapterClick}
                  showReadStatus={true}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </CleanLayout>
  );
};

export default BookLandingPage;

