import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, BookChapter, TextHighlight } from '../../types';
import { loadBookChapters, fallbackChapters } from '../../data/bookContent';
import CleanLayout from '../../components/CleanLayout';
import StandardHeader from '../../components/StandardHeader';
import ReaderNavigation from '../../components/ReaderNavigation';
import ChapterInfo from '../../components/ChapterInfo';
import { useScrollTransition } from '../../hooks/useScrollTransition';

import AudioControlStrip from '../../components/AudioControlStrip';

interface ReaderPageProps {
  onOpenAI?: () => void;
}

interface TextSelection {
  text: string;
  range: Range;
  rect: DOMRect;
}

const ReaderPage: React.FC<ReaderPageProps> = ({ onOpenAI }) => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [savedHighlights, setSavedHighlights] = useState<TextHighlight[]>([]);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [highlightedProgress, setHighlightedProgress] = useState(0); // 0 to 1, representing progress through the text
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // Track when audio is actively playing
  const [fontSize, setFontSize] = useState('base');

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

  // Load saved highlights from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('highlights');
    if (saved) {
      try {
        setSavedHighlights(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading highlights:', error);
      }
    }
  }, []);

  // Load font size setting
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') || 'base';
    setFontSize(savedFontSize);
  }, []);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Only show menu if selection is within our content area
        if (contentRef.current?.contains(range.commonAncestorContainer)) {
          setSelectedText({
            text: selection.toString().trim(),
            range: range.cloneRange(),
            rect
          });
        }
      } else {
        setSelectedText(null);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  // Clear selection when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedText && !(event.target as Element).closest('.selection-menu')) {
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedText]);

  const handleSaveHighlight = () => {
    if (selectedText) {
      const newHighlight: TextHighlight = {
        id: Date.now().toString(),
        text: selectedText.text,
        chapterId: currentChapter.id,
        chapterTitle: currentChapter.title,
        timestamp: new Date(),
        position: {
          start: 0, // Would need to calculate actual position
          end: selectedText.text.length
        }
      };
      const newHighlights = [...savedHighlights, newHighlight];
      setSavedHighlights(newHighlights);
      localStorage.setItem('highlights', JSON.stringify(newHighlights));
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleAskAI = () => {
    if (selectedText) {
      // Store selected text in context for AI
      localStorage.setItem('selectedTextForAI', selectedText.text);
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
    }
    if (onOpenAI) {
      onOpenAI();
    }
  };

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
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextChapter();
    } else if (isRightSwipe) {
      handlePreviousChapter();
    }
  };



  const formatContent = (content: string) => {
    // Clean the content for consistent character counting
    const cleanContent = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    const totalChars = cleanContent.length;
    const targetCharIndex = Math.floor(highlightedProgress * totalChars);
    
    return content.split('\n\n').map((paragraph, index) => {
      // Split the paragraph into words and whitespace
      const words = paragraph.split(/(\s+)/);
      
      // Calculate the character position for this paragraph
      const cleanParagraph = paragraph
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1');
      const paragraphStartCharIndex = cleanContent.indexOf(cleanParagraph);
      
      return (
        <p key={index} className={`mb-6 leading-8 text-ink-primary dark:text-paper-light ${
          fontSize === 'sm' ? 'text-sm' : 
          fontSize === 'base' ? 'text-base' : 
          fontSize === 'lg' ? 'text-lg' : 
          'text-xl'
        }`}>
          {words.map((word, wordIndex) => {
            // Calculate the character position for this word
            const wordStartCharIndex = paragraphStartCharIndex + words.slice(0, wordIndex).join('').length;
            const wordEndCharIndex = wordStartCharIndex + word.length;
            
            // Check if this word should be highlighted (character-based highlighting)
            const shouldHighlight = wordEndCharIndex <= targetCharIndex && highlightedProgress > 0;
            
            // Apply markdown formatting to the word
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
      {/* Header and ChapterInfo as one unified component */}
      <div 
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          ...headerScrollTransition.style,
          transform: isAudioPlaying 
            ? 'translateY(-120px)' // Move header up when audio is playing
            : headerScrollTransition.style.transform
        }}
      >
        <StandardHeader
          title={currentChapter.title}
          showBackButton={true}
          onBackClick={() => navigate(AppRoute.HOME)}
        />
        
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
        {/* Audio Control Strip - positioned above navigation */}
        <div className="flex justify-center mb-2">
          <AudioControlStrip
            chapter={currentChapter}
            isOpen={isAudioPlayerOpen}
            onClose={handleAudioPlayerClose}
            onHighlightProgress={handleHighlightProgress}
            onScrollToPosition={handleScrollToPosition}
            onNextChapter={handleNextChapter}
            hasNextChapter={currentChapterIndex < chapters.length - 1}
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
        />
      </div>

      {/* Main Content Area */}
      <main 
        ref={contentRef}
        className="pb-36 px-10 max-w-2xl mx-auto relative"
        style={{ 
          userSelect: 'text',
          paddingTop: isAudioPlaying ? '2rem' : '10rem', // 2rem when playing, 10rem (pt-40) when not
          transform: isAudioPlaying ? 'translateY(80px)' : 'none',
          transition: 'transform 0.3s ease-out, padding-top 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >


        <div>
          {/* Chapter Header */}
          <div className="mb-8">
            <h2 className={`font-bold text-ink-primary dark:text-paper-light mb-4 leading-tight ${
              fontSize === 'sm' ? 'text-2xl' : 
              fontSize === 'base' ? 'text-2xl' : 
              fontSize === 'lg' ? 'text-3xl' : 
              'text-4xl'
            }`}>
              {currentChapter.title}
            </h2>
            {currentChapter.subtitle && (
              <p className={`text-ink-secondary dark:text-ink-muted mb-6 leading-relaxed ${
                fontSize === 'sm' ? 'text-lg' : 
                fontSize === 'base' ? 'text-lg' : 
                fontSize === 'lg' ? 'text-xl' : 
                'text-2xl'
              }`}>
                {currentChapter.subtitle}
              </p>
            )}
          </div>

          {/* Chapter Content */}
          <div className="max-w-none">
            {formatContent(currentChapter.content)}
          </div>


        </div>
      </main>

      {/* Text Selection Menu */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="selection-menu fixed z-50 bg-paper-light dark:bg-paper-dark rounded-lg shadow-lg border border-ink-muted border-opacity-20 px-2 py-1"
            style={{
              left: Math.max(16, Math.min(window.innerWidth - 150, selectedText.rect.left + selectedText.rect.width / 2 - 75)),
              top: selectedText.rect.top - 50,
            }}
          >
            <div className="flex space-x-1">
              <button
                onClick={handleSaveHighlight}
                className="px-3 py-2 text-sm font-medium text-ink-secondary dark:text-ink-muted hover:bg-ink-muted hover:bg-opacity-10 rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleAskAI}
                className="px-3 py-2 text-sm font-medium text-ink-primary dark:text-paper-light hover:bg-ink-primary hover:bg-opacity-10 rounded transition-colors"
              >
                Ask AI
              </button>
            </div>
            {/* Triangle pointer */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-ink-muted"></div>
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




    </CleanLayout>
  );
};

export default ReaderPage; 