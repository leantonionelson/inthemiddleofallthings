import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoute } from './types';
import './App.css';

// Lazy load pages for code splitting - only load when needed
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const BookLandingPage = lazy(() => import('./pages/Book/BookLandingPage'));
const MeditationsLandingPage = lazy(() => import('./pages/Meditations/MeditationsLandingPage'));
const StoriesLandingPage = lazy(() => import('./pages/Stories/StoriesLandingPage'));
const ReaderPage = lazy(() => import('./features/Reader/ReaderPage'));
const MeditationsPage = lazy(() => import('./features/Meditations/MeditationsPage'));
const StoriesPage = lazy(() => import('./features/Stories/StoriesPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

// Components - keep these as regular imports since they're needed globally
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import WelcomeBanner from './components/WelcomeBanner';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import NativeFeatures from './components/NativeFeatures';
import LoadingSpinner from './components/LoadingSpinner';
import PersistentLayout from './components/PersistentLayout';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize app - setup theme
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
  }, []);

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

  // Loading fallback component
  const PageLoader = () => (
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
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <Router>
        <div className={`app ${isDarkMode ? 'dark' : ''}`}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Persistent Layout wraps all routes */}
              <Route element={<PersistentLayout />}>
                {/* Home route - main navigation hub */}
                <Route
                  path={AppRoute.HOME}
                  element={<HomePage />}
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

                {/* Default redirect - redirect root to home */}
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

          {/* Welcome Banner - shows on first visit */}
          <WelcomeBanner />

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
