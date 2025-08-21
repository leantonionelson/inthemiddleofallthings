import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';

interface ReaderNavigationProps {
  currentChapterIndex: number;
  totalChapters: number;
  isListening: boolean;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onToggleListen: () => void;
  showShadow?: boolean;
  progress?: number; // Progress from 0 to 1
}

const ReaderNavigation: React.FC<ReaderNavigationProps> = ({
  currentChapterIndex,
  totalChapters,
  isListening,
  onPreviousChapter,
  onNextChapter,
  onToggleListen,
  showShadow = true,
  progress = 0
}) => {
  return (
    <div className={`bg-paper-light dark:bg-paper-dark backdrop-blur-sm paper-texture ${showShadow ? 'shadow-lg' : ''}`}>
      {/* Progress bar at the top - only show when listening */}
      {isListening && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className="bg-blue-600 h-1 rounded-full transition-all duration-100"
            style={{ width: `${(progress || 0) * 100}%` }}
          />
        </div>
      )}
      
      <div className="flex items-center justify-center px-4 py-3">
        {/* Left side: Listen button */}
        <div className="flex items-center space-x-3 mr-4">
          {/* Listen button (play button) */}
          <motion.button
            onClick={onToggleListen}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
              isListening
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              {isListening ? (
                <X className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </div>
          </motion.button>
        </div>

        {/* Center: Pill-shaped navigation with chapter indicator */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
          {/* Previous chapter */}
          <motion.button
            onClick={onPreviousChapter}
            disabled={currentChapterIndex === 0}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
              currentChapterIndex === 0
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            whileHover={currentChapterIndex > 0 ? { scale: 1.05 } : {}}
            whileTap={currentChapterIndex > 0 ? { scale: 0.95 } : {}}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          {/* Chapter indicator (center of pill) */}
          <div className="flex items-center justify-center px-4 mx-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Chapter {currentChapterIndex + 1}
            </span>
          </div>

          {/* Next chapter */}
          <motion.button
            onClick={onNextChapter}
            disabled={currentChapterIndex === totalChapters - 1}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
              currentChapterIndex === totalChapters - 1
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            whileHover={currentChapterIndex < totalChapters - 1 ? { scale: 1.05 } : {}}
            whileTap={currentChapterIndex < totalChapters - 1 ? { scale: 0.95 } : {}}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ReaderNavigation;
