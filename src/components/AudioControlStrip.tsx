import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { BookChapter } from '../types';
import { geminiTTSService, TTSConfig } from '../services/geminiTTS';

// Utility function for consistent text cleaning
const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .trim();
};

interface AudioControlStripProps {
  chapter: BookChapter;
  isOpen: boolean;
  onClose: () => void;
  onHighlightProgress?: (progress: number) => void;
  onScrollToPosition?: (position: number) => void;
  onNextChapter?: () => void;
  hasNextChapter?: boolean;
  autoPlay?: boolean;
}

const AudioControlStrip: React.FC<AudioControlStripProps> = ({
  chapter,
  isOpen,
  onClose,
  onHighlightProgress,
  onScrollToPosition,
  onNextChapter,
  hasNextChapter = false,
  autoPlay = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const [isUsingBrowserSpeech, setIsUsingBrowserSpeech] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordTimingsRef = useRef<number[]>([]);
  const browserSpeechIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorHandlerRef = useRef<((e: Event) => void) | null>(null);



  useEffect(() => {
    if (isOpen) {
      // Clean up any existing audio before initializing new one
      if (audioRef.current) {
        stopAudio();
      }
      initializeAudio();
    } else {
      stopAudio();
    }
  }, [isOpen, chapter]);

  // Check API availability on mount
  useEffect(() => {
    const checkApiAvailability = () => {
      const available = geminiTTSService.isApiAvailable();
      setIsApiAvailable(available);
    };
    
    checkApiAvailability();
    // Check every 5 minutes
    const interval = setInterval(checkApiAvailability, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (audioRef.current) {
        stopAudio();
      }
      if (browserSpeechIntervalRef.current) {
        clearInterval(browserSpeechIntervalRef.current);
      }
    };
  }, []);

  const initializeAudio = async () => {
    try {
      setIsGenerating(true);
      
      // Clean text for processing using the utility function
      const cleanText = cleanTextForSpeech(chapter.content);
      
      // Split content into words for highlighting
      const words = cleanText.split(/\s+/);
      wordsRef.current = words;
      
      console.log('🎯 Initializing audio...');
      
      // Generate audio with Gemini TTS (handles caching internally)
      const ttsConfig: TTSConfig = {
        voiceName: 'Zephyr',
        speakingRate: 1.15, // Faster, more lecturer-like pace
      };

      const audioData = await geminiTTSService.generateChapterAudio(chapter, ttsConfig);
      wordTimingsRef.current = audioData.wordTimings;
      setupAudioElement(audioData.audioUrl);
      setDuration(audioData.duration);
      
      console.log('✅ Audio initialization complete');
      
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
          console.error('Rate limit exceeded - daily quota reached');
          setIsApiAvailable(false);
          // Show user-friendly message and offer browser speech
          console.log('Switching to browser speech synthesis due to rate limit');
          setupBrowserSpeech();
          return;
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          console.error('API quota exceeded');
          setIsApiAvailable(false);
          console.log('Switching to browser speech synthesis due to quota exceeded');
          setupBrowserSpeech();
          return;
        }
      }
      
      // For other errors, try browser speech as fallback
      console.warn('Audio generation failed, switching to browser speech');
      setIsApiAvailable(false);
      setupBrowserSpeech();
    } finally {
      setIsGenerating(false);
    }
  };

  const setupBrowserSpeech = () => {
    console.log('Setting up browser speech synthesis');
    
    // Cancel any existing speech synthesis
    speechSynthesis.cancel();
    
    // Check if speech synthesis is supported
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      alert('Speech synthesis is not supported in your browser. Please try a different browser or try again later.');
      return;
    }

    try {
      // Clean text for speech synthesis
      const cleanText = chapter.content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
        .trim();

      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Configure speech settings
      utterance.rate = 0.8; // Slightly slower for better comprehension
      utterance.pitch = 1.0;
      utterance.volume = isMuted ? 0 : 1.0;
      
      // Try to find a natural voice
      const voices = speechSynthesis.getVoices();
      let preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Natural') || voice.name.includes('Premium') || !voice.name.includes('Google'))
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      // If no voices are available yet, wait for them to load
      if (!preferredVoice && voices.length === 0) {
        console.log('Waiting for voices to load...');
        speechSynthesis.onvoiceschanged = () => {
          const loadedVoices = speechSynthesis.getVoices();
          preferredVoice = loadedVoices.find(voice => voice.lang.startsWith('en')) || loadedVoices[0];
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log('Using voice:', preferredVoice.name);
          }
        };
      } else if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using voice:', preferredVoice.name);
      }

      // Set up event listeners
      utterance.onstart = () => {
        console.log('Browser speech started');
        setIsPlaying(true);
        setIsUsingBrowserSpeech(true);
        startBrowserSpeechHighlighting();
      };

      utterance.onend = () => {
        console.log('Browser speech ended');
        setIsPlaying(false);
        setCurrentWordIndex(0);
        clearHighlight();
        stopBrowserSpeechHighlighting();
        
        // Auto-advance to next chapter if available
        if (hasNextChapter && onNextChapter) {
          setTimeout(() => {
            onNextChapter();
          }, 1000);
        }
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsPlaying(false);
        setIsUsingBrowserSpeech(false);
        
        // Don't show alert for interrupted errors (user likely stopped it)
        if (error.error !== 'interrupted') {
          console.warn('Speech synthesis failed, but continuing with text highlighting');
        }
      };

      speechUtteranceRef.current = utterance;
      
      // Auto-play if enabled
      if (autoPlayEnabled) {
        setTimeout(() => {
          speechSynthesis.speak(utterance);
        }, 500);
      }
      
      // Set estimated duration (rough calculation)
      const estimatedDuration = cleanText.length * 0.08; // About 0.08 seconds per character
      setDuration(estimatedDuration);

    } catch (error) {
      console.error('Error setting up browser speech:', error);
      alert('Failed to set up speech synthesis. Please try again.');
    }
  };

  const setupAudioElement = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      
      // Use the accurate word timings from the TTS service if available
      // Only create evenly spaced timings as a fallback if no accurate timings exist
      if (wordTimingsRef.current.length === 0) {
        const totalWords = wordsRef.current.length;
        const totalDuration = audio.duration * 1000; // Convert to milliseconds
        
        // Create evenly spaced word timings as fallback
        wordTimingsRef.current = Array.from({ length: totalWords }, (_, i) => {
          return (i / totalWords) * totalDuration;
        });
      }
      
      // Auto-play if enabled
      if (autoPlayEnabled && !isGenerating) {
        setTimeout(() => {
          audio.play().then(() => {
            setIsPlaying(true);
          }).catch(error => {
            console.error('Auto-play failed:', error);
          });
        }, 500);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (audioRef.current === audio) {
        const currentTime = audio.currentTime;
        
        // Update progress-based highlighting for smooth motion
        updateHighlightProgress(currentTime, audio.duration || 1);
        

      }
    });
    
    // Add a very frequent update for ultra-smooth highlighting
    const smoothUpdateInterval = setInterval(() => {
      if (audioRef.current === audio && isPlaying) {
        const currentTime = audio.currentTime;
        const duration = audio.duration || 1;
        
        // Update progress-based highlighting for smooth motion
        updateHighlightProgress(currentTime, duration);
      }
    }, 16); // Update every 16ms (~60fps) for ultra-smooth motion
    
    // Clean up interval when audio element is removed
    audio.addEventListener('ended', () => clearInterval(smoothUpdateInterval));
    audio.addEventListener('pause', () => clearInterval(smoothUpdateInterval));

    audio.addEventListener('ended', () => {
      // Only handle ended event if this is the current audio element
      if (audioRef.current === audio) {
        console.log('Audio playback completed');
        setIsPlaying(false);
        setCurrentWordIndex(0);
        clearHighlight();
        
        // Auto-advance to next chapter if available
        if (hasNextChapter && onNextChapter) {
          setTimeout(() => {
            onNextChapter();
          }, 1000); // Wait 1 second before advancing
        } else if (!hasNextChapter) {
          // Show completion message if this is the last chapter
          console.log('🎉 Congratulations! You have completed all chapters.');
        }
      } else {
        console.log('Ignoring ended event from old audio element');
      }
    });

    const errorHandler = async (e: Event) => {
      // Only handle errors if this is the current audio element and component is still mounted
      if (audioRef.current === audio && isOpen) {
        console.error('Audio playback error:', e);
        console.log('Audio URL may be invalid, attempting to regenerate audio');
        
        // Try to regenerate the audio completely
        try {
          setIsGenerating(true);
          await initializeAudio();
        } catch (error) {
          console.error('Failed to regenerate audio:', error);
          // Show user-friendly error message
          console.log('Audio generation failed. Please try again.');
        } finally {
          setIsGenerating(false);
        }
      } else {
        // Silently ignore errors from old audio elements or when component is closed
        console.log('Ignoring error from old audio element or closed component');
      }
    };
    
    errorHandlerRef.current = errorHandler;
    audio.addEventListener('error', errorHandler);

    audioRef.current = audio;
  };





  const updateHighlightProgress = (currentTime: number, duration: number) => {
    if (onHighlightProgress && duration > 0) {
      // Calculate progress as a value between 0 and 1
      const progress = Math.min(1, Math.max(0, currentTime / duration));
      onHighlightProgress(progress);
      
      // Scroll to the current position smoothly
      if (onScrollToPosition) {
        const cleanContent = cleanTextForSpeech(chapter.content);
        const totalChars = cleanContent.length;
        const currentCharPosition = Math.floor(progress * totalChars);
        onScrollToPosition(currentCharPosition);
      }
    }
  };

  const clearHighlight = () => {
    if (onHighlightProgress) {
      onHighlightProgress(0); // Clear highlight
    }
  };

  const startBrowserSpeechHighlighting = () => {
    if (!onHighlightProgress) return;
    
    // Clear any existing interval
    if (browserSpeechIntervalRef.current) {
      clearInterval(browserSpeechIntervalRef.current);
    }

    // Use the same text cleaning logic as the speech synthesis
    const cleanText = cleanTextForSpeech(chapter.content);

    const totalDuration = cleanText.length * 0.08; // Estimated duration in seconds
    const updateInterval = 16; // Update every 16ms for ultra-smooth highlighting
    
    let elapsedTime = 0;
    
    browserSpeechIntervalRef.current = setInterval(() => {
      elapsedTime += updateInterval / 1000; // Convert to seconds
      
      if (elapsedTime >= totalDuration) {
        // Highlight complete text at the end
        if (onHighlightProgress) {
          onHighlightProgress(1.0);
        }
        stopBrowserSpeechHighlighting();
        return;
      }
      
      // Calculate progress percentage based on clean text
      const progress = elapsedTime / totalDuration;
      
      // Update highlighting progress for smooth motion
      if (onHighlightProgress) {
        onHighlightProgress(progress);
      }
      

      
    }, updateInterval);
  };



  const stopBrowserSpeechHighlighting = () => {
    if (browserSpeechIntervalRef.current) {
      clearInterval(browserSpeechIntervalRef.current);
      browserSpeechIntervalRef.current = null;
    }
  };

  const togglePlayPause = async () => {
    if (isGenerating) return;

    if (isUsingBrowserSpeech) {
      // Handle browser speech synthesis
      if (isPlaying) {
        speechSynthesis.cancel();
        setIsPlaying(false);
        stopBrowserSpeechHighlighting();
      } else {
        if (speechUtteranceRef.current) {
          speechSynthesis.speak(speechUtteranceRef.current);
          setIsPlaying(true);
          startBrowserSpeechHighlighting();
        }
      }
    } else if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      // Using Gemini TTS audio
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio play error:', error);
          
          // If the audio fails to play, it might be due to an invalid URL
          // Try to regenerate the audio
          if (error instanceof Error && error.name === 'NotSupportedError') {
            console.log('Audio URL appears to be invalid, regenerating audio...');
            setIsGenerating(true);
            try {
              await initializeAudio();
            } catch (regenerateError) {
              console.error('Failed to regenerate audio:', regenerateError);
            } finally {
              setIsGenerating(false);
            }
          }
        }
      }
    }
  };



  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isUsingBrowserSpeech) {
      // For browser speech, we need to update the volume on the utterance
      if (speechUtteranceRef.current) {
        speechUtteranceRef.current.volume = !isMuted ? 1.0 : 0;
      }
    } else if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      audioRef.current.muted = !isMuted;
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    
    if (isUsingBrowserSpeech) {
      // For browser speech, update the rate on the utterance
      if (speechUtteranceRef.current) {
        speechUtteranceRef.current.rate = newRate * 0.8; // Scale to reasonable speech rate
      }
    } else if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const stopAudio = () => {
    if (isUsingBrowserSpeech) {
      speechSynthesis.cancel();
      setIsUsingBrowserSpeech(false);
      stopBrowserSpeechHighlighting();
    } else if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Remove all event listeners to prevent memory leaks
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.oncanplaythrough = null;
    }
    setIsPlaying(false);
    setCurrentWordIndex(0);
    clearHighlight();
  };

  // Update current word highlighting - only needed if not using HTML audio timeupdate
  useEffect(() => {
    // The timeupdate event on the audio element handles this automatically

  }, [isPlaying, currentWordIndex, duration]);

  // Cleanup on unmount or when isOpen changes
  useEffect(() => {
    return () => {
      // Stop all audio playback
      if (isUsingBrowserSpeech) {
        speechSynthesis.cancel();
        setIsUsingBrowserSpeech(false);
        stopBrowserSpeechHighlighting();
      } else if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
        // Pause and clear the audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        
        // Remove all event listeners by setting them to null
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onloadedmetadata = null;
        audioRef.current.oncanplaythrough = null;
        
        // Remove the error event listener if it exists
        if (errorHandlerRef.current) {
          audioRef.current.removeEventListener('error', errorHandlerRef.current);
          errorHandlerRef.current = null;
        }
      }
      
      // Clear all state
      setIsPlaying(false);
      setCurrentWordIndex(0);
      clearHighlight();
      
      // Clear the audio reference
      audioRef.current = null;
    };
  }, [isOpen, isUsingBrowserSpeech]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Ensure audio is completely stopped when component unmounts
      if (isUsingBrowserSpeech) {
        speechSynthesis.cancel();
      }
      if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      // Clear any remaining intervals
      if (browserSpeechIntervalRef.current) {
        clearInterval(browserSpeechIntervalRef.current);
        browserSpeechIntervalRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex justify-center"
      >
        {/* Main pill container */}
        <div className="bg-paper-light dark:bg-paper-dark rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center space-x-3 backdrop-blur-sm paper-texture mb-1">
          {/* Volume control */}
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Speed control */}
                      <button
              onClick={changePlaybackRate}
              className="px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all min-w-[2.5rem]"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

          {/* Central play button */}
          <button
            onClick={togglePlayPause}
            disabled={isGenerating}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-lg mx-1 relative ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : !isApiAvailable
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
            }`}
            title={!isApiAvailable ? 'API unavailable - using fallback audio' : 'Play/Pause'}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
            {!isApiAvailable && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" title="API unavailable" />
            )}
          </button>

          {/* Auto-play toggle */}
                      <button
              onClick={() => {
                const newValue = !autoPlayEnabled;
                setAutoPlayEnabled(newValue);
                localStorage.setItem('autoPlayAudio', newValue.toString());
              }}
              className={`px-2 py-1.5 text-xs font-medium rounded-full transition-all ${
                autoPlayEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={autoPlayEnabled ? 'Auto-play enabled' : 'Auto-play disabled'}
            >
              {autoPlayEnabled ? 'Auto' : 'Manual'}
            </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            title="Close player"
          >
            <X className="w-3 h-3" />
          </button>


        </div>


      </motion.div>
    </AnimatePresence>
  );
};

export default AudioControlStrip;