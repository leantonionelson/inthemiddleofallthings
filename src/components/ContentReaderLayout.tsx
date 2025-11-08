import React, { useRef } from 'react';
import { useScrollTransition } from '../hooks/useScrollTransition';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import ReaderNavigation from './ReaderNavigation';
import UnifiedAudioPlayer from './UnifiedAudioPlayer';
import ContentFormatter from './ContentFormatter';
import ChapterInfo from './ChapterInfo';
import { BookChapter } from '../types';
import { audioManagerService, AudioPlaybackState } from '../services/audioManager';

interface ContentReaderLayoutProps {
  content: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  currentIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  onListen: () => void;
  isListening: boolean;
  isAudioPlayerOpen: boolean;
  onAudioPlayerClose: () => void;
  onScrollToPosition: (position: number) => void;
  contentType: 'chapter' | 'meditation' | 'story';
  contentId: string;
  contentTitle: string;
  fontSize: string;
  mainScrollRef?: React.RefObject<HTMLElement>;
  showMobileHeader?: boolean;
  chapter?: BookChapter;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

const ContentReaderLayout: React.FC<ContentReaderLayoutProps> = ({
  content,
  title,
  subtitle,
  tags,
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  onListen,
  isListening,
  isAudioPlayerOpen,
  onAudioPlayerClose,
  onScrollToPosition,
  contentType,
  contentId,
  contentTitle,
  fontSize,
  mainScrollRef,
  showMobileHeader = false,
  chapter,
  contentRef: externalContentRef
}) => {
  const internalContentRef = useRef<HTMLDivElement>(null);
  const contentRef = externalContentRef || internalContentRef;
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const [playbackState, setPlaybackState] = React.useState<AudioPlaybackState | null>(null);

  // Subscribe to audio playback state changes (polling approach to avoid conflicts with UnifiedAudioPlayer)
  React.useEffect(() => {
    if (!isAudioPlayerOpen) {
      setPlaybackState(null);
      setIsAudioPlaying(false);
      return;
    }

    // Get initial state
    const currentState = audioManagerService.getPlaybackState();
    setPlaybackState(currentState);
    setIsAudioPlaying(currentState.isPlaying);

    // Poll for state updates (audioManager updates state internally)
    const interval = setInterval(() => {
      const state = audioManagerService.getPlaybackState();
      setPlaybackState(state);
      setIsAudioPlaying(state.isPlaying);
    }, 100); // Update every 100ms for smooth highlighting

    return () => {
      clearInterval(interval);
    };
  }, [isAudioPlayerOpen, chapter?.id]);

  // Scroll transition hooks
  const headerScrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 120,
    direction: 'up'
  }, mainScrollRef);

  const readerNavScrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 80,
    direction: 'down'
  }, mainScrollRef);

  const combinedTransitionStyle = {
    ...readerNavScrollTransition.style,
    transform: isAudioPlaying 
      ? 'translateY(80px)'
      : readerNavScrollTransition.style.transform
  };

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious
  });

  // Determine padding top based on content type and audio state
  const getPaddingTop = () => {
    if (contentType === 'chapter') {
      return isAudioPlaying ? '2rem' : '6rem';
    } else {
      return isAudioPlaying ? '7rem' : '8rem';
    }
  };

  // Get title font size classes
  const getTitleSizeClasses = () => {
    if (contentType === 'chapter') {
      return fontSize === 'sm' ? 'text-2xl lg:text-3xl' : 
             fontSize === 'base' ? 'text-2xl lg:text-3xl' : 
             fontSize === 'lg' ? 'text-3xl lg:text-4xl' : 
             'text-4xl lg:text-5xl';
    } else {
      return fontSize === 'sm' ? 'text-2xl' : 
             fontSize === 'base' ? 'text-2xl' : 
             fontSize === 'lg' ? 'text-3xl' : 
             'text-4xl';
    }
  };

  // Get subtitle font size classes
  const getSubtitleSizeClasses = () => {
    return fontSize === 'sm' ? 'text-lg lg:text-xl' : 
           fontSize === 'base' ? 'text-lg lg:text-xl' : 
           fontSize === 'lg' ? 'text-xl lg:text-2xl' : 
           'text-2xl lg:text-3xl';
  };

  return (
    <>
      {/* Mobile Header - ChapterInfo only for chapters */}
      {showMobileHeader && contentType === 'chapter' && (
        <div 
          className="lg:hidden fixed top-0 left-0 right-0 z-40"
          style={{
            ...headerScrollTransition.style,
            transform: isAudioPlaying 
              ? 'translateY(-120px)'
              : headerScrollTransition.style.transform
          }}
        >
          <ChapterInfo
            currentChapterIndex={currentIndex}
            totalChapters={totalItems}
          />
        </div>
      )}

      {/* Unified Audio Player - Fixed position, not affected by scroll */}
      <UnifiedAudioPlayer
        chapter={chapter || {
          id: contentId,
          title: contentTitle,
          content: content,
          part: contentType === 'chapter' ? 'Book' : contentType === 'meditation' ? 'Meditation' : 'Story',
          chapterNumber: currentIndex + 1,
          totalChapters: totalItems
        }}
        isOpen={isAudioPlayerOpen}
        onClose={onAudioPlayerClose}
        onScrollToPosition={onScrollToPosition}
        onNextChapter={onNext}
        onPreviousChapter={onPrevious}
        hasNextChapter={currentIndex < totalItems - 1}
        hasPreviousChapter={currentIndex > 0}
        autoPlay={localStorage.getItem('autoPlayAudio') === 'true'}
      />

      {/* Reader Navigation - Can move with scroll */}
      <div 
        className="fixed bottom-[85px] left-0 right-0 z-40"
        style={combinedTransitionStyle}
      >
        <ReaderNavigation
          currentChapterIndex={currentIndex}
          totalChapters={totalItems}
          isListening={isListening}
          onPreviousChapter={onPrevious}
          onNextChapter={onNext}
          onToggleListen={onListen}
          showShadow={!isAudioPlayerOpen}
          contentType={contentType}
          contentId={contentId}
          contentTitle={contentTitle}
          content={content}
        />
      </div>

      {/* Main Content Area */}
      <main
        ref={contentRef}
        className={`reader-content relative px-6 max-w-2xl mx-auto ${
          isAudioPlayerOpen ? 'pb-48' : ''
        } lg:px-8 lg:max-w-4xl lg:pt-8 ${
          isAudioPlayerOpen ? 'lg:pb-32' : ''
        }`}
        style={{ 
          paddingTop: getPaddingTop(),
          transform: isAudioPlaying ? 'translateY(80px)' : 'none',
          transition: 'transform 0.3s ease-out, padding-top 0.3s ease-out'
        }}
        onTouchStart={swipeHandlers.handleTouchStart}
        onTouchMove={swipeHandlers.handleTouchMove}
        onTouchEnd={swipeHandlers.handleTouchEnd}
      >
        <div>
          {/* Header */}
          <div className="mb-8">
            {/* Desktop Chapter Info and Navigation - only for chapters */}
            {contentType === 'chapter' && (
              <div className="hidden lg:flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-secondary dark:text-ink-muted">
                    Chapter {currentIndex + 1} of {totalItems}
                  </span>
                  <div className="w-px h-4 bg-ink-muted/20 dark:bg-paper-light/20" />
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-ink-muted/10 dark:bg-paper-light/10 rounded-full h-1">
                      <div 
                        className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-secondary dark:text-ink-muted">
                      {Math.round(((currentIndex + 1) / totalItems) * 100)}%
                    </span>
                  </div>
                </div>
                
                {/* Desktop Navigation Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={onNext}
                    disabled={currentIndex === totalItems - 1}
                    className="p-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            {/* Title */}
            <h2 className={`font-bold text-left text-ink-primary dark:text-paper-light mb-4 leading-tight ${getTitleSizeClasses()}`}>
              {title}
            </h2>

            {/* Subtitle or Tags */}
            {subtitle && (
              <p className={`text-left text-ink-secondary dark:text-ink-muted mb-6 leading-relaxed ${getSubtitleSizeClasses()}`}>
                {subtitle}
              </p>
            )}
            
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="px-3 py-1 bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="max-w-none">
            <ContentFormatter 
              content={content}
              fontSize={fontSize}
              currentTime={playbackState?.currentTime || 0}
              duration={playbackState?.duration || 0}
              isPlaying={playbackState?.isPlaying || false}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default ContentReaderLayout;

