import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { X, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { syncProgressToFirebase, loadProgressFromFirebase } from '../services/progressSyncService';
import { readingProgressService } from '../services/readingProgressService';

const WelcomeDrawer: React.FC = () => {
  const location = useLocation();
  const [showDrawer, setShowDrawer] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user, signUp, signIn } = useAuth();

  // Don't show on desktop landing page
  const isDesktopPage = location.pathname === '/desktop';

  useEffect(() => {
    // Don't show on desktop page
    if (isDesktopPage) {
      setShowDrawer(false);
      return;
    }

    // Check if user has seen the welcome drawer before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    // Don't show if user is already authenticated (unless explicitly opened from settings)
    if (!hasSeenWelcome && !user) {
      // Show drawer after a short delay
      setTimeout(() => {
        setShowDrawer(true);
      }, 1000);
    } else if (user && showDrawer) {
      // Close drawer if user becomes authenticated
      setShowDrawer(false);
      localStorage.setItem('hasSeenWelcome', 'true');
      window.dispatchEvent(new CustomEvent('welcomeDrawerClosed'));
    }
  }, [user, showDrawer, isDesktopPage]);

  // Allow external control to show drawer (e.g., from Settings page)
  useEffect(() => {
    const handleShowDrawer = () => {
      // Don't show on desktop page
      if (!isDesktopPage) {
        setShowDrawer(true);
      }
    };
    window.addEventListener('showWelcomeDrawer', handleShowDrawer);
    return () => window.removeEventListener('showWelcomeDrawer', handleShowDrawer);
  }, [isDesktopPage]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        // Sign up
        const newUser = await signUp(email, password, name);
        
        // Sync existing localStorage progress to Firebase
        try {
          await syncProgressToFirebase(newUser);
          // Set up sync callback for future updates
          readingProgressService.setUser(newUser, async () => {
            const { syncOnProgressUpdate } = await import('../services/progressSyncService');
            await syncOnProgressUpdate(newUser);
          });
        } catch (syncError) {
          console.error('Error syncing progress:', syncError);
          // Continue anyway - progress sync is not critical
        }
      } else {
        // Sign in
        const signedInUser = await signIn(email, password);
        
        // Load and merge progress from Firebase
        try {
          await loadProgressFromFirebase(signedInUser);
          // Set up sync callback for future updates
          readingProgressService.setUser(signedInUser, async () => {
            const { syncOnProgressUpdate } = await import('../services/progressSyncService');
            await syncOnProgressUpdate(signedInUser);
          });
        } catch (syncError) {
          console.error('Error loading progress:', syncError);
          // Continue anyway - progress sync is not critical
        }
      }

      // Close drawer and mark as seen
      handleDismiss();
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      const authError = error as { code?: string; message?: string };
      const errorMessage = authError.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please sign in instead.'
        : authError.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : authError.code === 'auth/wrong-password'
        ? 'Incorrect password.'
        : authError.message || 'Authentication failed. Please try again.';
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowDrawer(false);
    localStorage.setItem('hasSeenWelcome', 'true');
    // Dispatch event to notify Settings page
    window.dispatchEvent(new CustomEvent('welcomeDrawerClosed'));
  };

  const handleContinueWithoutSignup = () => {
    handleDismiss();
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  // Drag functionality - hooks must be called unconditionally
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 200], [1, 0]);
  const DRAG_THRESHOLD = 100; // pixels to drag before closing

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged down more than threshold, close drawer
    if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
      handleDismiss();
    } else {
      // Snap back to original position
      y.set(0);
    }
  };

  // Don't render on desktop landing page
  if (isDesktopPage) {
    return null;
  }

  // Allow showing drawer even if user is authenticated (e.g., from Settings)
  // But don't auto-show if user is already authenticated
  if (user && !showDrawer) {
    return null;
  }

  return (
    <AnimatePresence>
      {showDrawer && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              type: 'tween',
              ease: 'easeOut',
              duration: 0.25
            }}
            style={{ opacity: backdropOpacity }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: showDrawer ? 0 : '100%' }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'tween',
              ease: [0.25, 0.1, 0.25, 1],
              duration: 0.3
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            dragDirectionLock={true}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-paper-light dark:bg-paper-dark rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col"
          >
            {/* Top Bar with Drag Handle and Close Button */}
            <div className="flex items-center justify-between pt-3 pb-2 px-4">
              {/* Left spacer for centering drag handle */}
              <div className="w-10"></div>
              
              {/* Drag Handle - visual indicator */}
              <div className="flex justify-center flex-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-ink-muted" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto" 
              style={{ touchAction: 'pan-y' }}
              onTouchStart={(e) => {
                // Prevent drag when scrolling content
                const target = e.target as HTMLElement;
                if (target.closest('input, textarea, button, a')) {
                  return;
                }
              }}
            >
              <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-ink-primary dark:text-paper-light mb-2">
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </h3>
                  <p className="text-sm text-ink-secondary dark:text-ink-muted">
                    Sign up to store your progress and get updates
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-0">
                <div className={`overflow-hidden border border-gray-300 dark:border-gray-600 ${
                  isSignUp ? 'rounded-lg' : 'rounded-lg'
                }`}>
                  {isSignUp && (
                    <div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-muted z-10" />
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 rounded-t-lg border-0 border-b ${
                            errors.name
                              ? 'border-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-800 text-ink-primary dark:text-paper-light focus:outline-none focus:ring-2 focus:ring-ink-primary dark:focus:ring-paper-light focus:z-10 relative`}
                          placeholder="Your name"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.name && (
                        <p className="px-4 pt-1 pb-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-muted z-10" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border-0 ${
                        isSignUp ? 'border-b' : 'rounded-t-lg border-b'
                      } ${
                        errors.email
                          ? 'border-red-500 dark:border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-ink-primary dark:text-paper-light focus:outline-none focus:ring-2 focus:ring-ink-primary dark:focus:ring-paper-light focus:z-10 relative`}
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="px-4 pt-1 pb-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-muted z-10" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border-0 ${
                        isSignUp ? 'border-b' : 'rounded-b-lg'
                      } ${
                        errors.password
                          ? 'border-red-500 dark:border-red-500'
                          : isSignUp ? 'border-gray-300 dark:border-gray-600' : ''
                      } bg-white dark:bg-gray-800 text-ink-primary dark:text-paper-light focus:outline-none focus:ring-2 focus:ring-ink-primary dark:focus:ring-paper-light focus:z-10 relative`}
                      placeholder="Password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted hover:text-ink-primary dark:hover:text-paper-light z-10"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="px-4 pt-1 pb-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}

                  {isSignUp && (
                    <div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-muted z-10" />
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 rounded-b-lg border-0 ${
                            errors.confirmPassword
                              ? 'border-red-500 dark:border-red-500'
                              : ''
                          } bg-white dark:bg-gray-800 text-ink-primary dark:text-paper-light focus:outline-none focus:ring-2 focus:ring-ink-primary dark:focus:ring-paper-light focus:z-10 relative`}
                          placeholder="Confirm password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted hover:text-ink-primary dark:hover:text-paper-light z-10"
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="px-4 pt-1 pb-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {isLoading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
                  </button>
                </div>
              </form>

              {/* Switch Mode */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-sm text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light"
                  disabled={isLoading}
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>

              {/* Continue Without Signup */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleContinueWithoutSignup}
                  className="w-full text-sm text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light py-2"
                  disabled={isLoading}
                >
                  Continue without signing up
                </button>
              </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomeDrawer;

