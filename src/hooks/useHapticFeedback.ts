import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // Check if device supports haptic feedback
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(50);
          break;
        case 'heavy':
          navigator.vibrate(100);
          break;
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'warning':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'error':
          navigator.vibrate([200, 100, 200]);
          break;
        default:
          navigator.vibrate(10);
      }
    }

    // Fallback: Add visual feedback class
    const addVisualFeedback = (className: string) => {
      document.body.classList.add(className);
      setTimeout(() => {
        document.body.classList.remove(className);
      }, 200);
    };

    switch (type) {
      case 'light':
        addVisualFeedback('haptic-light');
        break;
      case 'medium':
        addVisualFeedback('haptic-medium');
        break;
      case 'heavy':
        addVisualFeedback('haptic-heavy');
        break;
      case 'success':
        addVisualFeedback('haptic-medium');
        break;
      case 'warning':
        addVisualFeedback('haptic-medium');
        break;
      case 'error':
        addVisualFeedback('haptic-heavy');
        break;
    }
  }, []);

  return { triggerHaptic };
};
