import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { AppRoute } from '../../types';
import { authService } from '../../services/firebaseAuth';
import { progressService } from '../../services/firebaseProgress';

interface AuthPageProps {
  onAuthenticate?: () => void;
}

type AuthMode = 'welcome' | 'login' | 'signup' | 'free';

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticate }) => {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    if (mode === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      let userCredential;
      
      if (mode === 'signup') {
        userCredential = await authService.createAccount(email, password);
        // Initialize progress for new users
        await progressService.initializeUserProgress(userCredential.user.uid);
      } else {
        userCredential = await authService.signInWithEmail(email, password);
      }

      // Notify parent component about authentication
      if (onAuthenticate) {
        onAuthenticate();
      }

      // Navigate to appropriate page
      const userProfile = await authService.getUserProfile(userCredential.user.uid);
      if (userProfile?.onboardingCompleted) {
        navigate(AppRoute.HOME);
      } else {
        navigate(AppRoute.ONBOARDING);
      }
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      
      // Map Firebase errors to user-friendly messages
      let errorMessage = 'Authentication failed';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address';
        } else if (errorCode === 'auth/wrong-password') {
          errorMessage = 'Incorrect password';
        } else if (errorCode === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
          // Automatically switch to login mode
          setTimeout(() => {
            setMode('login');
            setErrors({});
          }, 2000);
        } else if (errorCode === 'auth/weak-password') {
          errorMessage = 'Password must be at least 6 characters long';
        } else if (errorCode === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (errorCode === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousAuth = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      await authService.signInAnonymously();
      
      // Note: Anonymous users don't get cloud progress tracking
      // They will use local storage for progress and highlights
      
      // Notify parent component about authentication
      if (onAuthenticate) {
        onAuthenticate();
      }
      
      navigate(AppRoute.ONBOARDING);
    } catch (error: unknown) {
      console.error('Anonymous auth error:', error);
      // Fallback to free mode
      handleFreeAccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeAccess = () => {
    setIsLoading(true);
    
    // Set authentication state in localStorage
    localStorage.setItem('freeAuth', 'true');
    
    // Notify parent component about authentication
    if (onAuthenticate) {
      onAuthenticate();
    }
    
    // Navigate to onboarding with a small delay to ensure state is updated
    setTimeout(() => {
      navigate(AppRoute.ONBOARDING);
      
      // Fallback: if navigation doesn't work, force a page refresh after 2 seconds
      setTimeout(() => {
        if (window.location.pathname !== AppRoute.ONBOARDING) {
          console.log('Navigation fallback: refreshing page');
          window.location.href = AppRoute.ONBOARDING;
        }
      }, 2000);
    }, 100);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle 
                cx="50" 
                cy="50" 
                r="25" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-ink-primary dark:text-paper-light"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="15" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
                className="text-ink-primary dark:text-paper-light opacity-60"
              />
            </svg>
          </motion.div>
          
          <h1 className="text-3xl font-serif text-ink-primary dark:text-paper-light mb-2">
            In the Middle of All Things
          </h1>
          <p className="text-ink-secondary dark:text-ink-muted font-body">
            A poetic journey of reflection and discovery
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Create Account Button */}
              <motion.button
                onClick={() => switchMode('signup')}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center gap-3">
                  <User className="w-5 h-5" />
                  Create Account
                </div>
              </motion.button>

              {/* Sign In Button */}
              <motion.button
                onClick={() => switchMode('login')}
                className="w-full px-6 py-4 border-2 border-ink-muted/20 dark:border-paper-light/20 text-ink-primary dark:text-paper-light font-medium rounded-xl hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-ink-muted/20 dark:bg-paper-light/20" />
                <span className="text-ink-secondary dark:text-ink-muted text-sm">or</span>
                <div className="flex-1 h-px bg-ink-muted/20 dark:bg-paper-light/20" />
              </div>

              {/* Anonymous Access */}
              <motion.button
                onClick={handleAnonymousAuth}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted font-medium rounded-xl hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Connecting...' : 'Continue as Guest'}
              </motion.button>

              {/* Free Access */}
              <motion.button
                onClick={handleFreeAccess}
                disabled={isLoading}
                className="w-full px-6 py-3 text-ink-secondary dark:text-ink-muted font-medium hover:text-ink-primary dark:hover:text-paper-light transition-colors text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Free Mode (No Account)
              </motion.button>
            </motion.div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <button
                onClick={() => switchMode('welcome')}
                className="flex items-center gap-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {/* Form Header */}
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-ink-primary dark:text-paper-light mb-2">
                  {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-ink-secondary dark:text-ink-muted">
                  {mode === 'signup' 
                    ? 'Join to sync your progress across devices'
                    : 'Sign in to access your saved content'
                  }
                </p>
              </div>

              {/* Error Display */}
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Mail className="w-5 h-5 text-ink-muted dark:text-ink-secondary" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className={`w-full pl-12 pr-4 py-3 bg-transparent border rounded-xl text-ink-primary dark:text-paper-light placeholder-ink-muted dark:placeholder-ink-secondary focus:outline-none focus:ring-2 transition-colors ${
                        errors.email 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                          : 'border-ink-muted/20 dark:border-paper-light/20 focus:ring-blue-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Lock className="w-5 h-5 text-ink-muted dark:text-ink-secondary" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`w-full pl-12 pr-12 py-3 bg-transparent border rounded-xl text-ink-primary dark:text-paper-light placeholder-ink-muted dark:placeholder-ink-secondary focus:outline-none focus:ring-2 transition-colors ${
                        errors.password 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                          : 'border-ink-muted/20 dark:border-paper-light/20 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted dark:text-ink-secondary hover:text-ink-primary dark:hover:text-paper-light"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field (Sign Up Only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-ink-primary dark:text-paper-light mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Lock className="w-5 h-5 text-ink-muted dark:text-ink-secondary" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className={`w-full pl-12 pr-12 py-3 bg-transparent border rounded-xl text-ink-primary dark:text-paper-light placeholder-ink-muted dark:placeholder-ink-secondary focus:outline-none focus:ring-2 transition-colors ${
                          errors.confirmPassword 
                            ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                            : 'border-ink-muted/20 dark:border-paper-light/20 focus:ring-blue-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted dark:text-ink-secondary hover:text-ink-primary dark:hover:text-paper-light"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading 
                    ? (mode === 'signup' ? 'Creating Account...' : 'Signing In...') 
                    : (mode === 'signup' ? 'Create Account' : 'Sign In')
                  }
                </motion.button>
              </form>

              {/* Switch Mode */}
              <div className="text-center">
                <button
                  onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
                  className="text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors text-sm"
                >
                  {mode === 'signup' 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Create one"
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-ink-muted dark:text-ink-secondary opacity-60">
          I am that I am. All of me, all of us, all of existence

          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage; 