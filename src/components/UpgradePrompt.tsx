import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Star, Bookmark, Cloud, BarChart3 } from 'lucide-react';
import { AppRoute } from '../types';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'highlights' | 'progress' | 'ai' | 'sync';
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ isOpen, onClose, feature }) => {
  const navigate = useNavigate();

  const featureInfo = {
    highlights: {
      icon: Bookmark,
      title: 'Save Highlights',
      description: 'Create an account to save your highlights across all devices',
      benefits: ['Cloud backup of all highlights', 'Search across all saved content', 'Access from any device']
    },
    progress: {
      icon: BarChart3,
      title: 'Track Progress',
      description: 'Create an account to sync your reading progress everywhere',
      benefits: ['Resume reading on any device', 'Track reading statistics', 'Never lose your place']
    },
    ai: {
      icon: Star,
      title: 'AI Features',
      description: 'Create an account to unlock AI-powered insights and assistance',
      benefits: ['Personalized reflections', 'AI-guided discussions', 'Smart content recommendations']
    },
    sync: {
      icon: Cloud,
      title: 'Cloud Sync',
      description: 'Create an account to sync all your data across devices',
      benefits: ['Automatic cloud backup', 'Cross-device synchronization', 'Never lose your data']
    }
  };

  const info = featureInfo[feature];
  const IconComponent = info.icon;

  const handleCreateAccount = () => {
    onClose();
    navigate(AppRoute.AUTH);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-paper-light dark:bg-paper-dark rounded-2xl max-w-md w-full p-6 shadow-2xl border border-ink-muted/20 dark:border-paper-light/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-ink-primary dark:text-paper-light">
              {info.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-ink-secondary dark:text-ink-muted" />
          </button>
        </div>

        {/* Description */}
        <p className="text-ink-secondary dark:text-ink-muted mb-6 leading-relaxed">
          {info.description}
        </p>

        {/* Benefits */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-ink-primary dark:text-paper-light mb-3">
            With an account you get:
          </h3>
          <ul className="space-y-2">
            {info.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                <span className="text-sm text-ink-secondary dark:text-ink-muted">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-ink-muted/20 dark:border-paper-light/20 rounded-xl text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors font-medium"
          >
            Continue as Guest
          </button>
          <button
            onClick={handleCreateAccount}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
          >
            Create Account
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-ink-muted dark:text-ink-secondary text-center mt-4">
          You can continue using the app with local storage, but data won't sync across devices
        </p>
      </motion.div>
    </div>
  );
};

export default UpgradePrompt;
