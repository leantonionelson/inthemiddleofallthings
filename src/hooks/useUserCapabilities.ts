import { useState, useEffect } from 'react';
import { authService } from '../services/firebaseAuth';
import { stripeService } from '../services/stripeService';

export interface UserCapabilities {
  canSaveProgress: boolean;
  canSaveHighlights: boolean;
  canUseAI: boolean;
  canSync: boolean;
  userType: 'guest' | 'anonymous' | 'authenticated';
  hasActiveSubscription: boolean;
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
        const userCapabilities = await authService.getUserCapabilities();
        setCapabilities({
          ...userCapabilities,
          userType: userCapabilities.userType as 'guest' | 'anonymous' | 'authenticated',
          isLoading: false
        });
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
