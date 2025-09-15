import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Check, 
  Loader2, 
  AlertCircle, 
  Star,
  Shield,
  Zap,
  Users,
  Clock
} from 'lucide-react';
import { stripeService } from '../services/stripeService';

interface PaymentStepProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onComplete, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planDetails] = useState(stripeService.getPlanDetails());

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await stripeService.redirectToCheckout();
      // The user will be redirected to Stripe Checkout
      // onComplete will be called when they return from successful payment
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to start payment process. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-6 py-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-ink-primary dark:text-paper-light mb-2">
          Unlock Premium Features
        </h2>
        <p className="text-ink-secondary dark:text-ink-muted text-lg">
          Get full access to AI conversations, save highlights, and sync across devices
        </p>
      </div>

      {/* Pricing Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-8 border border-blue-200 dark:border-blue-800">
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            Most Popular
          </div>
          <h3 className="text-2xl font-bold text-ink-primary dark:text-paper-light mb-2">
            {planDetails.name}
          </h3>
          <div className="text-4xl font-bold text-ink-primary dark:text-paper-light mb-2">
            {planDetails.price}
            <span className="text-lg font-normal text-ink-secondary dark:text-ink-muted">
              /{planDetails.billing}
            </span>
          </div>
          <p className="text-ink-secondary dark:text-ink-muted">
            Cancel anytime • 7-day free trial
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {planDetails.features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-ink-primary dark:text-paper-light">{feature}</span>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm text-ink-primary dark:text-paper-light">AI Powered</span>
          </div>
          <div className="flex items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <Shield className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm text-ink-primary dark:text-paper-light">Secure</span>
          </div>
          <div className="flex items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm text-ink-primary dark:text-paper-light">Community</span>
          </div>
          <div className="flex items-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <Clock className="w-5 h-5 text-purple-500 mr-2" />
            <span className="text-sm text-ink-primary dark:text-paper-light">24/7 Access</span>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={handleSkip}
            className="text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors text-sm"
          >
            Skip for now (Limited access)
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="text-center">
        <p className="text-xs text-ink-muted dark:text-ink-secondary mb-2">
          Secure payment powered by Stripe
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-ink-muted dark:text-ink-secondary">
          <span>🔒 SSL Encrypted</span>
          <span>💳 All major cards</span>
          <span>🔄 Cancel anytime</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
