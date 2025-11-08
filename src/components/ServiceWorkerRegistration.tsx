import { useEffect } from 'react';

const ServiceWorkerRegistration: React.FC = () => {
  useEffect(() => {
    // Skip service worker in development mode
    if (import.meta.env.DEV) {
      // Unregister any existing service workers in dev mode
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().then((success) => {
              if (success) {
                console.log('Service worker unregistered for development');
              }
            });
          });
        });
      }
      return;
    }

    // Only register service worker in production
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, prompt user to refresh
                    if (confirm('New version available! Refresh to update?')) {
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return null;
};

export default ServiceWorkerRegistration;
