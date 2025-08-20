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

  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null);

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
    } else {
      // If audio player is closed, open it and enable auto-play
      setIsAudioPlayerOpen(true);
      setIsListening(true);
      // Enable auto-play when the play button is clicked
      localStorage.setItem('autoPlayAudio', 'true');
    }
  };





  const handleHighlightText = (startIndex: number, endIndex: number) => {
    if (startIndex === -1 && endIndex === -1) {
      setHighlightedRange(null);
    } else {
      setHighlightedRange({ start: startIndex, end: endIndex });
    }
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
    return content.split('\n\n').map((paragraph, index) => {
      // Simple text formatting - just bold and italic for now
      let formattedParagraph = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Add cumulative highlighting if there's a highlighted range
      if (highlightedRange && highlightedRange.start >= 0 && highlightedRange.end >= 0) {
        const { start, end } = highlightedRange;
        
        // Find the paragraph boundaries within the content
        const paragraphStart = content.indexOf(paragraph);
        const paragraphEnd = paragraphStart + paragraph.length;
        
        // Check if highlighting should affect this paragraph
        if (start < paragraphEnd && end > paragraphStart) {
          const localStart = Math.max(0, start - paragraphStart);
          const localEnd = Math.min(paragraph.length, end - paragraphStart);
          
          if (localStart < localEnd) {
            // Split the paragraph into highlighted and non-highlighted parts
            const beforeHighlight = formattedParagraph.substring(0, localStart);
            const highlightedText = formattedParagraph.substring(localStart, localEnd);
            const afterHighlight = formattedParagraph.substring(localEnd);
            
            formattedParagraph = `${beforeHighlight}<span class="bg-blue-200 dark:bg-blue-800 bg-opacity-50 dark:bg-opacity-30 transition-all duration-200">${highlightedText}</span>${afterHighlight}`;
          } else if (paragraphStart < end) {
            // Entire paragraph should be highlighted
            formattedParagraph = `<span class="bg-blue-200 dark:bg-blue-800 bg-opacity-50 dark:bg-opacity-30 transition-all duration-200">${formattedParagraph}</span>`;
          }
        }
      }

      return (
        <p 
          key={index} 
          className="mb-6 text-lg leading-8 text-ink-primary dark:text-paper-light"
          dangerouslySetInnerHTML={{ __html: formattedParagraph }}
        />
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
    >
      {/* Header with scroll transition */}
      <div 
        className="fixed top-0 left-0 right-0 z-40"
        style={headerScrollTransition.style}
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

      {/* Reader Navigation - positioned above bottom menu */}
      <div 
        className="fixed bottom-20 left-0 right-0 z-40"
        style={readerNavScrollTransition.style}
      >
        <ReaderNavigation
          currentChapterIndex={currentChapterIndex}
          totalChapters={chapters.length}
          isListening={isListening}
          onPreviousChapter={handlePreviousChapter}
          onNextChapter={handleNextChapter}
          onToggleListen={handleListen}
          showShadow={!isAudioPlayerOpen}
        />
      </div>

      {/* Main Content Area */}
      <main 
        ref={contentRef}
        className="pt-28 pb-32 px-10 max-w-2xl mx-auto relative"
        style={{ userSelect: 'text' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >


        <div className="py-12">
          {/* Chapter Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink-primary dark:text-paper-light mb-4 leading-tight">
              {currentChapter.title}
            </h2>
            {currentChapter.subtitle && (
              <p className="text-xl text-ink-secondary dark:text-ink-muted mb-6 leading-relaxed">
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



      {/* Audio Control Strip */}
      <AudioControlStrip
        chapter={currentChapter}
        isOpen={isAudioPlayerOpen}
        onClose={handleAudioPlayerClose}
        onHighlightText={handleHighlightText}
        onScrollToPosition={handleScrollToPosition}
        onNextChapter={handleNextChapter}
        hasNextChapter={currentChapterIndex < chapters.length - 1}
        autoPlay={localStorage.getItem('autoPlayAudio') === 'true'}
      />
    </CleanLayout>
  );
};

export default ReaderPage; 