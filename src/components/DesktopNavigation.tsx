import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Home, Star, Scale, Settings, User, Scroll } from 'lucide-react';
import { AppRoute } from '../types';

interface DesktopNavigationProps {
  onOpenAI?: () => void;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ onOpenAI }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getActivePage = () => {
    switch (location.pathname) {
      case AppRoute.HOME: return 'home';
      case AppRoute.READER: return 'reader';
      case AppRoute.MEDITATIONS: return 'meditations';
      case AppRoute.STORIES: return 'stories';
      case AppRoute.SETTINGS: return 'settings';
      default: return '';
    }
  };

  const activePage = getActivePage();

  // All navigation items available to all users
  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, route: AppRoute.HOME },
    { id: 'reader', label: 'Book', icon: BookOpen, route: AppRoute.READER },
    { id: 'meditations', label: 'Meditations', icon: Scale, route: AppRoute.MEDITATIONS },
    { id: 'stories', label: 'Stories', icon: Scroll, route: AppRoute.STORIES },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper-light/80 dark:bg-paper-dark/80 backdrop-blur-md border-b border-ink-muted/10 dark:border-paper-light/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(AppRoute.HOME)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="20" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-ink-primary dark:text-paper-light"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="12" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1"
                  className="text-ink-primary dark:text-paper-light opacity-60"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-serif text-ink-primary dark:text-paper-light">
                In the Middle of All Things
              </h1>
              <p className="text-xs text-ink-secondary dark:text-ink-muted">
                A poetic journey
              </p>
            </div>
          </motion.div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {navigationItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.route)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activePage === item.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/5 dark:hover:bg-paper-light/5'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </motion.button>
            ))}

            {/* AI Button (available to all users) */}
            {onOpenAI && (
              <motion.button
                onClick={onOpenAI}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Star className="w-5 h-5" />
                <span className="font-medium text-sm">AI</span>
              </motion.button>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-ink-primary dark:text-paper-light">
                  User
                </p>
                <p className="text-xs text-ink-secondary dark:text-ink-muted">
                  Full Access
                </p>
              </div>
            </motion.button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-paper-light dark:bg-paper-dark border border-ink-muted/20 dark:border-paper-light/20 rounded-xl shadow-lg z-20"
                >
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate(AppRoute.SETTINGS);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavigation;
