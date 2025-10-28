import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoute } from './types';
import { generateSymbol, GeneratedSymbol } from './services/symbolGenerator';
import './App.css';

// Pages
import HomePage from './pages/Home/HomePage';
import ReaderPage from './features/Reader/ReaderPage';
import MeditationsPage from './features/Meditations/MeditationsPage';
import StoriesPage from './features/Stories/StoriesPage';
import SettingsPage from './pages/Settings/SettingsPage';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import { Symbol } from './components/Symbol';
import AIDrawer from './features/AI/AIDrawer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import NativeFeatures from './components/NativeFeatures';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSymbol, setShowSymbol] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<GeneratedSymbol | null>(null);

  // Initialize app - generate symbol and setup theme
  useEffect(() => {
    const initializeApp = async () => {
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

      // Check if user already has a symbol
      const savedSymbolData = localStorage.getItem('userSymbol');
      
      if (savedSymbolData) {
        // User already has a symbol, load it
        try {
          const symbol = JSON.parse(savedSymbolData);
          setUserSymbol(symbol);
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading saved symbol:', error);
          // Generate new symbol if saved data is corrupted
          const newSymbol = generateSymbol('onboarding');
          setUserSymbol(newSymbol);
          localStorage.setItem('userSymbol', JSON.stringify(newSymbol));
          setIsLoading(false);
        }
      } else {
        // First time user - generate a new symbol
        const newSymbol = generateSymbol('onboarding');
        setUserSymbol(newSymbol);
        localStorage.setItem('userSymbol', JSON.stringify(newSymbol));
        
        // Show symbol splash screen for first-time users
        setShowSymbol(true);
        setIsLoading(false);
        
        // Hide symbol after 2 seconds
        setTimeout(() => {
          setShowSymbol(false);
        }, 2000);
      }
    };

    initializeApp();
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

  // Show symbol splash screen
  if (showSymbol && userSymbol) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 transition-all duration-500">
        <div className="text-center">
          <Symbol 
            svgPath={userSymbol.svgPath}
            size={150}
            isAnimating={true}
            metadata={userSymbol.metadata}
            colorScheme={userSymbol.colorScheme}
          />
          <p className="mt-6 text-gray-600 dark:text-gray-400 text-sm">
            Your symbol is being created...
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className={`app ${isDarkMode ? 'dark' : ''}`}>
          <Routes>
            {/* Home route - main landing page */}
            <Route
              path={AppRoute.HOME}
              element={<HomePage onOpenAI={() => setIsAIDrawerOpen(true)} />}
            />

            {/* All other routes are now accessible */}
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
                    // Clear symbol and regenerate
                    localStorage.removeItem('userSymbol');
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
