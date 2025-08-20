import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { BookChapter } from '../types';
import { geminiTTSService, TTSConfig } from '../services/geminiTTS';

interface AudioControlStripProps {
  chapter: BookChapter;
  isOpen: boolean;
  onClose: () => void;
  onHighlightText?: (startIndex: number, endIndex: number) => void;
  onScrollToPosition?: (position: number) => void;
  onNextChapter?: () => void;
  hasNextChapter?: boolean;
  autoPlay?: boolean;
}

const AudioControlStrip: React.FC<AudioControlStripProps> = ({
  chapter,
  isOpen,
  onClose,
  onHighlightText,
  onScrollToPosition,
  onNextChapter,
  hasNextChapter = false,
  autoPlay = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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

  useEffect(() => {
    if (isOpen) {
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

  const initializeAudio = async () => {
    try {
      setIsGenerating(true);
      
      // Clean text for processing
      const cleanText = chapter.content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
        .trim();
      
      // Split content into words for highlighting
      const words = cleanText.split(/\s+/);
      wordsRef.current = words;
      
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
        voiceName: 'Kore',
        pace: 'quick', // Use faster pace
        tone: 'warm',
        style: 'neutral'
      };

      const audioData = await geminiTTSService.generateChapterAudio(chapter, ttsConfig);
      wordTimingsRef.current = audioData.wordTimings;
      setupAudioElement(audioData.audioUrl);
      setDuration(audioData.duration);
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      
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
        setCurrentTime(0);
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
      // Create evenly distributed word timings based on actual audio duration
      const totalWords = wordsRef.current.length;
      const totalDuration = audio.duration * 1000; // Convert to milliseconds
      
      // Create evenly spaced word timings
      wordTimingsRef.current = Array.from({ length: totalWords }, (_, i) => {
        return (i / totalWords) * totalDuration;
      });
      
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
      setCurrentTime(audio.currentTime);
      updateCurrentWordIndex(audio.currentTime * 1000);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
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
    });

    audio.addEventListener('error', async (e) => {
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
    });

    audioRef.current = audio;
  };



  const updateCurrentWordIndex = (currentMs: number) => {
    // Find the current word based on timing
    let wordIndex = -1;
    for (let i = 0; i < wordTimingsRef.current.length; i++) {
      if (currentMs >= wordTimingsRef.current[i]) {
        wordIndex = i;
      } else {
        break;
      }
    }
    
    if (wordIndex >= 0 && wordIndex !== currentWordIndex) {
      setCurrentWordIndex(wordIndex);
      highlightCurrentWord(wordIndex);
    }
  };

  const highlightCurrentWord = (wordIndex: number) => {
    if (onHighlightText && wordsRef.current[wordIndex]) {
      // Calculate cumulative highlighting - highlight from start to current word
      const words = wordsRef.current;
      let totalChars = 0;
      
      // Calculate total characters from start to current word (inclusive)
      for (let i = 0; i <= wordIndex; i++) {
        totalChars += words[i].length;
        if (i < wordIndex) {
          totalChars += 1; // Add space between words
        }
      }
      
      // Find the corresponding position in the original content
      const originalContent = chapter.content;
      const cleanContent = originalContent
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Map clean content position to original content position
      let originalPos = 0;
      let cleanPos = 0;
      
      while (cleanPos < totalChars && originalPos < originalContent.length) {
        if (originalContent[originalPos] === cleanContent[cleanPos]) {
          cleanPos++;
        }
        originalPos++;
      }
      
      // Highlight from beginning to current position (cumulative highlighting)
      onHighlightText(0, originalPos);
      
      // Scroll to the current word smoothly
      if (onScrollToPosition) {
        onScrollToPosition(originalPos - words[wordIndex].length);
      }
    }
  };

  const clearHighlight = () => {
    if (onHighlightText) {
      onHighlightText(-1, -1); // Clear highlight
    }
  };

  const startBrowserSpeechHighlighting = () => {
    if (!onHighlightText) return;
    
    // Clear any existing interval
    if (browserSpeechIntervalRef.current) {
      clearInterval(browserSpeechIntervalRef.current);
    }

    // Use the same text cleaning logic as the speech synthesis and the original highlighting
    const cleanText = chapter.content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const totalDuration = cleanText.length * 0.08; // Estimated duration in seconds
    const updateInterval = 100; // Update every 100ms for smooth highlighting
    
    let elapsedTime = 0;
    
    browserSpeechIntervalRef.current = setInterval(() => {
      elapsedTime += updateInterval / 1000; // Convert to seconds
      
      if (elapsedTime >= totalDuration) {
        // Highlight complete text at the end - map back to original content length
        if (onHighlightText) {
          onHighlightText(0, chapter.content.length);
        }
        stopBrowserSpeechHighlighting();
        return;
      }
      
      // Calculate progress percentage based on clean text
      const progress = elapsedTime / totalDuration;
      const targetCleanPos = Math.floor(cleanText.length * progress);
      
      // Map the clean text position back to the original content position
      // This ensures highlighting works correctly with the original content that gets formatted
      const originalPos = mapCleanToOriginalPosition(cleanText, chapter.content, targetCleanPos);
      
      if (onHighlightText) {
        onHighlightText(0, originalPos);
      }
      
      // Update current time for progress bar
      setCurrentTime(elapsedTime);
      
    }, updateInterval);
  };

  const mapCleanToOriginalPosition = (cleanText: string, originalContent: string, cleanPos: number): number => {
    // Map clean text position to original content position
    let originalIndex = 0;
    let cleanIndex = 0;
    
    while (cleanIndex < cleanPos && originalIndex < originalContent.length) {
      // Skip markdown formatting in original content
      if (originalContent.substring(originalIndex, originalIndex + 2) === '**') {
        // Skip bold markdown
        originalIndex += 2;
        continue;
      }
      if (originalContent[originalIndex] === '*' && originalContent.substring(originalIndex, originalIndex + 2) !== '**') {
        // Skip italic markdown
        originalIndex += 1;
        continue;
      }
      if (originalContent[originalIndex] === '#' && originalIndex < originalContent.length - 1 && originalContent[originalIndex + 1] === ' ') {
        // Skip header markdown
        while (originalIndex < originalContent.length && originalContent[originalIndex] !== '\n') {
          originalIndex++;
        }
        continue;
      }
      
      // Match characters between clean and original
      if (cleanIndex < cleanText.length && originalContent[originalIndex] === cleanText[cleanIndex]) {
        cleanIndex++;
      }
      originalIndex++;
    }
    
    return originalIndex;
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
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentWordIndex(0);
    clearHighlight();
  };

  // Update current word highlighting - only needed if not using HTML audio timeupdate
  useEffect(() => {
    // The timeupdate event on the audio element handles this automatically
    // This is only needed as a fallback
    if (isPlaying && !(audioRef.current instanceof HTMLAudioElement) && wordTimingsRef.current.length > 0) {
      const interval = setInterval(() => {
        const currentMs = currentTime * 1000;
        updateCurrentWordIndex(currentMs);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentWordIndex, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isUsingBrowserSpeech) {
        speechSynthesis.cancel();
        stopBrowserSpeechHighlighting();
      } else if (audioRef.current && audioRef.current instanceof HTMLAudioElement) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      // Note: We don't revoke blob URLs here as they're managed by the TTS service
      // The service will handle cleanup when needed
    };
  }, [isUsingBrowserSpeech]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-28 left-4 right-4 z-30 flex justify-center"
      >
        {/* Main pill container */}
        <div className="bg-paper-light dark:bg-paper-dark rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center space-x-3 backdrop-blur-sm paper-texture mb-14">
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

        {/* Progress bar - positioned below the pill */}
        <div className="absolute -bottom-2 left-6 right-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <motion.div
              className="bg-blue-600 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentTime / duration) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioControlStrip;