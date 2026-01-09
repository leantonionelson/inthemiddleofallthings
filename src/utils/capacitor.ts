/**
 * Utility functions for Capacitor detection and native app features
 */

/**
 * Check if the app is running in a Capacitor native environment
 */
export const isCapacitor = (): boolean => {
  // Check for Capacitor global object
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return true;
  }
  
  // Check for Capacitor platform
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
    return true;
  }
  
  // Check build-time flag (defined in vite.config.ts)
  if (typeof __IS_CAPACITOR__ !== 'undefined' && __IS_CAPACITOR__) {
    return true;
  }
  
  // Check user agent for native app indicators
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    // Capacitor apps often have specific user agent patterns
    if (ua.includes('capacitor') || ua.includes('ionic')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get the current Capacitor platform (ios, android, or web)
 */
export const getCapacitorPlatform = (): 'ios' | 'android' | 'web' => {
  if (!isCapacitor()) {
    return 'web';
  }
  
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const platform = (window as any).Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') {
      return platform;
    }
  }
  
  // Fallback: check user agent
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      return 'ios';
    }
    if (ua.includes('android')) {
      return 'android';
    }
  }
  
  return 'web';
};

/**
 * Check if service workers should be enabled
 * Service workers are disabled in Capacitor native apps
 */
export const shouldEnableServiceWorker = (): boolean => {
  return !isCapacitor();
};

