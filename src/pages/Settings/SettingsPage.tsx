import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StandardHeader from '../../components/StandardHeader';
import { audioManagerService } from '../../services/audioManager';
import InstallButton from '../../components/InstallButton';
import { useAuth } from '../../hooks/useAuth';
import WelcomeDrawer from '../../components/WelcomeDrawer';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onToggleTheme
}) => {
  const [voicePreference, setVoicePreference] = useState<'male' | 'female'>('male');
  const [showLoginDrawer, setShowLoginDrawer] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Load voice preference setting
    const savedVoicePreference = localStorage.getItem('audioVoicePreference') as 'male' | 'female' || 'male';
    setVoicePreference(savedVoicePreference);
  }, []);

  // Listen for drawer close event
  useEffect(() => {
    const handleDrawerClose = () => {
      setShowLoginDrawer(false);
    };
    window.addEventListener('welcomeDrawerClosed', handleDrawerClose);
    return () => window.removeEventListener('welcomeDrawerClosed', handleDrawerClose);
  }, []);

  const handleVoicePreferenceChange = (newVoice: 'male' | 'female') => {
    setVoicePreference(newVoice);
    localStorage.setItem('audioVoicePreference', newVoice);
    
    // Update the audio manager with new voice preference
    audioManagerService.setVoicePreference(newVoice);
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-slate-950/75 relative">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-100"
        >
          <source src="/media/bg.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for better content readability */}
        <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
      </div>

      <div className="relative z-10">
        <StandardHeader
          title="Settings"
          showBackButton={true}
        />

      {/* Content */}
      <div className="p-6 max-w-md mx-auto space-y-6">
        {/* Profile */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            Profile
          </h2>
          {user ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-secondary dark:text-ink-muted mb-1">
                  Name
                </label>
                <p className="text-ink-primary dark:text-paper-light">
                  {user.displayName || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary dark:text-ink-muted mb-1">
                  Email
                </label>
                <p className="text-ink-primary dark:text-paper-light">
                  {user.email}
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                }}
                className="w-full mt-4 py-2 px-4 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-ink-secondary dark:text-ink-muted text-sm mb-4">
                Sign up to store your progress and get updates
              </p>
              <button
                onClick={() => {
                  setShowLoginDrawer(true);
                  // Trigger drawer to show
                  window.dispatchEvent(new CustomEvent('showWelcomeDrawer'));
                }}
                className="w-full py-2 px-4 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Login / Sign Up
              </button>
            </div>
          )}
        </motion.div>

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
        </motion.div>

        {/* Audio */}
        <motion.div
          className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
            Audio
          </h2>
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
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Author:</strong>{' '}
              <a 
                href="https://leantonio.me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                leantonio.me
              </a>
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
            In the Middle of All Things          </p>
        </motion.div>
      </div>
      </div>

      {/* Login Drawer - trigger via event */}
      {showLoginDrawer && (
        <WelcomeDrawer />
      )}
    </div>
  );
};

export default SettingsPage; 