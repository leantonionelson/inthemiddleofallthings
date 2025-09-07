import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, BookChapter, TextHighlight } from '../../types';
import { loadBookChapters, fallbackChapters } from '../../data/bookContent';
import CleanLayout from '../../components/CleanLayout';
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
  isManualSelection?: boolean;
}

const ReaderPage: React.FC<ReaderPageProps> = ({ onOpenAI }) => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [isTextSelected, setIsTextSelected] = useState(false);
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
          const isManual = selection.toString().trim().length > 0;
          setSelectedText({
            text: selection.toString().trim(),
            range: range.cloneRange(),
            rect,
            isManualSelection: isManual
          });
          setIsTextSelected(isManual);
          
          // Apply native-like selection styling
          if (isManual) {
            const style = document.createElement('style');
            style.id = 'native-selection-style';
            style.textContent = `
              ::selection {
                background-color: rgba(0, 123, 255, 0.3) !important;
                color: inherit !important;
              }
              ::-moz-selection {
                background-color: rgba(0, 123, 255, 0.3) !important;
                color: inherit !important;
              }
            `;
            document.head.appendChild(style);
          }
        }
      } else {
        setSelectedText(null);
        setIsTextSelected(false);
        
        // Remove custom selection styling
        const existingStyle = document.getElementById('native-selection-style');
        if (existingStyle) {
          existingStyle.remove();
        }
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      // Cleanup on unmount
      const existingStyle = document.getElementById('native-selection-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
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
      {/* ChapterInfo only - no header */}
      <div 
        className="fixed top-0 left-0 right-0 z-40"
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
          paddingTop: isAudioPlaying ? '2rem' : '6rem', // 2rem when playing, 10rem (pt-40) when not
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="selection-menu fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 px-1 py-1"
            style={{
              left: Math.max(16, Math.min(window.innerWidth - 160, selectedText.rect.left + selectedText.rect.width / 2 - 80)),
              top: Math.max(16, selectedText.rect.top - 60),
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <div className="flex space-x-0">
              <button
                onClick={handleSaveHighlight}
                className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center space-x-2 min-w-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save</span>
              </button>
              <button
                onClick={handleAskAI}
                className="px-4 py-3 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex items-center space-x-2 min-w-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ask AI</span>
              </button>
            </div>
            {/* Triangle pointer */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(255, 255, 255, 0.95)',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
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




    </CleanLayout>
  );
};

export default ReaderPage; 