import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, Story, BookChapter, Meditation } from '../../types';
import { loadStories, fallbackStories, searchStories } from '../../data/storiesContent';
import { readingProgressService } from '../../services/readingProgressService';
import { contentCache } from '../../services/contentCache';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import ContentCarousel from '../../components/ContentCarousel';
import SearchBar from '../../components/SearchBar';
import SearchOverlay from '../../components/SearchOverlay';
import ContentListItem from '../../components/ContentListItem';
import { BookOpen, Scroll, Feather, Eye, Brain, Globe, Clock, Sparkles, Zap } from 'lucide-react';

interface StoriesLandingPageProps {
  externalSearchQuery?: string;
  externalSearchFocused?: boolean;
  onExternalSearchClear?: () => void;
  hideSearchBar?: boolean;
}

const StoriesLandingPage: React.FC<StoriesLandingPageProps> = ({
  externalSearchQuery,
  externalSearchFocused,
  onExternalSearchClear,
  hideSearchBar = true
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();
  
  // Use external search query if provided, otherwise use internal state
  const effectiveSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;
  
  // Use external search focused state if provided, otherwise use internal state
  const effectiveSearchFocused = externalSearchFocused !== undefined ? externalSearchFocused : isSearchFocused;
  
  // Debounce search query to reduce filtering overhead
  const debouncedSearchQuery = useDebouncedValue(effectiveSearchQuery, 300);

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
    const loadStoryList = async () => {
      try {
        // Check if already cached - if so, skip loading state
        const isCached = contentCache.hasStories();
        if (!isCached) {
          setIsLoading(true);
        }
        
        const loadedStories = await contentCache.getStories(loadStories);
        setStories(loadedStories);
        setFilteredStories(loadedStories);
      } catch (error) {
        console.error('Error loading stories:', error);
        setStories(fallbackStories);
        setFilteredStories(fallbackStories);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoryList();
  }, []);

  // Get all unique tags from stories
  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    stories.forEach(story => {
      story.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [stories]);

  // Handle tag selection
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedTags([]);
    setSearchQuery('');
    // If using external search, also clear it
    if (onExternalSearchClear) {
      onExternalSearchClear();
    }
  }, [onExternalSearchClear]);

  // Handle search and tag filtering (using debounced search query)
  useEffect(() => {
    let filtered = searchStories(stories, debouncedSearchQuery);
    
    // Apply tag filtering if tags are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(story => 
        selectedTags.every(tag => story.tags.includes(tag))
      );
    }
    
    setFilteredStories(filtered);
  }, [debouncedSearchQuery, stories, selectedTags]);

  const completion = useMemo(() => {
    if (stories.length === 0) return 0;
    const readCount = stories.filter(s => readingProgressService.isRead(s.id)).length;
    return Math.round((readCount / stories.length) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories, progressUpdateTrigger]);

  // Get story icon based on tags or fallback to index-based icon
  const getStoryIcon = useCallback((story: Story, index: number) => {
    const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
      'consciousness': Brain,
      'awareness': Eye,
      'existence': Globe,
      'time': Clock,
      'eternity': Sparkles,
      'being': BookOpen,
      'identity': Scroll,
      'writing': Feather,
      'fiction': BookOpen,
      'philosophy': Brain,
      'narrative': Scroll,
      'mystery': Eye,
      'transcendence': Sparkles,
      'imagination': Zap,
    };

    // Try to find icon based on tags
    for (const tag of story.tags) {
      const lowerTag = tag.toLowerCase();
      if (iconMap[lowerTag]) {
        return iconMap[lowerTag];
      }
    }

    // Fallback to index-based icon cycling
    const fallbackIcons = [BookOpen, Scroll, Feather, Eye, Brain, Globe, Clock, Sparkles, Zap];
    return fallbackIcons[index % fallbackIcons.length];
  }, []);

  // Memoize story index map for O(1) lookup
  const storyIndexMap = useMemo(() => {
    return new Map(stories.map((s, idx) => [s.id, idx]));
  }, [stories]);

  const handleStoryClick = useCallback((item: Story | BookChapter | Meditation) => {
    // Type guard: ensure this is a Story
    if ('chapterNumber' in item || !('tags' in item)) {
      return; // Not a story, ignore
    }
    const story = item as Story;
    // Use O(1) map lookup instead of O(n) findIndex
    const actualIndex = storyIndexMap.get(story.id);
    if (actualIndex !== undefined) {
      localStorage.setItem('currentStoryIndex', actualIndex.toString());
      navigate(AppRoute.STORIES);
    }
  }, [storyIndexMap, navigate]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setIsSearchFocused(false);
    setSelectedTags([]);
    // If using external search, also clear it
    if (onExternalSearchClear) {
      onExternalSearchClear();
    }
  }, [onExternalSearchClear]);

  const handleSearchBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.relatedTarget || !e.relatedTarget.closest('[data-search-overlay]')) {
      setIsSearchFocused(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar - Only show if not hidden */}
      {!hideSearchBar && (
        <SearchBar
          placeholder="Search stories..."
          value={searchQuery}
          onChange={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={handleSearchBlur}
          showClearButton={isSearchFocused || !!searchQuery.trim()}
          onClear={handleSearchClear}
          isOpen={isSearchFocused || !!searchQuery.trim()}
        />
      )}

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={effectiveSearchFocused || !!effectiveSearchQuery.trim()}
        onClose={handleSearchClear}
        searchQuery={effectiveSearchQuery}
        selectedTags={selectedTags}
        allTags={getAllTags()}
        onTagToggle={toggleTag}
        onClearFilters={clearAllFilters}
        items={filteredStories}
        renderItem={(story, index) => {
          const IconComponent = getStoryIcon(story, index);
          const isRead = readingProgressService.isRead(story.id);
          
          return (
            <ContentListItem
              key={story.id}
              id={story.id}
              title={story.title}
              tags={story.tags}
              icon={<IconComponent className="w-6 h-6" />}
              isActive={false}
              isRead={isRead}
              onClick={() => {
                const actualIndex = stories.findIndex(s => s.id === story.id);
                localStorage.setItem('currentStoryIndex', actualIndex.toString());
                navigate(AppRoute.STORIES);
              }}
              selectedTags={selectedTags}
            />
          );
        }}
        visibleCount={filteredStories.length}
        totalCount={filteredStories.length}
        onViewMore={() => {}}
        emptyStateTitle="No stories found"
        emptyStateMessage="Try adjusting your search terms"
      />


      <div 
        className="flex-1 flex flex-col p-6 pb-10 pt-0 max-w-7xl mx-auto w-full" 
        style={{ 
          paddingTop: '1rem',
        }}
      >
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 mt-4 text-left"
        >
          <div className="mb-4 flex items-center gap-3">
            <Scroll className="w-8 h-8 text-ink-primary dark:text-paper-light flex-shrink-0" />
            <h1 className="text-3xl font-serif text-ink-primary dark:text-paper-light">
              Stories
            </h1>
          </div>
          <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
            Narrative explorations of consciousness, existence, and the mysteries of being. 
            These stories weave together philosophy, imagination, and insight to illuminate 
            the deeper questions of what it means to exist and to know.
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

        {/* Stories Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <ContentCarousel
            items={stories}
            contentType="story"
            onItemClick={handleStoryClick}
            showReadStatus={true}
          />
        </motion.div>
      </div>
    </>
  );
};

export default React.memo(StoriesLandingPage);

