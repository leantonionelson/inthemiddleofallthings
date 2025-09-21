import { useState, useEffect } from 'react';
import { offlineManager, OfflineStatus, OfflineChapter } from '../services/offlineManager';
import { BookChapter } from '../types';

export interface UseOfflineReturn {
  offlineStatus: OfflineStatus;
  isOnline: boolean;
  isOffline: boolean;
  hasOfflineContent: boolean;
  downloadedChapters: string[];
  downloadProgress: Map<string, number>;
  storageUsed: number;
  storageAvailable: number;
  downloadChapter: (chapter: BookChapter) => Promise<void>;
  removeOfflineChapter: (chapterId: string) => Promise<void>;
  clearAllOfflineContent: () => Promise<void>;
  isChapterOffline: (chapterId: string) => boolean;
  getOfflineChapter: (chapterId: string) => OfflineChapter | null;
  getOfflineContent: (chapterId: string) => Promise<string | null>;
  getOfflineAudio: (chapterId: string) => Promise<string | null>;
}

/**
 * Hook for managing offline functionality
 */
export const useOffline = (): UseOfflineReturn => {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(offlineManager.getOfflineStatus());

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setOfflineStatus);
    return unsubscribe;
  }, []);

  const downloadChapter = async (chapter: BookChapter): Promise<void> => {
    try {
      await offlineManager.downloadChapter(chapter);
    } catch (error) {
      console.error('Failed to download chapter:', error);
      throw error;
    }
  };

  const removeOfflineChapter = async (chapterId: string): Promise<void> => {
    try {
      await offlineManager.removeOfflineChapter(chapterId);
    } catch (error) {
      console.error('Failed to remove offline chapter:', error);
      throw error;
    }
  };

  const clearAllOfflineContent = async (): Promise<void> => {
    try {
      await offlineManager.clearAllOfflineContent();
    } catch (error) {
      console.error('Failed to clear offline content:', error);
      throw error;
    }
  };

  const isChapterOffline = (chapterId: string): boolean => {
    return offlineManager.isChapterOffline(chapterId);
  };

  const getOfflineChapter = (chapterId: string): OfflineChapter | null => {
    return offlineManager.getOfflineChapter(chapterId);
  };

  const getOfflineContent = async (chapterId: string): Promise<string | null> => {
    try {
      return await offlineManager.getOfflineContent(chapterId);
    } catch (error) {
      console.error('Failed to get offline content:', error);
      return null;
    }
  };

  const getOfflineAudio = async (chapterId: string): Promise<string | null> => {
    try {
      return await offlineManager.getOfflineAudio(chapterId);
    } catch (error) {
      console.error('Failed to get offline audio:', error);
      return null;
    }
  };

  return {
    offlineStatus,
    isOnline: offlineStatus.isOnline,
    isOffline: !offlineStatus.isOnline,
    hasOfflineContent: offlineStatus.downloadedChapters.length > 0,
    downloadedChapters: offlineStatus.downloadedChapters,
    downloadProgress: offlineStatus.downloadProgress,
    storageUsed: offlineStatus.storageUsed,
    storageAvailable: offlineStatus.storageAvailable,
    downloadChapter,
    removeOfflineChapter,
    clearAllOfflineContent,
    isChapterOffline,
    getOfflineChapter,
    getOfflineContent,
    getOfflineAudio
  };
};

export default useOffline;
