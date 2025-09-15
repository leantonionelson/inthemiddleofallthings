import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Star, 
  CreditCard, 
  X, 
  Check,
  Zap,
  Shield,
  Users,
  Clock
} from 'lucide-react';
import { stripeService } from '../services/stripeService';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'highlights' | 'progress' | 'ai' | 'sync';
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ isOpen, onClose, feature }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planDetails] = useState(stripeService.getPlanDetails());

  const getFeatureInfo = () => {
    switch (feature) {
      case 'highlights':
        return {
          title: 'Save Highlights',
          description: 'Save your favorite quotes and insights to revisit later',
          icon: '📝'
        };
      case 'progress':
        return {
          title: 'Save Progress',
          description: 'Track your reading progress across all devices',
          icon: '📊'
        };
      case 'ai':
        return {
          title: 'AI Conversations',
          description: 'Get personalized insights and reflections from AI',
          icon: '🤖'
        };
      case 'sync':
        return {
          title: 'Cloud Sync',
          description: 'Access your data from any device, anywhere',
          icon: '☁️'
        };
      default:
        return {
          title: 'Premium Feature',
          description: 'This feature requires a premium subscription',
          icon: '⭐'
        };
    }
  };

  const featureInfo = getFeatureInfo();

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await stripeService.redirectToCheckout();
      // User will be redirected to Stripe Checkout
    } catch (error) {
      console.error('Upgrade error:', error);
      setError('Failed to start upgrade process. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-paper-light dark:bg-paper-dark rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-ink-primary dark:text-paper-light mb-2">
                {featureInfo.title}
              </h2>
              <p className="text-ink-secondary dark:text-ink-muted">
                {featureInfo.description}
              </p>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-3">
                  <Star className="w-4 h-4 mr-1" />
                  Premium Plan
                </div>
                <h3 className="text-xl font-bold text-ink-primary dark:text-paper-light mb-1">
                  {planDetails.name}
                </h3>
                <div className="text-3xl font-bold text-ink-primary dark:text-paper-light mb-1">
                  {planDetails.price}
                  <span className="text-base font-normal text-ink-secondary dark:text-ink-muted">
                    /{planDetails.billing}
                  </span>
                </div>
                <p className="text-sm text-ink-secondary dark:text-ink-muted">
                  Cancel anytime • 7-day free trial
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {planDetails.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-ink-primary dark:text-paper-light">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="flex items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-xs text-ink-primary dark:text-paper-light">AI Powered</span>
                </div>
                <div className="flex items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-xs text-ink-primary dark:text-paper-light">Secure</span>
                </div>
                <div className="flex items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Users className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-xs text-ink-primary dark:text-paper-light">Community</span>
                </div>
                <div className="flex items-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                  <Clock className="w-4 h-4 text-purple-500 mr-2" />
                  <span className="text-xs text-ink-primary dark:text-paper-light">24/7 Access</span>
                </div>
              </div>

              {/* Upgrade Button */}
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  `Start Free Trial - ${planDetails.price}/${planDetails.billing}`
                )}
              </button>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 text-red-600 dark:text-red-400 mr-2">⚠️</div>
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="text-center mt-4">
              <p className="text-xs text-ink-muted dark:text-ink-secondary mb-2">
                Secure payment powered by Stripe
              </p>
              <div className="flex items-center justify-center space-x-3 text-xs text-ink-muted dark:text-ink-secondary">
                <span>🔒 SSL Encrypted</span>
                <span>💳 All major cards</span>
                <span>🔄 Cancel anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradePrompt;