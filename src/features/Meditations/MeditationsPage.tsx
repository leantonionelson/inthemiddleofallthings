import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Meditation } from '../../types';
import { loadMeditations, searchMeditations, fallbackMeditations } from '../../data/meditationContent';
import { contentCache } from '../../services/contentCache';
import { useScrollTracking } from '../../hooks/useScrollTracking';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { readingProgressService } from '../../services/readingProgressService';
import { Heart, Leaf, Star, Moon, Sun, Waves, Mountain, Compass, Flower2 } from 'lucide-react';

import SearchBar from '../../components/SearchBar';
import SearchOverlay from '../../components/SearchOverlay';
import ContentListItem from '../../components/ContentListItem';
import ContentReaderLayout from '../../components/ContentReaderLayout';
import PageLoadingSpinner from '../../components/PageLoadingSpinner';
import { useUserCapabilities } from '../../hooks/useUserCapabilities';
import SEO from '../../components/SEO';
import { generateArticleStructuredData, generateBreadcrumbStructuredData, generateFAQStructuredData } from '../../utils/seoHelpers';

const MeditationsPage: React.FC = () => {
  const outletContext = useOutletContext<{ isAudioPlaying?: boolean; setIsAudioPlaying?: (value: boolean) => void; mainScrollRef?: React.RefObject<HTMLElement> }>();
  const mainScrollRef = outletContext?.mainScrollRef;
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Initialize from localStorage if available, otherwise default to 0
  const getInitialMeditationIndex = () => {
    const savedIndex = localStorage.getItem('currentMeditationIndex');
    return savedIndex ? parseInt(savedIndex, 10) : 0;
  };
  const [currentMeditationIndex, setCurrentMeditationIndex] = useState(getInitialMeditationIndex());
  const hasLoadedSavedIndex = useRef(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [filteredMeditations, setFilteredMeditations] = useState<Meditation[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Debounce search query to reduce filtering overhead
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const [fontSize] = useState('base');
  
  // Get user capabilities
  useUserCapabilities();

  // Listen for read status changes to update list
  useEffect(() => {
    const checkReadStatus = () => {
      // Force re-render to update read status indicators
      // This is handled by the component re-rendering when currentMeditationIndex changes
    };
    
    // Check when page becomes visible (user navigates back)
    document.addEventListener('visibilitychange', checkReadStatus);
    
    // Also check periodically while on page (in case read status changes)
    const interval = setInterval(checkReadStatus, 2000);
    
    return () => {
      document.removeEventListener('visibilitychange', checkReadStatus);
      clearInterval(interval);
    };
  }, [currentMeditationIndex]);


  // Get all unique tags from meditations
  const getAllTags = useCallback(() => {
    const allTags = new Set<string>();
    meditations.forEach(meditation => {
      meditation.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [meditations]);

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
    const itemHeight = 80; // Approximate height per meditation item
    const bottomPadding = 200; // Navigation + audio controls
    
    const availableHeight = viewportHeight - searchBarHeight - tagCloudHeight - bottomPadding;
    const maxItems = Math.floor(availableHeight / itemHeight);
    
    // Ensure at least 3 items, max 15 for initial load
    return Math.max(3, Math.min(15, maxItems));
  }, []);

  // Handle "View More" functionality
  const handleViewMore = useCallback(() => {
    const increment = 10; // Load 10 more at a time
    const newCount = Math.min(visibleCount + increment, filteredMeditations.length);
    setVisibleCount(newCount);
  }, [visibleCount, filteredMeditations.length]);

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

  // Load meditations from MD files (use cache if available)
  useEffect(() => {
    const loadMeditationList = async () => {
      try {
        // Use content cache to avoid reloading if already loaded
        const loadedMeditations = await contentCache.getMeditations(loadMeditations);
        console.log('MeditationsPage: Loaded meditations:', loadedMeditations.map(m => ({ id: m.id, title: m.title })));
        setMeditations(loadedMeditations);
        setFilteredMeditations(loadedMeditations);
        
        // Try to find meditation by ID first (more reliable)
        const savedMeditationId = localStorage.getItem('currentMeditationId');
        const savedMeditationIndex = localStorage.getItem('currentMeditationIndex');
        
        console.log('MeditationsPage: Saved ID from localStorage:', savedMeditationId);
        console.log('MeditationsPage: Saved index from localStorage:', savedMeditationIndex);
        
        let targetIndex = -1;
        
        // Prefer ID-based lookup if available
        if (savedMeditationId) {
          const idIndex = loadedMeditations.findIndex(m => m.id === savedMeditationId);
          if (idIndex >= 0) {
            targetIndex = idIndex;
            console.log('MeditationsPage: Found meditation by ID at index:', targetIndex, 'Title:', loadedMeditations[targetIndex]?.title);
          } else {
            console.warn('MeditationsPage: Meditation ID not found:', savedMeditationId);
          }
        }
        
        // Fallback to index-based lookup
        if (targetIndex === -1 && savedMeditationIndex) {
          const index = parseInt(savedMeditationIndex, 10);
          console.log('MeditationsPage: Parsed index:', index, 'Total meditations:', loadedMeditations.length);
          if (index >= 0 && index < loadedMeditations.length) {
            targetIndex = index;
            console.log('MeditationsPage: Using index-based lookup:', targetIndex, 'Title:', loadedMeditations[targetIndex]?.title);
          } else {
            console.warn('MeditationsPage: Invalid index:', index, 'Max:', loadedMeditations.length - 1);
          }
        }
        
        if (targetIndex >= 0) {
          console.log('MeditationsPage: Setting meditation index to:', targetIndex, 'Title:', loadedMeditations[targetIndex]?.title);
          setCurrentMeditationIndex(targetIndex);
        } else {
          // No saved index found, but validate the initial index from state
          const initialIndex = currentMeditationIndex;
          if (initialIndex >= 0 && initialIndex < loadedMeditations.length) {
            console.log('MeditationsPage: Using initial index from state:', initialIndex, 'Title:', loadedMeditations[initialIndex]?.title);
            setCurrentMeditationIndex(initialIndex);
          } else {
            console.log('MeditationsPage: No saved meditation found, defaulting to index 0');
            setCurrentMeditationIndex(0);
          }
        }
        // Mark as loaded so save effect can run
        hasLoadedSavedIndex.current = true;
      } catch (error) {
        console.error('Error loading meditations:', error);
        setMeditations(fallbackMeditations);
        setFilteredMeditations(fallbackMeditations);
      }
    };

    loadMeditationList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount


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
    if (initialLoadComplete) {
      const newVisibleCount = debouncedSearchQuery.trim() || selectedTags.length > 0 
        ? Math.min(calculateInitialVisibleCount(), filtered.length)
        : calculateInitialVisibleCount();
      setVisibleCount(newVisibleCount);
    }
  }, [debouncedSearchQuery, meditations, selectedTags, initialLoadComplete, calculateInitialVisibleCount]);

  // Set initial visible count when meditations first load
  useEffect(() => {
    if (meditations.length > 0 && !initialLoadComplete) {
      const initialCount = calculateInitialVisibleCount();
      setVisibleCount(Math.min(initialCount, meditations.length));
      setInitialLoadComplete(true);
    }
  }, [meditations.length, initialLoadComplete, calculateInitialVisibleCount]);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (initialLoadComplete && !searchQuery.trim() && selectedTags.length === 0) {
        const newInitialCount = calculateInitialVisibleCount();
        // Only adjust if we're still at the initial load count
        if (visibleCount <= newInitialCount) {
          setVisibleCount(Math.min(newInitialCount, meditations.length));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialLoadComplete, searchQuery, selectedTags, visibleCount, calculateInitialVisibleCount, meditations.length]);

  // Save current meditation index and scroll to top when changing meditations
  useEffect(() => {
    // Don't save on initial load - wait until we've loaded the saved index
    if (!hasLoadedSavedIndex.current) {
      return;
    }
    
    // Only save if meditations are loaded and index is valid
    if (meditations.length > 0 && currentMeditationIndex >= 0 && currentMeditationIndex < meditations.length) {
      localStorage.setItem('currentMeditationIndex', currentMeditationIndex.toString());
      // Also save the ID for redundancy
      if (meditations[currentMeditationIndex]) {
        localStorage.setItem('currentMeditationId', meditations[currentMeditationIndex].id);
      }
      console.log('MeditationsPage: Saved index to localStorage:', currentMeditationIndex, meditations[currentMeditationIndex]?.title);
    }
    
    // Scroll to top when meditation changes (but not on initial load)
    if (hasLoadedSavedIndex.current && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Also scroll window to top for good measure
    if (hasLoadedSavedIndex.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentMeditationIndex, meditations]);

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

  const currentMeditation = meditations[currentMeditationIndex];

  // Track reading progress for current meditation
  useScrollTracking({
    contentId: currentMeditation?.id || '',
    contentType: 'meditation',
    contentRef: contentRef as React.RefObject<HTMLElement>,
    scrollContainerRef: mainScrollRef,
    enabled: !!currentMeditation,
    onReadComplete: () => {
      // Meditation marked as read
      console.log('Meditation marked as read:', currentMeditation?.title);
      // List will update automatically when currentMeditationIndex changes
    }
  });

  const handleNextMeditation = useCallback(() => {
    if (currentMeditationIndex < meditations.length - 1) {
      setCurrentMeditationIndex(currentMeditationIndex + 1);
    }
  }, [currentMeditationIndex, meditations.length]);

  const handlePreviousMeditation = useCallback(() => {
    if (currentMeditationIndex > 0) {
      setCurrentMeditationIndex(currentMeditationIndex - 1);
    }
  }, [currentMeditationIndex]);

  const goToMeditation = useCallback((index: number) => {
    setCurrentMeditationIndex(index);
    // Close overlay immediately
    setSearchQuery('');
    setIsSearchFocused(false);
    setSelectedTags([]);
  }, []);

  // Handle Listen button
  const handleListen = async () => {
    // Check if audio is available before opening the media player
    try {
      const { getUnifiedContentService } = await import('../../services/unifiedContentService');
      const audioService = getUnifiedContentService();
      
      const currentMeditation = meditations[currentMeditationIndex];
      if (!currentMeditation) return;
      
      console.log(`🎵 Opening audio player for meditation: "${currentMeditation.title}" (${currentMeditation.id})`);
      
      const hasAudio = await audioService.hasAudio(currentMeditation.id, 'meditation');
      if (hasAudio) {
        console.log('✅ Audio available - opening player');
        setIsAudioPlayerOpen(true);
        setIsListening(true);
      } else {
        console.log('⚠️  Audio not available for this meditation');
      }
    } catch (error) {
      console.error('❌ Error checking audio availability:', error);
      // Don't open media player if there's an error
    }
  };

  const handleAudioPlayerClose = () => {
    setIsAudioPlayerOpen(false);
    setIsListening(false);
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
        handlePreviousMeditation();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextMeditation();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        setIsSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNextMeditation, handlePreviousMeditation]);

  // Show loading state while meditations are being loaded
  if (meditations.length === 0) {
    return <PageLoadingSpinner message="Loading meditations..." />;
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

  const currentList = searchQuery.trim() || selectedTags.length > 0 ? filteredMeditations : meditations;

  const meditationUrl = `https://inthemiddleofallthings.com/meditations?meditation=${currentMeditation.id}`;
  const meditationDescription = currentMeditation.tags && currentMeditation.tags.length > 0
    ? `Guided meditation: ${currentMeditation.title}. Tags: ${currentMeditation.tags.join(', ')}. Explore contemplative practice and philosophical reflection.`
    : `Guided meditation: ${currentMeditation.title}. Explore contemplative practice and philosophical reflection.`;

  const meditationFAQs = [
    {
      question: `What is the meditation "${currentMeditation.title}" about?`,
      answer: `${currentMeditation.title} is a guided meditation${currentMeditation.tags && currentMeditation.tags.length > 0 ? ` focusing on ${currentMeditation.tags.join(', ')}` : ''}. It is part of the In the Middle of All Things collection of contemplative practices designed to support philosophical reflection and self-discovery.`,
    },
    {
      question: 'How do I practice guided meditation?',
      answer: 'Find a quiet space, sit comfortably, and follow the guided meditation text. You can also use the audio narration feature to listen while reading. Take your time with each section and allow yourself to fully engage with the contemplative practice.',
    },
  ];

  return (
    <>
      <SEO
        title={currentMeditation.title}
        description={meditationDescription}
        keywords={`guided meditation, ${currentMeditation.title}, ${currentMeditation.tags?.join(', ') || ''}, contemplative practice, mindfulness, philosophy, self-discovery`}
        type="article"
        articleAuthor="In the Middle of All Things"
        structuredData={{
          '@context': 'https://schema.org',
          '@graph': [
            generateArticleStructuredData(
              currentMeditation.title,
              meditationDescription,
              meditationUrl,
              'In the Middle of All Things',
              undefined,
              undefined,
              'Guided Meditation'
            ),
            generateBreadcrumbStructuredData([
              { name: 'Home', url: 'https://inthemiddleofallthings.com/' },
              { name: 'Meditations', url: 'https://inthemiddleofallthings.com/meditations' },
              { name: currentMeditation.title, url: meditationUrl },
            ]),
            generateFAQStructuredData(meditationFAQs),
          ],
        }}
      />
      {/* Search Bar */}
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
        renderItem={(meditation, index) => {
          const actualIndex = meditations.findIndex(m => m.id === meditation.id);
          const isActive = actualIndex === currentMeditationIndex;
          const IconComponent = getMeditationIcon(meditation, index);
          const isRead = readingProgressService.isRead(meditation.id);
          
          return (
            <ContentListItem
              key={meditation.id}
              id={meditation.id}
              title={meditation.title}
              tags={meditation.tags}
              icon={<IconComponent className="w-6 h-6" />}
              isActive={isActive}
              isRead={isRead}
              onClick={() => goToMeditation(actualIndex)}
              selectedTags={selectedTags}
            />
          );
        }}
        visibleCount={visibleCount}
        totalCount={currentList.length}
        onViewMore={handleViewMore}
        emptyStateTitle="No meditations found"
        emptyStateMessage="Try adjusting your search terms"
      />
      {/* Content Reader Layout */}
      <ContentReaderLayout
        content={currentMeditation.content}
        title={currentMeditation.title}
        tags={currentMeditation.tags}
        currentIndex={currentMeditationIndex}
        totalItems={meditations.length}
        onPrevious={handlePreviousMeditation}
        onNext={handleNextMeditation}
        onListen={handleListen}
        isListening={isListening}
        isAudioPlayerOpen={isAudioPlayerOpen}
        onAudioPlayerClose={handleAudioPlayerClose}
        onScrollToPosition={handleScrollToPosition}
        contentType="meditation"
        contentId={currentMeditation.id}
        contentTitle={currentMeditation.title}
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

export default MeditationsPage;