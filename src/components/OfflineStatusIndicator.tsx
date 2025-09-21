import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { offlineManager, OfflineStatus } from '../services/offlineManager';

interface OfflineStatusIndicatorProps {
  className?: string;
}

const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({ className = '' }) => {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(offlineManager.getOfflineStatus());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setOfflineStatus);
    return unsubscribe;
  }, []);

  const isOnline = offlineStatus.isOnline;
  const downloadedCount = offlineStatus.downloadedChapters.length;
  const hasDownloads = downloadedCount > 0;

  const getStatusIcon = () => {
    if (!isOnline && hasDownloads) {
      return <WifiOff className="w-4 h-4 text-yellow-500" />;
    } else if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    } else if (hasDownloads) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <Wifi className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline && hasDownloads) {
      return 'Offline (content available)';
    } else if (!isOnline) {
      return 'Offline';
    } else if (hasDownloads) {
      return `${downloadedCount} chapters offline`;
    } else {
      return 'Online';
    }
  };

  const getStatusColor = () => {
    if (!isOnline && hasDownloads) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (!isOnline) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (hasDownloads) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium transition-colors ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Offline Status
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-gray-700">
                  {isOnline ? 'Connected to internet' : 'No internet connection'}
                </span>
              </div>

              {/* Downloaded Content */}
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">
                  {downloadedCount} chapters downloaded for offline use
                </span>
              </div>

              {/* Storage Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Storage Used</span>
                  <span className="font-medium text-gray-900">
                    {formatBytes(offlineStatus.storageUsed)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((offlineStatus.storageUsed / (50 * 1024 * 1024)) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Download Progress */}
              {offlineStatus.downloadProgress.size > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Active Downloads
                  </div>
                  {Array.from(offlineStatus.downloadProgress.entries()).map(([chapterId, progress]) => (
                    <div key={chapterId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate">
                          {chapterId.replace('chapter-', 'Chapter ')}
                        </span>
                        <span className="text-gray-500">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Offline Capabilities */}
              {!isOnline && hasDownloads && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">
                      You can read and listen to downloaded content offline
                    </span>
                  </div>
                </div>
              )}

              {/* No Offline Content Warning */}
              {!isOnline && !hasDownloads && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      No offline content available. Connect to internet to download chapters.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineStatusIndicator;
