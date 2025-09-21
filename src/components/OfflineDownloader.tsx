import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Wifi, WifiOff, CheckCircle, AlertCircle, Trash2, HardDrive } from 'lucide-react';
import { BookChapter } from '../types';
import { offlineManager, OfflineStatus, DownloadProgress } from '../services/offlineManager';

interface OfflineDownloaderProps {
  chapter: BookChapter;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const OfflineDownloader: React.FC<OfflineDownloaderProps> = ({
  chapter,
  onDownloadComplete,
  onDownloadError
}) => {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(offlineManager.getOfflineStatus());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setOfflineStatus);
    return unsubscribe;
  }, []);

  const isOffline = offlineManager.isChapterOffline(chapter.id);
  const isOnline = offlineStatus.isOnline;
  const canDownload = offlineStatus.canDownload && !isOffline && !isDownloading;

  const handleDownload = async () => {
    if (!canDownload) return;

    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      const progress = await offlineManager.downloadChapter(chapter);
      
      if (progress.status === 'completed') {
        setDownloadProgress(100);
        onDownloadComplete?.();
      } else if (progress.status === 'error') {
        setError(progress.error || 'Download failed');
        onDownloadError?.(progress.error || 'Download failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      onDownloadError?.(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await offlineManager.removeOfflineChapter(chapter.id);
    } catch (err) {
      console.error('Failed to remove offline chapter:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (isOffline) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isDownloading) return <Download className="w-4 h-4 text-blue-500 animate-pulse" />;
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Download className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isOffline) return 'Downloaded';
    if (isDownloading) return 'Downloading...';
    if (error) return 'Error';
    return 'Download for offline';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isOffline && (
            <button
              onClick={handleRemove}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove from offline storage"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          {canDownload && (
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              Download
            </button>
          )}
        </div>
      </div>

      {/* Download Progress */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${downloadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {downloadProgress}% complete
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storage Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <HardDrive className="w-3 h-3" />
          <span>
            {formatBytes(offlineStatus.storageUsed)} used
          </span>
        </div>
        
        {isOffline && (
          <span className="text-green-600">
            Available offline
          </span>
        )}
      </div>

      {/* Network Status */}
      {!isOnline && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
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

export default OfflineDownloader;
