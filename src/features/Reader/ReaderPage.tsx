import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, BookChapter, TextHighlight } from '../../types';
import { loadBookChapters, fallbackChapters } from '../../data/bookContent';
import CleanLayout from '../../components/CleanLayout';
import ReaderNavigation from '../../components/ReaderNavigation';
import ChapterInfo from '../../components/ChapterInfo';
import { useScrollTransition } from '../../hooks/useScrollTransition';

import UnifiedAudioPlayer from '../../components/UnifiedAudioPlayer';
import { highlightsService } from '../../services/firebaseHighlights';
import { authService } from '../../services/firebaseAuth';
import { useUserCapabilities } from '../../hooks/useUserCapabilities';
import UpgradePrompt from '../../components/UpgradePrompt';

interface ReaderPageProps {
  onOpenAI?: () => void;
  onCloseAI?: () => void;
}

interface TextSelection {
  text: string;
  range: Range;
  rect: DOMRect;
  isManualSelection?: boolean;
}


const ReaderPage: React.FC<ReaderPageProps> = ({ onOpenAI, onCloseAI }) => {
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
          
          // Apply native-like selection styling with proper dark/light mode colors
          if (isManual) {
            const style = document.createElement('style');
            style.id = 'native-selection-style';
            style.textContent = `
              /* Light mode selection - white text on black highlight */
              ::selection {
                background-color: rgba(15, 15, 15, 0.9) !important;
                color: #FAFAFA !important;
              }
              ::-moz-selection {
                background-color: rgba(15, 15, 15, 0.9) !important;
                color: #FAFAFA !important;
              }
              
              /* Dark mode selection - black text on white highlight */
              .dark ::selection {
                background-color: rgba(250, 250, 250, 0.9) !important;
                color: #0F0F0F !important;
              }
              .dark ::-moz-selection {
                background-color: rgba(250, 250, 250, 0.9) !important;
                color: #0F0F0F !important;
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

  const handleSaveHighlight = async () => {
    if (selectedText) {
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
          chapterId: currentChapter.id,
          chapterTitle: currentChapter.title,
          timestamp: new Date(),
          position: {
            start: 0, // Would need to calculate actual position
            end: selectedText.text.length
          }
        };
        
        // Save to Firebase for authenticated users
        const currentUser = authService.getCurrentUser();
        if (currentUser && !currentUser.isAnonymous) {
          await highlightsService.saveHighlight(currentUser.uid, newHighlight);
          console.log('Highlight saved to Firebase');
        } else {
          // Save to localStorage for anonymous/free users
          const existingHighlights = localStorage.getItem('savedHighlights');
          const highlights = existingHighlights ? JSON.parse(existingHighlights) : [];
          highlights.push(newHighlight);
          localStorage.setItem('savedHighlights', JSON.stringify(highlights));
          console.log('Highlight saved to localStorage');
        }
        
        // Update local state
        setSavedHighlights(prev => [...prev, newHighlight]);
        
        // Clear selection
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
        
        // Show success feedback
        console.log('Highlight saved successfully!');
        
      } catch (error) {
        console.error('Error saving highlight:', error);
        // Fallback to localStorage
        const existingHighlights = localStorage.getItem('savedHighlights');
        const highlights = existingHighlights ? JSON.parse(existingHighlights) : [];
        highlights.push({
          id: Date.now().toString(),
          text: selectedText.text,
          chapterId: currentChapter.id,
          chapterTitle: currentChapter.title,
          timestamp: new Date(),
          position: {
            start: 0,
            end: selectedText.text.length
          }
        });
        localStorage.setItem('savedHighlights', JSON.stringify(highlights));
        
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
        console.log('Highlight saved to localStorage as fallback');
      }
    }
  };

  const handleAskAI = () => {
    // Check if user can use AI
    if (!userCapabilities.canUseAI) {
      setUpgradeFeature('ai');
      setShowUpgradePrompt(true);
      return;
    }

    if (selectedText) {
      // Store selected text in context for AI
      localStorage.setItem('selectedTextForAI', selectedText.text);
      // Don't clear selection immediately - let the AI drawer handle it
      // This allows for better UX when switching between selections
    }
    if (onOpenAI) {
      onOpenAI();
    }
  };

  // Function to clear selection when AI drawer is closed
  const clearSelection = useCallback(() => {
    setSelectedText(null);
    setIsTextSelected(false);
    window.getSelection()?.removeAllRanges();
    
    // Remove custom selection styling
    const existingStyle = document.getElementById('native-selection-style');
    if (existingStyle) {
      existingStyle.remove();
    }
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
        <p key={index} className={`mb-6 leading-8 lg:leading-10 text-ink-primary dark:text-paper-light ${
          fontSize === 'sm' ? 'text-sm lg:text-base' : 
          fontSize === 'base' ? 'text-base lg:text-lg' : 
          fontSize === 'lg' ? 'text-lg lg:text-xl' : 
          'text-xl lg:text-2xl'
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
        />
      </div>

      {/* Main Content Area */}
      <main 
        ref={contentRef}
        className={`reader-content relative ${
          // Mobile styles
          'pb-36 px-6 max-w-2xl mx-auto'
        } ${
          // Desktop styles - consistent top padding
          'lg:pb-20 lg:px-8 lg:max-w-4xl lg:pt-8'
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
            {formatContent(currentChapter.content)}
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

export default ReaderPage; 