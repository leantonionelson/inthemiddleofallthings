import { useState, useEffect } from 'react';

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
    canSaveProgress: true,
    canSaveHighlights: true,
    canUseAI: true, // All users can use AI
    canSync: false,
    userType: 'guest',
    hasActiveSubscription: false,
    isLoading: true
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        // Check if user is in free mode
        const freeAuth = localStorage.getItem('freeAuth') === 'true';
        const userType = localStorage.getItem('userType') || 'guest';
        
        // All users have full capabilities now (no payment required)
        const finalCapabilities = {
          canSaveProgress: true, // All users can save progress locally
          canSaveHighlights: true, // All users can save highlights locally
          canUseAI: true, // All users can use AI
          canSync: false, // No cloud sync
          hasActiveSubscription: false, // No subscriptions
          userType: (userType as 'guest' | 'anonymous' | 'authenticated' | 'admin'),
          isAdmin: false,
          isLoading: false
        };
        
        setCapabilities(finalCapabilities);
        
      } catch (error) {
        console.error('Error checking user capabilities:', error);
        setCapabilities({
          canSaveProgress: true,
          canSaveHighlights: true,
          canUseAI: true,
          canSync: false,
          userType: 'guest',
          hasActiveSubscription: false,
          isLoading: false
        });
      }
    };

    checkCapabilities();
  }, []);

  return capabilities;
};
