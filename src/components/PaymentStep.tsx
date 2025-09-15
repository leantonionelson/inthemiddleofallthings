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
      // Get the correct price ID for the selected billing period
      const priceId = selectedBilling === 'yearly' 
        ? planDetails.priceId 
        : stripeService.getPlanDetails(userCurrency, 'monthly').priceId;
      
      // Check if we have a valid price ID
      if (!priceId || !priceId.startsWith('price_')) {
        throw new Error('Payment configuration error. Please contact support.');
      }
      
      await stripeService.redirectToCheckout(priceId);
      // The user will be redirected to Stripe Checkout
      // onComplete will be called when they return from successful payment
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start payment process. Please try again.';
      setError(errorMessage);
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
      className="max-w-md mx-auto px-6 py-8"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light text-ink-primary dark:text-paper-light mb-4">
          Continue Your Journey
        </h2>
        <p className="text-ink-secondary dark:text-ink-muted text-sm leading-relaxed">
          Unlock the full experience with premium features
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-10">
        <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-1 flex">
          <button
            onClick={() => setSelectedBilling('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              selectedBilling === 'monthly'
                ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary shadow-sm'
                : 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedBilling('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              selectedBilling === 'yearly'
                ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary shadow-sm'
                : 'text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="bg-paper-light/30 dark:bg-paper-dark/30 backdrop-blur-sm border border-ink-muted/10 dark:border-paper-light/10 rounded-xl p-8 mb-8">
        {/* Price */}
        <div className="text-center mb-8">
          <div className="text-5xl font-thin text-ink-primary dark:text-paper-light mb-2">
            {selectedBilling === 'yearly' ? pricing.yearly.formatted : pricing.monthly.formatted}
          </div>
          <div className="text-xs text-ink-secondary dark:text-ink-muted uppercase tracking-wider">
            per {selectedBilling === 'yearly' ? 'year' : 'month'}
          </div>
          {selectedBilling === 'yearly' && (
            <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium">
              Save {pricing.savings.formatted} ({pricing.savings.percentage}%)
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {planDetails.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start">
              <div className="w-4 h-4 rounded-full bg-ink-primary/20 dark:bg-paper-light/20 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-ink-primary dark:text-paper-light" />
              </div>
              <span className="text-sm text-ink-primary dark:text-paper-light leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>

        {/* Payment Button */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium py-4 px-6 rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
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
      <div className="text-center mb-8">
        <button
          onClick={handleSkip}
          className="text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors text-xs"
        >
          Skip for now
        </button>
      </div>

      {/* Currency Info */}
      <div className="text-center">
        <div className="flex items-center justify-center text-xs text-ink-muted dark:text-ink-secondary">
          <Globe className="w-3 h-3 mr-1" />
          <span>Pricing in {userCurrency}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
