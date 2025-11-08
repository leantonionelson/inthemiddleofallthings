import { useEffect, useCallback, useRef } from 'react';
import { readingProgressService } from '../services/readingProgressService';

interface UseScrollTrackingOptions {
  contentId: string;
  contentType: 'meditation' | 'story' | 'chapter';
  contentRef: React.RefObject<HTMLElement>;
  scrollContainerRef?: React.RefObject<HTMLElement>; // Optional scroll container ref (for when scroll happens on a parent element)
  onReadComplete?: () => void;
  onProgressUpdate?: (progress: number) => void;
  enabled?: boolean;
  bottomThreshold?: number; // How close to bottom to consider "read" (default 95%)
}

/**
 * Hook to track reading progress based on scroll position
 * Automatically marks content as read when scrolled to bottom
 */
export function useScrollTracking({
  contentId,
  contentType,
  contentRef,
  scrollContainerRef,
  onReadComplete,
  onProgressUpdate,
  enabled = true,
  bottomThreshold = 95
}: UseScrollTrackingOptions) {
  const lastSavedProgress = useRef<number>(0);
  const hasReachedBottom = useRef<boolean>(false);

  /**
   * Calculate scroll progress percentage
   */
  const calculateScrollProgress = useCallback((): number => {
    if (!contentRef.current) return 0;

    const element = contentRef.current;
    const scrollContainer = scrollContainerRef?.current;
    
    // If we have a scroll container, use it for calculations
    if (scrollContainer) {
      // Calculate progress based on scroll container's scroll position
      // and the content element's position within it
      const containerScrollTop = scrollContainer.scrollTop;
      const containerClientHeight = scrollContainer.clientHeight;
      
      // Get content element's position relative to scroll container
      const elementRect = element.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // Calculate element's position within the scroll container
      const elementTopInContainer = elementRect.top - containerRect.top + containerScrollTop;
      const elementBottomInContainer = elementTopInContainer + elementRect.height;
      
      // If content is shorter than viewport, check if it's fully visible
      if (elementRect.height <= containerClientHeight) {
        // Element is fully visible if it's within the container's viewport
        if (elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom) {
          return 100;
        }
        return 0;
      }
      
      // Calculate progress: 0% when element top reaches container top, 100% when element bottom reaches container bottom
      const containerTop = containerScrollTop;
      const containerBottom = containerScrollTop + containerClientHeight;
      
      // Element top reaches container top when: elementTopInContainer = containerTop
      const elementStartPosition = elementTopInContainer;
      
      // Element bottom reaches container bottom when: elementBottomInContainer = containerBottom
      // So: elementBottomInContainer = containerScrollTop + containerClientHeight
      const elementEndPosition = elementBottomInContainer - containerClientHeight;
      
      // Total scrollable range for this element within the container
      const scrollableRange = elementEndPosition - elementStartPosition;
      
      if (scrollableRange <= 0) {
        // Element might be fully visible or not yet in viewport
        if (elementRect.top <= containerRect.top && elementRect.bottom >= containerRect.bottom) {
          return 100;
        }
        if (elementRect.top < containerRect.bottom && elementRect.bottom > containerRect.top) {
          return 50; // Approximate middle
        }
        return 0;
      }
      
      // Calculate progress based on container scroll position
      if (containerScrollTop < elementStartPosition) {
        return 0; // Element top hasn't reached container top yet
      }
      if (containerScrollTop >= elementEndPosition) {
        return 100; // Element bottom has reached container bottom
      }
      
      // Linear interpolation
      const scrolledPast = containerScrollTop - elementStartPosition;
      const percentage = (scrolledPast / scrollableRange) * 100;
      
      return Math.min(100, Math.max(0, percentage));
    }
    
    // Check if element itself is scrollable
    const isElementScrollable = element.scrollHeight > element.clientHeight;
    
    if (isElementScrollable) {
      // Element is scrollable - use element's scroll position
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      // If content is shorter than viewport, consider it 100% visible
      if (scrollHeight <= clientHeight) {
        return 100;
      }

      // Calculate percentage scrolled
      const scrollableHeight = scrollHeight - clientHeight;
      const percentage = (scrollTop / scrollableHeight) * 100;
      return Math.min(100, Math.max(0, percentage));
    } else {
      // Window/document is scrollable - calculate based on element's visibility in viewport
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Get element's absolute position in document
      const elementTop = rect.top + windowScrollTop;
      const elementHeight = rect.height;
      const elementBottom = elementTop + elementHeight;
      
      // If element is shorter than viewport, check if it's visible
      if (elementHeight <= windowHeight) {
        // Element is fully visible if it's in the viewport
        if (rect.bottom > 0 && rect.top < windowHeight) {
          return 100;
        }
        return 0;
      }
      
      // Calculate progress based on how much of the element has been scrolled through
      // 0% when element top reaches viewport top
      // 100% when element bottom reaches viewport bottom
      
      // Element top reaches viewport top when: windowScrollTop = elementTop
      const elementStartPosition = elementTop;
      
      // Element bottom reaches viewport bottom when: windowScrollTop + windowHeight = elementBottom
      // So: windowScrollTop = elementBottom - windowHeight
      const elementEndPosition = elementBottom - windowHeight;
      
      // Total scrollable range for this element
      const scrollableRange = elementEndPosition - elementStartPosition;
      
      // If range is invalid or zero, return 0
      if (scrollableRange <= 0) {
        // Element might be fully visible or not yet in viewport
        if (rect.top <= 0 && rect.bottom >= windowHeight) {
          // Element spans entire viewport or more
          return 100;
        }
        if (rect.top < windowHeight && rect.bottom > 0) {
          // Element is partially visible
          return 50; // Approximate middle
        }
        return 0;
      }
      
      // Calculate progress: 0% when element top at viewport top, 100% when element bottom at viewport bottom
      if (windowScrollTop < elementStartPosition) {
        return 0; // Element top hasn't reached viewport top yet
      }
      if (windowScrollTop >= elementEndPosition) {
        return 100; // Element bottom has reached viewport bottom
      }
      
      // Linear interpolation
      const scrolledPast = windowScrollTop - elementStartPosition;
      const percentage = (scrolledPast / scrollableRange) * 100;
      
      return Math.min(100, Math.max(0, percentage));
    }
  }, [contentRef, scrollContainerRef]);

  /**
   * Handle scroll event
   */
  const handleScroll = useCallback(() => {
    if (!enabled || !contentId) return;

    const progress = calculateScrollProgress();
    console.log(`Scroll tracking [${contentId}]: progress = ${progress.toFixed(1)}%`);

    // Update progress if changed significantly (every 5%)
    if (Math.abs(progress - lastSavedProgress.current) >= 5) {
      console.log(`Scroll tracking [${contentId}]: Saving progress ${progress.toFixed(1)}%`);
      readingProgressService.updatePosition(contentId, contentType, progress);
      lastSavedProgress.current = progress;
      
      if (onProgressUpdate) {
        onProgressUpdate(progress);
      }
    }

    // Check if reached bottom threshold
    if (progress >= bottomThreshold && !hasReachedBottom.current) {
      console.log(`Scroll tracking [${contentId}]: Marked as READ (${progress.toFixed(1)}%)`);
      hasReachedBottom.current = true;
      readingProgressService.markAsRead(contentId, contentType);
      
      // Trigger progress update event to refresh UI
      window.dispatchEvent(new CustomEvent('readingProgressUpdated'));
      
      if (onReadComplete) {
        onReadComplete();
      }
    }
  }, [
    enabled,
    contentId,
    contentType,
    bottomThreshold,
    calculateScrollProgress,
    onReadComplete,
    onProgressUpdate
  ]);

  /**
   * Restore scroll position from saved progress
   */
  const restoreScrollPosition = useCallback(() => {
    if (!contentRef.current || !contentId) return;

    const savedProgress = readingProgressService.getProgress(contentId);
    if (savedProgress && savedProgress.lastPosition > 0 && savedProgress.lastPosition < 90) {
      // Wait for content to render
      setTimeout(() => {
        if (!contentRef.current) return;

        const element = contentRef.current;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const scrollableHeight = scrollHeight - clientHeight;
        
        if (scrollableHeight > 0) {
          const targetScroll = (savedProgress.lastPosition / 100) * scrollableHeight;
          element.scrollTop = targetScroll;
        }
      }, 100);
    }
  }, [contentId, contentRef]);

  /**
   * Get initial read status
   */
  const isRead = useCallback((): boolean => {
    return readingProgressService.isRead(contentId);
  }, [contentId]);

  /**
   * Get last saved position
   */
  const getLastPosition = useCallback((): number => {
    return readingProgressService.getLastPosition(contentId);
  }, [contentId]);

  /**
   * Reset read status
   */
  const resetReadStatus = useCallback(() => {
    readingProgressService.markAsUnread(contentId);
    hasReachedBottom.current = false;
  }, [contentId]);

  // Set up scroll listener
  useEffect(() => {
    const element = contentRef.current;
    if (!element || !enabled || !contentId) return;

    console.log('Setting up scroll tracking for:', contentId, 'element:', element);

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Determine which element to listen to for scroll events
    const scrollContainer = scrollContainerRef?.current;
    const isElementScrollable = element.scrollHeight > element.clientHeight;
    
    if (scrollContainer) {
      // Use provided scroll container
      scrollContainer.addEventListener('scroll', throttledScroll, { passive: true });
      console.log('Listening to scroll container scroll events');
    } else if (isElementScrollable) {
      // Element itself is scrollable
      element.addEventListener('scroll', throttledScroll, { passive: true });
      console.log('Listening to element scroll events');
    } else {
      // Window/document is scrollable, listen to window scroll
      window.addEventListener('scroll', throttledScroll, { passive: true });
      console.log('Listening to window scroll events');
    }

    // Initial check in case content is already at bottom
    // Use multiple timeouts to ensure content is fully rendered
    const initialCheck = () => {
      setTimeout(() => {
        handleScroll();
        // Check again after a longer delay to catch any layout changes
        setTimeout(() => {
          handleScroll();
        }, 1000);
      }, 100);
    };
    
    initialCheck();

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', throttledScroll);
      } else if (isElementScrollable) {
        element.removeEventListener('scroll', throttledScroll);
      } else {
        window.removeEventListener('scroll', throttledScroll);
      }
    };
  }, [contentRef, scrollContainerRef, enabled, handleScroll, contentId]);

  // Load initial state and check if content should be marked as read
  useEffect(() => {
    if (!contentId || !contentRef.current) return;
    
    const progress = readingProgressService.getProgress(contentId);
    if (progress) {
      lastSavedProgress.current = progress.lastPosition;
      hasReachedBottom.current = progress.isRead;
    } else {
      // If no progress exists, check if content is already fully visible (shorter than viewport)
      // This handles the case where content loads and is immediately fully visible
      setTimeout(() => {
        if (!contentRef.current) return;
        const element = contentRef.current;
        const isElementScrollable = element.scrollHeight > element.clientHeight;
        
        // If element is not scrollable and window scroll is needed, check if content fits in viewport
        if (!isElementScrollable) {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          // If content height is less than or equal to viewport, it's fully visible
          if (rect.height <= windowHeight) {
            const initialProgress = calculateScrollProgress();
            if (initialProgress >= bottomThreshold && !hasReachedBottom.current) {
              console.log(`Scroll tracking [${contentId}]: Content fits in viewport, marking as READ`);
              hasReachedBottom.current = true;
              readingProgressService.markAsRead(contentId, contentType);
              window.dispatchEvent(new CustomEvent('readingProgressUpdated'));
            }
          }
        } else {
          // Element is scrollable - if content fits in viewport, mark as read
          if (element.scrollHeight <= element.clientHeight) {
            const initialProgress = calculateScrollProgress();
            if (initialProgress >= bottomThreshold && !hasReachedBottom.current) {
              console.log(`Scroll tracking [${contentId}]: Content fits in element viewport, marking as READ`);
              hasReachedBottom.current = true;
              readingProgressService.markAsRead(contentId, contentType);
              window.dispatchEvent(new CustomEvent('readingProgressUpdated'));
            }
          }
        }
      }, 200);
    }
  }, [contentId, contentType, bottomThreshold, calculateScrollProgress]);

  return {
    isRead: isRead(),
    lastPosition: getLastPosition(),
    restoreScrollPosition,
    resetReadStatus,
    calculateScrollProgress
  };
}

