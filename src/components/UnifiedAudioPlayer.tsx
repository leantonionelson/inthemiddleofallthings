import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Loader2,
  AlertCircle,
  Shuffle,
  Repeat
} from 'lucide-react';
import { BookChapter } from '../types';
import { audioManagerService, AudioPlaybackState } from '../services/audioManager';
import { PlaylistItem } from '../services/audioPlaylist';

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
    audioSource: null,
    playbackRate: 1.0
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [autoPlayNext, setAutoPlayNext] = useState(localStorage.getItem('audioAutoPlayNext') !== 'false');
  const [playlistState, setPlaylistState] = useState<any>(null);
  const [currentPlaylistItem, setCurrentPlaylistItem] = useState<PlaylistItem | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Initialize audio when component opens or chapter changes
  useEffect(() => {
    if (isOpen) {
      // Always initialize when the chapter changes or opens
      initializeAudio();
      isInitialized.current = true;
    } else {
      audioManagerService.stopAudio();
      isInitialized.current = false;
    }
  }, [isOpen, chapter.id]); // Use chapter.id as dependency to detect chapter changes

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
          // Auto-advance to next chapter if available and auto-play is enabled
          if (hasNextChapter && onNextChapter && autoPlayNext) {
            setTimeout(() => {
              onNextChapter();
            }, 1000);
          }
        },
        onPrevious: onPreviousChapter,
        onNext: onNextChapter,
        onTrackChange: (item: PlaylistItem, index: number) => {
          setCurrentPlaylistItem(item);
          console.log(`🎵 Track changed to: ${item.title} (${index + 1})`);
        },
        onPlaylistStateChange: (state: any) => {
          setPlaylistState(state);
        }
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const handlePlayPause = (e?: React.MouseEvent | React.TouchEvent) => {
    // Stop event propagation to prevent bubbling
    if (e) {
      e.stopPropagation();
    }
    
    console.log('🎵 UnifiedAudioPlayer: Play/Pause button clicked', {
      currentState: playbackState.isPlaying,
      audioSource: playbackState.audioSource,
      isLoading: playbackState.isLoading
    });
    
    // Don't allow interaction while loading
    if (playbackState.isLoading) {
      console.log('⏸️ UnifiedAudioPlayer: Ignoring click while loading');
      return;
    }
    
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
    audioManagerService.skipForward(15);
  };

  const handleSkipBackward = () => {
    audioManagerService.skipBackward(15);
  };

  const handleNextTrack = () => {
    audioManagerService.nextTrack();
  };

  const handlePreviousTrack = () => {
    audioManagerService.previousTrack();
  };

  const handleToggleShuffle = () => {
    audioManagerService.toggleShuffle();
    // Update playlist state
    setPlaylistState(audioManagerService.getPlaylistState());
  };

  const handleToggleRepeat = () => {
    audioManagerService.cycleRepeatMode();
    // Update playlist state
    setPlaylistState(audioManagerService.getPlaylistState());
  };

  const handlePlaybackRateChange = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    audioManagerService.setPlaybackRate(newRate);
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioManagerService.setMuted(newMuted);
  };

  const handleAutoPlayToggle = () => {
    const newAutoPlay = !autoPlayNext;
    setAutoPlayNext(newAutoPlay);
    localStorage.setItem('audioAutoPlayNext', newAutoPlay.toString());
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
              {playlistState && playlistState.items.length > 1 && (
                <div className="text-xs text-ink-secondary dark:text-ink-muted mt-1">
                  Track {playlistState.currentIndex + 1} of {playlistState.items.length}
                  {playlistState.shuffleMode && ' • Shuffled'}
                  {playlistState.repeatMode !== 'none' && ` • Repeat ${playlistState.repeatMode}`}
                </div>
              )}
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
              onTouchStart={handlePlayPause}
              disabled={playbackState.isLoading}
              className="p-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-full hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={playbackState.isPlaying ? 'Pause' : 'Play'}
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

            {/* Playlist Controls */}
            {playlistState && playlistState.items.length > 1 && (
              <>
                {/* Previous Track */}
                <button
                  onClick={handlePreviousTrack}
                  disabled={!audioManagerService.hasPreviousTrack()}
                  className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Next Track */}
                <button
                  onClick={handleNextTrack}
                  disabled={!audioManagerService.hasNextTrack()}
                  className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Shuffle */}
                <button
                  onClick={handleToggleShuffle}
                  className={`p-2 rounded-full transition-colors ${
                    playlistState.shuffleMode
                      ? 'text-ink-primary dark:text-paper-light bg-ink-muted/20 dark:bg-paper-light/20'
                      : 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                {/* Repeat */}
                <button
                  onClick={handleToggleRepeat}
                  className={`p-2 rounded-full transition-colors ${
                    playlistState.repeatMode !== 'none'
                      ? 'text-ink-primary dark:text-paper-light bg-ink-muted/20 dark:bg-paper-light/20'
                      : 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </>
            )}

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

          {/* Quick Controls */}
          <div className="flex items-center justify-center space-x-4 mt-4 pt-3 border-t border-ink-muted/20 dark:border-paper-light/20">
            {/* Speed Control */}
            <button
              onClick={handlePlaybackRateChange}
              className="px-3 py-1.5 text-sm font-medium text-ink-primary dark:text-paper-light hover:bg-ink-muted hover:bg-opacity-10 rounded-lg transition-colors min-w-[48px]"
            >
              {playbackRate}×
            </button>

            {/* Mute Button */}
            <button
              onClick={handleMuteToggle}
              className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Auto-Play Toggle */}
            <button
              onClick={handleAutoPlayToggle}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                autoPlayNext
                  ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                  : 'text-ink-secondary dark:text-ink-muted hover:bg-ink-muted hover:bg-opacity-10'
              }`}
            >
              Auto-Next
            </button>
          </div>


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
