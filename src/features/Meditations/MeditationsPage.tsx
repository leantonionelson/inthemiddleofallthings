import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, Meditation, TextHighlight } from '../../types';
import { loadMeditations, searchMeditations, fallbackMeditations } from '../../data/meditationContent';
import CleanLayout from '../../components/CleanLayout';
import ReaderNavigation from '../../components/ReaderNavigation';
import { useScrollTransition } from '../../hooks/useScrollTransition';
import { Search, X, ChevronRight, Heart, Leaf, Star, Moon, Sun, Waves, Mountain, Compass, Flower2 } from 'lucide-react';

import UnifiedAudioPlayer from '../../components/UnifiedAudioPlayer';
import { highlightsService } from '../../services/firebaseHighlights';
import { authService } from '../../services/firebaseAuth';
import { useUserCapabilities } from '../../hooks/useUserCapabilities';
import UpgradePrompt from '../../components/UpgradePrompt';

interface MeditationsPageProps {
  onOpenAI?: () => void;
  onCloseAI?: () => void;
}

interface TextSelection {
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

const MeditationsPage: React.FC<MeditationsPageProps> = ({ onOpenAI, onCloseAI }) => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentMeditationIndex, setCurrentMeditationIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [savedHighlights, setSavedHighlights] = useState<TextHighlight[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [filteredMeditations, setFilteredMeditations] = useState<Meditation[]>([]);
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
    const iconMap: Record<string, React.ComponentType<any>> = {
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

  // Load meditations from MD files
  useEffect(() => {
    const loadMeditationList = async () => {
      try {
        const loadedMeditations = await loadMeditations();
        setMeditations(loadedMeditations);
        setFilteredMeditations(loadedMeditations);
        
        const savedMeditationIndex = localStorage.getItem('currentMeditationIndex');
        if (savedMeditationIndex) {
          const index = parseInt(savedMeditationIndex, 10);
          if (index >= 0 && index < loadedMeditations.length) {
            setCurrentMeditationIndex(index);
          }
        }
      } catch (error) {
        console.error('Error loading meditations:', error);
        setMeditations(fallbackMeditations);
        setFilteredMeditations(fallbackMeditations);
      }
    };

    loadMeditationList();
  }, []);

  // Handle search and tag filtering
  useEffect(() => {
    let filtered = searchMeditations(meditations, searchQuery);
    
    // Apply tag filtering if tags are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(meditation => 
        selectedTags.every(tag => meditation.tags.includes(tag))
      );
    }
    
    setFilteredMeditations(filtered);
    
    // Reset visible count when filters change
    if (initialLoadComplete) {
      const newVisibleCount = searchQuery.trim() || selectedTags.length > 0 
        ? Math.min(calculateInitialVisibleCount(), filtered.length)
        : calculateInitialVisibleCount();
      setVisibleCount(newVisibleCount);
    }
  }, [searchQuery, meditations, selectedTags, initialLoadComplete, calculateInitialVisibleCount]);

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

  // Save current meditation index
  useEffect(() => {
    localStorage.setItem('currentMeditationIndex', currentMeditationIndex.toString());
  }, [currentMeditationIndex]);

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
  const handleListen = () => {
    setIsAudioPlayerOpen(true);
    setIsListening(true);
  };

  const handleAudioPlayerClose = () => {
    setIsAudioPlayerOpen(false);
    setIsListening(false);
  };

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      setSelectedText(null);
      setIsTextSelected(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) {
      setSelectedText(null);
      setIsTextSelected(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText({
      text: selectedText,
      range: range.cloneRange(),
      rect,
      isManualSelection: true
    });
    setIsTextSelected(true);
  }, []);

  // Handle saving highlights
  const handleSaveHighlight = async () => {
    if (selectedText && currentMeditation) {
      // Check if user can save highlights
      if (!userCapabilities.canSaveHighlights) {
        setUpgradeFeature('highlights');
        setShowUpgradePrompt(true);
        return;
      }

      try {
        const newHighlight: TextHighlight = {
          id: Date.now().toString(),
          text: selectedText.text,
          chapterId: currentMeditation.id,
          chapterTitle: currentMeditation.title,
          timestamp: new Date(),
          position: {
            start: selectedText.range.startOffset,
            end: selectedText.range.endOffset
          }
        };
        
        // Save to Firebase for authenticated users
        const currentUser = authService.getCurrentUser();
        if (currentUser && !currentUser.isAnonymous) {
          await highlightsService.saveHighlight(currentUser.uid, newHighlight);
          console.log('Meditation highlight saved to Firebase');
        } else {
          // Save to localStorage for anonymous/free users
          const existingHighlights = localStorage.getItem('savedHighlights');
          const highlights = existingHighlights ? JSON.parse(existingHighlights) : [];
          highlights.push(newHighlight);
          localStorage.setItem('savedHighlights', JSON.stringify(highlights));
          console.log('Meditation highlight saved to localStorage');
        }
        
        // Update local state
        setSavedHighlights(prev => [...prev, newHighlight]);
        
        // Clear selection
        setSelectedText(null);
        setIsTextSelected(false);
        window.getSelection()?.removeAllRanges();
        
        console.log('Meditation highlight saved successfully!');
        
      } catch (error) {
        console.error('Error saving meditation highlight:', error);
        // Fallback to localStorage
        const existingHighlights = localStorage.getItem('savedHighlights');
        const highlights = existingHighlights ? JSON.parse(existingHighlights) : [];
        highlights.push({
          id: Date.now().toString(),
          text: selectedText.text,
          chapterId: currentMeditation.id,
          chapterTitle: currentMeditation.title,
          timestamp: new Date(),
          position: {
            start: selectedText.range.startOffset,
            end: selectedText.range.endOffset
          }
        });
        localStorage.setItem('savedHighlights', JSON.stringify(highlights));
        
        setSelectedText(null);
        setIsTextSelected(false);
        window.getSelection()?.removeAllRanges();
        console.log('Meditation highlight saved to localStorage as fallback');
      }
    }
  };

  // Handle Ask AI
  const handleAskAI = () => {
    // Check if user can use AI
    if (!userCapabilities.canUseAI) {
      setUpgradeFeature('ai');
      setShowUpgradePrompt(true);
      return;
    }

    if (onOpenAI) {
      onOpenAI();
    }
    setSelectedText(null);
    setIsTextSelected(false);
    window.getSelection()?.removeAllRanges();
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
        // Swipe right - previous meditation
        handlePreviousMeditation();
      } else {
        // Swipe left - next meditation  
        handleNextMeditation();
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
        handlePreviousMeditation();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextMeditation();
      } else if (e.key === 'Escape') {
        setSelectedText(null);
        setIsTextSelected(false);
        setSearchQuery('');
        setIsSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNextMeditation, handlePreviousMeditation]);

  // Text selection listener
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!isDragging) {
        handleTextSelection();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleTextSelection, isDragging]);

  // Format content with word-level highlighting
  const formatContent = (content: string) => {
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    const cleanContent = content.replace(/\n+/g, ' ').trim();
    const totalCharCount = cleanContent.length;
    const targetCharIndex = highlightedProgress * totalCharCount;

    return paragraphs.map((paragraph, index) => {
      const cleanParagraph = paragraph.trim();
      if (cleanParagraph === '') return <br key={index} />;
      
      const words = cleanParagraph.split(/(\s+)/).filter(Boolean);
      const paragraphStartCharIndex = cleanContent.indexOf(cleanParagraph);
      
      return (
        <p key={index} className={`mb-6 leading-8 text-ink-primary dark:text-paper-light ${
          fontSize === 'sm' ? 'text-sm' : 
          fontSize === 'base' ? 'text-base' : 
          fontSize === 'lg' ? 'text-lg' : 
          'text-xl'
        }`}>
          {words.map((word, wordIndex) => {
            const wordStartCharIndex = paragraphStartCharIndex + words.slice(0, wordIndex).join('').length;
            const wordEndCharIndex = wordStartCharIndex + word.length;
            
            const shouldHighlight = wordEndCharIndex <= targetCharIndex && highlightedProgress > 0;
            
            const formattedWord = word
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            return (
              <span
                key={wordIndex}
                className={shouldHighlight ? 'bg-blue-200 dark:bg-blue-800 bg-opacity-50 dark:bg-opacity-30 transition-all duration-75 ease-out' : 'transition-all duration-75 ease-out'}
                dangerouslySetInnerHTML={{ __html: formattedWord }}
              />
            );
          })}
        </p>
      );
    });
  };

  // Show loading state while meditations are being loaded
  if (meditations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-serif flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meditations...</p>
        </div>
      </div>
    );
  }

  return (
    <CleanLayout
      currentPage="meditations"
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
              placeholder="Search meditations..."
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
                  {/* Show visible meditations based on pagination */}
                  {(searchQuery.trim() || selectedTags.length > 0 ? filteredMeditations : meditations)
                    .slice(0, visibleCount)
                    .map((meditation, index) => {
                    const actualIndex = meditations.findIndex(m => m.id === meditation.id);
                    const isActive = actualIndex === currentMeditationIndex;
                    const IconComponent = getMeditationIcon(meditation, index);
                    
                    return (
                      <li
                        key={meditation.id}
                        className={`relative flex justify-between gap-x-6 px-6 py-5 hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 transition-colors ${
                          isActive ? 'bg-blue-50/80 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <button
                          onClick={() => goToMeditation(actualIndex)}
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
                              {meditation.title}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1 justify-center">
                              {meditation.tags.slice(0, 3).map(tag => (
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
                              {meditation.tags.length > 3 && (
                                <span className="text-xs text-ink-secondary dark:text-ink-muted">
                                  +{meditation.tags.length - 3}
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
                  const currentList = searchQuery.trim() || selectedTags.length > 0 ? filteredMeditations : meditations;
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
                
                {(searchQuery.trim() || selectedTags.length > 0) && filteredMeditations.length === 0 && (
                  <div className="text-center py-16 px-6">
                    <Search className="w-16 h-16 mx-auto mb-4 text-ink-muted/50 dark:text-ink-muted/30" />
                    <h3 className="text-xl font-medium text-ink-primary dark:text-paper-light mb-2">
                      No meditations found
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
              id: currentMeditation.id,
              title: currentMeditation.title,
              content: currentMeditation.content,
              part: 'Meditation',
              chapterNumber: currentMeditationIndex + 1,
              totalChapters: meditations.length
            }}
            isOpen={isAudioPlayerOpen}
            onClose={handleAudioPlayerClose}
            onHighlightProgress={handleHighlightProgress}
            onScrollToPosition={handleScrollToPosition}
            onNextChapter={handleNextMeditation}
            onPreviousChapter={handlePreviousMeditation}
            hasNextChapter={currentMeditationIndex < meditations.length - 1}
            hasPreviousChapter={currentMeditationIndex > 0}
            autoPlay={localStorage.getItem('autoPlayAudio') === 'true'}
          />
        </div>
        
        {/* Reader Navigation */}
        <ReaderNavigation
          currentChapterIndex={currentMeditationIndex}
          totalChapters={meditations.length}
          isListening={isListening}
          onPreviousChapter={handlePreviousMeditation}
          onNextChapter={handleNextMeditation}
          onToggleListen={handleListen}
          showShadow={!isAudioPlayerOpen}
          progress={highlightedProgress}
          contentType="meditation"
        />
      </div>

      {/* Main Content Area */}
      <main 
        ref={contentRef}
        className={`reader-content relative ${
          // Mobile styles
          'pb-36 px-6 max-w-2xl mx-auto'
        } ${
          // Desktop styles - override padding with fixed value
          'lg:pb-20 lg:px-8 lg:max-w-4xl lg:pt-8'
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
          {/* Meditation Header */}
          <div className="mb-8">
            <h2 className={`font-bold text-ink-primary dark:text-paper-light mb-4 leading-tight ${
              fontSize === 'sm' ? 'text-2xl' : 
              fontSize === 'base' ? 'text-2xl' : 
              fontSize === 'lg' ? 'text-3xl' : 
              'text-4xl'
            }`}>
              {currentMeditation.title}
            </h2>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {currentMeditation.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Meditation Content */}
          <div className="max-w-none">
            {formatContent(currentMeditation.content)}
          </div>
        </div>
      </main>

      {/* Native-like Text Selection Menu */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="selection-menu fixed z-50 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md rounded-2xl shadow-2xl border border-ink-muted/20 dark:border-paper-light/20 px-2 py-2"
            style={{
              left: Math.max(16, Math.min(window.innerWidth - 180, selectedText.rect.left + selectedText.rect.width / 2 - 90)),
              top: Math.max(16, selectedText.rect.top - 70),
              boxShadow: '0 8px 32px rgba(15, 15, 15, 0.15), 0 2px 8px rgba(15, 15, 15, 0.1)',
            }}
          >
            <div className="flex items-center space-x-1">
              <button
                onClick={handleSaveHighlight}
                className="group px-5 py-3 text-sm font-medium text-ink-primary dark:text-paper-light hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 active:bg-ink-primary/10 dark:active:bg-paper-light/10 rounded-xl transition-all duration-150 flex items-center space-x-2.5 min-w-0"
              >
                <svg className="w-4 h-4 transition-transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Save</span>
              </button>
              <div className="w-px h-6 bg-ink-muted/20 dark:bg-paper-light/20"></div>
              <button
                onClick={handleAskAI}
                className="group px-5 py-3 text-sm font-medium text-ink-primary dark:text-paper-light hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 active:bg-ink-primary/10 dark:active:bg-paper-light/10 rounded-xl transition-all duration-150 flex items-center space-x-2.5 min-w-0"
              >
                <svg className="w-4 h-4 transition-transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-medium">Ask AI</span>
              </button>
            </div>
            {/* Native-style triangle pointer */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(250, 250, 250, 0.95)',
                filter: 'drop-shadow(0 2px 4px rgba(15, 15, 15, 0.1))'
              }}
            ></div>
            {/* Dark mode triangle pointer */}
            <div 
              className="dark:block hidden absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(15, 15, 15, 0.95)',
                filter: 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.1))'
              }}
            ></div>
          </motion.div>
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

export default MeditationsPage;