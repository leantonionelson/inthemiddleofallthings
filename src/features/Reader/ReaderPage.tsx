import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookChapter } from '../../types';
import { loadBookChapters, fallbackChapters } from '../../data/bookContent';
import { useScrollTracking } from '../../hooks/useScrollTracking';

import ContentReaderLayout from '../../components/ContentReaderLayout';
import PageLoadingSpinner from '../../components/PageLoadingSpinner';
import { useUserCapabilities } from '../../hooks/useUserCapabilities';

const ReaderPage: React.FC = () => {
  const outletContext = useOutletContext<{ isAudioPlaying?: boolean; setIsAudioPlaying?: (value: boolean) => void; mainScrollRef?: React.RefObject<HTMLElement> }>();
  const mainScrollRef = outletContext?.mainScrollRef;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [highlightedProgress, setHighlightedProgress] = useState(0); // 0 to 1, representing progress through the text
  const [fontSize, setFontSize] = useState('base');
  
  // Get user capabilities
  useUserCapabilities();

  // Load chapters from MDX files
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const loadedChapters = await loadBookChapters();
        setChapters(loadedChapters);
        
        // Load saved chapter index
        const savedChapterIndex = localStorage.getItem('currentChapterIndex');
        if (savedChapterIndex) {
          const index = parseInt(savedChapterIndex, 10);
          if (index >= 0 && index < loadedChapters.length) {
            setCurrentChapterIndex(index);
          }
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
        // Fallback to hardcoded chapters if loading fails
        setChapters(fallbackChapters);
      }
    };

    loadChapters();
  }, []);

  // Save chapter index when it changes and scroll to top
  useEffect(() => {
    if (chapters.length > 0) {
      localStorage.setItem('currentChapterIndex', currentChapterIndex.toString());
      
      // Scroll to top when chapter changes
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Also scroll window to top for good measure
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChapterIndex, chapters.length]);

  const currentChapter = chapters[currentChapterIndex] || fallbackChapters[0];

  // Track reading progress for current chapter
  useScrollTracking({
    contentId: currentChapter?.id || '',
    contentType: 'chapter',
    contentRef: contentRef as React.RefObject<HTMLElement>,
    scrollContainerRef: mainScrollRef,
    enabled: !!currentChapter && !!currentChapter.id,
    onReadComplete: () => {
      // Chapter marked as read
      console.log('Chapter marked as read:', currentChapter?.title);
    }
  });

  // Load font size setting
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') || 'base';
    setFontSize(savedFontSize);
  }, []);





  const handleListen = () => {
    if (isAudioPlayerOpen) {
      // If audio player is open, close it
      setIsAudioPlayerOpen(false);
      setIsListening(false);
      setIsAudioPlaying(false);
    } else {
      // If audio player is closed, open it and enable auto-play
      setIsAudioPlayerOpen(true);
      setIsListening(true);
      setIsAudioPlaying(true);
      // Enable auto-play when the play button is clicked
      localStorage.setItem('autoPlayAudio', 'true');
    }
  };





  const handleHighlightProgress = (progress: number) => {
    setHighlightedProgress(progress);
  };

  const handleScrollToPosition = (position: number) => {
    // Find the element at the given character position and scroll to it
    const contentElement = contentRef.current;
    if (contentElement) {
      const textContent = contentElement.textContent || '';
      if (position < textContent.length) {
        // Create a range to find the position
        const range = document.createRange();
        const walker = document.createTreeWalker(
          contentElement,
          NodeFilter.SHOW_TEXT,
          null
        );

        let currentPos = 0;
        let targetNode: Text | null = null;
        let targetOffset = 0;

        let node;
        while ((node = walker.nextNode()) !== null) {
          const nodeLength = node.textContent?.length || 0;
          if (currentPos + nodeLength > position) {
            targetNode = node as Text;
            targetOffset = position - currentPos;
            break;
          }
          currentPos += nodeLength;
        }

        if (targetNode) {
          range.setStart(targetNode, targetOffset);
          range.setEnd(targetNode, targetOffset);
          
          // Scroll the element into view
          targetNode.parentElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  };

  const handleAudioPlayerClose = () => {
    setIsAudioPlayerOpen(false);
    setIsListening(false);
    setIsAudioPlaying(false);
  };

  const handleNextChapter = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      // Scroll to top when changing chapters
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      
      // Reset audio highlighting progress when changing chapters
      setHighlightedProgress(0);
    }
  }, [currentChapterIndex, chapters.length]);

  const handlePreviousChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
      // Scroll to top when changing chapters
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      
      // Reset audio highlighting progress when changing chapters
      setHighlightedProgress(0);
    }
  }, [currentChapterIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousChapter();
      } else if (e.key === 'ArrowRight') {
        handleNextChapter();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNextChapter, handlePreviousChapter]);


  // Show loading state while chapters are being loaded
  if (chapters.length === 0) {
    return <PageLoadingSpinner message="Loading chapter..." />;
  }

  return (
    <>
      {/* Content Reader Layout */}
      <ContentReaderLayout
        content={currentChapter.content}
        title={currentChapter.title}
        subtitle={currentChapter.subtitle}
        currentIndex={currentChapterIndex}
        totalItems={chapters.length}
        onPrevious={handlePreviousChapter}
        onNext={handleNextChapter}
        onListen={handleListen}
        isListening={isListening}
        isAudioPlayerOpen={isAudioPlayerOpen}
        onAudioPlayerClose={handleAudioPlayerClose}
        highlightedProgress={highlightedProgress}
        onHighlightProgress={handleHighlightProgress}
        onScrollToPosition={handleScrollToPosition}
        contentType="chapter"
        contentId={currentChapter.id}
        contentTitle={currentChapter.title}
        fontSize={fontSize}
        mainScrollRef={mainScrollRef}
        contentRef={contentRef}
        showMobileHeader={true}
        chapter={currentChapter}
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

export default ReaderPage; 