import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, Meditation } from '../../types';
import { loadMeditations, fallbackMeditations, searchMeditations } from '../../data/meditationContent';
import { readingProgressService } from '../../services/readingProgressService';
import { contentCache } from '../../services/contentCache';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import SynchronizedCarousel from '../../components/SynchronizedCarousel';
import SearchBar from '../../components/SearchBar';
import SearchOverlay from '../../components/SearchOverlay';
import ContentListItem from '../../components/ContentListItem';
import { Heart, Leaf, Star, Moon, Sun, Waves, Mountain, Compass, Flower2, Scale } from 'lucide-react';

interface MeditationsLandingPageProps {
  externalSearchQuery?: string;
  externalSearchFocused?: boolean;
  onExternalSearchClear?: () => void;
  hideSearchBar?: boolean;
}

const MeditationsLandingPage: React.FC<MeditationsLandingPageProps> = ({
  externalSearchQuery,
  externalSearchFocused,
  onExternalSearchClear,
  hideSearchBar = false
}) => {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [filteredMeditations, setFilteredMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
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
    const loadMeditationList = async () => {
      try {
        // Check if already cached - if so, skip loading state
        const isCached = contentCache.hasMeditations();
        if (!isCached) {
          setIsLoading(true);
        }
        
        const loadedMeditations = await contentCache.getMeditations(loadMeditations);
        setMeditations(loadedMeditations);
        setFilteredMeditations(loadedMeditations);
      } catch (error) {
        console.error('Error loading meditations:', error);
        setMeditations(fallbackMeditations);
        setFilteredMeditations(fallbackMeditations);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeditationList();
  }, []);

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
    let filtered = searchMeditations(meditations, debouncedSearchQuery);
    
    // Apply tag filtering if tags are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(meditation => 
        selectedTags.every(tag => meditation.tags.includes(tag))
      );
    }
    
    setFilteredMeditations(filtered);
    // Reset visible count when filters change
    setVisibleCount(20);
  }, [debouncedSearchQuery, meditations, selectedTags]);

  const completion = useMemo(() => {
    if (meditations.length === 0) return 0;
    const readCount = meditations.filter(m => readingProgressService.isRead(m.id)).length;
    return Math.round((readCount / meditations.length) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meditations, progressUpdateTrigger]);

  // Get all unique tags from meditations
  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    meditations.forEach(meditation => {
      meditation.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [meditations]);

  // Get meditation icon based on tags or fallback to index-based icon
  const getMeditationIcon = useCallback((meditation: Meditation, index: number) => {
    const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
      'breathing': Waves,
      'mindfulness': Leaf,
      'compassion': Heart,
      'love': Heart,
      'kindness': Heart,
      'morning': Sun,
      'evening': Moon,
      'night': Moon,
      'sleep': Moon,
      'nature': Mountain,
      'peace': Flower2,
      'calm': Waves,
      'guidance': Compass,
      'intention': Star,
      'focus': Star,
      'awareness': Compass,
    };

    // Try to find icon based on tags
    for (const tag of meditation.tags) {
      const lowerTag = tag.toLowerCase();
      if (iconMap[lowerTag]) {
        return iconMap[lowerTag];
      }
    }

    // Fallback to index-based icon cycling
    const fallbackIcons = [Heart, Leaf, Star, Moon, Sun, Waves, Mountain, Compass, Flower2];
    return fallbackIcons[index % fallbackIcons.length];
  }, []);

  // Memoize meditation index map for O(1) lookup
  const meditationIndexMap = useMemo(() => {
    return new Map(meditations.map((m, idx) => [m.id, idx]));
  }, [meditations]);

  const handleMeditationClick = useCallback((meditation: Meditation) => {
    // Use O(1) map lookup instead of O(n) findIndex
    const actualIndex = meditationIndexMap.get(meditation.id);
    if (actualIndex !== undefined) {
      localStorage.setItem('currentMeditationId', meditation.id);
      localStorage.setItem('currentMeditationIndex', actualIndex.toString());
      navigate(AppRoute.MEDITATIONS);
    }
  }, [meditationIndexMap, navigate]);

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

  const handleViewMore = useCallback(() => {
    setVisibleCount(prev => prev + 20);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted">Loading meditations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar - Only show if not hidden */}
      {!hideSearchBar && (
        <SearchBar
          placeholder="Search meditations..."
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
        items={filteredMeditations}
        renderItem={(meditation, index) => {
          const IconComponent = getMeditationIcon(meditation, index);
          const isRead = readingProgressService.isRead(meditation.id);
          
          return (
            <ContentListItem
              key={meditation.id}
              id={meditation.id}
              title={meditation.title}
              tags={meditation.tags}
              icon={<IconComponent className="w-6 h-6" />}
              isActive={false}
              isRead={isRead}
              onClick={() => handleMeditationClick(meditation)}
              selectedTags={selectedTags}
            />
          );
        }}
        visibleCount={visibleCount}
        totalCount={filteredMeditations.length}
        onViewMore={handleViewMore}
        emptyStateTitle="No meditations found"
        emptyStateMessage="Try adjusting your search terms"
      />


      <div 
        className="flex-1 flex flex-col p-6 pb-10 pt-0 max-w-7xl mx-auto w-full" 
        style={{ 
          paddingTop: hideSearchBar ? '0rem' : '1rem',
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
            <Scale className="w-8 h-8 text-ink-primary dark:text-paper-light flex-shrink-0" />
            <h1 className="text-3xl font-serif text-ink-primary dark:text-paper-light">
              Meditations
            </h1>
          </div>
          <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
            Guided reflections and contemplative practices designed to deepen awareness, 
            cultivate mindfulness, and explore the inner landscape of consciousness. 
            Each meditation offers a unique perspective on presence, compassion, and understanding.
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

        {/* Meditations Carousel - 3 Rows Synchronized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <SynchronizedCarousel
            items={meditations}
            onItemClick={handleMeditationClick}
            showReadStatus={true}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </>
  );
};

export default React.memo(MeditationsLandingPage);

