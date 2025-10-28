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
      // Try pre-generated audio
      const preGeneratedAudio = await this.preGeneratedService.getPreGeneratedAudio(chapter);
      if (preGeneratedAudio) {
        console.log('🎵 Using pre-generated audio');
        const audioUrl = preGeneratedAudio.blobUrl || preGeneratedAudio.audioUrl;
        await this.setupPreGeneratedAudio(audioUrl, preGeneratedAudio.duration);
        this.updatePlaybackState({ 
          audioSource: 'pre-generated',
          duration: preGeneratedAudio.duration,
          isLoading: false 
        });
        
        // Update media session
        mediaSessionService.setMetadata(chapter);
        
        return;
      }

      // No pre-generated audio available
      throw new Error('No audio file available for this content. Please upload audio via CMS.');

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
   * Setup pre-generated audio
   */
  private async setupPreGeneratedAudio(audioUrl: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.playbackRate = this.playbackState.playbackRate;

      // Audio loaded
      this.currentAudio.addEventListener('loadedmetadata', () => {
        if (this.currentAudio) {
          const actualDuration = this.currentAudio.duration || duration;
          this.updatePlaybackState({ 
            duration: actualDuration,
            isLoading: false 
          });
          console.log(`✅ Audio loaded: ${actualDuration.toFixed(1)}s`);
          resolve();
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

      // Error handling
      this.currentAudio.addEventListener('error', () => {
        const error = this.currentAudio?.error;
        const errorMessage = error 
          ? `Audio error: ${error.code} - ${error.message}` 
          : 'Unknown audio error';
        console.error('❌ Audio playback error:', errorMessage);
        this.updatePlaybackState({ 
          isPlaying: false, 
          isLoading: false,
          error: errorMessage
        });
        this.callbacks.onError?.(errorMessage);
        reject(new Error(errorMessage));
      });

      // Start loading
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

    if (this.playbackState.isPlaying) {
      this.currentAudio.pause();
      this.updatePlaybackState({ isPlaying: false });
    } else {
      this.currentAudio.play().then(() => {
        this.updatePlaybackState({ isPlaying: true });
      }).catch(error => {
        console.error('❌ Failed to play audio:', error);
        this.callbacks.onError?.('Failed to play audio');
      });
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
