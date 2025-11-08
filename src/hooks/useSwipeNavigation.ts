import { useState, useCallback } from 'react';

interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

interface UseSwipeNavigationReturn {
  touchStartX: number;
  touchStartY: number;
  isDragging: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: UseSwipeNavigationOptions = {}): UseSwipeNavigationReturn => {
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  }, [touchStartX, touchStartY]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging && !touchStartX) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > threshold && deltaY < 100) {
      if (deltaX > 0) {
        // Swipe right
        onSwipeRight?.();
      } else {
        // Swipe left
        onSwipeLeft?.();
      }
    }
    
    setTouchStartX(0);
    setTouchStartY(0);
    setIsDragging(false);
  }, [isDragging, touchStartX, touchStartY, threshold, onSwipeLeft, onSwipeRight]);

  return {
    touchStartX,
    touchStartY,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

