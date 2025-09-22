/**
 * Audio Playlist Service
 * 
 * Manages seamless audio playback across chapters, meditations, and stories
 * Provides playlist functionality for continuous listening experience
 */

import { BookChapter } from '../types';

export interface PlaylistItem {
  id: string;
  title: string;
  content: string;
  part: string;
  chapterNumber: number;
  totalChapters: number;
  type: 'chapter' | 'meditation' | 'story';
  duration?: number;
}

export interface PlaylistState {
  items: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  shuffleMode: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

export interface PlaylistCallbacks {
  onTrackChange?: (item: PlaylistItem, index: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

class AudioPlaylistService {
  private static instance: AudioPlaylistService;
  private playlist: PlaylistItem[] = [];
  private currentIndex = 0;
  private callbacks: PlaylistCallbacks = {};
  private isShuffled = false;
  private repeatMode: 'none' | 'one' | 'all' = 'none';
  private originalOrder: PlaylistItem[] = [];

  private constructor() {
    this.loadPlaylistSettings();
  }

  public static getInstance(): AudioPlaylistService {
    if (!AudioPlaylistService.instance) {
      AudioPlaylistService.instance = new AudioPlaylistService();
    }
    return AudioPlaylistService.instance;
  }

  /**
   * Load playlist settings from localStorage
   */
  private loadPlaylistSettings(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const shuffleMode = localStorage.getItem('audioShuffleMode') === 'true';
      const repeatMode = localStorage.getItem('audioRepeatMode') as 'none' | 'one' | 'all' || 'none';
      this.isShuffled = shuffleMode;
      this.repeatMode = repeatMode;
    }
  }

  /**
   * Save playlist settings to localStorage
   */
  private savePlaylistSettings(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('audioShuffleMode', this.isShuffled.toString());
      localStorage.setItem('audioRepeatMode', this.repeatMode);
    }
  }

  /**
   * Create a playlist from chapters, meditations, or stories
   */
  public createPlaylist(
    items: BookChapter[], 
    type: 'chapter' | 'meditation' | 'story',
    startIndex: number = 0
  ): void {
    this.playlist = items.map((item, index) => ({
      id: item.id || `${type}-${index}`,
      title: item.title,
      content: item.content,
      part: item.part || type,
      chapterNumber: item.chapterNumber || index + 1,
      totalChapters: items.length,
      type,
      duration: this.estimateDuration(item.content)
    }));

    this.originalOrder = [...this.playlist];
    this.currentIndex = Math.max(0, Math.min(startIndex, this.playlist.length - 1));

    if (this.isShuffled) {
      this.shufflePlaylist();
    }

    console.log(`🎵 Playlist created: ${this.playlist.length} ${type}s, starting at index ${this.currentIndex}`);
  }

  /**
   * Get current playlist item
   */
  public getCurrentItem(): PlaylistItem | null {
    return this.playlist[this.currentIndex] || null;
  }

  /**
   * Get current playlist state
   */
  public getPlaylistState(): PlaylistState {
    const currentItem = this.getCurrentItem();
    return {
      items: this.playlist,
      currentIndex: this.currentIndex,
      isPlaying: false, // This will be updated by the audio manager
      currentTime: 0,
      totalDuration: this.playlist.reduce((total, item) => total + (item.duration || 0), 0),
      shuffleMode: this.isShuffled,
      repeatMode: this.repeatMode
    };
  }

  /**
   * Move to next item in playlist
   */
  public next(): PlaylistItem | null {
    if (this.playlist.length === 0) return null;

    if (this.repeatMode === 'one') {
      // Stay on current item
      return this.getCurrentItem();
    }

    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
    } else if (this.repeatMode === 'all') {
      // Loop back to beginning
      this.currentIndex = 0;
    } else {
      // End of playlist
      this.callbacks.onComplete?.();
      return null;
    }

    const nextItem = this.getCurrentItem();
    this.callbacks.onTrackChange?.(nextItem!, this.currentIndex);
    return nextItem;
  }

  /**
   * Move to previous item in playlist
   */
  public previous(): PlaylistItem | null {
    if (this.playlist.length === 0) return null;

    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.repeatMode === 'all') {
      // Loop to end
      this.currentIndex = this.playlist.length - 1;
    } else {
      // Stay at beginning
      return this.getCurrentItem();
    }

    const prevItem = this.getCurrentItem();
    this.callbacks.onTrackChange?.(prevItem!, this.currentIndex);
    return prevItem;
  }

  /**
   * Jump to specific item in playlist
   */
  public jumpTo(index: number): PlaylistItem | null {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
      const item = this.getCurrentItem();
      this.callbacks.onTrackChange?.(item!, this.currentIndex);
      return item;
    }
    return null;
  }

  /**
   * Toggle shuffle mode
   */
  public toggleShuffle(): boolean {
    this.isShuffled = !this.isShuffled;
    
    if (this.isShuffled) {
      this.shufflePlaylist();
    } else {
      this.playlist = [...this.originalOrder];
      // Find current item in original order
      const currentItem = this.originalOrder.find(item => item.id === this.playlist[this.currentIndex]?.id);
      this.currentIndex = this.originalOrder.findIndex(item => item.id === currentItem?.id);
    }

    this.savePlaylistSettings();
    console.log(`🔀 Shuffle mode: ${this.isShuffled ? 'ON' : 'OFF'}`);
    return this.isShuffled;
  }

  /**
   * Cycle through repeat modes
   */
  public cycleRepeatMode(): 'none' | 'one' | 'all' {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentModeIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentModeIndex + 1) % modes.length];
    
    this.savePlaylistSettings();
    console.log(`🔁 Repeat mode: ${this.repeatMode.toUpperCase()}`);
    return this.repeatMode;
  }

  /**
   * Shuffle the playlist while preserving current item
   */
  private shufflePlaylist(): void {
    if (this.playlist.length <= 1) return;

    const currentItem = this.getCurrentItem();
    const otherItems = this.playlist.filter((_, index) => index !== this.currentIndex);
    
    // Fisher-Yates shuffle
    for (let i = otherItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherItems[i], otherItems[j]] = [otherItems[j], otherItems[i]];
    }

    // Reconstruct playlist with current item at the beginning
    this.playlist = [currentItem!, ...otherItems];
    this.currentIndex = 0;
  }

  /**
   * Set playlist callbacks
   */
  public setCallbacks(callbacks: PlaylistCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Clear playlist
   */
  public clearPlaylist(): void {
    this.playlist = [];
    this.originalOrder = [];
    this.currentIndex = 0;
    console.log('🎵 Playlist cleared');
  }

  /**
   * Get playlist info for display
   */
  public getPlaylistInfo(): {
    current: number;
    total: number;
    currentTitle: string;
    nextTitle?: string;
    previousTitle?: string;
  } {
    const current = this.getCurrentItem();
    const next = this.playlist[this.currentIndex + 1];
    const previous = this.playlist[this.currentIndex - 1];

    return {
      current: this.currentIndex + 1,
      total: this.playlist.length,
      currentTitle: current?.title || '',
      nextTitle: next?.title,
      previousTitle: previous?.title
    };
  }

  /**
   * Estimate duration based on content length
   */
  private estimateDuration(content: string): number {
    // Rough estimate: 200 words per minute for audio
    const wordCount = content.split(/\s+/).length;
    return Math.max(30, (wordCount / 200) * 60); // Minimum 30 seconds
  }

  /**
   * Check if there's a next item available
   */
  public hasNext(): boolean {
    if (this.repeatMode === 'all') return this.playlist.length > 0;
    return this.currentIndex < this.playlist.length - 1;
  }

  /**
   * Check if there's a previous item available
   */
  public hasPrevious(): boolean {
    if (this.repeatMode === 'all') return this.playlist.length > 0;
    return this.currentIndex > 0;
  }

  /**
   * Get all playlist items
   */
  public getAllItems(): PlaylistItem[] {
    return [...this.playlist];
  }

  /**
   * Get current index
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get playlist length
   */
  public getLength(): number {
    return this.playlist.length;
  }
}

export const audioPlaylistService = AudioPlaylistService.getInstance();
