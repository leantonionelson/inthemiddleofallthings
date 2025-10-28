import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, BookChapter, TextHighlight } from '../../types';
import { loadBookChapters, fallbackChapters } from '../../data/bookContent';
import CleanLayout from '../../components/CleanLayout';
import ReaderNavigation from '../../components/ReaderNavigation';
import ChapterInfo from '../../components/ChapterInfo';
import { useScrollTransition } from '../../hooks/useScrollTransition';

import UnifiedAudioPlayer from '../../components/UnifiedAudioPlayer';
import TextSelection from '../../components/TextSelection';
import ContentFormatter from '../../components/ContentFormatter';
import { highlightsService } from '../../services/firebaseHighlights';
import { authService } from '../../services/firebaseAuth';
import { useUserCapabilities } from '../../hooks/useUserCapabilities';
import { useTextSelection } from '../../hooks/useTextSelection';
import UpgradePrompt from '../../components/UpgradePrompt';

interface ReaderPageProps {
  onOpenAI?: () => void;
  onCloseAI?: () => void;
}



const ReaderPage: React.FC<ReaderPageProps> = ({ onOpenAI, onCloseAI }) => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  // Use shared text selection hook
  const { selectedText, isTextSelected, clearSelection } = useTextSelection({ contentRef });
  const [, setSavedHighlights] = useState<TextHighlight[]>([]);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [highlightedProgress, setHighlightedProgress] = useState(0); // 0 to 1, representing progress through the text
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // Track when audio is actively playing
  const [fontSize, setFontSize] = useState('base');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'highlights' | 'progress' | 'ai' | 'sync'>('highlights');
  
  // Get user capabilities
  const userCapabilities = useUserCapabilities();

  // Scroll transition hooks for header and navigation
  const headerScrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 120,
    direction: 'up' // Header moves up when scrolling down
  });



  // Reader navigation moves with bottom menu but stays at bottom of screen
  const readerNavScrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 80,
    direction: 'down' // Moves down when scrolling down (stays at bottom)
  });

  // Combined transition style that includes both scroll and audio playing state
  const combinedTransitionStyle = {
    ...readerNavScrollTransition.style,
    transform: isAudioPlaying 
      ? 'translateY(80px)' // Force the scroll transition effect when audio is playing
      : readerNavScrollTransition.style.transform
  };

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

  // Save chapter index when it changes
  useEffect(() => {
    if (chapters.length > 0) {
      localStorage.setItem('currentChapterIndex', currentChapterIndex.toString());
    }
  }, [currentChapterIndex, chapters.length]);

  const currentChapter = chapters[currentChapterIndex] || fallbackChapters[0];

  // Load saved highlights and pins from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('highlights');
    if (saved) {
      try {
        setSavedHighlights(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading highlights:', error);
      }
    }

    // Clear any old highlight pins data
    localStorage.removeItem('highlightPins');
  }, []);

  // Load font size setting
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') || 'base';
    setFontSize(savedFontSize);
  }, []);



  // Expose clearSelection to parent component
  useEffect(() => {
    if (onCloseAI) {
      // Store the clearSelection function so parent can call it
      (window as typeof window & { clearReaderSelection?: () => void }).clearReaderSelection = clearSelection;
    }
  }, [onCloseAI, clearSelection]);





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

  // Handle swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Disable swipe navigation when text is manually selected
    if (isTextSelected) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextChapter();
    } else if (isRightSwipe) {
      handlePreviousChapter();
    }
  };

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
        chapterId: chapters[currentChapterIndex].id,
        chapterTitle: chapters[currentChapterIndex].title,
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
      chapter: chapters[currentChapterIndex].title,
      timestamp: new Date().toISOString()
    }));
    
    if (onOpenAI) {
      onOpenAI();
    }
  };



  // Show loading state while chapters are being loaded
  if (chapters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-serif flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chapter...</p>
        </div>
      </div>
    );
  }

  return (
    <CleanLayout
      currentPage="reader"
      onRead={() => navigate(AppRoute.HOME)}
      isReading={true}
      onOpenAI={onOpenAI}
      isAudioPlaying={isAudioPlaying}
    >
      {/* ChapterInfo only on mobile - hidden on desktop */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-40"
        style={{
          ...headerScrollTransition.style,
          transform: isAudioPlaying 
            ? 'translateY(-120px)' // Move chapter info up when audio is playing
            : headerScrollTransition.style.transform
        }}
      >
        <ChapterInfo
          currentChapterIndex={currentChapterIndex}
          totalChapters={chapters.length}
        />
      </div>

      {/* Combined Navigation and Audio Controls - positioned with scroll transition */}
      <div 
        className="fixed bottom-20 left-0 right-0 z-40"
        style={combinedTransitionStyle}
      >
        {/* Unified Audio Player - positioned above navigation */}
        <div className="flex justify-center mb-2">
          <UnifiedAudioPlayer
            chapter={currentChapter}
            isOpen={isAudioPlayerOpen}
            onClose={handleAudioPlayerClose}
            onHighlightProgress={handleHighlightProgress}
            onScrollToPosition={handleScrollToPosition}
            onNextChapter={handleNextChapter}
            onPreviousChapter={handlePreviousChapter}
            hasNextChapter={currentChapterIndex < chapters.length - 1}
            hasPreviousChapter={currentChapterIndex > 0}
            autoPlay={localStorage.getItem('autoPlayAudio') === 'true'}
          />
        </div>
        
        {/* Reader Navigation */}
        <ReaderNavigation
          currentChapterIndex={currentChapterIndex}
          totalChapters={chapters.length}
          isListening={isListening}
          onPreviousChapter={handlePreviousChapter}
          onNextChapter={handleNextChapter}
          onToggleListen={handleListen}
          showShadow={!isAudioPlayerOpen}
          progress={highlightedProgress}
          contentType="chapter"
          contentId={currentChapter.id}
          contentTitle={currentChapter.title}
          content={currentChapter.content}
        />
      </div>

      {/* Main Content Area */}
      <main
        ref={contentRef}
        className={`reader-content relative ${
          // Mobile styles - increased bottom padding for audio player
          'pb-48 px-6 max-w-2xl mx-auto'
        } ${
          // Desktop styles - consistent top padding
          'lg:pb-32 lg:px-8 lg:max-w-4xl lg:pt-8'
        }`}
        style={{ 
          // Mobile padding top (desktop handled by Tailwind classes)
          paddingTop: isAudioPlaying ? '2rem' : '6rem',
          transform: isAudioPlaying ? 'translateY(80px)' : 'none',
          transition: 'transform 0.3s ease-out, padding-top 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >


        <div>
          {/* Desktop Chapter Header with Navigation */}
          <div className="mb-8">
            {/* Desktop Chapter Info */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink-secondary dark:text-ink-muted">
                  Chapter {currentChapterIndex + 1} of {chapters.length}
                </span>
                <div className="w-px h-4 bg-ink-muted/20 dark:bg-paper-light/20" />
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-ink-muted/10 dark:bg-paper-light/10 rounded-full h-1">
                    <div 
                      className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${((currentChapterIndex + 1) / chapters.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-secondary dark:text-ink-muted">
                    {Math.round(((currentChapterIndex + 1) / chapters.length) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Desktop Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousChapter}
                  disabled={currentChapterIndex === 0}
                  className="p-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={handleNextChapter}
                  disabled={currentChapterIndex === chapters.length - 1}
                  className="p-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            <h2 className={`font-bold text-ink-primary dark:text-paper-light mb-4 leading-tight ${
              fontSize === 'sm' ? 'text-2xl lg:text-3xl' : 
              fontSize === 'base' ? 'text-2xl lg:text-3xl' : 
              fontSize === 'lg' ? 'text-3xl lg:text-4xl' : 
              'text-4xl lg:text-5xl'
            }`}>
              {currentChapter.title}
            </h2>
            {currentChapter.subtitle && (
              <p className={`text-ink-secondary dark:text-ink-muted mb-6 leading-relaxed ${
                fontSize === 'sm' ? 'text-lg lg:text-xl' : 
                fontSize === 'base' ? 'text-lg lg:text-xl' : 
                fontSize === 'lg' ? 'text-xl lg:text-2xl' : 
                'text-2xl lg:text-3xl'
              }`}>
                {currentChapter.subtitle}
              </p>
            )}
          </div>

          {/* Chapter Content */}
          <div className="max-w-none">
            <ContentFormatter 
              content={currentChapter.content}
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

export default ReaderPage; 