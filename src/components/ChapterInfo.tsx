import React from 'react';

interface ChapterInfoProps {
  currentChapterIndex: number;
  totalChapters: number;
}

const ChapterInfo: React.FC<ChapterInfoProps> = ({
  currentChapterIndex,
  totalChapters
}) => {
  return (
    <div className="fixed top-16 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center py-3 px-4 mt-2">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Chapter {currentChapterIndex + 1} of {totalChapters} • {Math.round(((currentChapterIndex + 1) / totalChapters) * 100)}% complete
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterInfo;
