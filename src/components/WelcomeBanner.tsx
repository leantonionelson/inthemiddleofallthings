import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Scale, Scroll } from 'lucide-react';

const WelcomeBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome banner before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    if (!hasSeenWelcome) {
      // Show banner after a short delay
      setTimeout(() => {
        setShowBanner(true);
      }, 1000);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-2">
                  Welcome to In the Middle of All Things
                </h3>
                <p className="text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
                  A contemplative space for reflection, wisdom, and transformation.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
                aria-label="Dismiss welcome message"
              >
                <X className="w-5 h-5 text-ink-muted" />
              </button>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary dark:text-paper-light text-sm mb-1">
                    Read the Book
                  </h4>
                  <p className="text-xs text-ink-secondary dark:text-ink-muted">
                    Explore philosophical insights and transformative concepts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary dark:text-paper-light text-sm mb-1">
                    Daily Meditations
                  </h4>
                  <p className="text-xs text-ink-secondary dark:text-ink-muted">
                    Guided reflections with optional audio accompaniment
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <Scroll className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-ink-primary dark:text-paper-light text-sm mb-1">
                    Stories & Wisdom
                  </h4>
                  <p className="text-xs text-ink-secondary dark:text-ink-muted">
                    Narrative teachings and contemplative stories
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleDismiss}
              className="w-full bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium py-3 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              Begin Your Journey
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeBanner;

