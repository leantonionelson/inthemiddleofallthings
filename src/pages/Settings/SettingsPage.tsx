import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import StandardHeader from '../../components/StandardHeader';
import { audioManagerService } from '../../services/audioManager';
import { authService, UserProfile } from '../../services/firebaseAuth';
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
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState('base');
  const [voicePreference, setVoicePreference] = useState<'male' | 'female'>('male');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    // Load user profile
    const loadUserProfile = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && !currentUser.isAnonymous) {
          const profile = await authService.getUserProfile(currentUser.uid);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
    
    // Load font size setting
    const savedFontSize = localStorage.getItem('fontSize') || 'base';
    setFontSize(savedFontSize);
    
    // Load voice preference setting
    const savedVoicePreference = localStorage.getItem('audioVoicePreference') as 'male' | 'female' || 'male';
    setVoicePreference(savedVoicePreference);
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
                {isLoadingProfile ? (
                  <div className="w-4 h-4 border-2 border-paper-light border-t-transparent rounded-full animate-spin" />
                ) : userProfile ? (
                  (userProfile.name || userProfile.email || 'U').charAt(0).toUpperCase()
                ) : (
                  'D'
                )}
              </span>
            </div>
            <div>
              {isLoadingProfile ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                </div>
              ) : userProfile ? (
                <>
                  <p className="text-ink-primary dark:text-paper-light font-medium">
                    {userProfile.name || 'User'}
                  </p>
                  <p className="text-ink-muted text-sm">
                    {userProfile.email || 'No email'}
                  </p>
                  <p className="text-ink-muted text-xs">
                    {userProfile.isAnonymous ? 'Anonymous User' : 'Authenticated User'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-ink-primary dark:text-paper-light font-medium">
                    Free User
                  </p>
                  <p className="text-ink-muted text-sm">
                    free@example.com
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Account Info */}
        {userProfile && (
          <motion.div
            className="bg-ink-muted bg-opacity-10 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-lg font-heading text-ink-primary dark:text-paper-light mb-4">
              Account
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary dark:text-ink-muted">Account Type</span>
                <span className="text-ink-primary dark:text-paper-light font-medium">
                  {userProfile.isAnonymous ? 'Anonymous' : 'Authenticated'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary dark:text-ink-muted">Cloud Sync</span>
                <span className={`font-medium ${userProfile.isAnonymous ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {userProfile.isAnonymous ? 'Disabled' : 'Enabled'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary dark:text-ink-muted">Member Since</span>
                <span className="text-ink-primary dark:text-paper-light font-medium">
                  {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

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