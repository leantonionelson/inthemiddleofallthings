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
            const onboardingCompleted = userProfile?.onboardingCompleted || false;
            console.log('Onboarding completed from Firebase:', onboardingCompleted);
            
            // If Firebase shows incomplete but localStorage shows complete, trust localStorage
            const localOnboardingState = localStorage.getItem('demoOnboarding') === 'true';
            const finalOnboardingState = onboardingCompleted || localOnboardingState;
            console.log('Final onboarding state (Firebase || localStorage):', finalOnboardingState);
            
            setHasCompletedOnboarding(finalOnboardingState);
          } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Fallback to localStorage for all users when Firebase fails
            const demoOnboardingState = localStorage.getItem('demoOnboarding');
            console.log('Falling back to localStorage onboarding:', demoOnboardingState);
            setHasCompletedOnboarding(demoOnboardingState === 'true');
          }
        } else {
          console.log('No Firebase user, checking demo mode');
          // Check for demo mode fallback
          const demoAuthState = localStorage.getItem('demoAuth');
          const demoOnboardingState = localStorage.getItem('demoOnboarding');
          
          if (demoAuthState === 'true') {
            console.log('Demo mode authenticated, onboarding:', demoOnboardingState);
            setIsAuthenticated(true);
            setHasCompletedOnboarding(demoOnboardingState === 'true');
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
      if (e.key === 'demoAuth') {
        setIsAuthenticated(e.newValue === 'true');
      }
      if (e.key === 'demoOnboarding') {
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
        
        // Verify the save by refetching the profile
        const updatedProfile = await authService.getUserProfile(currentUser.uid);
        console.log('Updated profile after onboarding completion:', updatedProfile);
        
        if (updatedProfile?.onboardingCompleted) {
          console.log('Onboarding completion verified in Firebase');
        } else {
          console.warn('Onboarding completion not reflected in Firebase, using localStorage fallback');
          localStorage.setItem('demoOnboarding', 'true');
        }
        
        // Always save to localStorage as backup for authenticated users too
        localStorage.setItem('demoOnboarding', 'true');
      } else {
        console.log('Saving onboarding completion to localStorage (demo/anonymous user)');
        // Fallback to localStorage for demo/anonymous users
        localStorage.setItem('demoOnboarding', 'true');
      }
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      console.log('Falling back to localStorage due to error');
      // Fallback to localStorage
      localStorage.setItem('demoOnboarding', 'true');
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
                    <OnboardingPage onComplete={handleOnboardingComplete} />
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
                      localStorage.removeItem('demoAuth');
                      localStorage.removeItem('demoOnboarding');
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
