import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StandardHeader from '../../components/StandardHeader';
import { audioManagerService } from '../../services/audioManager';
import InstallButton from '../../components/InstallButton';

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
  const [fontSize, setFontSize] = useState('base');
  const [voicePreference, setVoicePreference] = useState<'male' | 'female'>('male');

  useEffect(() => {
    // Load font size setting
    const savedFontSize = localStorage.getItem('fontSize') || 'base';
    setFontSize(savedFontSize);
    
    // Load voice preference setting
    const savedVoicePreference = localStorage.getItem('audioVoicePreference') as 'male' | 'female' || 'male';
    setVoicePreference(savedVoicePreference);
  }, []);

  const clearLocalData = () => {
    // Clear all app data except theme
    const keysToRemove = Object.keys(localStorage).filter(key => key !== 'theme');
    keysToRemove.forEach(key => localStorage.removeItem(key));
    alert('Local data cleared successfully (theme preserved)');
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    localStorage.setItem('fontSize', newSize);
  };

  const handleVoicePreferenceChange = (newVoice: 'male' | 'female') => {
    setVoicePreference(newVoice);
    localStorage.setItem('audioVoicePreference', newVoice);
    
    // Update the audio manager with new voice preference
    audioManagerService.setVoicePreference(newVoice);
  };

  const handleDownloadAllAudio = async () => {
    alert('Audio files are managed manually via Pages CMS. Upload audio files for each chapter, meditation, or story through the CMS interface.');
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark paper-texture">
      <StandardHeader
        title="Settings"
        showBackButton={true}
      />

      {/* Content */}
      <div className="p-6 max-w-md mx-auto space-y-6 pt-20 pb-24">
        {/* Appearance */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
            <div className="space-y-3">
              <span className="text-ink-secondary dark:text-ink-muted">
                Font Size
              </span>
              <div className="flex space-x-2">
                {[
                  { value: 'sm', label: 'Small', preview: 'Aa' },
                  { value: 'base', label: 'Medium', preview: 'Aa' },
                  { value: 'lg', label: 'Large', preview: 'Aa' },
                  { value: 'xl', label: 'Extra Large', preview: 'Aa' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFontSizeChange(option.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                      fontSize === option.value
                        ? 'border-ink-primary dark:border-paper-light bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                        : 'border-ink-muted border-opacity-30 text-ink-secondary dark:text-ink-muted hover:border-opacity-50'
                    }`}
                  >
                    <div className={`text-center ${option.value === 'sm' ? 'text-sm' : option.value === 'base' ? 'text-base' : option.value === 'lg' ? 'text-lg' : 'text-xl'}`}>
                      {option.preview}
                    </div>
                    <div className="text-xs mt-1">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Audio Management */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            Audio Management
          </h2>
          <div className="space-y-4">
            {/* Voice Preference */}
            <div className="space-y-3">
              <span className="text-ink-secondary dark:text-ink-muted">
                Voice Preference
              </span>
              <div className="flex space-x-2">
                {[
                  { value: 'male', label: 'Male Voice', description: 'Deeper, resonant tone' },
                  { value: 'female', label: 'Female Voice', description: 'Smooth, natural tone' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleVoicePreferenceChange(option.value as 'male' | 'female')}
                    className={`flex-1 py-3 px-4 rounded-lg border transition-colors text-left ${
                      voicePreference === option.value
                        ? 'border-ink-primary dark:border-paper-light bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                        : 'border-ink-muted border-opacity-30 text-ink-secondary dark:text-ink-muted hover:border-opacity-50'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-75">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Files Info */}
            <div className="border-t border-ink-muted border-opacity-20 pt-4">
              <p className="text-sm text-ink-muted mb-3">
                Audio files are managed through Pages CMS. Upload .wav files for each content piece via the CMS interface.
              </p>
              
              <button
                onClick={handleDownloadAllAudio}
                className="w-full px-4 py-2 text-sm text-ink-secondary dark:text-ink-muted hover:bg-ink-muted hover:bg-opacity-10 rounded-lg transition-colors"
              >
                About Audio Management
              </button>
            </div>
          </div>
        </motion.div>

        {/* App */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            App
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ink-secondary dark:text-ink-muted font-medium">
                  Install App
                </p>
                <p className="text-sm text-ink-muted">
                  Get the full experience with offline access and background audio
                </p>
              </div>
              <InstallButton size="sm" />
            </div>
          </div>
        </motion.div>

        {/* Data */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
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
              <strong>Version:</strong> 1.0.0 (Free)
            </p>
            <p>
              <strong>Build:</strong> Development
            </p>
            <p>
              <strong>Features:</strong> Offline Mode, AI Chat
            </p>
          </div>
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