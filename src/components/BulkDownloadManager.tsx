import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, HardDrive, Wifi, WifiOff, Play, Pause, Trash2 } from 'lucide-react';
import { BookChapter } from '../types';
import { offlineManager, OfflineStatus, DownloadProgress } from '../services/offlineManager';

interface BulkDownloadManagerProps {
  chapters: BookChapter[];
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const BulkDownloadManager: React.FC<BulkDownloadManagerProps> = ({
  chapters,
  onDownloadComplete,
  onDownloadError
}) => {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(offlineManager.getOfflineStatus());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(new Map());
  const [downloadStatus, setDownloadStatus] = useState<Map<string, 'pending' | 'downloading' | 'completed' | 'error'>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setOfflineStatus);
    return unsubscribe;
  }, []);

  const isOnline = offlineStatus.isOnline;
  const canDownload = isOnline && !isDownloading;
  const downloadedCount = offlineStatus.downloadedChapters.length;
  const totalCount = chapters.length;
  const progressPercentage = totalCount > 0 ? (downloadedCount / totalCount) * 100 : 0;

  const handleBulkDownload = async () => {
    if (!canDownload) return;

    setIsDownloading(true);
    setIsPaused(false);
    setErrors(new Map());
    setDownloadProgress(new Map());
    setDownloadStatus(new Map());

    try {
      const results = await offlineManager.downloadMultipleChapters(chapters);
      
      results.forEach((result, index) => {
        const chapter = chapters[index];
        if (result.status === 'completed') {
          setDownloadStatus(prev => new Map(prev.set(chapter.id, 'completed')));
          setDownloadProgress(prev => new Map(prev.set(chapter.id, 100)));
        } else if (result.status === 'error') {
          setDownloadStatus(prev => new Map(prev.set(chapter.id, 'error')));
          setErrors(prev => new Map(prev.set(chapter.id, result.error || 'Download failed')));
        }
      });

      onDownloadComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk download failed';
      onDownloadError?.(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    // Note: In a real implementation, you'd want to actually pause the downloads
  };

  const handleResume = () => {
    setIsPaused(false);
    // Note: In a real implementation, you'd want to resume the downloads
  };

  const handleClearAll = async () => {
    try {
      await offlineManager.clearAllOfflineContent();
    } catch (err) {
      console.error('Failed to clear offline content:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getChapterStatus = (chapterId: string) => {
    if (offlineStatus.downloadedChapters.includes(chapterId)) {
      return 'completed';
    }
    return downloadStatus.get(chapterId) || 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Downloaded';
      case 'downloading':
        return 'Downloading...';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Offline Downloads
            </h3>
            <p className="text-sm text-gray-500">
              {downloadedCount} of {totalCount} chapters downloaded
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          
          {downloadedCount > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear all offline content"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-blue-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Storage Usage */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Storage Used</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatBytes(offlineStatus.storageUsed)}
          </span>
        </div>
      </div>

      {/* Download Controls */}
      <div className="flex items-center space-x-3 mb-4">
        {!isDownloading && canDownload && (
          <button
            onClick={handleBulkDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download All</span>
          </button>
        )}

        {isDownloading && (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Chapter List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {chapters.map((chapter) => {
          const status = getChapterStatus(chapter.id);
          const progress = downloadProgress.get(chapter.id) || 0;
          const error = errors.get(chapter.id);

          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(status)}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {chapter.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getStatusText(status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {status === 'downloading' && (
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                
                {error && (
                  <div className="text-xs text-red-500 max-w-32 truncate">
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Network Status */}
      {!isOnline && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              You're offline. Downloaded content is still available.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDownloadManager;
