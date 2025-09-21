/**
 * Comprehensive Audio Management Service
 * 
 * This service provides:
 * - Single audio playback management (only one audio plays at a time)
 * - Audio fallback system (pre-generated -> Gemini TTS -> browser speech)
 * - Voice preference handling (male/female)
 * - Navigation handling (stop audio when navigating away)
 * - Background audio support (continues when screen is off)
 */

import { BookChapter } from '../types';
import { getGeminiTTSService } from './geminiTTS';
import { getPreGeneratedAudioService } from './preGeneratedAudio';
import { mediaSessionService } from './mediaSession';

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  audioSource: 'pre-generated' | 'gemini-tts' | 'browser-speech' | null;
  playbackRate: number;
}

export interface AudioManagerCallbacks {
  onPlaybackStateChange?: (state: AudioPlaybackState) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

class AudioManagerService {
  private static instance: AudioManagerService;
  private currentAudio: HTMLAudioElement | null = null;
  private currentSpeechUtterance: SpeechSynthesisUtterance | null = null;
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
  private geminiTTSService = getGeminiTTSService();
  private preGeneratedService = getPreGeneratedAudioService();

  private constructor() {
    this.loadVoicePreference();
    this.setupNavigationHandling();
    this.setupMobileAudioUnlock();
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
    console.log(`🎙️ Audio Manager: Voice preference set to ${voice}`);
  }

  /**
   * Get current voice preference
   */
  public getVoicePreference(): 'male' | 'female' {
    return this.voicePreference;
  }

  /**
   * Setup navigation handling to stop audio when navigating away
   */
  private setupNavigationHandling(): void {
    if (typeof window === 'undefined') return;

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.playbackState.isPlaying) {
        // Page is hidden but audio should continue playing
        console.log('📱 Page hidden - audio continues playing');
      } else if (!document.hidden && this.playbackState.isPlaying) {
        // Page is visible again
        console.log('📱 Page visible - audio still playing');
      }
    });

    // Handle beforeunload to clean up
    window.addEventListener('beforeunload', () => {
      this.stopAudio();
    });

    // Handle popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.stopAudio();
    });
  }

  /**
   * Setup mobile audio unlock for iOS Safari and other mobile browsers
   */
  private setupMobileAudioUnlock(): void {
    if (typeof window === 'undefined') return;

    let audioUnlocked = false;

    const unlockAudio = () => {
      if (audioUnlocked) return;

      console.log('🔓 AudioManager: Attempting to unlock audio context for mobile...');
      
      // Create a silent audio element and try to play it
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbCDuW3vLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmM=';
      silentAudio.volume = 0.01;
      silentAudio.play().then(() => {
        console.log('✅ AudioManager: Audio context unlocked successfully');
        audioUnlocked = true;
        silentAudio.remove();
      }).catch((error) => {
        console.log('⚠️ AudioManager: Audio unlock attempt failed (this is normal for some browsers):', error);
        audioUnlocked = true; // Mark as unlocked anyway to prevent repeated attempts
        silentAudio.remove();
      });
    };

    // Listen for first user interaction to unlock audio
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true, passive: true });
    });
  }

  /**
   * Initialize audio for chat interactions (uses Gemini TTS for best quality)
   * This is the only method that should use Gemini TTS to save API quota
   */
  public async initializeChatAudio(
    text: string,
    callbacks: AudioManagerCallbacks = {}
  ): Promise<void> {
    this.callbacks = callbacks;
    
    // Stop any existing audio
    this.stopAudio();
    
    this.updatePlaybackState({ isLoading: true, error: null });

    try {
      // For chat, we prioritize Gemini TTS for best quality
      if (this.geminiTTSService.isApiAvailable()) {
        console.log('🤖 Using Gemini TTS for chat interaction');
        const voiceName = this.voicePreference === 'male' ? 'Charon' : 'Zephyr';
        
        // Create a temporary chapter object for TTS
        const tempChapter: BookChapter = {
          id: 'chat',
          title: 'Chat Response',
          content: text,
          chapterNumber: 0,
          totalChapters: 1,
          part: 'Chat'
        };
        
        const audioData = await this.geminiTTSService.generateChatAudio(text, {
          voiceName,
          speakingRate: 1.15
        });
        
        await this.setupGeminiAudio(audioData.audioUrl, audioData.duration);
        this.updatePlaybackState({ 
          audioSource: 'gemini-tts',
          duration: audioData.duration,
          isLoading: false 
        });
        return;
      }

      // Fallback to browser speech for chat if Gemini TTS unavailable
      console.log('🗣️ Using browser speech synthesis for chat (Gemini TTS unavailable)');
      const tempChapter: BookChapter = {
        id: 'chat',
        title: 'Chat Response',
        content: text,
        chapterNumber: 0,
        totalChapters: 1,
        part: 'Chat'
      };
      this.setupBrowserSpeech(tempChapter);
      this.updatePlaybackState({ 
        audioSource: 'browser-speech',
        duration: this.estimateDuration(text),
        isLoading: false 
      });

    } catch (error) {
      console.error('❌ Chat audio generation failed:', error);
      const tempChapter: BookChapter = {
        id: 'chat',
        title: 'Chat Response',
        content: text,
        chapterNumber: 0,
        totalChapters: 1,
        part: 'Chat'
      };
      this.setupBrowserSpeech(tempChapter);
      this.updatePlaybackState({ 
        audioSource: 'browser-speech',
        duration: this.estimateDuration(text),
        isLoading: false,
        error: 'Chat audio generation failed, using browser speech'
      });
    }
  }

  /**
   * Initialize audio for a chapter with optimized fallback system
   * Prioritizes pre-generated audio, then browser TTS (no Gemini TTS for content)
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
      // 1. Try pre-generated audio first (fastest, no API usage)
      const preGeneratedAudio = await this.preGeneratedService.getPreGeneratedAudio(chapter);
      if (preGeneratedAudio) {
        console.log('🎵 Using pre-generated audio (no API usage)');
        await this.setupPreGeneratedAudio(preGeneratedAudio.audioUrl, preGeneratedAudio.duration);
        this.updatePlaybackState({ 
          audioSource: 'pre-generated',
          duration: preGeneratedAudio.duration,
          isLoading: false 
        });
        return;
      }

      // 2. Use browser speech synthesis (no API usage, good fallback)
      console.log('🗣️ Using browser speech synthesis (no API usage)');
      this.setupBrowserSpeech(chapter);
      this.updatePlaybackState({ 
        audioSource: 'browser-speech',
        duration: this.estimateDuration(chapter.content),
        isLoading: false 
      });

      // Note: Gemini TTS is now reserved for chat interactions only
      // This saves significant API quota for content that has pre-generated audio

    } catch (error) {
      console.error('❌ All audio methods failed, using browser speech as final fallback:', error);
      this.setupBrowserSpeech(chapter);
      this.updatePlaybackState({ 
        audioSource: 'browser-speech',
        duration: this.estimateDuration(chapter.content),
        isLoading: false,
        error: 'Audio generation failed, using browser speech'
      });
    }
  }

  /**
   * Setup pre-generated audio
   */
  private async setupPreGeneratedAudio(audioUrl: string, duration: number): Promise<void> {
    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    
    this.setupAudioElement(audio, duration);
    this.currentAudio = audio;
  }

  /**
   * Setup Gemini TTS audio
   */
  private async setupGeminiAudio(audioUrl: string, duration: number): Promise<void> {
    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    
    this.setupAudioElement(audio, duration);
    this.currentAudio = audio;
  }

  /**
   * Setup browser speech synthesis
   */
  private setupBrowserSpeech(chapter: BookChapter): void {
    // Cancel any existing speech
    speechSynthesis.cancel();
    
    if (!window.speechSynthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Clean text for speech synthesis
    const cleanText = chapter.content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configure speech settings
    utterance.rate = 0.8; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a voice that matches preference
    const voices = speechSynthesis.getVoices();
    let preferredVoice = voices.find(voice => {
      const isEnglish = voice.lang.startsWith('en');
      const isMale = this.voicePreference === 'male' && 
        (voice.name.toLowerCase().includes('male') || 
         voice.name.toLowerCase().includes('man') ||
         voice.name.toLowerCase().includes('david') ||
         voice.name.toLowerCase().includes('alex'));
      const isFemale = this.voicePreference === 'female' && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('karen'));
      
      return isEnglish && (isMale || isFemale);
    }) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`🗣️ Using voice: ${preferredVoice.name} (${this.voicePreference})`);
    }

    // Set up event handlers
    utterance.onstart = () => {
      this.updatePlaybackState({ isPlaying: true });
    };

    utterance.onend = () => {
      this.updatePlaybackState({ isPlaying: false, currentTime: 0 });
      this.callbacks.onComplete?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.updatePlaybackState({ 
        isPlaying: false, 
        error: `Speech synthesis error: ${event.error}` 
      });
    };

    this.currentSpeechUtterance = utterance;
  }

  /**
   * Setup audio element with common event handlers
   */
  private setupAudioElement(audio: HTMLAudioElement, duration: number): void {
    // Set up Media Session for native mobile controls
    if (mediaSessionService.isSupported() && this.currentChapter) {
      mediaSessionService.setAudioElement(audio);
      mediaSessionService.setMetadata(this.currentChapter);
      mediaSessionService.setActionHandlers({
        onPlayPause: () => this.togglePlayPause(),
        onPrevious: () => this.callbacks.onPrevious?.(),
        onNext: () => this.callbacks.onNext?.(),
        onSeek: (time: number) => {
          if (audio) {
            audio.currentTime = time;
          }
        }
      });
    }

    // Set up audio event listeners
    audio.addEventListener('loadedmetadata', () => {
      this.updatePlaybackState({ duration: audio.duration || duration });
    });

    audio.addEventListener('timeupdate', () => {
      const progress = audio.duration ? audio.currentTime / audio.duration : 0;
      this.updatePlaybackState({ currentTime: audio.currentTime });
      this.callbacks.onProgress?.(progress);
    });

    audio.addEventListener('ended', () => {
      this.updatePlaybackState({ isPlaying: false, currentTime: 0 });
      this.callbacks.onComplete?.();
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      this.updatePlaybackState({ 
        isPlaying: false, 
        error: 'Audio playback failed' 
      });
    });

    audio.addEventListener('play', () => {
      this.updatePlaybackState({ isPlaying: true });
    });

    audio.addEventListener('pause', () => {
      this.updatePlaybackState({ isPlaying: false });
    });
  }

  /**
   * Toggle play/pause
   */
  public togglePlayPause(): void {
    if (this.currentAudio) {
      // Using audio element
      if (this.playbackState.isPlaying) {
        console.log('🔄 AudioManager: Pausing audio...');
        try {
          this.currentAudio.pause();
          // Immediately update state for responsive UI
          this.updatePlaybackState({ isPlaying: false });
          console.log('✅ AudioManager: Audio paused successfully');
        } catch (error) {
          console.error('❌ AudioManager: Error pausing audio:', error);
          this.updatePlaybackState({ 
            isPlaying: false, 
            error: 'Failed to pause audio' 
          });
        }
      } else {
        console.log('🔄 AudioManager: Starting audio playback...');
        // Immediately update state to show loading state
        this.updatePlaybackState({ isPlaying: true });
        
        this.currentAudio.play().then(() => {
          console.log('✅ AudioManager: Audio playing successfully');
          // Confirm playing state after successful play
          this.updatePlaybackState({ isPlaying: true, error: null });
        }).catch(error => {
          console.error('❌ AudioManager: Audio play error:', error);
          this.updatePlaybackState({ 
            isPlaying: false, 
            error: 'Failed to play audio' 
          });
        });
      }
    } else if (this.currentSpeechUtterance) {
      // Using speech synthesis
      if (this.playbackState.isPlaying) {
        console.log('🔄 AudioManager: Pausing speech synthesis...');
        speechSynthesis.pause();
        this.updatePlaybackState({ isPlaying: false });
      } else {
        if (speechSynthesis.paused) {
          console.log('🔄 AudioManager: Resuming speech synthesis...');
          speechSynthesis.resume();
          this.updatePlaybackState({ isPlaying: true });
        } else {
          console.log('🔄 AudioManager: Starting speech synthesis...');
          // Set up event listeners for speech synthesis
          this.currentSpeechUtterance.onstart = () => {
            console.log('✅ AudioManager: Speech synthesis started');
            this.updatePlaybackState({ isPlaying: true });
          };
          
          this.currentSpeechUtterance.onend = () => {
            console.log('✅ AudioManager: Speech synthesis ended');
            this.updatePlaybackState({ isPlaying: false, currentTime: 0 });
            this.callbacks.onComplete?.();
          };
          
          this.currentSpeechUtterance.onerror = (e) => {
            console.error('❌ AudioManager: Speech synthesis error:', e);
            this.updatePlaybackState({ 
              isPlaying: false, 
              error: 'Speech synthesis failed' 
            });
          };
          
          speechSynthesis.speak(this.currentSpeechUtterance);
          this.updatePlaybackState({ isPlaying: true });
        }
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

    if (this.currentSpeechUtterance) {
      speechSynthesis.cancel();
      this.currentSpeechUtterance = null;
    }

    // Clear Media Session
    mediaSessionService.clearMetadata();

    this.updatePlaybackState({
      isPlaying: false,
      currentTime: 0,
      audioSource: null,
      error: null
    });
  }

  /**
   * Seek to specific time
   */
  public seekTo(time: number): void {
    if (this.currentAudio) {
      this.currentAudio.currentTime = time;
      this.updatePlaybackState({ currentTime: time });
    } else if (this.currentSpeechUtterance) {
      // For speech synthesis, we can't seek precisely, so we restart from estimated position
      const estimatedPosition = Math.floor(time * 16); // Rough estimate
      const remainingText = this.currentChapter?.content.substring(estimatedPosition) || '';
      
      speechSynthesis.cancel();
      if (remainingText) {
        const newUtterance = new SpeechSynthesisUtterance(remainingText);
        newUtterance.rate = 0.8;
        newUtterance.pitch = 1.0;
        newUtterance.volume = 1.0;
        
        // Copy voice settings from current utterance
        if (this.currentSpeechUtterance.voice) {
          newUtterance.voice = this.currentSpeechUtterance.voice;
        }
        
        this.currentSpeechUtterance = newUtterance;
        speechSynthesis.speak(newUtterance);
        this.updatePlaybackState({ isPlaying: true, currentTime: time });
      }
    }
  }

  /**
   * Get current playback state
   */
  public getPlaybackState(): AudioPlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Update playback state and notify callbacks
   */
  private updatePlaybackState(updates: Partial<AudioPlaybackState>): void {
    this.playbackState = { ...this.playbackState, ...updates };
    this.callbacks.onPlaybackStateChange?.(this.playbackState);
  }

  /**
   * Estimate duration based on text length
   */
  private estimateDuration(content: string): number {
    const words = content.split(/\s+/).length;
    const wordsPerMinute = 150; // Average reading speed
    return Math.max(1, (words / wordsPerMinute) * 60);
  }

  /**
   * Set playback rate
   */
  public setPlaybackRate(rate: number): void {
    // Update playback state first
    this.updatePlaybackState({ playbackRate: rate });
    
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    } else if (this.currentSpeechUtterance) {
      // For speech synthesis, we need to recreate the utterance with new rate
      const wasPlaying = this.playbackState.isPlaying;
      const currentTime = this.playbackState.currentTime;
      
      speechSynthesis.cancel();
      
      if (this.currentChapter) {
        const estimatedPosition = Math.floor(currentTime * 16);
        const remainingText = this.currentChapter.content.substring(estimatedPosition) || '';
        
        if (remainingText) {
          const newUtterance = new SpeechSynthesisUtterance(remainingText);
          newUtterance.rate = rate * 0.8; // Scale to reasonable speech rate
          newUtterance.pitch = 1.0;
          newUtterance.volume = 1.0;
          
          if (this.currentSpeechUtterance.voice) {
            newUtterance.voice = this.currentSpeechUtterance.voice;
          }
          
          this.currentSpeechUtterance = newUtterance;
          
          if (wasPlaying) {
            speechSynthesis.speak(newUtterance);
            this.updatePlaybackState({ isPlaying: true });
          }
        }
      }
    }
  }

  /**
   * Set audio volume
   */
  public setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
    } else if (this.currentSpeechUtterance) {
      this.currentSpeechUtterance.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Mute/unmute audio
   */
  public setMuted(muted: boolean): void {
    if (this.currentAudio) {
      this.currentAudio.muted = muted;
    } else if (this.currentSpeechUtterance) {
      this.currentSpeechUtterance.volume = muted ? 0 : 1;
    }
  }

  /**
   * Skip forward by specified seconds
   */
  public skipForward(seconds: number = 15): void {
    const newTime = Math.min(this.playbackState.currentTime + seconds, this.playbackState.duration);
    this.seekTo(newTime);
  }

  /**
   * Skip backward by specified seconds
   */
  public skipBackward(seconds: number = 15): void {
    const newTime = Math.max(this.playbackState.currentTime - seconds, 0);
    this.seekTo(newTime);
  }

  /**
   * Check if audio is currently playing
   */
  public isPlaying(): boolean {
    return this.playbackState.isPlaying;
  }

  /**
   * Get current chapter
   */
  public getCurrentChapter(): BookChapter | null {
    return this.currentChapter;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopAudio();
    this.callbacks = {};
    this.currentChapter = null;
  }
}

// Export singleton instance
export const audioManagerService = AudioManagerService.getInstance();
export default audioManagerService;
