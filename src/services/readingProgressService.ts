/**
 * Reading Progress Service
 * Tracks reading status and progress for meditations, stories, and book chapters
 */

export interface ReadingProgress {
  id: string; // content id (meditation.id, story.id, or chapter.id)
  type: 'meditation' | 'story' | 'chapter';
  isRead: boolean;
  lastPosition: number; // scroll position percentage (0-100)
  lastReadDate: string; // ISO date string
  readCount: number; // how many times fully read
}

export interface ContinueReadingItem {
  id: string;
  type: 'meditation' | 'story' | 'chapter';
  title: string;
  lastPosition: number;
  lastReadDate: string;
  isRead: boolean;
}

const STORAGE_KEY = 'readingProgress';
const CONTINUE_READING_LIMIT = 5; // Max items to show in continue reading
const PROGRESS_UPDATE_EVENT = 'readingProgressUpdated';

class ReadingProgressService {
  /**
   * Dispatch custom event to notify listeners of progress updates
   */
  private dispatchProgressUpdate(): void {
    try {
      // Dispatch custom event for same-tab listeners
      // Note: Storage events fire naturally for cross-tab updates when localStorage is modified
      window.dispatchEvent(new CustomEvent(PROGRESS_UPDATE_EVENT));
    } catch (error) {
      console.error('Error dispatching progress update event:', error);
    }
  }

  /**
   * Get all reading progress data
   */
  private getAllProgress(): Record<string, ReadingProgress> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading reading progress:', error);
      return {};
    }
  }

  /**
   * Save all reading progress data
   */
  private saveAllProgress(data: Record<string, ReadingProgress>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Dispatch update event after saving
      this.dispatchProgressUpdate();
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  }

  /**
   * Get progress for specific content
   */
  getProgress(id: string): ReadingProgress | null {
    const allProgress = this.getAllProgress();
    return allProgress[id] || null;
  }

  /**
   * Update reading position
   */
  updatePosition(id: string, type: 'meditation' | 'story' | 'chapter', position: number): void {
    const allProgress = this.getAllProgress();
    const existing = allProgress[id];
    
    const now = new Date().toISOString();
    
    allProgress[id] = {
      id,
      type,
      isRead: existing?.isRead || false,
      lastPosition: Math.round(position),
      lastReadDate: now,
      readCount: existing?.readCount || 0
    };
    
    this.saveAllProgress(allProgress);
  }

  /**
   * Mark content as fully read (when scrolled to bottom)
   */
  markAsRead(id: string, type: 'meditation' | 'story' | 'chapter'): void {
    console.log(`[ReadingProgressService] markAsRead called: id=${id}, type=${type}`);
    const allProgress = this.getAllProgress();
    const existing = allProgress[id];
    
    const now = new Date().toISOString();
    
    allProgress[id] = {
      id,
      type,
      isRead: true,
      lastPosition: 100,
      lastReadDate: now,
      readCount: (existing?.readCount || 0) + 1
    };
    
    console.log(`[ReadingProgressService] Saving progress for ${id}:`, allProgress[id]);
    this.saveAllProgress(allProgress);
  }

  /**
   * Mark content as unread
   */
  markAsUnread(id: string): void {
    const allProgress = this.getAllProgress();
    if (allProgress[id]) {
      allProgress[id].isRead = false;
      allProgress[id].readCount = 0;
      this.saveAllProgress(allProgress);
    }
  }

  /**
   * Check if content is read
   */
  isRead(id: string): boolean {
    const progress = this.getProgress(id);
    const result = progress?.isRead || false;
    if (result) {
      console.log(`[ReadingProgressService] isRead(${id}) = true`);
    }
    return result;
  }

  /**
   * Get last reading position
   */
  getLastPosition(id: string): number {
    const progress = this.getProgress(id);
    return progress?.lastPosition || 0;
  }

  /**
   * Get continue reading items for a specific type
   */
  getContinueReading(type?: 'meditation' | 'story' | 'chapter'): ContinueReadingItem[] {
    const allProgress = this.getAllProgress();
    
    // Convert to array and filter
    let items = Object.values(allProgress)
      .filter(item => {
        // Filter by type if specified
        if (type && item.type !== type) return false;
        
        // Only include items that are in progress (not fully read and have some progress)
        return !item.isRead && item.lastPosition > 5 && item.lastPosition < 95;
      })
      .map(item => ({
        id: item.id,
        type: item.type,
        title: '', // Will be filled by the caller with actual content data
        lastPosition: item.lastPosition,
        lastReadDate: item.lastReadDate,
        isRead: item.isRead
      }));
    
    // Sort by most recent first
    items.sort((a, b) => {
      return new Date(b.lastReadDate).getTime() - new Date(a.lastReadDate).getTime();
    });
    
    // Limit results
    return items.slice(0, CONTINUE_READING_LIMIT);
  }

  /**
   * Get all items of a specific type (for list views)
   */
  getProgressByType(type: 'meditation' | 'story' | 'chapter'): Record<string, ReadingProgress> {
    const allProgress = this.getAllProgress();
    const filtered: Record<string, ReadingProgress> = {};
    
    Object.entries(allProgress).forEach(([id, progress]) => {
      if (progress.type === type) {
        filtered[id] = progress;
      }
    });
    
    return filtered;
  }

  /**
   * Get reading statistics
   */
  getStats(type?: 'meditation' | 'story' | 'chapter') {
    const allProgress = this.getAllProgress();
    const items = Object.values(allProgress);
    
    const filtered = type ? items.filter(item => item.type === type) : items;
    
    const totalRead = filtered.filter(item => item.isRead).length;
    const totalInProgress = filtered.filter(item => !item.isRead && item.lastPosition > 5).length;
    const totalItems = filtered.length;
    
    return {
      totalRead,
      totalInProgress,
      totalItems,
      percentageRead: totalItems > 0 ? Math.round((totalRead / totalItems) * 100) : 0
    };
  }

  /**
   * Clear all progress (for settings/reset)
   */
  clearAllProgress(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Clear progress for specific type
   */
  clearProgressByType(type: 'meditation' | 'story' | 'chapter'): void {
    const allProgress = this.getAllProgress();
    const filtered: Record<string, ReadingProgress> = {};
    
    Object.entries(allProgress).forEach(([id, progress]) => {
      if (progress.type !== type) {
        filtered[id] = progress;
      }
    });
    
    this.saveAllProgress(filtered);
  }

  /**
   * Export progress data (for backup/sync)
   */
  exportProgress(): string {
    return JSON.stringify(this.getAllProgress(), null, 2);
  }

  /**
   * Import progress data (for backup/sync)
   */
  importProgress(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.saveAllProgress(parsed);
      return true;
    } catch (error) {
      console.error('Error importing progress:', error);
      return false;
    }
  }
}

// Export singleton instance
export const readingProgressService = new ReadingProgressService();

