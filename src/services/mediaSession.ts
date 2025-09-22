import { BookChapter } from '../types';
import { PlaylistItem } from './audioPlaylist';

export interface MediaSessionMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: MediaImage[];
  playlistPosition?: number;
  playlistLength?: number;
}

export class MediaSessionService {
  private static instance: MediaSessionService;
  private audioElement: HTMLAudioElement | null = null;
  private currentChapter: BookChapter | null = null;
  private currentPlaylistItem: PlaylistItem | null = null;
  private onPlayPause: (() => void) | null = null;
  private onPrevious: (() => void) | null = null;
  private onNext: (() => void) | null = null;
  private onSeek: ((time: number) => void) | null = null;
  private onSeekToPosition: ((position: number) => void) | null = null;
  private onToggleShuffle: (() => void) | null = null;
  private onToggleRepeat: (() => void) | null = null;

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

    // Enhanced mobile controls
    try {
      // Set up additional action handlers for better mobile experience
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        console.log('Media Session: Seek to position triggered', details);
        if (details.seekTime !== undefined) {
          this.onSeek?.(details.seekTime);
        }
      });

      // Handle position state updates for timeline scrubbing
      if ('setPositionState' in navigator.mediaSession) {
        // This will be called by updatePositionState
      }
    } catch (error) {
      console.warn('Some media session features not supported:', error);
    }

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

  public setMetadata(chapter: BookChapter, playlistItem?: PlaylistItem) {
    this.currentChapter = chapter;
    this.currentPlaylistItem = playlistItem || null;

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
      ],
      playlistPosition: playlistItem ? playlistItem.chapterNumber : undefined,
      playlistLength: playlistItem ? playlistItem.totalChapters : undefined
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
    onSeekToPosition?: (position: number) => void;
    onToggleShuffle?: () => void;
    onToggleRepeat?: () => void;
  }) {
    this.onPlayPause = handlers.onPlayPause || null;
    this.onPrevious = handlers.onPrevious || null;
    this.onNext = handlers.onNext || null;
    this.onSeek = handlers.onSeek || null;
    this.onSeekToPosition = handlers.onSeekToPosition || null;
    this.onToggleShuffle = handlers.onToggleShuffle || null;
    this.onToggleRepeat = handlers.onToggleRepeat || null;
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
      
      // Update position more frequently for better timeline scrubbing
      if (this.audioElement.currentTime > 0) {
        // Throttle position updates to avoid excessive calls
        if (!this.lastPositionUpdate || Date.now() - this.lastPositionUpdate > 1000) {
          this.lastPositionUpdate = Date.now();
        }
      }
    } catch (error) {
      console.error('Failed to update position state:', error);
    }
  }

  private lastPositionUpdate = 0;

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

  /**
   * Enable background audio playback on mobile devices
   * This should be called after user interaction
   */
  public enableBackgroundAudio(): void {
    if (!this.audioElement) return;

    try {
      // Set audio context to resume state for mobile
      if (this.audioElement.audioContext) {
        this.audioElement.audioContext.resume();
      }

      // Enable background playback
      this.audioElement.setAttribute('playsinline', 'true');
      this.audioElement.setAttribute('webkit-playsinline', 'true');
      
      console.log('✅ Background audio enabled for mobile');
    } catch (error) {
      console.warn('Failed to enable background audio:', error);
    }
  }

  /**
   * Update media session with enhanced mobile controls
   */
  public updateMobileControls(): void {
    if (!('mediaSession' in navigator)) return;

    try {
      // Set up enhanced action handlers for mobile
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        console.log('Mobile: Seek to position', details);
        if (details.seekTime !== undefined) {
          this.onSeek?.(details.seekTime);
        }
      });

      // Enable position state for timeline scrubbing
      if (this.audioElement) {
        this.updatePositionState();
      }
    } catch (error) {
      console.warn('Failed to update mobile controls:', error);
    }
  }
}

export const mediaSessionService = MediaSessionService.getInstance();
