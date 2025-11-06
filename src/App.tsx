import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoute } from './types';
import './App.css';

// Pages
import HomePage from './pages/Home/HomePage';
import BookLandingPage from './pages/Book/BookLandingPage';
import MeditationsLandingPage from './pages/Meditations/MeditationsLandingPage';
import StoriesLandingPage from './pages/Stories/StoriesLandingPage';
import ReaderPage from './features/Reader/ReaderPage';
import MeditationsPage from './features/Meditations/MeditationsPage';
import StoriesPage from './features/Stories/StoriesPage';
import SettingsPage from './pages/Settings/SettingsPage';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import AIDrawer from './features/AI/AIDrawer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import NativeFeatures from './components/NativeFeatures';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

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

  return (
    <ErrorBoundary>
      <Router>
        <div className={`app ${isDarkMode ? 'dark' : ''}`}>
          <Routes>
            {/* Home route - main navigation hub */}
            <Route
              path={AppRoute.HOME}
              element={<HomePage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            {/* Landing pages */}
            <Route
              path="/book"
              element={<BookLandingPage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            <Route
              path="/meditations-landing"
              element={<MeditationsLandingPage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            <Route
              path="/stories-landing"
              element={<StoriesLandingPage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            {/* Reader pages */}
            <Route
              path={AppRoute.READER}
              element={<ReaderPage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            <Route
              path={AppRoute.MEDITATIONS}
              element={<MeditationsPage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            <Route
              path={AppRoute.STORIES}
              element={<StoriesPage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            <Route
              path={AppRoute.SETTINGS}
              element={
                <SettingsPage 
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleTheme}
                  onSignOut={() => {
                    window.location.reload();
                  }}
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
          </Routes>

          {/* AI Drawer */}
          <AIDrawer 
            isOpen={isAIDrawerOpen}
            onClose={() => setIsAIDrawerOpen(false)}
            user={null}
          />

          {/* PWA Install Prompt */}
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
