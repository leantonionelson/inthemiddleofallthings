import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, Activity, Settings, User, MessageCircle } from 'lucide-react';
import { AppRoute } from '../types';

const DesktopNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getActivePage = () => {
    const path = location.pathname;
    if (path === AppRoute.CHAT) return 'chat';
    if (path === AppRoute.LEARN || path.startsWith(AppRoute.LEARN)) return 'learn';
    if (path === AppRoute.DO || path.startsWith(AppRoute.DO)) return 'do';
    if (path === AppRoute.READ || path.startsWith(AppRoute.READ) || path === AppRoute.READER || path.startsWith(AppRoute.READER) || path === '/book' || path === '/meditations-landing' || path === '/stories-landing' || path === AppRoute.MEDITATIONS || path === AppRoute.STORIES) return 'read';
    if (path === AppRoute.SETTINGS) return 'settings';
    // `/quotes` is accessed from inside Read now.
    if (path === AppRoute.HOME) return 'read';
    return '';
  };

  const activePage = getActivePage();

  // All navigation items available to all users - route to new pages
  const navigationItems = [
    { id: 'chat', label: 'Chat', icon: MessageCircle, route: AppRoute.CHAT },
    { id: 'learn', label: 'Learn', icon: GraduationCap, route: AppRoute.LEARN },
    { id: 'do', label: 'Do', icon: Activity, route: AppRoute.DO },
    { id: 'read', label: 'Read', icon: BookOpen, route: AppRoute.READ },
  ];

  return (
    <nav id="desktop-nav" className="fixed top-0 left-0 right-0 z-50 bg-paper-light/80 dark:bg-paper-dark/80 backdrop-blur-sm border-b border-ink-muted/10 dark:border-paper-light/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(AppRoute.CHAT)}
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
