import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';

interface AuthPageProps {
  onAuthenticate?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoAccess = () => {
    setIsLoading(true);
    
    // Set authentication state in localStorage
    localStorage.setItem('demoAuth', 'true');
    
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md text-center"
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
                className="text-gray-700 dark:text-gray-300"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="15" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
                className="text-gray-700 dark:text-gray-300 opacity-60"
              />
            </svg>
          </motion.div>
          
          <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">
            In the Middle of All Things
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-body mb-8">
            A poetic journey of reflection and discovery
          </p>
        </div>

        {/* Demo Notice */}
        <motion.div
          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-heading text-gray-900 dark:text-gray-100 mb-3">
            Demo Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Experience the full journey without authentication. Your progress will be temporary but all features are available.
          </p>
          
          <motion.button
            onClick={handleDemoAccess}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Entering...' : 'Begin Journey'}
          </motion.button>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 opacity-60">
            Built with React, TypeScript, and Gemini AI
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage; 