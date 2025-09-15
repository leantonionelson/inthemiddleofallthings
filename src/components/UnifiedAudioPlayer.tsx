import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Settings, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { BookChapter } from '../types';
import { audioManagerService, AudioPlaybackState } from '../services/audioManager';

interface UnifiedAudioPlayerProps {
  chapter: BookChapter;
  isOpen: boolean;
  onClose: () => void;
  onHighlightProgress?: (progress: number) => void;
  onScrollToPosition?: (position: number) => void;
  onNextChapter?: () => void;
  onPreviousChapter?: () => void;
  hasNextChapter?: boolean;
  hasPreviousChapter?: boolean;
  autoPlay?: boolean;
}

const UnifiedAudioPlayer: React.FC<UnifiedAudioPlayerProps> = ({
  chapter,
  isOpen,
  onClose,
  onHighlightProgress,
  onScrollToPosition,
  onNextChapter,
  onPreviousChapter,
  hasNextChapter = false,
  hasPreviousChapter = false,
  autoPlay = false
}) => {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
    audioSource: null
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Initialize audio when component opens
  useEffect(() => {
    if (isOpen && !isInitialized.current) {
      initializeAudio();
      isInitialized.current = true;
    } else if (!isOpen) {
      audioManagerService.stopAudio();
      isInitialized.current = false;
    }
  }, [isOpen, chapter]);

  // Auto-play if enabled
  useEffect(() => {
    if (isOpen && autoPlay && playbackState.audioSource && !playbackState.isPlaying && !playbackState.isLoading) {
      audioManagerService.togglePlayPause();
    }
  }, [isOpen, autoPlay, playbackState.audioSource, playbackState.isPlaying, playbackState.isLoading]);

  const initializeAudio = async () => {
    try {
      await audioManagerService.initializeAudio(chapter, {
        onPlaybackStateChange: (state) => {
          setPlaybackState(state);
        },
        onProgress: (progress) => {
          onHighlightProgress?.(progress);
        },
        onError: (error) => {
          console.error('Audio error:', error);
        },
        onComplete: () => {
          // Auto-advance to next chapter if available
          if (hasNextChapter && onNextChapter) {
            setTimeout(() => {
              onNextChapter();
            }, 1000);
          }
        },
        onPrevious: onPreviousChapter,
        onNext: onNextChapter
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const handlePlayPause = () => {
    audioManagerService.togglePlayPause();
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !playbackState.duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * playbackState.duration;
    
    audioManagerService.seekTo(newTime);
    onScrollToPosition?.(progress);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(playbackState.currentTime + 15, playbackState.duration);
    audioManagerService.seekTo(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(playbackState.currentTime - 15, 0);
    audioManagerService.seekTo(newTime);
  };

  const handleNextChapter = () => {
    if (hasNextChapter && onNextChapter) {
      onNextChapter();
    }
  };

  const handlePreviousChapter = () => {
    if (hasPreviousChapter && onPreviousChapter) {
      onPreviousChapter();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioSourceLabel = (source: string | null): string => {
    switch (source) {
      case 'pre-generated': return 'Pre-generated Audio';
      case 'gemini-tts': return 'AI-Generated Audio';
      case 'browser-speech': return 'Browser Speech';
      default: return 'Audio';
    }
  };

  const getAudioSourceColor = (source: string | null): string => {
    switch (source) {
      case 'pre-generated': return 'text-green-600 dark:text-green-400';
      case 'gemini-tts': return 'text-blue-600 dark:text-blue-400';
      case 'browser-speech': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-lg border-t border-ink-muted/20 dark:border-paper-light/20"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-ink-primary dark:text-paper-light truncate">
                {chapter.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs ${getAudioSourceColor(playbackState.audioSource)}`}>
                  {getAudioSourceLabel(playbackState.audioSource)}
                </span>
                {playbackState.error && (
                  <span className="text-xs text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Error
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div
              ref={progressRef}
              className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-full cursor-pointer relative"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-ink-primary dark:bg-paper-light rounded-full transition-all duration-100"
                style={{
                  width: playbackState.duration 
                    ? `${(playbackState.currentTime / playbackState.duration) * 100}%` 
                    : '0%'
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-ink-secondary dark:text-ink-muted mt-1">
              <span>{formatTime(playbackState.currentTime)}</span>
              <span>{formatTime(playbackState.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            {/* Previous Chapter */}
            <button
              onClick={handlePreviousChapter}
              disabled={!hasPreviousChapter}
              className={`p-2 rounded-full transition-colors ${
                hasPreviousChapter
                  ? 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10'
                  : 'text-ink-muted/50 dark:text-ink-muted/50 cursor-not-allowed'
              }`}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Skip Backward */}
            <button
              onClick={handleSkipBackward}
              className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 rounded-full transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              disabled={playbackState.isLoading}
              className="p-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-full hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {playbackState.isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : playbackState.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={handleSkipForward}
              className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 rounded-full transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Next Chapter */}
            <button
              onClick={handleNextChapter}
              disabled={!hasNextChapter}
              className={`p-2 rounded-full transition-colors ${
                hasNextChapter
                  ? 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10'
                  : 'text-ink-muted/50 dark:text-ink-muted/50 cursor-not-allowed'
              }`}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-ink-muted/20 dark:border-paper-light/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-secondary dark:text-ink-muted">
                    Playback Speed
                  </span>
                  <div className="flex space-x-2">
                    {[0.75, 1, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          playbackRate === rate
                            ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                            : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {playbackState.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {playbackState.error}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedAudioPlayer;
