/**
 * Simplified Audio Management Service
 * 
 * This service provides:
 * - Single audio playback management (only one audio plays at a time)
 * - Pre-generated audio playback only
 * - Voice preference handling (male/female)
 * - Navigation handling (stop audio when navigating away)
 * - Background audio support (continues when screen is off)
 */

import { BookChapter } from '../types';
import { getPreGeneratedAudioService } from './preGeneratedAudio';
import { mediaSessionService } from './mediaSession';
import { audioPlaylistService, PlaylistItem, PlaylistCallbacks } from './audioPlaylist';
import { getUnifiedContentService, ContentType } from './unifiedContentService';

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  audioSource: 'pre-generated' | null;
  playbackRate: number;
}

export interface AudioManagerCallbacks {
  onPlaybackStateChange?: (state: AudioPlaybackState) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onTrackChange?: (item: PlaylistItem, index: number) => void;
}

class AudioManagerService {
  private static instance: AudioManagerService;
  private currentAudio: HTMLAudioElement | null = null;
  private currentChapter: BookChapter | null = null;
  private callbacks: AudioManagerCallbacks = {};
  private playbackState: AudioPlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,
    audioSource: null,
    playbackRate: 1.0
  };
  private isInitialized = false;
  private voicePreference: 'male' | 'female' = 'male';
  private preGeneratedService = getPreGeneratedAudioService();

  private constructor() {
    this.loadVoicePreference();
    this.setupNavigationHandling();
    this.setupMobileAudioUnlock();
    this.setupPlaylistIntegration();
  }

  public static getInstance(): AudioManagerService {
    if (!AudioManagerService.instance) {
      AudioManagerService.instance = new AudioManagerService();
    }
    return AudioManagerService.instance;
  }

  /**
   * Load voice preference from localStorage
   */
  private loadVoicePreference(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('audioVoicePreference');
      if (saved === 'male' || saved === 'female') {
        this.voicePreference = saved;
      }
    }
    // Ensure pre-generated service is synced with our preference
    this.preGeneratedService.setVoicePreference(this.voicePreference);
  }

  /**
   * Set voice preference
   */
  public setVoicePreference(voice: 'male' | 'female'): void {
    this.voicePreference = voice;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('audioVoicePreference', voice);
    }
    // Update pre-generated service
    this.preGeneratedService.setVoicePreference(voice);
    
    // Stop current audio and clear any blob URLs
    this.stopAudio();
  }

  /**
   * Get current voice preference
   */
  public getVoicePreference(): 'male' | 'female' {
    return this.voicePreference;
  }

  /**
   * Setup navigation handling to stop audio when user navigates away
   */
  private setupNavigationHandling(): void {
    if (typeof window !== 'undefined') {
      // Handle React Router navigation (location change)
      window.addEventListener('popstate', () => {
        console.log('🚫 Navigation detected: Stopping audio');
        this.stopAudio();
      });

      // Handle page unload (user closes tab or refreshes)
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Setup mobile audio unlock
   * Mobile browsers require user interaction before playing audio
   */
  private setupMobileAudioUnlock(): void {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const unlockAudio = () => {
        const audio = new Audio();
        audio.play().catch(() => {});
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      };
      
      document.addEventListener('touchstart', unlockAudio);
      document.addEventListener('click', unlockAudio);
    }
  }

  /**
   * Setup playlist integration
   */
  private setupPlaylistIntegration(): void {
    // Subscribe to playlist events
    const playlistCallbacks: PlaylistCallbacks = {
      onTrackChange: (item, index) => {
        console.log('📻 Playlist track changed:', item.title);
        this.callbacks.onTrackChange?.(item, index);
      },
      onError: (error) => {
        this.callbacks.onError?.(error);
      }
    };

    audioPlaylistService.setCallbacks(playlistCallbacks);
  }

  /**
   * Update playback state and notify callbacks
   */
  private updatePlaybackState(updates: Partial<AudioPlaybackState>): void {
    this.playbackState = { ...this.playbackState, ...updates };
    this.callbacks.onPlaybackStateChange?.(this.playbackState);
  }

  /**
   * Initialize audio for a chapter
   * Only uses pre-generated audio files
   */
  public async initializeAudio(
    chapter: BookChapter, 
    callbacks: AudioManagerCallbacks = {}
  ): Promise<void> {
    this.callbacks = callbacks;
    this.currentChapter = chapter;
    
    // Stop any existing audio
    this.stopAudio();
    
    this.updatePlaybackState({ isLoading: true, error: null });

    try {
      const unified = getUnifiedContentService();

      // Infer content type from `part` (this is how ContentReaderLayout passes meditation/story).
      const partLower = (chapter.part || '').toLowerCase();
      const inferredType: ContentType =
        partLower.includes('meditation') ? 'meditation' : partLower.includes('story') ? 'story' : 'chapter';

      const status = await unified.getAudioStatus(chapter.id, inferredType);
      if (status === 'pending') {
        // Avoid misleading UX. If audio isn't present yet, treat as unavailable.
        throw new Error('No audio available.');
      }
      if (status === 'failed') {
        throw new Error('Audio unavailable right now.');
      }
      if (status !== 'ok') {
        throw new Error('No audio available.');
      }

      const audioUrl = await unified.getAudioUrl(chapter.id, inferredType);
      if (!audioUrl) {
        throw new Error('No audio available.');
      }

      console.log('🎵 Using static audio URL:', audioUrl);
      // Estimate duration; audio element will correct this once metadata loads.
      const estimatedDuration = this.estimateDuration(chapter.content);
      await this.setupPreGeneratedAudio(audioUrl, estimatedDuration);
      this.updatePlaybackState({
        audioSource: 'pre-generated',
        duration: estimatedDuration,
        isLoading: false,
      });

      // Update media session
      mediaSessionService.setMetadata(chapter);

      return;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No audio available';
      console.error('❌ Audio initialization failed:', errorMessage);
      this.updatePlaybackState({ 
        audioSource: null,
        duration: 0,
        isLoading: false,
        error: errorMessage
      });
      this.callbacks.onError?.(errorMessage);
    }
  }

  /**
   * Estimate duration based on text length (fallback)
   */
  private estimateDuration(content: string): number {
    // Average speaking pace: ~150 words per minute
    const words = content.split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = 150;
    return Math.max(1, (words / wordsPerMinute) * 60);
  }

  /**
   * Setup pre-generated audio
   */
  private async setupPreGeneratedAudio(audioUrl: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🎵 Setting up audio with URL: ${audioUrl}`);
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.playbackRate = this.playbackState.playbackRate;
      
      let isResolved = false;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.warn('⏰ Audio setup timeout');
          isResolved = true;
          resolve(); // Resolve anyway to allow playback attempt
        }
      }, 10000); // 10 second timeout

      // Audio loaded
      this.currentAudio.addEventListener('loadedmetadata', () => {
        if (this.currentAudio && !isResolved) {
          const actualDuration = this.currentAudio.duration || duration;
          this.updatePlaybackState({ 
            duration: actualDuration,
            isLoading: false 
          });
          console.log(`✅ Audio loaded: ${actualDuration.toFixed(1)}s`);
          clearTimeout(timeout);
          isResolved = true;
          resolve();
        }
      });

      // Audio can play (ready to play)
      this.currentAudio.addEventListener('canplay', () => {
        if (this.currentAudio && !isResolved) {
          console.log('✅ Audio can play');
          clearTimeout(timeout);
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        }
      });

      // Time update for progress tracking
      this.currentAudio.addEventListener('timeupdate', () => {
        if (this.currentAudio) {
          const currentTime = this.currentAudio.currentTime;
          const duration = this.currentAudio.duration;
          
          this.updatePlaybackState({ 
            currentTime,
            duration
          });
          
          // Calculate progress percentage
          const progress = duration > 0 ? currentTime / duration : 0;
          this.callbacks.onProgress?.(progress);
        }
      });

      // Playback ended
      this.currentAudio.addEventListener('ended', () => {
        console.log('🏁 Audio playback completed');
        this.updatePlaybackState({ isPlaying: false });
        this.callbacks.onComplete?.();
      });

      // Play event - sync state when audio starts playing
      this.currentAudio.addEventListener('play', () => {
        console.log('▶️ Audio play event');
        this.updatePlaybackState({ isPlaying: true });
      });

      // Pause event - sync state when audio is paused
      this.currentAudio.addEventListener('pause', () => {
        console.log('⏸️ Audio pause event');
        this.updatePlaybackState({ isPlaying: false });
      });

      // Error handling
      this.currentAudio.addEventListener('error', (e) => {
        const error = this.currentAudio?.error;
        const errorMessage = error 
          ? `Audio error: ${error.code} - ${error.message}` 
          : 'Unknown audio error';
        console.error('❌ Audio playback error:', errorMessage, error, e);
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          this.updatePlaybackState({ 
            isPlaying: false, 
            isLoading: false,
            error: errorMessage
          });
          this.callbacks.onError?.(errorMessage);
          reject(new Error(errorMessage));
        }
      });

      // Start loading
      console.log('🔄 Loading audio element...');
      this.currentAudio.load();
    });
  }

  /**
   * Toggle play/pause
   */
  public togglePlayPause(): void {
    if (!this.currentAudio) {
      console.warn('⚠️ No audio initialized');
      return;
    }

    console.log('🎵 Toggle play/pause:', {
      isPlaying: this.playbackState.isPlaying,
      audioPaused: this.currentAudio.paused,
      readyState: this.currentAudio.readyState,
      src: this.currentAudio.src
    });

    // Check the actual audio element state instead of internal state
    if (!this.currentAudio.paused) {
      // Audio is playing, so pause it
      this.currentAudio.pause();
      this.updatePlaybackState({ isPlaying: false });
      console.log('⏸️ Audio paused');
    } else {
      // Check if audio is ready
      if (this.currentAudio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        this.currentAudio.play().then(() => {
          console.log('▶️ Audio playing');
          this.updatePlaybackState({ isPlaying: true });
        }).catch(error => {
          console.error('❌ Failed to play audio:', error);
          this.updatePlaybackState({ 
            isPlaying: false,
            error: `Failed to play: ${error.message}`
          });
          this.callbacks.onError?.(`Failed to play audio: ${error.message}`);
        });
      } else {
        // Wait for audio to be ready
        console.log('⏳ Waiting for audio to be ready...');
        const checkReady = () => {
          if (this.currentAudio && this.currentAudio.readyState >= 2) {
            this.currentAudio.play().then(() => {
              console.log('▶️ Audio playing (after wait)');
              this.updatePlaybackState({ isPlaying: true });
            }).catch(error => {
              console.error('❌ Failed to play audio:', error);
              this.updatePlaybackState({ 
                isPlaying: false,
                error: `Failed to play: ${error.message}`
              });
              this.callbacks.onError?.(`Failed to play audio: ${error.message}`);
            });
          } else if (this.currentAudio) {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      }
    }
  }

  /**
   * Stop audio playback
   */
  public stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    this.updatePlaybackState({
      isPlaying: false,
      currentTime: 0,
      audioSource: null
    });
  }

  /**
   * Seek to a specific time
   */
  public seekTo(time: number): void {
    if (this.currentAudio) {
      this.currentAudio.currentTime = time;
      this.updatePlaybackState({ currentTime: time });
    }
  }

  /**
   * Skip forward by seconds
   */
  public skipForward(seconds: number = 15): void {
    if (this.currentAudio) {
      const newTime = Math.min(
        this.currentAudio.currentTime + seconds,
        this.currentAudio.duration
      );
      this.seekTo(newTime);
    }
  }

  /**
   * Skip backward by seconds
   */
  public skipBackward(seconds: number = 15): void {
    if (this.currentAudio) {
      const newTime = Math.max(this.currentAudio.currentTime - seconds, 0);
      this.seekTo(newTime);
    }
  }

  /**
   * Set playback rate
   */
  public setPlaybackRate(rate: number): void {
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
    this.updatePlaybackState({ playbackRate: rate });
  }

  /**
   * Set muted state
   */
  public setMuted(muted: boolean): void {
    if (this.currentAudio) {
      this.currentAudio.muted = muted;
    }
  }

  /**
   * Get current playback state
   */
  public getPlaybackState(): AudioPlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Check if audio is currently playing
   */
  public isPlaying(): boolean {
    return this.playbackState.isPlaying;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopAudio();
    this.callbacks = {};
  }
}

// Export singleton instance
export const audioManagerService = AudioManagerService.getInstance();
export default audioManagerService;
