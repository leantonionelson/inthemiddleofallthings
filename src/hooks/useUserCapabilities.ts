import { useState, useEffect } from 'react';
import { stripeService } from '../services/stripeService';
import { paymentValidationService } from '../services/paymentValidation';

export interface UserCapabilities {
  canSaveProgress: boolean;
  canSaveHighlights: boolean;
  canUseAI: boolean;
  canSync: boolean;
  userType: 'guest' | 'anonymous' | 'authenticated' | 'admin';
  hasActiveSubscription: boolean;
  isAdmin?: boolean;
  isLoading: boolean;
}

export const useUserCapabilities = (): UserCapabilities => {
  const [capabilities, setCapabilities] = useState<UserCapabilities>({
    canSaveProgress: false,
    canSaveHighlights: false,
    canUseAI: false,
    canSync: false,
    userType: 'guest',
    hasActiveSubscription: false,
    isLoading: true
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        // First validate payment status to catch any bypasses
        const paymentValidation = await paymentValidationService.validatePaymentStatus();
        
        // Get subscription status
        const subscription = await stripeService.getSubscriptionStatus();
        const hasActiveSubscription = subscription?.isActive || false;
        
        // Check if user is in free mode
        const freeAuth = localStorage.getItem('freeAuth') === 'true';
        const userType = localStorage.getItem('userType') || 'guest';
        
        // Determine capabilities based on payment validation and subscription
        const finalCapabilities = {
          canSaveProgress: true, // All users can save progress locally
          canSaveHighlights: true, // All users can save highlights locally
          canUseAI: paymentValidation.hasActiveSubscription || hasActiveSubscription,
          canSync: false, // No cloud sync without Firebase
          hasActiveSubscription: paymentValidation.hasActiveSubscription || hasActiveSubscription,
          userType: paymentValidation.isFreeUser ? 'guest' : (userType as 'guest' | 'anonymous' | 'authenticated' | 'admin'),
          isAdmin: false, // No admin without Firebase
          isLoading: false
        };
        
        setCapabilities(finalCapabilities);
        
        // Log payment bypass if detected
        if (paymentValidationService.hasBypassedPayment()) {
          console.warn('Payment bypass detected - user capabilities restricted');
        }
        
      } catch (error) {
        console.error('Error checking user capabilities:', error);
        setCapabilities({
          canSaveProgress: true,
          canSaveHighlights: true,
          canUseAI: false,
          canSync: false,
          userType: 'guest',
          hasActiveSubscription: false,
          isLoading: false
        });
      }
    };

    checkCapabilities();
    
    // Re-check capabilities periodically (since we don't have auth state listeners)
    const interval = setInterval(checkCapabilities, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return capabilities;
};
