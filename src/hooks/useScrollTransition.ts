import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollTransitionOptions {
  threshold?: number; // Minimum scroll amount to trigger transition
  sensitivity?: number; // How sensitive the transition is to scroll speed
  transitionDuration?: number; // Duration of the transition animation
}

interface ScrollTransitionState {
  isVisible: boolean;
  opacity: number;
  transform: string;
}

export const useScrollTransition = (options: ScrollTransitionOptions = {}) => {
  const {
    threshold = 10,
    sensitivity = 0.5,
    transitionDuration = 300
  } = options;

  const [state, setState] = useState<ScrollTransitionState>({
    isVisible: true,
    opacity: 1,
    transform: 'translateY(0)'
  });

  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const scrollSpeed = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const animationFrameId = useRef<number>();

  const updateVisibility = useCallback((scrollY: number, direction: 'up' | 'down', speed: number) => {
    const currentTime = Date.now();
    const timeDelta = currentTime - lastScrollTime.current;
    
    if (timeDelta < 16) return; // Throttle to ~60fps
    
    lastScrollTime.current = currentTime;
    
    // Calculate transition progress based on scroll speed and direction
    const speedFactor = Math.min(speed * sensitivity, 1);
    const directionFactor = direction === 'down' ? -1 : 1;
    
    // Update state based on scroll direction and speed
    if (direction === 'down' && state.isVisible) {
      // Scrolling down - hide UI
      const newOpacity = Math.max(0, 1 - speedFactor);
      const newTransform = `translateY(${-20 * speedFactor}px)`;
      
      setState({
        isVisible: newOpacity > 0.1,
        opacity: newOpacity,
        transform: newTransform
      });
    } else if (direction === 'up' && !state.isVisible) {
      // Scrolling up - show UI
      const newOpacity = Math.min(1, speedFactor);
      const newTransform = `translateY(${-20 + (20 * speedFactor)}px)`;
      
      setState({
        isVisible: newOpacity > 0.1,
        opacity: newOpacity,
        transform: newTransform
      });
    } else if (direction === 'up' && state.isVisible && state.opacity < 1) {
      // Continue showing UI when scrolling up
      const newOpacity = Math.min(1, state.opacity + speedFactor * 0.1);
      const newTransform = `translateY(${-20 + (20 * newOpacity)}px)`;
      
      setState({
        isVisible: true,
        opacity: newOpacity,
        transform: newTransform
      });
    } else if (direction === 'down' && !state.isVisible && state.opacity > 0) {
      // Continue hiding UI when scrolling down
      const newOpacity = Math.max(0, state.opacity - speedFactor * 0.1);
      const newTransform = `translateY(${-20 * (1 - newOpacity)}px)`;
      
      setState({
        isVisible: newOpacity > 0.1,
        opacity: newOpacity,
        transform: newTransform
      });
    }
  }, [state.isVisible, state.opacity, sensitivity]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastScrollTime.current;
      
      // Calculate scroll speed (pixels per millisecond)
      scrollSpeed.current = timeDelta > 0 ? Math.abs(scrollDelta) / timeDelta : 0;
      
      // Determine scroll direction
      if (Math.abs(scrollDelta) > threshold) {
        scrollDirection.current = scrollDelta > 0 ? 'down' : 'up';
      }
      
      // Update visibility with smooth animation
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      animationFrameId.current = requestAnimationFrame(() => {
        if (scrollDirection.current) {
          updateVisibility(currentScrollY, scrollDirection.current, scrollSpeed.current);
        }
      });
      
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
  }, [updateVisibility, threshold]);

  // Reset visibility when scroll position is at top
  useEffect(() => {
    const handleScrollReset = () => {
      if (window.scrollY === 0 && !state.isVisible) {
        setState({
          isVisible: true,
          opacity: 1,
          transform: 'translateY(0)'
        });
      }
    };

    window.addEventListener('scroll', handleScrollReset, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollReset);
  }, [state.isVisible]);

  return {
    ...state,
    style: {
      opacity: state.opacity,
      transform: state.transform,
      transition: `opacity ${transitionDuration}ms ease-out, transform ${transitionDuration}ms ease-out`,
      willChange: 'opacity, transform'
    }
  };
};
