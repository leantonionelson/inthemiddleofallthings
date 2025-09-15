import { useEffect } from 'react';

const NativeFeatures: React.FC = () => {
  useEffect(() => {
    // Handle theme color changes for native status bar
    const updateThemeColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const themeColor = isDark ? '#1a1a1a' : '#f8f9fa';
      
      // Update theme-color meta tag
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', themeColor);
      }
      
      // Update Apple status bar style
      const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleStatusBarMeta) {
        appleStatusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
      }
    };

    // Initial theme color setup
    updateThemeColor();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateThemeColor();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Handle device orientation changes
    const handleOrientationChange = () => {
      // Prevent zoom on orientation change
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no');
        
        // Re-enable zoom after a short delay
        setTimeout(() => {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
        }, 500);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        // App is in fullscreen mode
        document.body.classList.add('fullscreen');
      } else {
        // App exited fullscreen
        document.body.classList.remove('fullscreen');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Handle app visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is in background
        document.title = 'The Middle - Paused';
      } else {
        // App is in foreground
        document.title = 'In the Middle of All Things';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle network status
    const handleOnline = () => {
      console.log('App is online');
      document.body.classList.remove('offline');
    };

    const handleOffline = () => {
      console.log('App is offline');
      document.body.classList.add('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial network status
    if (!navigator.onLine) {
      document.body.classList.add('offline');
    }

    // Handle device motion (for reading progress)
    let lastMotionTime = 0;
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastMotionTime > 1000) { // Throttle to once per second
        const acceleration = event.acceleration;
        if (acceleration && (Math.abs(acceleration.x || 0) > 2 || Math.abs(acceleration.y || 0) > 2)) {
          // User is moving the device significantly
          console.log('Device motion detected - user is active');
          lastMotionTime = now;
        }
      }
    };

    if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (typeof DeviceMotionEvent !== 'undefined') {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, []);

  return null;
};

export default NativeFeatures;
