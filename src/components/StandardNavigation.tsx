import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { BookOpen, Home, Star, Scale, Bookmark, Scroll } from 'lucide-react';
import { authService } from '../services/firebaseAuth';

interface StandardNavigationProps {
  currentPage: string;
  onRead?: () => void; // Made optional since it's no longer used
  isReading?: boolean;
  showShadow?: boolean;
  onOpenAI?: () => void;
}

const StandardNavigation: React.FC<StandardNavigationProps> = ({
  currentPage,
  onRead,
  isReading = false,
  showShadow = true,
  onOpenAI
}) => {
  const navigate = useNavigate();
  const [userCapabilities, setUserCapabilities] = useState({
    canSaveProgress: false,
    canSaveHighlights: false,
    canUseAI: false,
    canSync: false,
    userType: 'guest' as 'guest' | 'anonymous' | 'authenticated' | 'admin',
    hasActiveSubscription: false
  });

  // Update capabilities when auth state changes
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const capabilities = await authService.getUserCapabilities();
        setUserCapabilities({
          ...capabilities,
          userType: capabilities.userType as 'guest' | 'anonymous' | 'authenticated' | 'admin'
        });
      } catch (error) {
        console.error('Error checking user capabilities:', error);
      }
    };

    checkCapabilities();

    const unsubscribe = authService.onAuthStateChanged(async () => {
      await checkCapabilities();
    });
    return unsubscribe;
  }, []);

  const getActivePage = () => {
    switch (currentPage) {
      case 'home': return 'home';
      case 'reader': return 'read';
      case 'meditations': return 'meditations';
      case 'stories': return 'stories';
      case 'saved': return 'saved';
      default: return 'home';
    }
  };

  const activePage = getActivePage();

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-paper-light dark:bg-paper-dark backdrop-blur-sm paper-texture ${showShadow ? 'shadow-md' : ''}`}>
      <div className="flex items-center justify-around px-2 py-3">
        {/* Home Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.HOME)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'home'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </motion.button>

        {/* Read Button */}
        <motion.button
          onClick={() => navigate(AppRoute.READER)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'read'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BookOpen className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Book</span>
        </motion.button>

        {/* Meditations Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.MEDITATIONS)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'meditations'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Scale className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Meditations</span>
        </motion.button>

        {/* Stories Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.STORIES)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'stories'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Scroll className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Stories</span>
        </motion.button>

        {/* Saved Button - Only show for non-guest users */}
        {userCapabilities.userType !== 'guest' && (
          <motion.button
            onClick={() => navigate(AppRoute.SAVED)}
            className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
              activePage === 'saved'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Saved</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default StandardNavigation;
