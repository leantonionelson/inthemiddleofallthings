import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, Story, TextHighlight } from '../../types';
import { loadStories, searchStories, fallbackStories } from '../../data/storiesContent';
import CleanLayout from '../../components/CleanLayout';
import ReaderNavigation from '../../components/ReaderNavigation';
import { useScrollTransition } from '../../hooks/useScrollTransition';
import { Search, X, ChevronRight, BookOpen, Scroll, Feather, Eye, Brain, Globe, Clock, Sparkles, Zap } from 'lucide-react';

import UnifiedAudioPlayer from '../../components/UnifiedAudioPlayer';
import TextSelection from '../../components/TextSelection';
import ContentFormatter from '../../components/ContentFormatter';
import { highlightsService } from '../../services/firebaseHighlights';
import { authService } from '../../services/firebaseAuth';
import { useUserCapabilities } from '../../hooks/useUserCapabilities';
import { useTextSelection } from '../../hooks/useTextSelection';
import UpgradePrompt from '../../components/UpgradePrompt';

interface StoriesPageProps {
  onOpenAI?: () => void;
  onCloseAI?: () => void;
}

interface TextSelectionData {
  text: string;
  range: Range;
  rect: DOMRect;
  isManualSelection?: boolean;
}

interface HighlightPin {
  id: string;
  side: 'start' | 'end';
  rect: DOMRect;
  range: Range;
  highlightId: string;
}

const StoriesPage: React.FC<StoriesPageProps> = ({ onOpenAI, onCloseAI }) => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  // Use shared text selection hook
  const { selectedText, isTextSelected, clearSelection } = useTextSelection({ contentRef });
  const [, setSavedHighlights] = useState<TextHighlight[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [highlightedProgress, setHighlightedProgress] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [fontSize, setFontSize] = useState('base');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'highlights' | 'progress' | 'ai' | 'sync'>('highlights');
  
  // Get user capabilities
  const userCapabilities = useUserCapabilities();

  // Touch handling state
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Scroll transition hooks for header and navigation
  const headerScrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 120,
    direction: 'up'
  });

  const readerNavScrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 80,
    direction: 'down'
  });

  const combinedTransitionStyle = {
    ...readerNavScrollTransition.style,
    transform: isAudioPlaying 
      ? 'translateY(80px)'
      : readerNavScrollTransition.style.transform
  };

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
    const iconMap: Record<string, React.ComponentType<any>> = {
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

  // Save current story index
  useEffect(() => {
    localStorage.setItem('currentStoryIndex', currentStoryIndex.toString());
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
      } else {
        console.log('⚠️  Audio not available for this story');
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

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging && !touchStartX) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        // Swipe right - previous story
        handlePreviousStory();
      } else {
        // Swipe left - next story  
        handleNextStory();
      }
    }
    
    setTouchStartX(0);
    setTouchStartY(0);
    setIsDragging(false);
  };

  // Highlight progress handler
  const handleHighlightProgress = (progress: number) => {
    setHighlightedProgress(progress);
  };

  // Scroll to position handler
  const handleScrollToPosition = (position: number) => {
    if (contentRef.current) {
      const targetY = position * contentRef.current.scrollHeight;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  // Pin drag handlers
  const handlePinDragStart = (pinId: string, e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
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
        clearSelection();
        setSearchQuery('');
        setIsSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNextStory, handlePreviousStory, clearSelection]);

  const handleSaveHighlight = async (text: string, range: Range) => {
    if (!userCapabilities.canSaveHighlights) {
      setUpgradeFeature('highlights');
      setShowUpgradePrompt(true);
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.warn('No authenticated user for saving highlights');
        return;
      }

      const highlight: Omit<TextHighlight, 'id'> = {
        chapterId: currentStory.id,
        chapterTitle: currentStory.title,
        text: text.trim(),
        timestamp: new Date(),
        position: {
          start: range.startOffset,
          end: range.endOffset
        }
      };

      await highlightsService.saveHighlight(currentUser.uid, highlight);
      console.log('Highlight saved successfully');
    } catch (error) {
      console.error('Error saving highlight:', error);
    }
  };

  const handleAIChatWithText = (text: string) => {
    // Store the selected text for AI chat
    localStorage.setItem('aiChatContext', JSON.stringify({
      text: text.trim(),
      story: currentStory.title,
      timestamp: new Date().toISOString()
    }));
    
    if (onOpenAI) {
      onOpenAI();
    }
  };

  // Show loading state while stories are being loaded
  if (stories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-serif flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <CleanLayout
      currentPage="stories"
      onRead={() => navigate(AppRoute.READER)}
      isReading={true}
      onOpenAI={onOpenAI}
      isAudioPlaying={isAudioPlaying}
    >
      {/* Search Bar - Fixed at top on mobile, integrated on desktop */}
      <div className="fixed top-0 left-0 right-0 z-[70] bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md border-b border-ink-muted/10 dark:border-paper-light/10 lg:relative lg:bg-transparent lg:border-b-0 lg:backdrop-blur-none">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-6 py-4 lg:pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={(e) => {
                // Only blur if not clicking within the search overlay
                if (!e.relatedTarget || !e.relatedTarget.closest('[data-search-overlay]')) {
                  setIsSearchFocused(false);
                }
              }}
              className="w-full pl-12 pr-12 py-3 bg-paper-light dark:bg-paper-dark border border-ink-muted/20 dark:border-paper-light/20 rounded-xl text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
            />
            {(isSearchFocused || searchQuery.trim()) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                  setSelectedTags([]);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Search Overlay */}
      {(isSearchFocused || searchQuery.trim()) && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-lg z-[60]"
            onClick={() => {
              setSearchQuery('');
              setIsSearchFocused(false);
              setSelectedTags([]);
            }}
          />
          
          {/* Search Results Full Screen */}
          <div data-search-overlay className="fixed top-20 left-0 right-0 bottom-0 z-[60] overflow-hidden lg:absolute lg:top-full lg:mt-2">
            <div className="max-w-2xl lg:max-w-4xl mx-auto h-full flex flex-col">
              {/* Tag Cloud - Horizontal Scrollable, Two Rows */}
              <div className="px-6 py-4 border-b border-ink-muted/10 dark:border-paper-light/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-ink-secondary dark:text-ink-muted">
                    Filter by tags
                  </h3>
                  {(selectedTags.length > 0 || searchQuery.trim()) && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex flex-col gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                    {/* Split tags into two rows */}
                    {(() => {
                      const allTags = getAllTags();
                      const midPoint = Math.ceil(allTags.length / 2);
                      const firstRow = allTags.slice(0, midPoint);
                      const secondRow = allTags.slice(midPoint);
                      
                      return (
                        <>
                          {/* First row */}
                          <div className="flex gap-2">
                            {firstRow.map(tag => (
                              <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                                  selectedTags.includes(tag)
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 border border-transparent'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          
                          {/* Second row */}
                          <div className="flex gap-2">
                            {secondRow.map(tag => (
                              <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                                  selectedTags.includes(tag)
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 border border-transparent'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <ul role="list" className="divide-y divide-ink-muted/10 dark:divide-paper-light/10">
                  {/* Show visible stories based on pagination */}
                  {(searchQuery.trim() || selectedTags.length > 0 ? filteredStories : stories)
                    .slice(0, visibleCount)
                    .map((story, index) => {
                    const actualIndex = stories.findIndex(s => s.id === story.id);
                    const isActive = actualIndex === currentStoryIndex;
                    const IconComponent = getStoryIcon(story, index);
                    
                    return (
                      <li
                        key={story.id}
                        className={`relative flex justify-between gap-x-6 px-6 py-5 hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 transition-colors ${
                          isActive ? 'bg-blue-50/80 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <button
                          onClick={() => goToStory(actualIndex)}
                          className="flex min-w-0 gap-x-4 w-full text-left"
                        >
                          <span className="absolute inset-x-0 -top-px bottom-0" />
                          
                          {/* Icon */}
                          <div className={`flex-none rounded-full p-3 w-12 h-12 flex items-center justify-center ${
                            isActive 
                              ? 'bg-blue-100 dark:bg-blue-900/30' 
                              : 'bg-ink-muted/10 dark:bg-paper-light/10'
                          }`}>
                            <IconComponent className={`w-6 h-6 ${
                              isActive 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-ink-secondary dark:text-ink-muted'
                            }`} />
                          </div>
                          
                          {/* Content */}
                          <div className="min-w-0 flex-auto">
                            <p className={`text-sm/6 font-semibold ${
                              isActive 
                                ? 'text-blue-700 dark:text-blue-300' 
                                : 'text-ink-primary dark:text-paper-light'
                            }`}>
                              {story.title}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1 justify-center">
                              {story.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    selectedTags.includes(tag)
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                      : isActive
                                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                      : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {story.tags.length > 3 && (
                                <span className="text-xs text-ink-secondary dark:text-ink-muted">
                                  +{story.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Chevron */}
                          <div className="flex shrink-0 items-center">
                            <ChevronRight className={`w-5 h-5 ${
                              isActive 
                                ? 'text-blue-400 dark:text-blue-500' 
                                : 'text-ink-muted dark:text-ink-secondary'
                            }`} />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                  
                </ul>

                {/* View More Button */}
                {(() => {
                  const currentList = searchQuery.trim() || selectedTags.length > 0 ? filteredStories : stories;
                  const hasMore = visibleCount < currentList.length;
                  
                  return hasMore && (
                    <div className="px-6 py-4 border-t border-ink-muted/10 dark:border-paper-light/10">
                      <button
                        onClick={handleViewMore}
                        className="w-full px-4 py-3 bg-ink-primary/5 dark:bg-paper-light/5 hover:bg-ink-primary/10 dark:hover:bg-paper-light/10 border border-ink-muted/20 dark:border-paper-light/20 rounded-xl text-ink-primary dark:text-paper-light font-medium transition-all duration-200"
                      >
                        View More ({currentList.length - visibleCount} remaining)
                      </button>
                    </div>
                  );
                })()}
                
                {(searchQuery.trim() || selectedTags.length > 0) && filteredStories.length === 0 && (
                  <div className="text-center py-16 px-6">
                    <Search className="w-16 h-16 mx-auto mb-4 text-ink-muted/50 dark:text-ink-muted/30" />
                    <h3 className="text-xl font-medium text-ink-primary dark:text-paper-light mb-2">
                      No stories found
                    </h3>
                    <p className="text-ink-secondary dark:text-ink-muted">
                      Try adjusting your search terms
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}


      {/* Combined Navigation and Audio Controls - positioned with scroll transition */}
      <div 
        className="fixed bottom-20 left-0 right-0 z-40"
        style={combinedTransitionStyle}
      >
        {/* Unified Audio Player - positioned above navigation */}
        <div className="flex justify-center mb-2">
          <UnifiedAudioPlayer
            chapter={{
              id: currentStory.id,
              title: currentStory.title,
              content: currentStory.content,
              part: 'Story',
              chapterNumber: currentStoryIndex + 1,
              totalChapters: stories.length
            }}
            isOpen={isAudioPlayerOpen}
            onClose={handleAudioPlayerClose}
            onHighlightProgress={handleHighlightProgress}
            onScrollToPosition={handleScrollToPosition}
            onNextChapter={handleNextStory}
            onPreviousChapter={handlePreviousStory}
            hasNextChapter={currentStoryIndex < stories.length - 1}
            hasPreviousChapter={currentStoryIndex > 0}
            autoPlay={localStorage.getItem('autoPlayAudio') === 'true'}
          />
        </div>
        
        {/* Reader Navigation */}
        <ReaderNavigation
          currentChapterIndex={currentStoryIndex}
          totalChapters={stories.length}
          isListening={isListening}
          onPreviousChapter={handlePreviousStory}
          onNextChapter={handleNextStory}
          onToggleListen={handleListen}
          showShadow={!isAudioPlayerOpen}
          progress={highlightedProgress}
          contentType="story"
          contentId={stories[currentStoryIndex]?.id}
          contentTitle={stories[currentStoryIndex]?.title}
          content={stories[currentStoryIndex]?.content}
        />
      </div>

      {/* Main Content Area */}
      <main 
        ref={contentRef}
        className={`reader-content relative ${
          // Mobile styles - increased bottom padding for audio player
          'pb-48 px-6 max-w-2xl mx-auto'
        } ${
          // Desktop styles - increased bottom padding for audio player
          'lg:pb-32 lg:px-8 lg:max-w-4xl lg:pt-8'
        }`}
        style={{ 
          // Mobile: Adjusted for search bar, desktop uses responsive classes
          paddingTop: isAudioPlaying ? '7rem' : '8rem',
          transform: isAudioPlaying ? 'translateY(80px)' : 'none',
          transition: 'transform 0.3s ease-out, padding-top 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div>
          {/* Story Header */}
          <div className="mb-8">
            <h2 className={`font-bold text-ink-primary dark:text-paper-light mb-4 leading-tight ${
              fontSize === 'sm' ? 'text-2xl' : 
              fontSize === 'base' ? 'text-2xl' : 
              fontSize === 'lg' ? 'text-3xl' : 
              'text-4xl'
            }`}>
              {currentStory.title}
            </h2>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {currentStory.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Story Content */}
          <div className="max-w-none">
            <ContentFormatter 
              content={currentStory.content}
              highlightedProgress={highlightedProgress}
              fontSize={fontSize}
            />
          </div>
        </div>
      </main>

      {/* Enhanced Text Selection with Pins */}
      <AnimatePresence>
        {selectedText && isTextSelected && (
          <TextSelection
            selectedText={selectedText.text}
            range={selectedText.range}
            rect={selectedText.rect}
            onSave={handleSaveHighlight}
            onAIChat={handleAIChatWithText}
            onDismiss={clearSelection}
          />
        )}
      </AnimatePresence>


      {/* Click outside handler for overflow menu */}
      {showOverflowMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowOverflowMenu(false)}
        />
      )}

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature={upgradeFeature}
      />

    </CleanLayout>
  );
};

export default StoriesPage;
