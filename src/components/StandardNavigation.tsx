import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../types';
import { BookOpen, GraduationCap, Activity, MessageCircle } from 'lucide-react';

interface StandardNavigationProps {
  showShadow?: boolean;
}

const StandardNavigation: React.FC<StandardNavigationProps> = ({
  showShadow = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize active page calculation to prevent unnecessary re-renders
  const activePage = useMemo(() => {
    const path = location.pathname;
    if (path === AppRoute.CHAT) return 'chat';
    if (path === AppRoute.LEARN || path.startsWith(AppRoute.LEARN)) return 'learn';
    if (path === AppRoute.DO || path.startsWith(AppRoute.DO)) return 'do';
    if (path === AppRoute.READ || path.startsWith(AppRoute.READ) || path === AppRoute.READER || path.startsWith(AppRoute.READER) || path === '/book' || path === '/meditations-landing' || path === '/stories-landing' || path === AppRoute.MEDITATIONS || path === AppRoute.STORIES) return 'read';
    // `/quotes` is now accessed from inside the Read page.
    if (path === AppRoute.HOME) return 'read';
    return '';
  }, [location.pathname]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-sm ${showShadow ? 'shadow-md' : ''}`}>
      <div className="flex items-center justify-around px-2 py-3">
        {/* Chat Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.CHAT)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'chat'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Chat</span>
        </motion.button>

        {/* Learn Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.LEARN)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'learn'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <GraduationCap className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Learn</span>
        </motion.button>

        {/* Do Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.DO)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'do'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Activity className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Do</span>
        </motion.button>

        {/* Read Navigation */}
        <motion.button
          onClick={() => navigate(AppRoute.READ)}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activePage === 'read'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BookOpen className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Read</span>
        </motion.button>
      </div>
    </div>
  );
};

export default StandardNavigation;
