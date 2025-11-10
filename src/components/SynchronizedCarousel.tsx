import React, { useRef, useEffect, useState } from 'react';
import { Meditation } from '../types';
import CarouselCard from './CarouselCard';
import CarouselCardSkeleton from './CarouselCardSkeleton';
import { readingProgressService } from '../services/readingProgressService';

interface SynchronizedCarouselProps {
  items: Meditation[];
  onItemClick: (item: Meditation, index: number) => void;
  showReadStatus?: boolean;
  isLoading?: boolean;
  // Autoscroll controls
  autoScroll?: boolean;
  autoScrollSpeed?: number; // pixels per frame (~60fps)
  pauseOnHover?: boolean;
}

const SynchronizedCarousel: React.FC<SynchronizedCarouselProps> = ({
  items,
  onItemClick,
  showReadStatus = true,
  isLoading = false,
  autoScroll = true,
  autoScrollSpeed = 0.6,
  pauseOnHover = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const [duplicatedItems, setDuplicatedItems] = useState<Meditation[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);
  
  // Track scroll direction for each row (1 = right, -1 = left)
  const scrollDirectionRef = useRef<{ row1: number; row2: number; row3: number }>({
    row1: 1,  // Default: scroll right (positive)
    row2: -1, // Default: scroll left (negative, since row2 scrolls opposite)
    row3: 1   // Default: scroll right (positive)
  });
  
  // Track last scroll position to detect direction
  const lastScrollPosRef = useRef<{ row1: number; row2: number; row3: number }>({
    row1: 0,
    row2: 0,
    row3: 0
  });

  // Duplicate items 5 times for infinite scroll
  useEffect(() => {
    if (items.length > 0) {
      setDuplicatedItems([...items, ...items, ...items, ...items, ...items]);
    }
  }, [items]);

  // Split items into 3 rows
  const row1Items = duplicatedItems.filter((_, index) => index % 3 === 0);
  const row2Items = duplicatedItems.filter((_, index) => index % 3 === 1);
  const row3Items = duplicatedItems.filter((_, index) => index % 3 === 2);

  // Get card width including gap (210px card + 8px gap = 218px)
  const cardWidth = 218;
  
  // Calculate the width of one set of items
  const getRowSetWidth = (rowItems: Meditation[]) => {
    return (rowItems.length / 5) * cardWidth; // Divide by 5 since we duplicated 5 times
  };

  // Infinite scroll handler for row 1
  const handleRow1Scroll = () => {
    if (isScrolling.current || !row1Ref.current || !row2Ref.current || !row3Ref.current) return;
    
    isScrolling.current = true;
    const scrollLeft = row1Ref.current.scrollLeft;
    
    // Detect scroll direction
    if (lastScrollPosRef.current.row1 !== scrollLeft) {
      const direction = scrollLeft > lastScrollPosRef.current.row1 ? 1 : -1;
      scrollDirectionRef.current.row1 = direction;
      lastScrollPosRef.current.row1 = scrollLeft;
    }
    
    const scrollWidth = row1Ref.current.scrollWidth;
    const clientWidth = row1Ref.current.clientWidth;
    const setWidth = getRowSetWidth(row1Items);
    
    // Infinite scroll: reset position when near edges
    if (scrollLeft < setWidth) {
      // Near the start, jump to middle set
      row1Ref.current.scrollLeft = scrollLeft + setWidth * 2;
    } else if (scrollLeft > setWidth * 3) {
      // Near the end, jump back to middle set
      row1Ref.current.scrollLeft = scrollLeft - setWidth * 2;
    }
    
    const maxScroll = scrollWidth - clientWidth;
    const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    
    // Row 2 scrolls right (opposite direction)
    const row2MaxScroll = row2Ref.current.scrollWidth - row2Ref.current.clientWidth;
    const row2SetWidth = getRowSetWidth(row2Items);
    const row2Scroll = row2MaxScroll * (1 - scrollPercentage);
    
    // Infinite scroll for row 2
    if (row2Scroll < row2SetWidth) {
      row2Ref.current.scrollLeft = row2Scroll + row2SetWidth * 2;
    } else if (row2Scroll > row2SetWidth * 3) {
      row2Ref.current.scrollLeft = row2Scroll - row2SetWidth * 2;
    } else {
      row2Ref.current.scrollLeft = row2Scroll;
    }
    
    // Update row 2 direction (opposite of row 1)
    if (lastScrollPosRef.current.row2 !== row2Ref.current.scrollLeft) {
      const direction = row2Ref.current.scrollLeft > lastScrollPosRef.current.row2 ? 1 : -1;
      scrollDirectionRef.current.row2 = direction;
      lastScrollPosRef.current.row2 = row2Ref.current.scrollLeft;
    }
    
    // Row 3 scrolls left (same direction as row 1)
    const row3MaxScroll = row3Ref.current.scrollWidth - row3Ref.current.clientWidth;
    const row3SetWidth = getRowSetWidth(row3Items);
    const row3Scroll = row3MaxScroll * scrollPercentage;
    
    // Infinite scroll for row 3
    if (row3Scroll < row3SetWidth) {
      row3Ref.current.scrollLeft = row3Scroll + row3SetWidth * 2;
    } else if (row3Scroll > row3SetWidth * 3) {
      row3Ref.current.scrollLeft = row3Scroll - row3SetWidth * 2;
    } else {
      row3Ref.current.scrollLeft = row3Scroll;
    }
    
    // Update row 3 direction (same as row 1)
    if (lastScrollPosRef.current.row3 !== row3Ref.current.scrollLeft) {
      const direction = row3Ref.current.scrollLeft > lastScrollPosRef.current.row3 ? 1 : -1;
      scrollDirectionRef.current.row3 = direction;
      lastScrollPosRef.current.row3 = row3Ref.current.scrollLeft;
    }
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  };

  const handleRow2Scroll = () => {
    if (isScrolling.current || !row1Ref.current || !row2Ref.current || !row3Ref.current) return;
    
    isScrolling.current = true;
    const scrollLeft = row2Ref.current.scrollLeft;
    
    // Detect scroll direction
    if (lastScrollPosRef.current.row2 !== scrollLeft) {
      const direction = scrollLeft > lastScrollPosRef.current.row2 ? 1 : -1;
      scrollDirectionRef.current.row2 = direction;
      lastScrollPosRef.current.row2 = scrollLeft;
    }
    
    const scrollWidth = row2Ref.current.scrollWidth;
    const clientWidth = row2Ref.current.clientWidth;
    const setWidth = getRowSetWidth(row2Items);
    
    // Infinite scroll: reset position when near edges
    if (scrollLeft < setWidth) {
      row2Ref.current.scrollLeft = scrollLeft + setWidth * 2;
    } else if (scrollLeft > setWidth * 3) {
      row2Ref.current.scrollLeft = scrollLeft - setWidth * 2;
    }
    
    const maxScroll = scrollWidth - clientWidth;
    const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    
    // Row 1 scrolls right (opposite direction)
    const row1MaxScroll = row1Ref.current.scrollWidth - row1Ref.current.clientWidth;
    const row1SetWidth = getRowSetWidth(row1Items);
    const row1Scroll = row1MaxScroll * (1 - scrollPercentage);
    
    if (row1Scroll < row1SetWidth) {
      row1Ref.current.scrollLeft = row1Scroll + row1SetWidth * 2;
    } else if (row1Scroll > row1SetWidth * 3) {
      row1Ref.current.scrollLeft = row1Scroll - row1SetWidth * 2;
    } else {
      row1Ref.current.scrollLeft = row1Scroll;
    }
    
    // Update row 1 direction (opposite of row 2, since row 2 drives this handler)
    if (lastScrollPosRef.current.row1 !== row1Ref.current.scrollLeft) {
      // Row 1 moves opposite to row 2, so use the inverse of row 2's detected direction
      scrollDirectionRef.current.row1 = -scrollDirectionRef.current.row2;
      lastScrollPosRef.current.row1 = row1Ref.current.scrollLeft;
    }
    
    // Row 3 scrolls right (opposite direction)
    const row3MaxScroll = row3Ref.current.scrollWidth - row3Ref.current.clientWidth;
    const row3SetWidth = getRowSetWidth(row3Items);
    const row3Scroll = row3MaxScroll * (1 - scrollPercentage);
    
    if (row3Scroll < row3SetWidth) {
      row3Ref.current.scrollLeft = row3Scroll + row3SetWidth * 2;
    } else if (row3Scroll > row3SetWidth * 3) {
      row3Ref.current.scrollLeft = row3Scroll - row3SetWidth * 2;
    } else {
      row3Ref.current.scrollLeft = row3Scroll;
    }
    
    // Update row 3 direction (opposite of row 2, same as row 1)
    if (lastScrollPosRef.current.row3 !== row3Ref.current.scrollLeft) {
      // Row 3 moves opposite to row 2, so use the inverse of row 2's detected direction
      scrollDirectionRef.current.row3 = -scrollDirectionRef.current.row2;
      lastScrollPosRef.current.row3 = row3Ref.current.scrollLeft;
    }
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  };

  const handleRow3Scroll = () => {
    if (isScrolling.current || !row1Ref.current || !row2Ref.current || !row3Ref.current) return;
    
    isScrolling.current = true;
    const scrollLeft = row3Ref.current.scrollLeft;
    
    // Detect scroll direction
    if (lastScrollPosRef.current.row3 !== scrollLeft) {
      const direction = scrollLeft > lastScrollPosRef.current.row3 ? 1 : -1;
      scrollDirectionRef.current.row3 = direction;
      lastScrollPosRef.current.row3 = scrollLeft;
    }
    
    const scrollWidth = row3Ref.current.scrollWidth;
    const clientWidth = row3Ref.current.clientWidth;
    const setWidth = getRowSetWidth(row3Items);
    
    // Infinite scroll: reset position when near edges
    if (scrollLeft < setWidth) {
      row3Ref.current.scrollLeft = scrollLeft + setWidth * 2;
    } else if (scrollLeft > setWidth * 3) {
      row3Ref.current.scrollLeft = scrollLeft - setWidth * 2;
    }
    
    const maxScroll = scrollWidth - clientWidth;
    const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    
    // Row 1 scrolls left (same direction as row 3)
    const row1MaxScroll = row1Ref.current.scrollWidth - row1Ref.current.clientWidth;
    const row1SetWidth = getRowSetWidth(row1Items);
    const row1Scroll = row1MaxScroll * scrollPercentage;
    
    if (row1Scroll < row1SetWidth) {
      row1Ref.current.scrollLeft = row1Scroll + row1SetWidth * 2;
    } else if (row1Scroll > row1SetWidth * 3) {
      row1Ref.current.scrollLeft = row1Scroll - row1SetWidth * 2;
    } else {
      row1Ref.current.scrollLeft = row1Scroll;
    }
    
    // Update row 1 direction (same as row 3, since row 3 drives this handler)
    if (lastScrollPosRef.current.row1 !== row1Ref.current.scrollLeft) {
      const direction = row1Ref.current.scrollLeft > lastScrollPosRef.current.row1 ? 1 : -1;
      scrollDirectionRef.current.row1 = direction;
      lastScrollPosRef.current.row1 = row1Ref.current.scrollLeft;
    }
    
    // Row 2 scrolls right (opposite direction)
    const row2MaxScroll = row2Ref.current.scrollWidth - row2Ref.current.clientWidth;
    const row2SetWidth = getRowSetWidth(row2Items);
    const row2Scroll = row2MaxScroll * (1 - scrollPercentage);
    
    if (row2Scroll < row2SetWidth) {
      row2Ref.current.scrollLeft = row2Scroll + row2SetWidth * 2;
    } else if (row2Scroll > row2SetWidth * 3) {
      row2Ref.current.scrollLeft = row2Scroll - row2SetWidth * 2;
    } else {
      row2Ref.current.scrollLeft = row2Scroll;
    }
    
    // Update row 2 direction (opposite of row 3)
    if (lastScrollPosRef.current.row2 !== row2Ref.current.scrollLeft) {
      const direction = row2Ref.current.scrollLeft > lastScrollPosRef.current.row2 ? 1 : -1;
      // Row 2 moves opposite to row 3, so invert the direction
      scrollDirectionRef.current.row2 = -direction;
      lastScrollPosRef.current.row2 = row2Ref.current.scrollLeft;
    }
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  };

  // Get original index for click handler (accounting for duplication)
  const getOriginalIndex = (rowIndex: number, rowNumber: number) => {
    const itemsPerSet = items.length / 3; // Items per row in one set
    const indexInSet = rowIndex % itemsPerSet;
    return indexInSet * 3 + (rowNumber - 1);
  };

  // Initialize scroll position to middle set
  useEffect(() => {
    if (duplicatedItems.length === 0) return;
    
    const row1ItemsForCalc = duplicatedItems.filter((_, index) => index % 3 === 0);
    const row2ItemsForCalc = duplicatedItems.filter((_, index) => index % 3 === 1);
    const row3ItemsForCalc = duplicatedItems.filter((_, index) => index % 3 === 2);
    
    const setWidth1 = getRowSetWidth(row1ItemsForCalc);
    const setWidth2 = getRowSetWidth(row2ItemsForCalc);
    const setWidth3 = getRowSetWidth(row3ItemsForCalc);
    
    // Set initial scroll to middle set (2nd set)
    if (row1Ref.current) {
      row1Ref.current.scrollLeft = setWidth1 * 2;
      lastScrollPosRef.current.row1 = setWidth1 * 2;
    }
    if (row2Ref.current) {
      row2Ref.current.scrollLeft = setWidth2 * 2;
      lastScrollPosRef.current.row2 = setWidth2 * 2;
    }
    if (row3Ref.current) {
      row3Ref.current.scrollLeft = setWidth3 * 2;
      lastScrollPosRef.current.row3 = setWidth3 * 2;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicatedItems.length]);

  // Autoscroll effect - drive row 1 in its detected direction, scroll handlers sync rows 2 and 3
  useEffect(() => {
    if (!autoScroll) return;

    const step = () => {
      // If paused or refs not ready, just schedule next frame
      if (
        isPausedRef.current ||
        !row1Ref.current ||
        duplicatedItems.length === 0
      ) {
        rafIdRef.current = requestAnimationFrame(step);
        return;
      }

      // Advance row 1 in its last detected direction
      const speed = autoScrollSpeed * scrollDirectionRef.current.row1;
      row1Ref.current.scrollLeft += speed;
      
      // Explicitly trigger scroll listeners to synchronize other rows
      // The scroll handlers will detect and update directions for rows 2 and 3
      try {
        row1Ref.current.dispatchEvent(new Event('scroll'));
      } catch {
        // no-op
      }
      
      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [autoScroll, autoScrollSpeed, duplicatedItems.length]);

  // Pause/resume on hover and user interaction (wheel/touch/mouse)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pause = () => {
      isPausedRef.current = true;
      if (resumeTimeoutRef.current !== null) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    };

    const resumeAfterDelay = (delay = 1500) => {
      if (resumeTimeoutRef.current !== null) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
      resumeTimeoutRef.current = window.setTimeout(() => {
        isPausedRef.current = false;
      }, delay);
    };

    const handleMouseEnter = () => {
      if (pauseOnHover) pause();
    };
    const handleMouseLeave = () => {
      if (pauseOnHover) resumeAfterDelay(300);
    };
    const handlePointerDown = () => {
      pause();
    };
    const handlePointerUp = () => {
      resumeAfterDelay(800);
    };
    const handleWheel = () => {
      pause();
      resumeAfterDelay(1200);
    };
    const handleTouchStart = () => pause();
    const handleTouchEnd = () => resumeAfterDelay(800);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('pointerdown', handlePointerDown, { passive: true } as AddEventListenerOptions);
    container.addEventListener('pointerup', handlePointerUp, { passive: true } as AddEventListenerOptions);
    container.addEventListener('wheel', handleWheel, { passive: true } as AddEventListenerOptions);
    container.addEventListener('touchstart', handleTouchStart, { passive: true } as AddEventListenerOptions);
    container.addEventListener('touchend', handleTouchEnd, { passive: true } as AddEventListenerOptions);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('pointerdown', handlePointerDown as EventListener);
      container.removeEventListener('pointerup', handlePointerUp as EventListener);
      container.removeEventListener('wheel', handleWheel as EventListener);
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);

      if (resumeTimeoutRef.current !== null) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    };
  }, [pauseOnHover]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-ink-secondary dark:text-ink-muted">
        No items to display
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {/* Row 1 */}
      <div 
        ref={row1Ref}
        className="w-screen overflow-x-auto scrollbar-hide -ml-6"
        onScroll={handleRow1Scroll}
      >
        <div className="flex gap-2 pl-6 pr-6 py-0" style={{ width: 'max-content' }}>
          {isLoading && row1Items.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-row1-${i}`} className="flex-shrink-0 w-[210px]">
                <CarouselCardSkeleton />
              </div>
            ))
          ) : (
            row1Items.map((item, index) => {
              const originalIndex = getOriginalIndex(index, 1);
              const isRead = showReadStatus ? readingProgressService.isRead(item.id) : false;
              const subtitle = item.tags?.slice(0, 2).join(', ') || undefined;

              return (
                <div key={`row1-${item.id}-${index}`} className="flex-shrink-0 w-[210px]">
                  <CarouselCard
                    title={item.title}
                    subtitle={subtitle}
                    isRead={isRead}
                    onClick={() => onItemClick(item, originalIndex)}
                    contentType="meditation"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div 
        ref={row2Ref}
        className="w-screen overflow-x-auto scrollbar-hide -ml-6"
        onScroll={handleRow2Scroll}
      >
        <div className="flex gap-2 pl-6 pr-6 py-0" style={{ width: 'max-content' }}>
          {isLoading && row2Items.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-row2-${i}`} className="flex-shrink-0 w-[210px]">
                <CarouselCardSkeleton />
              </div>
            ))
          ) : (
            row2Items.map((item, index) => {
              const originalIndex = getOriginalIndex(index, 2);
              const isRead = showReadStatus ? readingProgressService.isRead(item.id) : false;
              const subtitle = item.tags?.slice(0, 2).join(', ') || undefined;

              return (
                <div key={`row2-${item.id}-${index}`} className="flex-shrink-0 w-[210px]">
                  <CarouselCard
                    title={item.title}
                    subtitle={subtitle}
                    isRead={isRead}
                    onClick={() => onItemClick(item, originalIndex)}
                    contentType="meditation"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div 
        ref={row3Ref}
        className="w-screen overflow-x-auto scrollbar-hide -ml-6"
        onScroll={handleRow3Scroll}
      >
        <div className="flex gap-2 pl-6 pr-6 py-0" style={{ width: 'max-content' }}>
          {isLoading && row3Items.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-row3-${i}`} className="flex-shrink-0 w-[210px]">
                <CarouselCardSkeleton />
              </div>
            ))
          ) : (
            row3Items.map((item, index) => {
              const originalIndex = getOriginalIndex(index, 3);
              const isRead = showReadStatus ? readingProgressService.isRead(item.id) : false;
              const subtitle = item.tags?.slice(0, 2).join(', ') || undefined;

              return (
                <div key={`row3-${item.id}-${index}`} className="flex-shrink-0 w-[210px]">
                  <CarouselCard
                    title={item.title}
                    subtitle={subtitle}
                    isRead={isRead}
                    onClick={() => onItemClick(item, originalIndex)}
                    contentType="meditation"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SynchronizedCarousel;

