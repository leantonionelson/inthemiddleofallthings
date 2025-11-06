import { useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * Simple PWA Install Prompt that uses browser defaults
 * Just captures the event and stores it for later use
 */
const PWAInstallPrompt = () => {
  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Don't prevent default - let browser show its native UI
      console.log('PWA install prompt available');
      
      // Optionally store the event for later use if needed
      (window as any).deferredPrompt = e as BeforeInstallPromptEvent;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // No UI - let browser handle everything
  return null;
};

export default PWAInstallPrompt;
