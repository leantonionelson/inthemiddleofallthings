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

  // Subscribe to audio playback state changes (optimized with requestAnimationFrame)
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

    // Use requestAnimationFrame for smoother updates (only when audio is playing)
    let animationFrameId: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 100; // Update every 100ms for smooth highlighting

    const updateState = (timestamp: number) => {
      const state = audioManagerService.getPlaybackState();
      
      // Throttle updates to every 100ms
      if (timestamp - lastUpdateTime >= UPDATE_INTERVAL) {
        setPlaybackState(state);
        setIsAudioPlaying(state.isPlaying);
        lastUpdateTime = timestamp;
      }
      
      // Continue polling if audio player is open (check state to see if still playing)
      if (isAudioPlayerOpen) {
        animationFrameId = requestAnimationFrame(updateState);
      }
    };

    // Start polling
    animationFrameId = requestAnimationFrame(updateState);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
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
      return fontSize === 'sm' ? 'text-2xl' : 
             fontSize === 'base' ? 'text-2xl' : 
             fontSize === 'lg' ? 'text-3xl' : 
             'text-4xl';
    } else {
      return fontSize === 'sm' ? 'text-2xl' : 
             fontSize === 'base' ? 'text-2xl' : 
             fontSize === 'lg' ? 'text-3xl' : 
             'text-4xl';
    }
  };

  // Get subtitle font size classes
  const getSubtitleSizeClasses = () => {
    return fontSize === 'sm' ? 'text-lg' : 
           fontSize === 'base' ? 'text-lg' : 
           fontSize === 'lg' ? 'text-xl' : 
           'text-2xl';
  };

  return (
    <>
      {/* Mobile Header - ChapterInfo only for chapters */}
      {showMobileHeader && contentType === 'chapter' && (
        <div 
          className="fixed top-0 left-0 right-0 z-40"
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
      <article
        ref={contentRef}
        className={`reader-content relative px-6 max-w-2xl mx-auto ${
          isAudioPlayerOpen ? 'pb-48' : ''
        }`}
        style={{ 
          paddingTop: getPaddingTop(),
          transform: isAudioPlaying ? 'translateY(80px)' : 'none',
          transition: 'transform 0.3s ease-out, padding-top 0.3s ease-out'
        }}
        onTouchStart={swipeHandlers.handleTouchStart}
        onTouchMove={swipeHandlers.handleTouchMove}
        onTouchEnd={swipeHandlers.handleTouchEnd}
        itemScope
        itemType="https://schema.org/Article"
      >
        <div>
          {/* Header */}
          <header className="mb-8">
            {/* Title */}
            <h1 className={`font-bold text-left text-ink-primary dark:text-paper-light mb-4 leading-tight ${getTitleSizeClasses()}`} itemProp="headline">
              {title}
            </h1>

            {/* Subtitle or Tags */}
            {subtitle && (
              <p className={`text-left text-ink-secondary dark:text-ink-muted mb-6 leading-relaxed ${getSubtitleSizeClasses()}`} itemProp="description">
                {subtitle}
              </p>
            )}
            
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6" role="list" aria-label="Content tags">
                {tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="px-3 py-1 bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted rounded-full text-sm"
                    role="listitem"
                    itemProp="keywords"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <section className="max-w-none" itemProp="articleBody">
            <ContentFormatter 
              content={content}
              fontSize={fontSize}
              currentTime={playbackState?.currentTime || 0}
              duration={playbackState?.duration || 0}
              isPlaying={playbackState?.isPlaying || false}
            />
          </section>
        </div>
      </article>
    </>
  );
};

export default React.memo(ContentReaderLayout);

