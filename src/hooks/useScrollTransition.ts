import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollTransitionOptions {
  threshold?: number; // Minimum scroll amount to trigger transition
  sensitivity?: number; // How much the UI moves per scroll pixel
  maxOffset?: number; // Maximum offset in pixels
}

interface ScrollTransitionState {
  isVisible: boolean;
  opacity: number;
  transform: string;
}

export const useScrollTransition = (options: ScrollTransitionOptions = {}) => {
  const {
    threshold = 5,
    sensitivity = 0.5,
    maxOffset = 100
  } = options;

  const [state, setState] = useState<ScrollTransitionState>({
    isVisible: true,
    opacity: 1,
    transform: 'translateY(0)'
  });

  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const animationFrameId = useRef<number>();

  const updatePosition = useCallback((scrollY: number, scrollDelta: number) => {
    // Calculate the offset based on scroll direction and amount
    const currentOffset = parseFloat(state.transform.replace('translateY(', '').replace('px)', '') || '0');
    
    let newOffset: number;
    
    if (scrollDelta > 0) {
      // Scrolling down - move UI up (negative offset)
      newOffset = Math.max(-maxOffset, currentOffset - (scrollDelta * sensitivity));
    } else {
      // Scrolling up - move UI down (positive offset, back to 0)
      newOffset = Math.min(0, currentOffset - (scrollDelta * sensitivity));
    }
    
    // Update state with new position
    setState({
      isVisible: newOffset > -maxOffset * 0.9, // Consider hidden when 90% moved out
      opacity: 1, // Keep opacity at 1 for movement-only effect
      transform: `translateY(${newOffset}px)`
    });
  }, [state.transform, sensitivity, maxOffset]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      
      // Only update if scroll amount exceeds threshold
      if (Math.abs(scrollDelta) > threshold) {
        // Update visibility with smooth animation
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        
        animationFrameId.current = requestAnimationFrame(() => {
          updatePosition(currentScrollY, scrollDelta);
        });
      }
      
      lastScrollY.current = currentScrollY;
    };

    // Throttled scroll handler
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updatePosition, threshold]);

  // Reset position when scroll position is at top
  useEffect(() => {
    const handleScrollReset = () => {
      if (window.scrollY === 0) {
        setState({
          isVisible: true,
          opacity: 1,
          transform: 'translateY(0)'
        });
      }
    };

    window.addEventListener('scroll', handleScrollReset, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollReset);
  }, []);

  return {
    ...state,
    style: {
      opacity: state.opacity,
      transform: state.transform,
      transition: 'transform 0.1s ease-out',
      willChange: 'transform'
    }
  };
};
