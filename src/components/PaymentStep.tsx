import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Loader2, 
  AlertCircle, 
  Star,
  ArrowRight,
  Globe
} from 'lucide-react';
import { stripeService } from '../services/stripeService';
import { regionalPricingService } from '../services/regionalPricing';

interface PaymentStepProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onComplete, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [userCurrency, setUserCurrency] = useState('GBP');
  const [planDetails, setPlanDetails] = useState(stripeService.getPlanDetails());

  // Update plan details when billing or currency changes
  useEffect(() => {
    const detectedCurrency = regionalPricingService.detectUserRegion();
    setUserCurrency(detectedCurrency);
    setPlanDetails(stripeService.getPlanDetails(detectedCurrency, selectedBilling));
  }, [selectedBilling]);

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

  const pricing = regionalPricingService.getPricingForCurrency(userCurrency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto px-6 py-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif text-ink-primary dark:text-paper-light mb-3">
          Choose Your Journey
        </h2>
        <p className="text-ink-secondary dark:text-ink-muted">
          Unlock the full experience with premium features
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-ink-muted/10 dark:bg-paper-light/10 rounded-full p-1 flex">
          <button
            onClick={() => setSelectedBilling('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedBilling === 'monthly'
                ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                : 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedBilling('yearly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedBilling === 'yearly'
                ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                : 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="bg-paper-light/50 dark:bg-paper-dark/50 backdrop-blur-sm border border-ink-muted/20 dark:border-paper-light/20 rounded-2xl p-8 mb-6">
        {/* Price */}
        <div className="text-center mb-6">
          <div className="text-4xl font-light text-ink-primary dark:text-paper-light mb-2">
            {selectedBilling === 'yearly' ? pricing.yearly.formatted : pricing.monthly.formatted}
          </div>
          <div className="text-sm text-ink-secondary dark:text-ink-muted">
            per {selectedBilling === 'yearly' ? 'year' : 'month'}
          </div>
          {selectedBilling === 'yearly' && (
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              Save {pricing.savings.formatted} ({pricing.savings.percentage}%)
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {planDetails.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-ink-primary/10 dark:bg-paper-light/10 flex items-center justify-center mr-3 flex-shrink-0">
                <Check className="w-3 h-3 text-ink-primary dark:text-paper-light" />
              </div>
              <span className="text-sm text-ink-primary dark:text-paper-light">{feature}</span>
            </div>
          ))}
        </div>

        {/* Payment Button */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center">
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors text-sm"
        >
          Skip for now
        </button>
      </div>

      {/* Currency Info */}
      <div className="text-center mt-6">
        <div className="flex items-center justify-center text-xs text-ink-muted dark:text-ink-secondary">
          <Globe className="w-3 h-3 mr-1" />
          <span>Pricing in {userCurrency}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
