import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoute } from './types';
import './App.css';
import { useAuth } from './hooks/useAuth';
import { loadProgressFromFirebase, setupProgressSyncListener } from './services/progressSyncService';
import { readingProgressService } from './services/readingProgressService';

// Lazy load pages for code splitting - only load when needed
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const DesktopLandingPage = lazy(() => import('./pages/Desktop/DesktopLandingPage'));
const BookLandingPage = lazy(() => import('./pages/Book/BookLandingPage'));
const MeditationsLandingPage = lazy(() => import('./pages/Meditations/MeditationsLandingPage'));
const StoriesLandingPage = lazy(() => import('./pages/Stories/StoriesLandingPage'));
const ReadPage = lazy(() => import('./pages/Read/ReadPage'));
const DoPage = lazy(() => import('./pages/Do/DoPage'));
const LearnPage = lazy(() => import('./pages/Learn/LearnPage'));
const LearnModulePage = lazy(() => import('./pages/Learn/LearnModulePage'));
const ReaderPage = lazy(() => import('./features/Reader/ReaderPage'));
const MeditationsPage = lazy(() => import('./features/Meditations/MeditationsPage'));
const StoriesPage = lazy(() => import('./features/Stories/StoriesPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

// Components - keep these as regular imports since they're needed globally
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import WelcomeDrawer from './components/WelcomeDrawer';
import WelcomeIntro from './components/WelcomeIntro';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import NativeFeatures from './components/NativeFeatures';
import PersistentLayout from './components/PersistentLayout';
import DesktopRedirect from './components/DesktopRedirect';
import UpdateBanner from './components/UpdateBanner';
import { useDesktopDetection } from './hooks/useDesktopDetection';
import { videoPreloader } from './services/videoPreloader';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(false);
  const { user } = useAuth();
  const isDesktop = useDesktopDetection();

  // Initialize app - setup theme and preload videos
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

    // Preload background videos early for instant playback
    videoPreloader.preloadVideos().catch((error) => {
      console.warn('Video preloading failed:', error);
    });
  }, []);

  // Check if welcome intro should be shown
  useEffect(() => {
    // Don't show on desktop
    if (isDesktop) {
      return;
    }
    
    const hasSeenIntro = localStorage.getItem('welcomeIntroShown');
    // Show intro if: hasn't been shown before AND user is not logged in
    if (!hasSeenIntro && !user) {
      setShowWelcomeIntro(true);
    }
  }, [user, isDesktop]);

  // Listen for manual trigger from Settings page
  useEffect(() => {
    // Don't allow manual trigger on desktop
    if (isDesktop) {
      return;
    }
    
    const handleShowIntro = () => {
      setShowWelcomeIntro(true);
    };
    window.addEventListener('showWelcomeIntro', handleShowIntro);
    return () => window.removeEventListener('showWelcomeIntro', handleShowIntro);
  }, [isDesktop]);

  // Set up Firebase progress sync when user is authenticated
  useEffect(() => {
    if (user) {
      // Load and merge progress from Firebase
      loadProgressFromFirebase(user)
        .then(() => {
          // Set up sync callback for future updates
          // Use user from outer scope since callback takes no arguments
          readingProgressService.setUser(user, async () => {
            const { syncOnProgressUpdate } = await import('./services/progressSyncService');
            await syncOnProgressUpdate(user);
          });

          // Set up real-time sync listener
          setupProgressSyncListener(user, () => {
            // Dispatch event to update UI
            window.dispatchEvent(new CustomEvent('readingProgressUpdated'));
          });
        })
        .catch((error) => {
          console.error('Error setting up progress sync:', error);
        });
    } else {
      // Clear user from progress service when logged out
      readingProgressService.setUser(null);
    }
  }, [user]);

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

  // Loading fallback component - removed "Awakening..." screen
  const PageLoader = () => null;

  return (
    <ErrorBoundary>
      <Router>
        <div className={`app ${isDarkMode ? 'dark' : ''}`}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Desktop Landing Page - no PersistentLayout wrapper */}
              <Route
                path="/desktop"
                element={<DesktopLandingPage />}
              />

              {/* Persistent Layout wraps all mobile routes */}
              <Route element={<PersistentLayout />}>
                {/* Home route - redirects desktop users to /desktop */}
                <Route
                  path={AppRoute.HOME}
                  element={
                    <DesktopRedirect>
                      <HomePage />
                    </DesktopRedirect>
                  }
                />

                {/* Landing pages */}
                <Route
                  path="/book"
                  element={<BookLandingPage />}
                />

                <Route
                  path="/meditations-landing"
                  element={<MeditationsLandingPage />}
                />

                <Route
                  path="/stories-landing"
                  element={<StoriesLandingPage />}
                />

                {/* Read page with tabs */}
                <Route
                  path={AppRoute.READ}
                  element={<ReadPage />}
                />

                {/* Do page */}
                <Route
                  path={AppRoute.DO}
                  element={<DoPage />}
                />

                {/* Learn page */}
                <Route
                  path={AppRoute.LEARN}
                  element={<LearnPage />}
                />

                {/* Learn module page */}
                <Route
                  path="/learn/:moduleSlug"
                  element={<LearnModulePage />}
                />

                {/* Reader pages */}
                <Route
                  path={AppRoute.READER}
                  element={<ReaderPage />}
                />

                <Route
                  path={AppRoute.MEDITATIONS}
                  element={<MeditationsPage />}
                />

                <Route
                  path={AppRoute.STORIES}
                  element={<StoriesPage />}
                />

                <Route
                  path={AppRoute.SETTINGS}
                  element={
                    <SettingsPage 
                      isDarkMode={isDarkMode}
                      onToggleTheme={toggleTheme}
                    />
                  }
                />

                {/* Default redirect - redirect root to home (which will redirect desktop to /desktop) */}
                <Route
                  path="/"
                  element={<Navigate to={AppRoute.HOME} replace />}
                />

                {/* Catch all - redirect to home */}
                <Route
                  path="*"
                  element={<Navigate to={AppRoute.HOME} replace />}
                />
              </Route>
            </Routes>
          </Suspense>

          {/* Welcome Drawer - shows on first visit */}
          <WelcomeDrawer />

          {/* Welcome Intro - shows once per session */}
          <WelcomeIntro
            isOpen={showWelcomeIntro}
            onClose={() => setShowWelcomeIntro(false)}
          />

          {/* Update Banner - shows when update is available */}
          <UpdateBanner />
          
          {/* PWA Install Prompt - uses browser default */}
          <PWAInstallPrompt />
          
          {/* Service Worker Registration */}
          <ServiceWorkerRegistration />
          
          {/* Native Features Handler */}
          <NativeFeatures />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
