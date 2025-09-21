import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Wifi, WifiOff, HardDrive, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';
import { BookChapter } from '../types';
import { bookContent } from '../data/bookContent';
import BulkDownloadManager from '../components/BulkDownloadManager';
import OfflineStatusIndicator from '../components/OfflineStatusIndicator';

const OfflinePage: React.FC = () => {
  const {
    offlineStatus,
    isOnline,
    isOffline,
    hasOfflineContent,
    downloadedChapters,
    storageUsed,
    downloadChapter,
    removeOfflineChapter,
    clearAllOfflineContent,
    isChapterOffline
  } = useOffline();

  const [selectedChapters, setSelectedChapters] = useState<BookChapter[]>([]);
  const [showBulkDownload, setShowBulkDownload] = useState(false);

  useEffect(() => {
    // Load all book chapters
    const allChapters: BookChapter[] = [];
    bookContent.forEach(part => {
      part.chapters.forEach(chapter => {
        allChapters.push(chapter);
      });
    });
    setSelectedChapters(allChapters);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (): number => {
    const maxStorage = 50 * 1024 * 1024; // 50MB
    return Math.min((storageUsed / maxStorage) * 100, 100);
  };

  const handleDownloadChapter = async (chapter: BookChapter) => {
    try {
      await downloadChapter(chapter);
    } catch (error) {
      console.error('Failed to download chapter:', error);
    }
  };

  const handleRemoveChapter = async (chapterId: string) => {
    try {
      await removeOfflineChapter(chapterId);
    } catch (error) {
      console.error('Failed to remove chapter:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all offline content? This action cannot be undone.')) {
      try {
        await clearAllOfflineContent();
      } catch (error) {
        console.error('Failed to clear offline content:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Offline Downloads
              </h1>
              <p className="text-gray-600 mt-1">
                Download chapters for offline reading and listening
              </p>
            </div>
            <OfflineStatusIndicator />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <Wifi className="w-8 h-8 text-green-500" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isOnline ? 'Online' : 'Offline'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isOnline ? 'Connected to internet' : 'No internet connection'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Downloaded Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3">
              <Download className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {downloadedChapters.length}
                </h3>
                <p className="text-sm text-gray-600">
                  Chapters downloaded
                </p>
              </div>
            </div>
          </motion.div>

          {/* Storage Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3">
              <HardDrive className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatBytes(storageUsed)}
                </h3>
                <p className="text-sm text-gray-600">
                  Storage used
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Storage Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Storage Usage
            </h3>
            <span className="text-sm text-gray-600">
              {formatBytes(storageUsed)} / 50 MB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-blue-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getStoragePercentage()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {getStoragePercentage().toFixed(1)}% of available storage used
          </p>
        </motion.div>

        {/* Bulk Download Manager */}
        {showBulkDownload && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <BulkDownloadManager
              chapters={selectedChapters}
              onDownloadComplete={() => {
                console.log('Bulk download completed');
              }}
              onDownloadError={(error) => {
                console.error('Bulk download error:', error);
              }}
            />
          </motion.div>
        )}

        {/* Download Controls */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => setShowBulkDownload(!showBulkDownload)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {showBulkDownload ? 'Hide' : 'Show'} Bulk Download
          </button>
          
          {hasOfflineContent && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Chapter List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Chapters
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Select chapters to download for offline use
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {selectedChapters.map((chapter, index) => {
              const isDownloaded = isChapterOffline(chapter.id);
              
              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {isDownloaded ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {chapter.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {chapter.part} • Chapter {chapter.chapterNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {isDownloaded ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-600 font-medium">
                            Downloaded
                          </span>
                          <button
                            onClick={() => handleRemoveChapter(chapter.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove from offline storage"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDownloadChapter(chapter)}
                          disabled={!isOnline}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Offline Capabilities Info */}
        {isOffline && hasOfflineContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Offline Mode Active
                </h3>
                <p className="text-green-700 mt-1">
                  You can read and listen to downloaded chapters without an internet connection.
                  All pre-generated audio files are available offline.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* No Offline Content Warning */}
        {isOffline && !hasOfflineContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">
                  No Offline Content
                </h3>
                <p className="text-yellow-700 mt-1">
                  You're offline and don't have any downloaded content. 
                  Connect to the internet to download chapters for offline use.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OfflinePage;
