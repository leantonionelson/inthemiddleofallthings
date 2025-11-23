import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';

const UpdateBanner: React.FC = () => {
  const { isUpdateAvailable, applyUpdate, isUpdating } = useAppUpdate();

  const handleUpdate = async () => {
    await applyUpdate();
  };

  return (
    <AnimatePresence>
      {isUpdateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <RefreshCw className="w-4 h-4 text-ink-secondary dark:text-ink-muted flex-shrink-0" />
                  <p className="text-sm text-ink-primary dark:text-paper-light">
                    Update available
                  </p>
                </div>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-sm font-medium bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateBanner;

