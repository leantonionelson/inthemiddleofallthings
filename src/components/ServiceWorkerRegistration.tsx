import { useEffect } from 'react';

const ServiceWorkerRegistration: React.FC = () => {
  useEffect(() => {
    // Skip in development mode
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

    // VitePWA handles service worker registration automatically in production
    // This component just ensures cleanup in dev mode
    // The useAppUpdate hook handles update checking and manual updates
  }, []);

  return null;
};

export default ServiceWorkerRegistration;
