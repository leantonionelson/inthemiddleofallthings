import { useState, useEffect, useCallback } from 'react';
import { Workbox } from 'workbox-window';

interface UpdateState {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  updateError: string | null;
}

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>({
    isUpdateAvailable: false,
    isUpdating: false,
    updateError: null,
  });

  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return;
    }

    // Get existing service worker registration (VitePWA registers it automatically)
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) {
        console.warn('No service worker registration found');
        return;
      }

      // Get the service worker script URL
      const swUrl = registration.active?.scriptURL || registration.waiting?.scriptURL;
      if (!swUrl) {
        console.warn('Could not determine service worker script URL');
        return;
      }

      // Extract the path from the full URL
      const swPath = new URL(swUrl).pathname;
      
      // Create Workbox instance with the actual service worker path
      const workbox = new Workbox(swPath, { type: 'classic' });
      setWb(workbox);

      // Listen for update available
      workbox.addEventListener('waiting', () => {
        setState(prev => ({ ...prev, isUpdateAvailable: true }));
      });

      // Listen for update installed (will reload)
      workbox.addEventListener('controlling', () => {
        window.location.reload();
      });

      // Check if update is already waiting
      if (registration.waiting) {
        setState(prev => ({ ...prev, isUpdateAvailable: true }));
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });
    }).catch((error) => {
      console.error('Failed to get service worker registration:', error);
      setState(prev => ({ ...prev, updateError: error.message }));
    });
  }, []);

  const checkForUpdates = useCallback(async () => {
    setState(prev => ({ ...prev, isUpdating: true, updateError: null }));

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setState(prev => ({ 
          ...prev, 
          updateError: 'No service worker registration found',
          isUpdating: false 
        }));
        return;
      }

      // Force update check
      await registration.update();
      
      // Use Workbox if available, otherwise check registration directly
      if (wb) {
        await wb.update();
      }
      
      // Check if update is waiting
      if (registration.waiting) {
        setState(prev => ({ 
          ...prev, 
          isUpdateAvailable: true,
          isUpdating: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isUpdateAvailable: false,
          isUpdating: false 
        }));
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        updateError: error.message || 'Failed to check for updates',
        isUpdating: false 
      }));
    }
  }, [wb]);

  const applyUpdate = useCallback(async () => {
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.waiting) {
        setState(prev => ({ 
          ...prev, 
          updateError: 'No update available to apply'
        }));
        return;
      }

      // Send skip waiting message to service worker with error handling
      try {
        // Use MessageChannel for reliable communication
        const channel = new MessageChannel();
        let portClosed = false;
        let timeoutId: NodeJS.Timeout | null = null;
        
        // Set up response handler
        channel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'SKIP_WAITING_ACK') {
            console.log('Service worker acknowledged skip waiting');
            // Close port after receiving response
            if (!portClosed) {
              portClosed = true;
              channel.port1.close();
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
            }
          }
        };
        
        // Handle port errors
        channel.port1.onerror = (error) => {
          console.warn('MessageChannel port error:', error);
          if (!portClosed) {
            portClosed = true;
            channel.port1.close();
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        };
        
        // Send message with port
        registration.waiting.postMessage(
          { type: 'SKIP_WAITING' },
          [channel.port2]
        );
        
        // Set timeout to prevent hanging (longer timeout to allow response)
        timeoutId = setTimeout(() => {
          if (!portClosed) {
            console.warn('MessageChannel timeout - closing port');
            portClosed = true;
            channel.port1.close();
          }
        }, 3000); // Increased to 3 seconds to allow service worker to respond
      } catch (messageError) {
        // Fallback: try simple postMessage without channel
        console.warn('MessageChannel failed, using simple postMessage:', messageError);
        try {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } catch (simpleError) {
          console.error('Simple postMessage also failed:', simpleError);
        }
      }
      
      // Reload will happen automatically via 'controlling' event
      // But add a fallback reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        updateError: error.message || 'Failed to apply update'
      }));
    }
  }, []);

  // Auto-check every hour
  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.error('Auto-update check failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    checkForUpdates,
    applyUpdate,
  };
}

