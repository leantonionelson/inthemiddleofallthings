import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, BookChapter, Meditation, Story } from '../../types';
import { loadBookChapters, fallbackChapters, partDescriptions } from '../../data/bookContent';
import { readingProgressService } from '../../services/readingProgressService';
import { contentCache } from '../../services/contentCache';
import ContentCarousel from '../../components/ContentCarousel';
import BookIntroDrawer from '../../components/BookIntroDrawer';
import { BookOpen, Info } from 'lucide-react';
import SEO from '../../components/SEO';
import { generateBookStructuredData, generateBreadcrumbStructuredData } from '../../utils/seoHelpers';

// Full part order (for index lookup)
const FULL_PART_ORDER = ['Introduction', 'Part I: The Axis of Becoming', 'Part II: The Spiral Path', 'Part III: The Living Axis', 'Part IV: The Horizon Beyond'];

const BookLandingPage: React.FC = () => {
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
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
        // Check if already cached - if so, skip loading state
        const isCached = contentCache.hasChapters();
        if (!isCached) {
          setIsLoading(true);
        }
        
        const loadedChapters = await contentCache.getChapters(loadBookChapters);
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
    return FULL_PART_ORDER.filter(part => chaptersByPart[part] && chaptersByPart[part].length > 0);
  }, [chaptersByPart]);

  const handleChapterClick = (item: BookChapter | Meditation | Story, _index: number) => {
    void _index; // Index provided by ContentCarousel but not used here
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

  const handleNavigateToChapter = (chapterIndex: number) => {
    localStorage.setItem('currentChapterIndex', chapterIndex.toString());
    navigate(AppRoute.READER);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted">Loading book content...</p>
        </div>
      </div>
    );
  }

  const bookDescription = 'A philosophical exploration of existence, consciousness, and the nature of being. Journey through four parts that examine the axis of becoming, the spiral path, the living axis, and the horizon beyond.';

  return (
    <>
      <SEO
        title="Book: In the Middle of All Things"
        description={bookDescription}
        keywords="philosophical book, consciousness, existence, being, axis of becoming, spiral path, living axis, horizon beyond, philosophy, contemplative reading"
        type="book"
        structuredData={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBookStructuredData(
              'In the Middle of All Things',
              bookDescription,
              'In the Middle of All Things',
              undefined,
              undefined,
              undefined,
              chapters.length
            ),
            generateBreadcrumbStructuredData([
              { name: 'Home', url: 'https://inthemiddleofallthings.com/' },
              { name: 'Book', url: 'https://inthemiddleofallthings.com/book' },
            ]),
          ],
        }}
      />
      <main 
        className="flex-1 flex flex-col p-6 pt-6 pb-10 max-w-7xl mx-auto w-full"
        style={{
          height: 'calc(100vh - 84px)',
          overflow: 'scroll'
        }}
      >
        {/* Description */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 mt-4 text-left"
        >
          <div className="mb-4">
            <BookOpen className="w-8 h-8 text-ink-primary dark:text-paper-light mb-3" />
            <h1 className="text-3xl font-serif text-ink-primary dark:text-paper-light">
              In the Middle of All Things
            </h1>
          </div>
          <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
            {bookDescription}
          </p>
        </motion.header>

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
        <section className="space-y-12 mt-8">
          {partOrder.map((part, partIndex) => {
            const partChapters = chaptersByPart[part];
            const description = partDescriptions[part] || '';
            
            return (
              <motion.section
                key={part}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + partIndex * 0.1 }}
                className="w-full"
              >
                {/* Section Header */}
                <header className="mb-4 text-left">
                  <h2 className="text-xl font-serif text-ink-primary dark:text-paper-light mb-2">
                    {part}
                  </h2>
                  {description && (
                    <div className="flex items-start gap-3">
                      <p className="text-sm text-ink-secondary dark:text-ink-muted italic max-w-3xl leading-relaxed flex-1">
                        {description}
                      </p>
                      {/* Info Button for Part Description */}
                      <button
                        onClick={() => {
                          const partIndex = FULL_PART_ORDER.indexOf(part);
                          setSelectedPartIndex(partIndex);
                          setIsDrawerOpen(true);
                        }}
                        className="p-2 rounded-full bg-ink-muted/10 dark:bg-paper-light/10 border border-ink-muted/20 dark:border-paper-light/20 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors flex-shrink-0"
                        aria-label={`View ${part} description`}
                      >
                        <Info className="w-5 h-5 text-ink-primary dark:text-paper-light" />
                      </button>
                    </div>
                  )}
                </header>

                {/* Chapters Carousel for this Section */}
                <ContentCarousel
                  items={partChapters}
                  contentType="chapter"
                  onItemClick={handleChapterClick}
                  showReadStatus={true}
                />
              </motion.section>
            );
          })}
        </section>
      </main>

      {/* Book Intro Drawer */}
      <BookIntroDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        chapters={chapters}
        onNavigate={handleNavigateToChapter}
        initialPartIndex={selectedPartIndex}
      />
    </>
  );
};

export default BookLandingPage;

