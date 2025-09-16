import { useState, useEffect } from 'react';
import { authService } from '../services/firebaseAuth';
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
        
        // Get user capabilities from auth service
        const userCapabilities = await authService.getUserCapabilities();
        
        // Override capabilities based on payment validation
        const finalCapabilities = {
          ...userCapabilities,
          canUseAI: paymentValidation.hasActiveSubscription,
          canSync: paymentValidation.hasActiveSubscription,
          hasActiveSubscription: paymentValidation.hasActiveSubscription,
          userType: paymentValidation.isFreeUser ? 'guest' : userCapabilities.userType as 'guest' | 'anonymous' | 'authenticated' | 'admin',
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
          canSaveProgress: false,
          canSaveHighlights: false,
          canUseAI: false,
          canSync: false,
          userType: 'guest',
          hasActiveSubscription: false,
          isLoading: false
        });
      }
    };

    checkCapabilities();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        await checkCapabilities();
      } else {
        setCapabilities({
          canSaveProgress: false,
          canSaveHighlights: false,
          canUseAI: false,
          canSync: false,
          userType: 'guest',
          hasActiveSubscription: false,
          isLoading: false
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return capabilities;
};
