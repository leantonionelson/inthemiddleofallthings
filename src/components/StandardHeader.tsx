import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../types';

interface StandardHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  onBackClick?: () => void;
  className?: string;
}

const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  showSettingsButton = false,
  onBackClick,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleSettingsClick = () => {
    navigate(AppRoute.SETTINGS);
  };

  const baseClasses = "";
  const headerClasses = `${baseClasses} ${className}`;

  return (
    <motion.header 
      className={`${headerClasses}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4 py-4 relative z-10">
          {/* Left side - Back button or title */}
          <div className="flex items-center flex-1">
            {showBackButton ? (
              <>
                <motion.button
                  onClick={handleBackClick}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 mr-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="flex-1">
                  <h1 className="text-md font-semibold text-gray-900 dark:text-white truncate leading-tight text-left">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1 leading-tight text-left">
                      {subtitle}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1">
                <h1 className="text-md font-semibold text-gray-900 dark:text-white truncate leading-tight text-left">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1 leading-tight text-left">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right side - Settings button or spacer */}
          <div className="flex items-center justify-end">
            {showSettingsButton ? (
              <motion.button
                onClick={handleSettingsClick}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">Settings</span>
              </motion.button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default StandardHeader;
