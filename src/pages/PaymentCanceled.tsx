import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute } from '../types';

const PaymentCanceled: React.FC = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate(AppRoute.ONBOARDING);
  };

  const handleContinueFree = () => {
    // Set free mode
    localStorage.setItem('freeAuth', 'true');
    localStorage.setItem('userType', 'free');
    navigate(AppRoute.HOME);
  };

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="w-16 h-16 mx-auto mb-6 text-amber-500">
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-heading text-ink-primary dark:text-paper-light mb-4">
          Payment Canceled
        </h1>
        
        <p className="text-ink-secondary dark:text-ink-muted font-body mb-8">
          No worries! You can still explore the app or try upgrading again later.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full px-6 py-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          
          <button
            onClick={handleContinueFree}
            className="w-full px-6 py-3 border border-ink-muted text-ink-secondary dark:text-ink-muted font-medium rounded-lg hover:bg-ink-muted hover:text-paper-light transition-colors"
          >
            Continue with Free Access
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCanceled;
