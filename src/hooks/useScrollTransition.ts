import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

interface ScrollTransitionOptions {
  threshold?: number; // Minimum scroll amount to trigger transition
  sensitivity?: number; // How much the UI moves per scroll pixel
  maxOffset?: number; // Maximum offset in pixels
  direction?: 'up' | 'down'; // Direction the UI should move when scrolling down
}

interface ScrollTransitionState {
  isVisible: boolean;
  opacity: number;
  transform: string;
}

export const useScrollTransition = (
  options: ScrollTransitionOptions = {},
  scrollContainerRef?: RefObject<HTMLElement | null>
) => {
  const {
    threshold = 5,
    sensitivity = 0.5,
    maxOffset = 100,
    direction = 'up' // Default: move up when scrolling down
  } = options;

  const [state, setState] = useState<ScrollTransitionState>({
    isVisible: true,
    opacity: 1,
    transform: 'translateY(0)'
  });

  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const animationFrameId = useRef<number | undefined>(undefined);

  const updatePosition = useCallback((scrollY: number, scrollDelta: number) => {
    // For automatic transitions, any scroll movement triggers full transition
    let newOffset: number;
    
    if (scrollDelta > 0) {
      // Scrolling down - trigger full transition
      if (direction === 'up') {
        // Move UI up (negative offset) - full transition
        newOffset = -maxOffset;
      } else {
        // Move UI down (positive offset) - full transition
        newOffset = maxOffset;
      }
    } else {
      // Scrolling up - return to original position
      if (direction === 'up') {
        // Move UI down (back to 0)
        newOffset = 0;
      } else {
        // Move UI up (back to 0)
        newOffset = 0;
      }
    }
    
    // Update state with new position
    setState({
      isVisible: Math.abs(newOffset) < maxOffset * 0.9, // Consider hidden when 90% moved out
      opacity: 1, // Keep opacity at 1 for movement-only effect
      transform: `translateY(${newOffset}px)`
    });
  }, [maxOffset, direction]);

  useEffect(() => {
    const scrollElement = scrollContainerRef?.current || window;
    const isWindow = scrollElement === window;
    
    const handleScroll = () => {
      const currentScrollY = isWindow 
        ? window.scrollY 
        : (scrollElement as HTMLElement).scrollTop;
      const scrollDelta = currentScrollY - lastScrollY.current;
      
      // Any scroll movement triggers the transition (automatic mode)
      if (Math.abs(scrollDelta) > 0) {
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

    scrollElement.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', throttledScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updatePosition, scrollContainerRef]);

  // Reset position when scroll position is at top
  useEffect(() => {
    const scrollElement = scrollContainerRef?.current || window;
    const isWindow = scrollElement === window;
    
    const handleScrollReset = () => {
      const scrollY = isWindow 
        ? window.scrollY 
        : (scrollElement as HTMLElement).scrollTop;
      if (scrollY === 0) {
        setState({
          isVisible: true,
          opacity: 1,
          transform: 'translateY(0)'
        });
      }
    };

    scrollElement.addEventListener('scroll', handleScrollReset, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScrollReset);
  }, [scrollContainerRef]);

  return {
    ...state,
    style: {
      opacity: state.opacity,
      transform: state.transform,
      transition: 'transform 0.3s ease-out',
      willChange: 'transform'
    }
  };
};
