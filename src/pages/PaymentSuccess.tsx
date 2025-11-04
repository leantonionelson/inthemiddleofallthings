import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute } from '../types';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isUpdating, setIsUpdating] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const updateUserSubscription = async () => {
      try {
        // Update localStorage with subscription status
        localStorage.setItem('subscriptionStatus', JSON.stringify({
          isActive: true,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancelAtPeriodEnd: false,
          planName: 'Premium Plan',
          stripeCustomerId: `cus_${Date.now()}`,
          stripeSubscriptionId: sessionId || `sub_${Date.now()}`
        }));
        
        localStorage.setItem('userType', 'authenticated');
        
        console.log('✅ User subscription activated successfully');
      } catch (error) {
        console.error('Error updating subscription status:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    updateUserSubscription();
  }, [sessionId]);

  const handleContinue = () => {
    navigate(AppRoute.HOME);
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        {isUpdating ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ink-primary dark:border-paper-light"></div>
            </div>
            <h1 className="text-2xl font-heading text-ink-primary dark:text-paper-light mb-4">
              Setting up your account...
            </h1>
            <p className="text-ink-secondary dark:text-ink-muted font-body">
              Please wait while we activate your subscription.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 text-green-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-heading text-ink-primary dark:text-paper-light mb-4">
              Payment Successful!
            </h1>
            <p className="text-ink-secondary dark:text-ink-muted font-body mb-8">
              Welcome to the full experience. Your subscription is now active and you have access to all premium features.
            </p>
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Continue to App
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
