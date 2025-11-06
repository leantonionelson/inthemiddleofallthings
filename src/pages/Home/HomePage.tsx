import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, BookChapter, Meditation, Story } from '../../types';
import { loadBookChapters, fallbackChapters } from '../../data/bookContent';
import { loadMeditations } from '../../data/meditationContent';
import { loadStories } from '../../data/storiesContent';
import { readingProgressService } from '../../services/readingProgressService';
import CleanLayout from '../../components/CleanLayout';
import StandardHeader from '../../components/StandardHeader';
import ContentCarousel from '../../components/ContentCarousel';
import { BookOpen, Scale, Scroll, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onOpenAI: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onOpenAI }) => {
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isLoadingMeditations, setIsLoadingMeditations] = useState(true);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [chaptersVisibleCount, setChaptersVisibleCount] = useState(6);
  const [meditationsVisibleCount, setMeditationsVisibleCount] = useState(6);
  const [storiesVisibleCount, setStoriesVisibleCount] = useState(6);
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const [bookCompletion, setBookCompletion] = useState(0);
  const [meditationsCompletion, setMeditationsCompletion] = useState(0);
  const [storiesCompletion, setStoriesCompletion] = useState(0);

  const navigate = useNavigate();

  // Listen for progress updates to refresh completion percentages
  useEffect(() => {
    const handleProgressUpdate = () => {
      setProgressUpdateTrigger(prev => prev + 1);
    };

    // Listen for custom progress update event (same tab)
    window.addEventListener('readingProgressUpdated', handleProgressUpdate);
    
    // Listen for storage events (other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'readingProgress') {
        setProgressUpdateTrigger(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Check progress when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setProgressUpdateTrigger(prev => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check
    handleProgressUpdate();

    return () => {
      window.removeEventListener('readingProgressUpdated', handleProgressUpdate);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load chapters progressively
  useEffect(() => {
    const loadChapters = async () => {
      try {
        setIsLoadingChapters(true);
        const loadedChapters = await loadBookChapters();
        setChapters(loadedChapters);
        setIsLoadingChapters(false);
      } catch {
        console.error('Error loading chapters');
        setChapters(fallbackChapters);
        setIsLoadingChapters(false);
      }
    };
    loadChapters();
  }, []);

  // Load meditations progressively
  useEffect(() => {
    const loadMeditationsContent = async () => {
      try {
        setIsLoadingMeditations(true);
        const loadedMeditations = await loadMeditations();
        setMeditations(loadedMeditations);
        setIsLoadingMeditations(false);
      } catch (error) {
        console.error('Error loading meditations:', error);
        setIsLoadingMeditations(false);
      }
    };
    loadMeditationsContent();
  }, []);

  // Load stories progressively
  useEffect(() => {
    const loadStoriesContent = async () => {
      try {
        setIsLoadingStories(true);
        const loadedStories = await loadStories();
        setStories(loadedStories);
        setIsLoadingStories(false);
      } catch (error) {
        console.error('Error loading stories:', error);
        setIsLoadingStories(false);
      }
    };
    loadStoriesContent();
  }, []);

  // Update main loading state
  useEffect(() => {
    setIsLoading(isLoadingChapters || isLoadingMeditations || isLoadingStories);
  }, [isLoadingChapters, isLoadingMeditations, isLoadingStories]);

  // Calculate completion percentages for each section when content or progress changes
  useEffect(() => {
    if (chapters.length === 0) {
      setBookCompletion(0);
    } else {
      const readCount = chapters.filter(ch => {
        const isRead = readingProgressService.isRead(ch.id);
        // Debug logging
        if (isRead) {
          console.log(`[HomePage] Chapter marked as read: ${ch.id} - ${ch.title}`);
        }
        return isRead;
      }).length;
      const percentage = Math.round((readCount / chapters.length) * 100);
      console.log(`[HomePage] Book completion: ${readCount}/${chapters.length} = ${percentage}%`);
      setBookCompletion(percentage);
    }
  }, [chapters, progressUpdateTrigger]);

  useEffect(() => {
    if (meditations.length === 0) {
      setMeditationsCompletion(0);
    } else {
      const readCount = meditations.filter(m => {
        const isRead = readingProgressService.isRead(m.id);
        // Debug logging
        if (isRead) {
          console.log(`[HomePage] Meditation marked as read: ${m.id} - ${m.title}`);
        }
        return isRead;
      }).length;
      const percentage = Math.round((readCount / meditations.length) * 100);
      console.log(`[HomePage] Meditations completion: ${readCount}/${meditations.length} = ${percentage}%`);
      setMeditationsCompletion(percentage);
    }
  }, [meditations, progressUpdateTrigger]);

  useEffect(() => {
    if (stories.length === 0) {
      setStoriesCompletion(0);
    } else {
      const readCount = stories.filter(s => {
        const isRead = readingProgressService.isRead(s.id);
        // Debug logging
        if (isRead) {
          console.log(`[HomePage] Story marked as read: ${s.id} - ${s.title}`);
        }
        return isRead;
      }).length;
      const percentage = Math.round((readCount / stories.length) * 100);
      console.log(`[HomePage] Stories completion: ${readCount}/${stories.length} = ${percentage}%`);
      setStoriesCompletion(percentage);
    }
  }, [stories, progressUpdateTrigger]);

  // Handle loading more chapters
  const handleLoadMoreChapters = () => {
    if (chaptersVisibleCount < chapters.length) {
      setChaptersVisibleCount(prev => Math.min(prev + 6, chapters.length));
    }
  };

  // Handle loading more meditations
  const handleLoadMoreMeditations = () => {
    if (meditationsVisibleCount < meditations.length) {
      setMeditationsVisibleCount(prev => Math.min(prev + 6, meditations.length));
    }
  };

  // Handle loading more stories
  const handleLoadMoreStories = () => {
    if (storiesVisibleCount < stories.length) {
      setStoriesVisibleCount(prev => Math.min(prev + 6, stories.length));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChapterClick = (item: BookChapter | Meditation | Story, _index: number) => {
    const chapter = item as BookChapter;
    const actualIndex = chapters.findIndex(c => c.id === chapter.id);
    localStorage.setItem('currentChapterIndex', actualIndex.toString());
    navigate(AppRoute.READER);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMeditationClick = (item: BookChapter | Meditation | Story, _index: number) => {
    const meditation = item as Meditation;
    const actualIndex = meditations.findIndex(m => m.id === meditation.id);
    localStorage.setItem('currentMeditationId', meditation.id);
    localStorage.setItem('currentMeditationIndex', actualIndex.toString());
    navigate(AppRoute.MEDITATIONS);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStoryClick = (item: BookChapter | Meditation | Story, _index: number) => {
    const story = item as Story;
    const actualIndex = stories.findIndex(s => s.id === story.id);
    localStorage.setItem('currentStoryIndex', actualIndex.toString());
    navigate(AppRoute.STORIES);
  };

  if (isLoading) {
    return (
      <CleanLayout
        currentPage="home"
        onRead={() => navigate(AppRoute.READER)}
        isReading={false}
        onOpenAI={onOpenAI}
      >
        <div className="min-h-screen bg-paper-light dark:bg-paper-dark paper-texture flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
            <p className="text-ink-secondary dark:text-ink-muted">Loading content...</p>
          </div>
        </div>
      </CleanLayout>
    );
  }

  return (
    <CleanLayout
      currentPage="home"
      onRead={() => navigate(AppRoute.READER)}
      isReading={false}
      onOpenAI={onOpenAI}
    >
      <StandardHeader
        title="In the Middle of All Things"
        showSettingsButton={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 pt-12 pb-24 max-w-6xl mx-auto w-full">
        {/* Book Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-ink-primary dark:text-paper-light" />
              <h2 className="text-2xl lg:text-3xl font-serif text-ink-primary dark:text-paper-light">
                The Book
              </h2>
            </div>
            <button
              onClick={() => navigate('/book')}
              className="flex items-center gap-2 text-sm text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-ink-muted/20 dark:bg-paper-light/20 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${bookCompletion}%` }}
              />
            </div>
            <span className="text-sm text-ink-secondary dark:text-ink-muted whitespace-nowrap">
              {bookCompletion}%
            </span>
          </div>
          <ContentCarousel
            items={chapters}
            contentType="chapter"
            onItemClick={handleChapterClick}
            showReadStatus={true}
            isLoading={isLoadingChapters}
            hasMore={chaptersVisibleCount < chapters.length}
            onLoadMore={handleLoadMoreChapters}
            visibleCount={chaptersVisibleCount}
          />
        </motion.div>

        {/* Meditations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-ink-primary dark:text-paper-light" />
              <h2 className="text-2xl lg:text-3xl font-serif text-ink-primary dark:text-paper-light">
                Meditations
              </h2>
            </div>
            <button
              onClick={() => navigate('/meditations-landing')}
              className="flex items-center gap-2 text-sm text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-ink-muted/20 dark:bg-paper-light/20 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${meditationsCompletion}%` }}
              />
            </div>
            <span className="text-sm text-ink-secondary dark:text-ink-muted whitespace-nowrap">
              {meditationsCompletion}%
            </span>
          </div>
          <ContentCarousel
            items={meditations}
            contentType="meditation"
            onItemClick={handleMeditationClick}
            showReadStatus={true}
            isLoading={isLoadingMeditations}
            hasMore={meditationsVisibleCount < meditations.length}
            onLoadMore={handleLoadMoreMeditations}
            visibleCount={meditationsVisibleCount}
          />
        </motion.div>

        {/* Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Scroll className="w-6 h-6 text-ink-primary dark:text-paper-light" />
              <h2 className="text-2xl lg:text-3xl font-serif text-ink-primary dark:text-paper-light">
                Stories
              </h2>
            </div>
            <button
              onClick={() => navigate('/stories-landing')}
              className="flex items-center gap-2 text-sm text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-ink-muted/20 dark:bg-paper-light/20 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${storiesCompletion}%` }}
              />
            </div>
            <span className="text-sm text-ink-secondary dark:text-ink-muted whitespace-nowrap">
              {storiesCompletion}%
            </span>
          </div>
          <ContentCarousel
            items={stories}
            contentType="story"
            onItemClick={handleStoryClick}
            showReadStatus={true}
            isLoading={isLoadingStories}
            hasMore={storiesVisibleCount < stories.length}
            onLoadMore={handleLoadMoreStories}
            visibleCount={storiesVisibleCount}
          />
        </motion.div>
      </div>
    </CleanLayout>
  );
};

export default HomePage;
