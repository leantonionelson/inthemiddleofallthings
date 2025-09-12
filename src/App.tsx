import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoute } from './types';
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

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
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

        // Check for saved auth state (demo mode)
        const demoAuthState = localStorage.getItem('demoAuth');
        const demoOnboardingState = localStorage.getItem('demoOnboarding');
        
        if (demoAuthState === 'true') {
          setIsAuthenticated(true);
        }
        
        if (demoOnboardingState === 'true') {
          setHasCompletedOnboarding(true);
        }

      } catch (error) {
        console.warn('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
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
  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('demoOnboarding', 'true');
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
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
