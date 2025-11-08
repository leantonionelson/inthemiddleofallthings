import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Story } from '../../types';
import { loadStories, searchStories, fallbackStories } from '../../data/storiesContent';
import { useScrollTracking } from '../../hooks/useScrollTracking';
import { readingProgressService } from '../../services/readingProgressService';
import { BookOpen, Scroll, Feather, Eye, Brain, Globe, Clock, Sparkles, Zap } from 'lucide-react';

import SearchBar from '../../components/SearchBar';
import SearchOverlay from '../../components/SearchOverlay';
import ContentListItem from '../../components/ContentListItem';
import ContentReaderLayout from '../../components/ContentReaderLayout';
import PageLoadingSpinner from '../../components/PageLoadingSpinner';

const StoriesPage: React.FC = () => {
  const outletContext = useOutletContext<{ isAudioPlaying?: boolean; setIsAudioPlaying?: (value: boolean) => void; mainScrollRef?: React.RefObject<HTMLElement> }>();
  const mainScrollRef = outletContext?.mainScrollRef;
  const setIsAudioPlaying = outletContext?.setIsAudioPlaying;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [fontSize] = useState('base');


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
  }, []);

  // Calculate initial visible count based on viewport height
  const calculateInitialVisibleCount = useCallback(() => {
    const viewportHeight = window.innerHeight;
    const searchBarHeight = 80; // Search bar + padding
    const tagCloudHeight = 120; // Tag cloud area
    const itemHeight = 80; // Approximate height per story item
    const bottomPadding = 200; // Navigation + audio controls
    
    const availableHeight = viewportHeight - searchBarHeight - tagCloudHeight - bottomPadding;
    const maxItems = Math.floor(availableHeight / itemHeight);
    
    // Ensure at least 3 items, max 15 for initial load
    return Math.max(3, Math.min(15, maxItems));
  }, []);

  // Handle "View More" functionality
  const handleViewMore = useCallback(() => {
    const increment = 10; // Load 10 more at a time
    const newCount = Math.min(visibleCount + increment, filteredStories.length);
    setVisibleCount(newCount);
  }, [visibleCount, filteredStories.length]);

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

  // Load stories from MD files
  useEffect(() => {
    const loadStoryList = async () => {
      try {
        const loadedStories = await loadStories();
        setStories(loadedStories);
        setFilteredStories(loadedStories);
        
        const savedStoryIndex = localStorage.getItem('currentStoryIndex');
        if (savedStoryIndex) {
          const index = parseInt(savedStoryIndex, 10);
          if (index >= 0 && index < loadedStories.length) {
            setCurrentStoryIndex(index);
          }
        }
      } catch (error) {
        console.error('Error loading stories:', error);
        setStories(fallbackStories);
        setFilteredStories(fallbackStories);
      }
    };

    loadStoryList();
  }, []);


  // Handle search and tag filtering
  useEffect(() => {
    let filtered = searchStories(stories, searchQuery);
    
    // Apply tag filtering if tags are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(story => 
        selectedTags.every(tag => story.tags.includes(tag))
      );
    }
    
    setFilteredStories(filtered);
    
    // Reset visible count when filters change
    if (initialLoadComplete) {
      const newVisibleCount = searchQuery.trim() || selectedTags.length > 0 
        ? Math.min(calculateInitialVisibleCount(), filtered.length)
        : calculateInitialVisibleCount();
      setVisibleCount(newVisibleCount);
    }
  }, [searchQuery, stories, selectedTags, initialLoadComplete, calculateInitialVisibleCount]);

  // Set initial visible count when stories first load
  useEffect(() => {
    if (stories.length > 0 && !initialLoadComplete) {
      const initialCount = calculateInitialVisibleCount();
      setVisibleCount(Math.min(initialCount, stories.length));
      setInitialLoadComplete(true);
    }
  }, [stories.length, initialLoadComplete, calculateInitialVisibleCount]);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (initialLoadComplete && !searchQuery.trim() && selectedTags.length === 0) {
        const newInitialCount = calculateInitialVisibleCount();
        // Only adjust if we're still at the initial load count
        if (visibleCount <= newInitialCount) {
          setVisibleCount(Math.min(newInitialCount, stories.length));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialLoadComplete, searchQuery, selectedTags, visibleCount, calculateInitialVisibleCount, stories.length]);

  // Save current story index and scroll to top when changing stories
  useEffect(() => {
    localStorage.setItem('currentStoryIndex', currentStoryIndex.toString());
    
    // Scroll to top when story changes
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Also scroll window to top for good measure
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStoryIndex]);

  // Disable body scroll when search is active
  useEffect(() => {
    const isSearchActive = isSearchFocused || searchQuery.trim();
    
    if (isSearchActive) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = parseInt(document.body.style.top || '0', 10);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, Math.abs(scrollY));
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isSearchFocused, searchQuery]);

  const currentStory = stories[currentStoryIndex];

  // Track reading progress for current story
  useScrollTracking({
    contentId: currentStory?.id || '',
    contentType: 'story',
    contentRef: contentRef as React.RefObject<HTMLElement>,
    scrollContainerRef: mainScrollRef,
    enabled: !!currentStory,
    onReadComplete: () => {
      // Story marked as read
      console.log('Story marked as read:', currentStory?.title);
    }
  });

  const handleNextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
  }, [currentStoryIndex, stories.length]);

  const handlePreviousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  }, [currentStoryIndex]);

  const goToStory = useCallback((index: number) => {
    setCurrentStoryIndex(index);
    // Close overlay immediately
    setSearchQuery('');
    setIsSearchFocused(false);
    setSelectedTags([]);
  }, []);

  // Handle Listen button
  const handleListen = async () => {
    if (isAudioPlayerOpen) {
      // If audio player is open, close it
      setIsAudioPlayerOpen(false);
      setIsListening(false);
      setIsAudioPlaying?.(false);
    } else {
      // Check if audio is available before opening the media player
      try {
        const { getUnifiedContentService } = await import('../../services/unifiedContentService');
        const audioService = getUnifiedContentService();
        
        const currentStory = stories[currentStoryIndex];
        if (!currentStory) return;
        
        console.log(`🎵 Opening audio player for story: "${currentStory.title}" (${currentStory.id})`);
        
        const hasAudio = await audioService.hasAudio(currentStory.id, 'story');
        if (hasAudio) {
          console.log('✅ Audio available - opening player');
          setIsAudioPlayerOpen(true);
          setIsListening(true);
          setIsAudioPlaying?.(true);
          // Enable auto-play when the play button is clicked
          localStorage.setItem('autoPlayAudio', 'true');
        } else {
          console.log('⚠️  Audio not available for this story');
        }
      } catch (error) {
        console.error('❌ Error checking audio availability:', error);
        // Don't open media player if there's an error
      }
    }
  };

  const handleAudioPlayerClose = () => {
    setIsAudioPlayerOpen(false);
    setIsListening(false);
    setIsAudioPlaying?.(false);
  };


  // Scroll to position handler
  const handleScrollToPosition = (position: number) => {
    if (contentRef.current) {
      const targetY = position * contentRef.current.scrollHeight;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePreviousStory();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextStory();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        setIsSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNextStory, handlePreviousStory]);

  // Show loading state while stories are being loaded
  if (stories.length === 0) {
    return <PageLoadingSpinner message="Loading stories..." />;
  }

  const handleSearchClear = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    setSelectedTags([]);
  };

  const handleSearchBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.relatedTarget || !e.relatedTarget.closest('[data-search-overlay]')) {
      setIsSearchFocused(false);
    }
  };

  const currentList = searchQuery.trim() || selectedTags.length > 0 ? filteredStories : stories;

  return (
    <>
      {/* Search Bar */}
      <SearchBar
        placeholder="Search stories..."
        value={searchQuery}
        onChange={setSearchQuery}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={handleSearchBlur}
        showClearButton={isSearchFocused || !!searchQuery.trim()}
        onClear={handleSearchClear}
        className="lg:relative"
        isOpen={isSearchFocused || !!searchQuery.trim()}
      />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchFocused || !!searchQuery.trim()}
        onClose={handleSearchClear}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        allTags={getAllTags()}
        onTagToggle={toggleTag}
        onClearFilters={clearAllFilters}
        items={currentList}
        renderItem={(story, index) => {
          const actualIndex = stories.findIndex(s => s.id === story.id);
          const isActive = actualIndex === currentStoryIndex;
          const IconComponent = getStoryIcon(story, index);
          const isRead = readingProgressService.isRead(story.id);
          
          return (
            <ContentListItem
              key={story.id}
              id={story.id}
              title={story.title}
              tags={story.tags}
              icon={<IconComponent className="w-6 h-6" />}
              isActive={isActive}
              isRead={isRead}
              onClick={() => goToStory(actualIndex)}
              selectedTags={selectedTags}
            />
          );
        }}
        visibleCount={visibleCount}
        totalCount={currentList.length}
        onViewMore={handleViewMore}
        emptyStateTitle="No stories found"
        emptyStateMessage="Try adjusting your search terms"
      />

      {/* Content Reader Layout */}
      <ContentReaderLayout
        content={currentStory.content}
        title={currentStory.title}
        tags={currentStory.tags}
        currentIndex={currentStoryIndex}
        totalItems={stories.length}
        onPrevious={handlePreviousStory}
        onNext={handleNextStory}
        onListen={handleListen}
        isListening={isListening}
        isAudioPlayerOpen={isAudioPlayerOpen}
        onAudioPlayerClose={handleAudioPlayerClose}
        onScrollToPosition={handleScrollToPosition}
        contentType="story"
        contentId={currentStory.id}
        contentTitle={currentStory.title}
        fontSize={fontSize}
        mainScrollRef={mainScrollRef}
        contentRef={contentRef}
      />

      {/* Click outside handler for overflow menu */}
      {showOverflowMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowOverflowMenu(false)}
        />
      )}


    </>
  );
};

export default StoriesPage;
