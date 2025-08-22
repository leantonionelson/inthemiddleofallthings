import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import StandardHeader from '../../components/StandardHeader';
import { geminiTTSService } from '../../services/geminiTTS';
import { useFontSize } from '../../contexts/FontSizeContext';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onToggleTheme,
  onSignOut
}) => {
  const navigate = useNavigate();
  const [autoDownload, setAutoDownload] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const { fontSize, setFontSize } = useFontSize();

  useEffect(() => {
    // Load audio settings
    const autoDownloadSetting = localStorage.getItem('autoDownloadAudio') === 'true';
    setAutoDownload(autoDownloadSetting);
    
    // Load audio cache info
    const cacheSize = geminiTTSService.getCacheSize();
    setTotalSize(cacheSize);
  }, []);

  const handleSignOut = () => {
    onSignOut();
    navigate(AppRoute.AUTH);
  };

  const clearLocalData = () => {
    localStorage.removeItem('onboardingResponses');
    localStorage.removeItem('userSymbol');
    localStorage.removeItem('reflections');
    localStorage.removeItem('highlights');
    alert('Local data cleared successfully');
  };

  const handleAutoDownloadToggle = () => {
    const newValue = !autoDownload;
    setAutoDownload(newValue);
    localStorage.setItem('autoDownloadAudio', newValue.toString());
  };

  const handleDownloadAllAudio = async () => {
    alert('Audio files are automatically generated and cached as needed. No manual download required.');
  };

  const handleClearAudioFiles = async () => {
    if (confirm('Are you sure you want to clear all generated audio files? This cannot be undone.')) {
      await geminiTTSService.clearCache();
      setTotalSize(0);
      alert('Audio files cleared successfully');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark paper-texture">
      <StandardHeader
        title="Settings"
        showBackButton={true}
      />

      {/* Content */}
      <div className="p-6 max-w-md mx-auto space-y-6 pt-20 pb-24">
        {/* Profile */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            Profile
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-ink-primary dark:bg-paper-light rounded-full flex items-center justify-center">
              <span className="text-paper-light dark:text-ink-primary font-medium">
                D
              </span>
            </div>
            <div>
              <p className="text-ink-primary dark:text-paper-light font-medium">
                Demo User
              </p>
              <p className="text-ink-muted text-sm">
                demo@example.com
              </p>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-ink-secondary dark:text-ink-muted">
                Dark Mode
              </span>
              <button
                onClick={onToggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-ink-primary' : 'bg-ink-muted bg-opacity-30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-paper-light transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-ink-secondary dark:text-ink-muted">
                  Font Size
                </span>
                <p className="text-xs text-ink-muted">
                  Adjust text size for reading
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFontSize('small')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    fontSize === 'small'
                      ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                      : 'bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20'
                  }`}
                >
                  S
                </button>
                <button
                  onClick={() => setFontSize('medium')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    fontSize === 'medium'
                      ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                      : 'bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    fontSize === 'large'
                      ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                      : 'bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20'
                  }`}
                >
                  L
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Audio Management */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            Audio Management
          </h2>
          <div className="space-y-4">
            {/* Auto Download Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-ink-secondary dark:text-ink-muted">
                  Auto-download Audio
                </span>
                <p className="text-xs text-ink-muted">
                  Automatically download generated audio files
                </p>
              </div>
              <button
                onClick={handleAutoDownloadToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoDownload ? 'bg-ink-primary' : 'bg-ink-muted bg-opacity-30'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-paper-light transition-transform ${
                    autoDownload ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Audio Files Info */}
            <div className="border-t border-ink-muted border-opacity-20 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-ink-secondary dark:text-ink-muted">
                  Generated Files
                </span>
                <span className="text-sm text-ink-muted">
                  {totalSize > 0 ? 'Cached audio' : 'No cached audio'} ({formatFileSize(totalSize)})
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleDownloadAllAudio}
                  className="w-full px-4 py-2 text-sm text-ink-secondary dark:text-ink-muted hover:bg-ink-muted hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  Download All Audio Files
                </button>
                <button
                  onClick={handleClearAudioFiles}
                  disabled={totalSize === 0}
                  className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All Audio Files
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            Data
          </h2>
          <div className="space-y-3">
            <button
              onClick={clearLocalData}
              className="w-full px-4 py-3 text-left text-ink-secondary dark:text-ink-muted hover:bg-ink-muted hover:bg-opacity-10 rounded-lg transition-colors"
            >
              Clear Local Data
            </button>
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            About
          </h2>
          <div className="space-y-3 text-ink-secondary dark:text-ink-muted text-sm">
            <p>
              <strong>Version:</strong> 1.0.0 (Demo)
            </p>
            <p>
              <strong>Build:</strong> Development
            </p>
            <p>
              <strong>Features:</strong> Offline Mode, Symbol Generation, AI Chat
            </p>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleSignOut}
            className="w-full px-6 py-3 bg-accent-ember text-paper-light font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign Out
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-ink-muted opacity-60">
            In the Middle of All Things<br />
            Built with React, TypeScript, and Gemini AI
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage; 