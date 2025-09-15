import { BookChapter } from '../types';

export interface MediaSessionMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: MediaImage[];
}

export class MediaSessionService {
  private static instance: MediaSessionService;
  private audioElement: HTMLAudioElement | null = null;
  private currentChapter: BookChapter | null = null;
  private onPlayPause: (() => void) | null = null;
  private onPrevious: (() => void) | null = null;
  private onNext: (() => void) | null = null;
  private onSeek: ((time: number) => void) | null = null;

  private constructor() {
    this.initializeMediaSession();
  }

  public static getInstance(): MediaSessionService {
    if (!MediaSessionService.instance) {
      MediaSessionService.instance = new MediaSessionService();
    }
    return MediaSessionService.instance;
  }

  private initializeMediaSession() {
    // Check if Media Session API is supported
    if (!('mediaSession' in navigator)) {
      console.warn('Media Session API not supported in this browser');
      return;
    }

    // Set up media session action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      console.log('Media Session: Play action triggered');
      this.onPlayPause?.();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('Media Session: Pause action triggered');
      this.onPlayPause?.();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('Media Session: Previous track action triggered');
      this.onPrevious?.();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('Media Session: Next track action triggered');
      this.onNext?.();
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      console.log('Media Session: Seek backward action triggered', details);
      const seekTime = details.seekOffset || 10;
      if (this.audioElement) {
        const newTime = Math.max(0, this.audioElement.currentTime - seekTime);
        this.onSeek?.(newTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      console.log('Media Session: Seek forward action triggered', details);
      const seekTime = details.seekOffset || 10;
      if (this.audioElement) {
        const newTime = Math.min(
          this.audioElement.duration || 0,
          this.audioElement.currentTime + seekTime
        );
        this.onSeek?.(newTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      console.log('Media Session: Seek to action triggered', details);
      if (details.seekTime !== undefined) {
        this.onSeek?.(details.seekTime);
      }
    });

    // Handle stop action
    navigator.mediaSession.setActionHandler('stop', () => {
      console.log('Media Session: Stop action triggered');
      this.onPlayPause?.();
    });

    console.log('✅ Media Session API initialized');
  }

  public setAudioElement(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement;
    this.setupAudioEventListeners();
  }

  private setupAudioEventListeners() {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('play', () => {
      this.updatePlaybackState('playing');
    });

    this.audioElement.addEventListener('pause', () => {
      this.updatePlaybackState('paused');
    });

    this.audioElement.addEventListener('ended', () => {
      this.updatePlaybackState('none');
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.updatePositionState();
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.updatePositionState();
    });
  }

  public setMetadata(chapter: BookChapter) {
    this.currentChapter = chapter;

    if (!('mediaSession' in navigator)) return;

    const metadata: MediaSessionMetadata = {
      title: chapter.title,
      artist: 'The Middle of All Things',
      album: chapter.part || 'Book',
      artwork: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-192x192.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    try {
      navigator.mediaSession.metadata = new MediaMetadata(metadata);
      console.log('✅ Media Session metadata updated:', metadata.title);
    } catch (error) {
      console.error('Failed to set media session metadata:', error);
    }
  }

  public setActionHandlers(handlers: {
    onPlayPause?: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    onSeek?: (time: number) => void;
  }) {
    this.onPlayPause = handlers.onPlayPause || null;
    this.onPrevious = handlers.onPrevious || null;
    this.onNext = handlers.onNext || null;
    this.onSeek = handlers.onSeek || null;
  }

  private updatePlaybackState(state: MediaSessionPlaybackState) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.playbackState = state;
      console.log('Media Session playback state updated:', state);
    } catch (error) {
      console.error('Failed to update playback state:', error);
    }
  }

  private updatePositionState() {
    if (!('mediaSession' in navigator) || !this.audioElement) return;

    try {
      const positionState: MediaPositionState = {
        duration: this.audioElement.duration || 0,
        playbackRate: this.audioElement.playbackRate,
        position: this.audioElement.currentTime
      };

      navigator.mediaSession.setPositionState(positionState);
    } catch (error) {
      console.error('Failed to update position state:', error);
    }
  }

  public clearMetadata() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      console.log('Media Session metadata cleared');
    } catch (error) {
      console.error('Failed to clear media session metadata:', error);
    }
  }

  public isSupported(): boolean {
    return 'mediaSession' in navigator;
  }
}

export const mediaSessionService = MediaSessionService.getInstance();
