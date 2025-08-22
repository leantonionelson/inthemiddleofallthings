import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';
import { BookOpen, Home, Star, Sparkles } from 'lucide-react';

interface StandardNavigationProps {
  currentPage: string;
  onRead: () => void;
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

  const getActivePage = () => {
    switch (currentPage) {
      case 'home': return 'home';
      case 'reader': return 'read';
      case 'garden': return 'garden';
      default: return 'home';
    }
  };

  const activePage = getActivePage();

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-paper-light dark:bg-paper-dark backdrop-blur-sm paper-texture ${showShadow ? 'shadow-md' : ''}`}>
      <div className="flex items-center justify-around px-4 py-3">
        {/* Home Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.HOME)}
          className={`flex flex-col items-center justify-center py-2 px-3 transition-all ${
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
          onClick={onRead}
          className={`flex flex-col items-center justify-center py-2 px-3 transition-all ${
            isReading
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BookOpen className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Read</span>
        </motion.button>

        {/* Garden Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.GARDEN)}
          className={`flex flex-col items-center justify-center py-2 px-3 transition-all ${
            activePage === 'garden'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Star className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Garden</span>
        </motion.button>

        {/* AI Chat Button */}
        {onOpenAI && (
          <motion.button
            onClick={onOpenAI}
            className="flex flex-col items-center justify-center py-2 px-3 transition-all text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">AI</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default StandardNavigation;
