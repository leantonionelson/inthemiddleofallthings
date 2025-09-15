import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Symbol } from './Symbol';
import { BookChapter } from '../types';
import { geminiTTSService, TTSConfig } from '../services/geminiTTS';
import { mediaSessionService } from '../services/mediaSession';

interface AudioPlayerProps {
  chapter: BookChapter;
  isOpen: boolean;
  onClose: () => void;
  onNextChapter: () => void;
  onPreviousChapter: () => void;
  userSymbol?: any;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  chapter,
  isOpen,
  onClose,
  onNextChapter,
  onPreviousChapter,
  userSymbol
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedStyle, setSelectedStyle] = useState('Gentle Guide');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimingsRef = useRef<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      initializeAudio();
    }
  }, [isOpen, chapter]);

  const initializeAudio = async () => {
    try {
      setIsGenerating(true);
      
      // Check if audio is already cached
      const isCached = await geminiTTSService.isAudioCached(chapter);
      if (isCached) {
        const cachedUrl = await geminiTTSService.getCachedAudio(chapter);
        if (cachedUrl) {
          setupAudioElement(cachedUrl);
          return;
        }
      }

      // Generate new audio with Gemini TTS
      const ttsConfig: TTSConfig = {
        voiceName: selectedVoice,
        speakingRate: 1.15 // Use faster pace
      };

      const audioData = await geminiTTSService.generateChapterAudio(chapter, ttsConfig);
      wordTimingsRef.current = audioData.wordTimings;
      setupAudioElement(audioData.audioUrl);
      setDuration(audioData.duration);
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      console.warn('Gemini TTS failed, this should not happen in production');
    } finally {
      setIsGenerating(false);
    }
  };

  const setupAudioElement = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    
    // Configure audio for background playback
    audio.crossOrigin = 'anonymous';
    
    // Set up Media Session for native mobile controls
    if (mediaSessionService.isSupported()) {
      mediaSessionService.setAudioElement(audio);
      mediaSessionService.setMetadata(chapter);
      mediaSessionService.setActionHandlers({
        onPlayPause: togglePlayPause,
        onPrevious: onPreviousChapter,
        onNext: onNextChapter,
        onSeek: (time: number) => {
          if (audioRef.current) {
            audioRef.current.currentTime = time;
          }
        }
      });
    }
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      console.log('Gemini TTS audio failed to load');
    });

    audioRef.current = audio;
  };



  const togglePlayPause = () => {
    if (isGenerating) return;

    if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      // Using Gemini TTS audio
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Audio play error:', error);
          console.log('Failed to play Gemini TTS audio');
        });
      }
    } else if ((audioRef as any).speechRef) {
      // Using speech synthesis fallback
      if (isPlaying) {
        speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
        } else {
          speechSynthesis.speak((audioRef as any).speechRef);
        }
        setIsPlaying(true);
      }
    }
  };

  const skipForward = () => {
    if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      // Using Gemini TTS audio - can seek properly
      const newTime = Math.min(currentTime + 15, duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else if ((audioRef as any).speechRef) {
      // Speech synthesis fallback - restart from new position
      const skipTime = Math.min(currentTime + 15, duration);
      setCurrentTime(skipTime);
      speechSynthesis.cancel();
      const remainingText = chapter.content.substring(Math.floor(skipTime * 16));
      const newUtterance = new SpeechSynthesisUtterance(remainingText);
      newUtterance.rate = playbackRate;
      newUtterance.pitch = 1;
      newUtterance.volume = isMuted ? 0 : 1;
      (audioRef as any).speechRef = newUtterance;
      speechSynthesis.speak(newUtterance);
      setIsPlaying(true);
    }
  };

  const skipBackward = () => {
    if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      // Using Gemini TTS audio - can seek properly
      const newTime = Math.max(currentTime - 15, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else if ((audioRef as any).speechRef) {
      // Speech synthesis fallback - restart from new position
      const skipTime = Math.max(currentTime - 15, 0);
      setCurrentTime(skipTime);
      speechSynthesis.cancel();
      const startPosition = Math.floor(skipTime * 16);
      const remainingText = chapter.content.substring(startPosition);
      const newUtterance = new SpeechSynthesisUtterance(remainingText);
      newUtterance.rate = playbackRate;
      newUtterance.pitch = 1;
      newUtterance.volume = isMuted ? 0 : 1;
      (audioRef as any).speechRef = newUtterance;
      speechSynthesis.speak(newUtterance);
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      audioRef.current.muted = !isMuted;
    } else if ((audioRef as any).speechRef) {
      (audioRef as any).speechRef.volume = isMuted ? 1 : 0;
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      audioRef.current.playbackRate = rate;
    } else if ((audioRef as any).speechRef) {
      (audioRef as any).speechRef.rate = rate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update current time periodically for speech synthesis fallback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !(audioRef.current instanceof HTMLAudioElement)) {
      // Only update time manually for speech synthesis
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          return newTime > duration ? duration : newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      speechSynthesis.cancel();
      
      // Clear Media Session metadata
      if (mediaSessionService.isSupported()) {
        mediaSessionService.clearMetadata();
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-paper-light dark:bg-paper-dark rounded-3xl p-8 max-w-md w-full shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading text-ink-primary dark:text-paper-light">
                  Listening
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-ink-muted hover:bg-opacity-10 transition-colors"
                >
                  <svg className="w-5 h-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Breathing Symbol */}
              <div className="flex justify-center mb-8">
                <motion.div
                  className="w-32 h-32"
                  animate={{
                    scale: isPlaying ? [1, 1.1, 1] : 1,
                    opacity: isPlaying ? [0.8, 1, 0.8] : 0.8
                  }}
                  transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                >
                  {userSymbol ? (
                    <Symbol
                      svgPath={userSymbol.svgPath}
                      size={128}
                      isAnimating={isPlaying}
                      metadata={userSymbol.metadata}
                      colorScheme={userSymbol.colorScheme}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <motion.div
                        className="w-full h-full rounded-full border-4 border-ink-primary dark:border-paper-light"
                        animate={{
                          scale: isPlaying ? [1, 1.2, 1] : 1,
                          opacity: isPlaying ? [0.3, 0.6, 0.3] : 0.3
                        }}
                        transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                      />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Chapter Info */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-ink-primary dark:text-paper-light mb-2">
                  {chapter.title}
                </h3>
                {chapter.subtitle && (
                  <p className="text-sm text-ink-secondary dark:text-ink-muted">
                    {chapter.subtitle}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-ink-muted mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="w-full bg-ink-muted bg-opacity-20 rounded-full h-2">
                  <motion.div
                    className="bg-ink-primary dark:bg-paper-light h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentTime / duration) * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Voice Style Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-secondary dark:text-ink-muted mb-2">
                  Voice Style
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={isGenerating || isPlaying}
                  className="w-full px-3 py-2 bg-ink-muted bg-opacity-10 border border-ink-muted border-opacity-20 rounded-lg text-ink-primary dark:text-paper-light focus:outline-none focus:ring-2 focus:ring-ink-primary dark:focus:ring-paper-light"
                >
                  <option value="neutral">Neutral</option>
                  <option value="warm">Warm</option>
                  <option value="formal">Formal</option>
                </select>
                <p className="text-xs text-ink-muted mt-1">
                  Choose the speaking style for the audio
                </p>
              </div>

              {/* Voice Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-ink-secondary dark:text-ink-muted mb-2">
                  Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={isGenerating || isPlaying}
                  className="w-full px-3 py-2 bg-ink-muted bg-opacity-10 border border-ink-muted border-opacity-20 rounded-lg text-ink-primary dark:text-paper-light focus:outline-none focus:ring-2 focus:ring-ink-primary dark:focus:ring-paper-light"
                >
                  <option value="Zephyr">Zephyr ⭐</option>
                  <option value="Nova">Nova</option>
                  <option value="Echo">Echo</option>
                </select>
                <p className="text-xs text-ink-muted mt-1">
                  Choose the voice for the audio narration
                </p>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center space-x-6 mb-6">
                <motion.button
                  onClick={onPreviousChapter}
                  className="p-3 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <SkipBack className="w-6 h-6" />
                </motion.button>

                <motion.button
                  onClick={skipBackward}
                  className="p-3 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>

                <motion.button
                  onClick={togglePlayPause}
                  disabled={isGenerating}
                  className={`p-6 rounded-full shadow-lg ${
                    isGenerating 
                      ? 'bg-ink-muted cursor-not-allowed' 
                      : 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                  }`}
                  whileHover={!isGenerating ? { scale: 1.05 } : {}}
                  whileTap={!isGenerating ? { scale: 0.95 } : {}}
                >
                  {isGenerating ? (
                    <div className="w-8 h-8 border-2 border-paper-light border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </motion.button>

                <motion.button
                  onClick={skipForward}
                  className="p-3 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5l9 2-9 18-9-18 9-2zm0 0v8" />
                  </svg>
                </motion.button>

                <motion.button
                  onClick={onNextChapter}
                  className="p-3 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <SkipForward className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Secondary Controls */}
              <div className="flex items-center justify-between">
                {/* Download Button */}
                <motion.button
                  onClick={() => console.log('Download functionality not implemented')}
                  className="p-3 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Download audio file (not implemented)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </motion.button>

                <motion.button
                  onClick={toggleMute}
                  className="p-3 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </motion.button>

                <div className="flex space-x-2">
                  {[0.75, 1, 1.25, 1.5].map((rate) => (
                    <motion.button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        playbackRate === rate
                          ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                          : 'bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {rate}x
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioPlayer;
