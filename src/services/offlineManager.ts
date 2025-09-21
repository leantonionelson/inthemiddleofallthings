/**
 * Offline Content Manager
 * Handles downloading and caching content for offline use
 */

import { BookChapter } from '../types';

export interface OfflineChapter {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  audioDuration?: number;
  downloadedAt: number;
  size: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  canDownload: boolean;
  storageUsed: number;
  storageAvailable: number;
  downloadedChapters: string[];
  downloadProgress: Map<string, number>;
}

export interface DownloadProgress {
  chapterId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
  error?: string;
}

class OfflineManagerService {
  private static instance: OfflineManagerService;
  private offlineChapters: Map<string, OfflineChapter> = new Map();
  private downloadProgress: Map<string, number> = new Map();
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(status: OfflineStatus) => void> = new Set();

  private readonly STORAGE_KEY = 'offline_chapters';
  private readonly AUDIO_CACHE_PREFIX = 'audio_';
  private readonly CONTENT_CACHE_PREFIX = 'content_';

  constructor() {
    this.loadOfflineChapters();
    this.setupNetworkListeners();
    this.setupStorageQuota();
  }

  public static getInstance(): OfflineManagerService {
    if (!OfflineManagerService.instance) {
      OfflineManagerService.instance = new OfflineManagerService();
    }
    return OfflineManagerService.instance;
  }

  /**
   * Check if a chapter is available offline
   */
  public isChapterOffline(chapterId: string): boolean {
    return this.offlineChapters.has(chapterId);
  }

  /**
   * Get offline chapter data
   */
  public getOfflineChapter(chapterId: string): OfflineChapter | null {
    return this.offlineChapters.get(chapterId) || null;
  }

  /**
   * Download a chapter for offline use
   */
  public async downloadChapter(chapter: BookChapter): Promise<DownloadProgress> {
    const chapterId = chapter.id;
    
    if (this.offlineChapters.has(chapterId)) {
      return {
        chapterId,
        progress: 100,
        status: 'completed'
      };
    }

    if (!this.isOnline) {
      return {
        chapterId,
        progress: 0,
        status: 'error',
        error: 'No internet connection'
      };
    }

    try {
      this.downloadProgress.set(chapterId, 0);
      this.notifyListeners();

      // Step 1: Download content (10% progress)
      this.downloadProgress.set(chapterId, 10);
      const content = await this.downloadChapterContent(chapter);
      
      // Step 2: Download audio if available (70% progress)
      this.downloadProgress.set(chapterId, 40);
      const audioData = await this.downloadChapterAudio(chapter);
      
      // Step 3: Cache everything (90% progress)
      this.downloadProgress.set(chapterId, 70);
      await this.cacheChapterData(chapter, content, audioData);
      
      // Step 4: Complete (100% progress)
      this.downloadProgress.set(chapterId, 100);
      
      const offlineChapter: OfflineChapter = {
        id: chapterId,
        title: chapter.title,
        content: content,
        audioUrl: audioData?.audioUrl,
        audioDuration: audioData?.duration,
        downloadedAt: Date.now(),
        size: this.calculateSize(content, audioData)
      };

      this.offlineChapters.set(chapterId, offlineChapter);
      this.saveOfflineChapters();
      this.downloadProgress.delete(chapterId);
      
      this.notifyListeners();

      return {
        chapterId,
        progress: 100,
        status: 'completed'
      };

    } catch (error) {
      this.downloadProgress.delete(chapterId);
      this.notifyListeners();
      
      return {
        chapterId,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Remove a chapter from offline storage
   */
  public async removeOfflineChapter(chapterId: string): Promise<void> {
    const chapter = this.offlineChapters.get(chapterId);
    if (!chapter) return;

    // Remove from cache
    await this.removeFromCache(chapterId);
    
    // Remove from memory
    this.offlineChapters.delete(chapterId);
    this.saveOfflineChapters();
    
    this.notifyListeners();
  }

  /**
   * Get offline status
   */
  public getOfflineStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      canDownload: this.isOnline && this.hasStorageSpace(),
      storageUsed: this.calculateStorageUsed(),
      storageAvailable: this.getStorageAvailable(),
      downloadedChapters: Array.from(this.offlineChapters.keys()),
      downloadProgress: new Map(this.downloadProgress)
    };
  }

  /**
   * Subscribe to offline status changes
   */
  public subscribe(listener: (status: OfflineStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get offline chapter content
   */
  public async getOfflineContent(chapterId: string): Promise<string | null> {
    const chapter = this.offlineChapters.get(chapterId);
    if (!chapter) return null;

    // Try to get from cache first
    const cached = await this.getFromCache(this.CONTENT_CACHE_PREFIX + chapterId);
    if (cached) return cached;

    // Fallback to stored content
    return chapter.content;
  }

  /**
   * Get offline audio URL
   */
  public async getOfflineAudio(chapterId: string): Promise<string | null> {
    const chapter = this.offlineChapters.get(chapterId);
    if (!chapter?.audioUrl) return null;

    // Try to get from cache first
    const cached = await this.getFromCache(this.AUDIO_CACHE_PREFIX + chapterId);
    if (cached) return cached;

    // Fallback to stored audio URL
    return chapter.audioUrl;
  }

  /**
   * Download multiple chapters
   */
  public async downloadMultipleChapters(chapters: BookChapter[]): Promise<DownloadProgress[]> {
    const results: DownloadProgress[] = [];
    
    for (const chapter of chapters) {
      const result = await this.downloadChapter(chapter);
      results.push(result);
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Clear all offline content
   */
  public async clearAllOfflineContent(): Promise<void> {
    // Clear cache
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    // Clear memory
    this.offlineChapters.clear();
    this.downloadProgress.clear();
    
    // Clear storage
    localStorage.removeItem(this.STORAGE_KEY);
    
    this.notifyListeners();
  }

  // Private methods

  private async downloadChapterContent(chapter: BookChapter): Promise<string> {
    // For now, we'll use the chapter content directly
    // In the future, this could fetch from an API
    return chapter.content;
  }

  private async downloadChapterAudio(chapter: BookChapter): Promise<{ audioUrl: string; duration: number } | null> {
    try {
      // Check if pre-generated audio exists
      const audioUrl = `/media/audio/chapters/${chapter.id}_male.wav`;
      const response = await fetch(audioUrl, { method: 'HEAD' });
      
      if (response.ok) {
        // Get audio duration
        const audio = new Audio(audioUrl);
        const duration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
          audio.addEventListener('error', () => resolve(0));
          setTimeout(() => resolve(0), 5000);
          audio.load();
        });
        
        return { audioUrl, duration };
      }
    } catch (error) {
      console.warn(`No pre-generated audio found for chapter ${chapter.id}`);
    }
    
    return null;
  }

  private async cacheChapterData(
    chapter: BookChapter, 
    content: string, 
    audioData: { audioUrl: string; duration: number } | null
  ): Promise<void> {
    const cache = await caches.open('offline-content-v1');
    
    // Cache content
    const contentResponse = new Response(content, {
      headers: { 'Content-Type': 'text/plain' }
    });
    await cache.put(this.CONTENT_CACHE_PREFIX + chapter.id, contentResponse);
    
    // Cache audio if available
    if (audioData) {
      try {
        const audioResponse = await fetch(audioData.audioUrl);
        if (audioResponse.ok) {
          await cache.put(this.AUDIO_CACHE_PREFIX + chapter.id, audioResponse);
        }
      } catch (error) {
        console.warn(`Failed to cache audio for chapter ${chapter.id}:`, error);
      }
    }
  }

  private async getFromCache(key: string): Promise<string | null> {
    try {
      const cache = await caches.open('offline-content-v1');
      const response = await cache.match(key);
      return response ? await response.text() : null;
    } catch (error) {
      return null;
    }
  }

  private async removeFromCache(chapterId: string): Promise<void> {
    try {
      const cache = await caches.open('offline-content-v1');
      await cache.delete(this.CONTENT_CACHE_PREFIX + chapterId);
      await cache.delete(this.AUDIO_CACHE_PREFIX + chapterId);
    } catch (error) {
      console.warn(`Failed to remove cache for chapter ${chapterId}:`, error);
    }
  }

  private calculateSize(content: string, audioData: { audioUrl: string; duration: number } | null): number {
    let size = new Blob([content]).size;
    
    if (audioData) {
      // Estimate audio file size (rough calculation)
      size += audioData.duration * 24000 * 2; // 24kHz, 16-bit
    }
    
    return size;
  }

  private calculateStorageUsed(): number {
    let totalSize = 0;
    for (const chapter of this.offlineChapters.values()) {
      totalSize += chapter.size;
    }
    return totalSize;
  }

  private getStorageAvailable(): number {
    // Estimate available storage (this is approximate)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => 
        (estimate.quota || 0) - (estimate.usage || 0)
      ).catch(() => 50 * 1024 * 1024); // 50MB fallback
    }
    return 50 * 1024 * 1024; // 50MB fallback
  }

  private hasStorageSpace(): boolean {
    const used = this.calculateStorageUsed();
    const available = 50 * 1024 * 1024; // 50MB limit
    return used < available;
  }

  private loadOfflineChapters(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const chapters = JSON.parse(stored);
        this.offlineChapters = new Map(chapters);
      }
    } catch (error) {
      console.warn('Failed to load offline chapters:', error);
    }
  }

  private saveOfflineChapters(): void {
    try {
      const chapters = Array.from(this.offlineChapters.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chapters));
    } catch (error) {
      console.warn('Failed to save offline chapters:', error);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private setupStorageQuota(): void {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        console.log('Storage quota:', estimate.quota);
        console.log('Storage used:', estimate.usage);
      });
    }
  }

  private notifyListeners(): void {
    const status = this.getOfflineStatus();
    this.listeners.forEach(listener => listener(status));
  }
}

// Export singleton instance
export const offlineManager = OfflineManagerService.getInstance();
