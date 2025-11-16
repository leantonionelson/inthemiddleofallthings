import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Story } from '../../types';
import { loadStories, fallbackStories } from '../../data/storiesContent';
import { useScrollTracking } from '../../hooks/useScrollTracking';
import { useScrollTransition } from '../../hooks/useScrollTransition';
import ContentReaderLayout from '../../components/ContentReaderLayout';
import PageLoadingSpinner from '../../components/PageLoadingSpinner';

const StoriesPage: React.FC = () => {
  const outletContext = useOutletContext<{ isAudioPlaying?: boolean; setIsAudioPlaying?: (value: boolean) => void; mainScrollRef?: React.RefObject<HTMLElement> }>();
  const mainScrollRef = outletContext?.mainScrollRef;
  const setIsAudioPlaying = outletContext?.setIsAudioPlaying;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [fontSize] = useState('base');

  // Handle back navigation to Read page with stories tab
  const handleBack = useCallback(() => {
    navigate('/read?tab=stories');
  }, [navigate]);

  // Load stories from MD files
  useEffect(() => {
    const loadStoryList = async () => {
      try {
        const loadedStories = await loadStories();
        setStories(loadedStories);
        
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
      }
    };

    loadStoryList();
  }, []);

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

  // Scroll transition for header (back button and search bar)
  const headerScrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 120,
    direction: 'up'
  }, mainScrollRef);

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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNextStory, handlePreviousStory]);

  // Show loading state while stories are being loaded
  if (stories.length === 0) {
    return <PageLoadingSpinner message="Loading stories..." />;
  }

  return (
    <>
      {/* Back Button - Fixed at top with scroll transition (search bar hidden) */}
      <div 
        className="fixed top-0 left-0 right-0 z-[10001]"
        style={headerScrollTransition.style}
      >
        <div className="max-w-2xl mx-auto px-4 py-2">
          <motion.button
            onClick={handleBack}
            className="flex items-center justify-center w-12 h-12 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </div>
      </div>


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
