import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import InstallButton from '../../components/InstallButton';
import { useAuth } from '../../hooks/useAuth';
import WelcomeDrawer from '../../components/WelcomeDrawer';
import { useAppUpdate } from '../../hooks/useAppUpdate';
import { useDesktopDetection } from '../../hooks/useDesktopDetection';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { RefreshCw, Download, CheckCircle, AlertCircle, Sun, Moon, ArrowLeft } from 'lucide-react';

// Version injected at build time by Vite
declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onToggleTheme
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [showLoginDrawer, setShowLoginDrawer] = useState(false);
  const { user, signOut } = useAuth();
  const isDesktop = useDesktopDetection();
  const {
    isUpdateAvailable,
    isUpdating,
    updateError,
    checkForUpdates,
    applyUpdate,
  } = useAppUpdate();

  // Swipe navigation for tabs
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (activeTab === 'profile') {
        setActiveTab('settings');
      }
    },
    onSwipeRight: () => {
      if (activeTab === 'settings') {
        setActiveTab('profile');
      }
    },
    threshold: 50
  });

  // Listen for drawer close event
  useEffect(() => {
    const handleDrawerClose = () => {
      setShowLoginDrawer(false);
    };
    window.addEventListener('welcomeDrawerClosed', handleDrawerClose);
    return () => window.removeEventListener('welcomeDrawerClosed', handleDrawerClose);
  }, []);

  return (
    <div className="relative z-10">
        {/* Custom Header with Back Button, Tabs, and Theme Toggle */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-20"
        >
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <motion.button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 flex-shrink-0"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              {/* Tabs */}
              <div className="flex-1 border-b border-gray-200 dark:border-white/10">
                <nav aria-label="Tabs" className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('profile')}
                    aria-current={activeTab === 'profile' ? 'page' : undefined}
                    className={`flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium transition-colors ${
                      activeTab === 'profile'
                        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-300'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    aria-current={activeTab === 'settings' ? 'page' : undefined}
                    className={`flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium transition-colors ${
                      activeTab === 'settings'
                        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-300'
                    }`}
                  >
                    Settings
                  </button>
                </nav>
              </div>

              {/* Theme Toggle */}
              <motion.button
                onClick={onToggleTheme}
                className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.header>

      {/* Content */}
      <div 
        className="p-6 max-w-2xl mx-auto w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        <div className="space-y-6 pb-6">
        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <motion.div
            className="relative glass-subtle rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-xl font-serif text-ink-primary dark:text-paper-light mb-6">
              Profile
            </h2>
            {user ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary dark:text-ink-muted mb-2">
                    Name
                  </label>
                  <p className="text-base text-ink-primary dark:text-paper-light">
                    {user.displayName || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-secondary dark:text-ink-muted mb-2">
                    Email
                  </label>
                  <p className="text-base text-ink-primary dark:text-paper-light">
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
                  className="relative w-full mt-6 py-3 px-4 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-red-600/90 dark:bg-red-700/90 rounded-full" />
                  <div className="absolute inset-0 bg-red-700/0 dark:bg-red-800/0 group-hover:bg-red-700/100 dark:group-hover:bg-red-800/100 transition-all duration-300 rounded-full" />
                  <span className="relative z-10 text-white">Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-ink-secondary dark:text-ink-muted text-sm mb-4 leading-relaxed">
                  Sign up to store your progress and get updates
                </p>
                <button
                  onClick={() => {
                    setShowLoginDrawer(true);
                    // Trigger drawer to show
                    window.dispatchEvent(new CustomEvent('showWelcomeDrawer'));
                  }}
                  className="relative w-full py-3 px-4 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  <div className="absolute inset-0 glass-subtle rounded-full" />
                  <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                  <span className="relative z-10 text-ink-primary dark:text-paper-light">Login / Sign Up</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <>
            {/* App */}
        <motion.div
          className="relative glass-subtle rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2 className="text-xl font-serif text-ink-primary dark:text-paper-light mb-6">
            App
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-base text-ink-primary dark:text-paper-light font-medium mb-1">
                  Install App
                </p>
                <p className="text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
                  Get the full experience with offline access and background audio
                </p>
              </div>
              <div className="flex-shrink-0">
                <InstallButton size="sm" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-ink-muted/20 dark:border-paper-light/20">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="text-base text-ink-primary dark:text-paper-light font-medium mb-1">
                    Check for Updates
                  </p>
                  <p className="text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
                    {isUpdateAvailable 
                      ? 'New version available! Click to update.'
                      : 'Check if a new version is available'}
                  </p>
                </div>
                <button
                  onClick={isUpdateAvailable ? applyUpdate : checkForUpdates}
                  disabled={isUpdating}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-medium shadow-sm hover:shadow-md overflow-hidden group flex-shrink-0 ${
                    isUpdateAvailable
                      ? ''
                      : ''
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdateAvailable ? (
                    <>
                      <div className="absolute inset-0 bg-green-600/90 dark:bg-green-700/90 rounded-full" />
                      <div className="absolute inset-0 bg-green-700/0 dark:bg-green-800/0 group-hover:bg-green-700/100 dark:group-hover:bg-green-800/100 transition-all duration-300 rounded-full" />
                      <span className="relative z-10 text-white flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Update Now
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 glass-subtle rounded-full" />
                      <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                      <span className="relative z-10 text-ink-primary dark:text-paper-light flex items-center gap-2">
                        {isUpdating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Check
                          </>
                        )}
                      </span>
                    </>
                  )}
                </button>
              </div>
              
              {isUpdateAvailable && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-3">
                  <CheckCircle className="w-4 h-4" />
                  <span>Update ready to install</span>
                </div>
              )}
              
              {updateError && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>{updateError}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          className="relative glass-subtle rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <h2 className="text-xl font-serif text-ink-primary dark:text-paper-light mb-6">
            About
          </h2>
          <div className="space-y-3 text-ink-secondary dark:text-ink-muted text-sm leading-relaxed">
            <p>
              <strong className="text-ink-primary dark:text-paper-light">Version:</strong> {APP_VERSION}
            </p>
            <p>
              <strong className="text-ink-primary dark:text-paper-light">Author:</strong>{' '}
              <a 
                href="https://leantonio.me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
              >
                leantonio.me
              </a>
            </p>
          </div>
          {!isDesktop && (
            <div className="mt-6 pt-6 border-t border-ink-muted/20 dark:border-paper-light/20">
              <button
                onClick={() => {
                  // Trigger welcome intro to show
                  window.dispatchEvent(new CustomEvent('showWelcomeIntro'));
                }}
                className="relative w-full py-3 px-4 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="absolute inset-0 glass-subtle rounded-full" />
                <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <span className="relative z-10 text-ink-primary dark:text-paper-light">View Welcome Intro</span>
              </button>
            </div>
          )}
        </motion.div>
          </>
        )}

        {/* Footer */}
        <motion.div
          className="text-center pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs text-ink-muted dark:text-ink-muted opacity-60">
            In the Middle of All Things
          </p>
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