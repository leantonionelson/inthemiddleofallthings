import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoute } from './types';
import { authService } from './services/firebaseAuth';
import './App.css';

// Pages
import HomePage from './pages/Home/HomePage';
import AuthPage from './features/Auth/AuthPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import ReaderPage from './features/Reader/ReaderPage';
import MeditationsPage from './features/Meditations/MeditationsPage';
import SavedPage from './features/Saved/SavedPage';
import SettingsPage from './pages/Settings/SettingsPage';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import AIDrawer from './features/AI/AIDrawer';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Initialize app
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    
    setIsDarkMode(shouldUseDark);
    
    // Apply theme
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Set up Firebase auth state listener
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          console.log('Firebase user found:', user.uid, 'isAnonymous:', user.isAnonymous);
          setIsAuthenticated(true);
          
          // Check onboarding status for authenticated users
          try {
            const userProfile = await authService.getUserProfile(user.uid);
            console.log('User profile:', userProfile);
            
            if (userProfile) {
              // User profile exists in Firebase, trust Firebase data
              const onboardingCompleted = userProfile.onboardingCompleted || false;
              console.log('Onboarding completed from Firebase:', onboardingCompleted);
              setHasCompletedOnboarding(onboardingCompleted);
            } else {
              // User profile doesn't exist in Firebase yet, check localStorage
              const localOnboardingState = localStorage.getItem('freeOnboarding') === 'true';
              console.log('No Firebase profile, using localStorage onboarding:', localOnboardingState);
              setHasCompletedOnboarding(localOnboardingState);
            }
          } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Fallback to localStorage when Firebase fails
            const freeOnboardingState = localStorage.getItem('freeOnboarding') === 'true';
            console.log('Firebase error, falling back to localStorage onboarding:', freeOnboardingState);
            setHasCompletedOnboarding(freeOnboardingState);
          }
        } else {
          console.log('No Firebase user, checking free mode');
          // Check for free mode fallback
          const freeAuthState = localStorage.getItem('freeAuth');
          const freeOnboardingState = localStorage.getItem('freeOnboarding');
          
          if (freeAuthState === 'true') {
            console.log('Free mode authenticated, onboarding:', freeOnboardingState);
            setIsAuthenticated(true);
            setHasCompletedOnboarding(freeOnboardingState === 'true');
          } else {
            console.log('No authentication found');
            setIsAuthenticated(false);
            setHasCompletedOnboarding(false);
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    });

    // Return cleanup function
    return unsubscribe;
  }, []);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'freeAuth') {
        setIsAuthenticated(e.newValue === 'true');
      }
      if (e.key === 'freeOnboarding') {
        setHasCompletedOnboarding(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    console.log('Onboarding completion started');
    setHasCompletedOnboarding(true);
    
    // Save to Firebase for authenticated users
    try {
      const currentUser = authService.getCurrentUser();
      console.log('Current user for onboarding completion:', currentUser?.uid, 'isAnonymous:', currentUser?.isAnonymous);
      
      if (currentUser && !currentUser.isAnonymous) {
        console.log('Saving onboarding completion to Firebase');
        await authService.completeOnboarding(currentUser.uid, {
          completedAt: new Date(),
          responses: {} // Could store onboarding responses here
        });
        console.log('Onboarding completion saved to Firebase successfully');
        
        // Also save to localStorage as backup
        localStorage.setItem('freeOnboarding', 'true');
      } else {
        console.log('Saving onboarding completion to localStorage (free/anonymous user)');
        // Fallback to localStorage for free/anonymous users
        localStorage.setItem('freeOnboarding', 'true');
      }
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      console.log('Falling back to localStorage due to error');
      // Fallback to localStorage
      localStorage.setItem('freeOnboarding', 'true');
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Show loading spinner while initializing
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className={`app ${isDarkMode ? 'dark' : ''}`}>
          <Routes>
            {/* Auth route */}
            <Route
              path={AppRoute.AUTH}
              element={
                isAuthenticated ? (
                  <Navigate to={hasCompletedOnboarding ? AppRoute.HOME : AppRoute.ONBOARDING} replace />
                ) : (
                  <AuthPage onAuthenticate={() => setIsAuthenticated(true)} />
                )
              }
            />

            {/* Onboarding route */}
            <Route
              path={AppRoute.ONBOARDING}
              element={
                isAuthenticated ? (
                  hasCompletedOnboarding ? (
                    <Navigate to={AppRoute.HOME} replace />
                  ) : (
                    <OnboardingPage 
                      onComplete={handleOnboardingComplete} 
                      onClose={() => {
                        // Sign out and return to auth page
                        authService.signOut().then(() => {
                          setIsAuthenticated(false);
                          setHasCompletedOnboarding(false);
                        }).catch(console.error);
                      }}
                    />
                  )
                ) : (
                  <Navigate to={AppRoute.AUTH} replace />
                )
              }
            />

            {/* Home route - this is the main landing page */}
            <Route
              path={AppRoute.HOME}
              element={
                isAuthenticated && hasCompletedOnboarding ? (
                  <HomePage onOpenAI={() => setIsAIDrawerOpen(true)} />
                ) : (
                  <Navigate to={isAuthenticated ? AppRoute.ONBOARDING : AppRoute.AUTH} replace />
                )
              }
            />

            {/* Other protected routes */}
            <Route
              path={AppRoute.READER}
              element={
                isAuthenticated && hasCompletedOnboarding ? (
                  <ReaderPage onOpenAI={() => setIsAIDrawerOpen(true)} />
                ) : (
                  <Navigate to={AppRoute.AUTH} replace />
                )
              }
            />

            <Route
              path={AppRoute.MEDITATIONS}
              element={
                isAuthenticated && hasCompletedOnboarding ? (
                  <MeditationsPage onOpenAI={() => setIsAIDrawerOpen(true)} />
                ) : (
                  <Navigate to={AppRoute.AUTH} replace />
                )
              }
            />

            <Route
              path={AppRoute.SAVED}
              element={
                isAuthenticated && hasCompletedOnboarding ? (
                  <SavedPage onOpenAI={() => setIsAIDrawerOpen(true)} />
                ) : (
                  <Navigate to={AppRoute.AUTH} replace />
                )
              }
            />

            <Route
              path={AppRoute.SETTINGS}
              element={
                isAuthenticated && hasCompletedOnboarding ? (
                  <SettingsPage 
                    isDarkMode={isDarkMode}
                    onToggleTheme={toggleTheme}
                    onSignOut={() => {
                      setIsAuthenticated(false);
                      setHasCompletedOnboarding(false);
                      localStorage.removeItem('freeAuth');
                      localStorage.removeItem('freeOnboarding');
                    }}
                  />
                ) : (
                  <Navigate to={AppRoute.AUTH} replace />
                )
              }
            />

            {/* Default redirect - redirect root to appropriate page based on state */}
            <Route
              path="/"
              element={
                <Navigate 
                  to={
                    isAuthenticated 
                      ? hasCompletedOnboarding 
                        ? AppRoute.HOME 
                        : AppRoute.ONBOARDING
                      : AppRoute.AUTH
                  } 
                  replace 
                />
              }
            />

            {/* Catch all */}
            <Route
              path="*"
              element={<Navigate to={AppRoute.AUTH} replace />}
            />
          </Routes>

          {/* AI Drawer */}
          <AIDrawer 
            isOpen={isAIDrawerOpen}
            onClose={() => setIsAIDrawerOpen(false)}
            user={null}
          />

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
