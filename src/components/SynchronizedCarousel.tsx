import React, { useRef } from 'react';
import { Meditation } from '../types';
import CarouselCard from './CarouselCard';
import CarouselCardSkeleton from './CarouselCardSkeleton';
import { readingProgressService } from '../services/readingProgressService';

interface SynchronizedCarouselProps {
  items: Meditation[];
  onItemClick: (item: Meditation, index: number) => void;
  showReadStatus?: boolean;
  isLoading?: boolean;
}

const SynchronizedCarousel: React.FC<SynchronizedCarouselProps> = ({
  items,
  onItemClick,
  showReadStatus = true,
  isLoading = false
}) => {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Split items into 3 rows
  const row1Items = items.filter((_, index) => index % 3 === 0);
  const row2Items = items.filter((_, index) => index % 3 === 1);
  const row3Items = items.filter((_, index) => index % 3 === 2);

  // Synchronize scroll: when row 1 scrolls left, row 2 scrolls right, row 3 scrolls left
  const handleRow1Scroll = () => {
    if (isScrolling.current || !row1Ref.current || !row2Ref.current || !row3Ref.current) return;
    
    isScrolling.current = true;
    const scrollLeft = row1Ref.current.scrollLeft;
    const maxScroll = row1Ref.current.scrollWidth - row1Ref.current.clientWidth;
    const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    
    // Row 2 scrolls right (opposite direction)
    const row2MaxScroll = row2Ref.current.scrollWidth - row2Ref.current.clientWidth;
    row2Ref.current.scrollLeft = row2MaxScroll * (1 - scrollPercentage);
    
    // Row 3 scrolls left (same direction as row 1)
    const row3MaxScroll = row3Ref.current.scrollWidth - row3Ref.current.clientWidth;
    row3Ref.current.scrollLeft = row3MaxScroll * scrollPercentage;
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  };

  const handleRow2Scroll = () => {
    if (isScrolling.current || !row1Ref.current || !row2Ref.current || !row3Ref.current) return;
    
    isScrolling.current = true;
    const scrollLeft = row2Ref.current.scrollLeft;
    const maxScroll = row2Ref.current.scrollWidth - row2Ref.current.clientWidth;
    const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    
    // Row 1 scrolls right (opposite direction)
    const row1MaxScroll = row1Ref.current.scrollWidth - row1Ref.current.clientWidth;
    row1Ref.current.scrollLeft = row1MaxScroll * (1 - scrollPercentage);
    
    // Row 3 scrolls right (opposite direction)
    const row3MaxScroll = row3Ref.current.scrollWidth - row3Ref.current.clientWidth;
    row3Ref.current.scrollLeft = row3MaxScroll * (1 - scrollPercentage);
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  };

  const handleRow3Scroll = () => {
    if (isScrolling.current || !row1Ref.current || !row2Ref.current || !row3Ref.current) return;
    
    isScrolling.current = true;
    const scrollLeft = row3Ref.current.scrollLeft;
    const maxScroll = row3Ref.current.scrollWidth - row3Ref.current.clientWidth;
    const scrollPercentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    
    // Row 1 scrolls left (same direction as row 3)
    const row1MaxScroll = row1Ref.current.scrollWidth - row1Ref.current.clientWidth;
    row1Ref.current.scrollLeft = row1MaxScroll * scrollPercentage;
    
    // Row 2 scrolls right (opposite direction)
    const row2MaxScroll = row2Ref.current.scrollWidth - row2Ref.current.clientWidth;
    row2Ref.current.scrollLeft = row2MaxScroll * (1 - scrollPercentage);
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  };

  // Get original index for click handler
  const getOriginalIndex = (rowIndex: number, rowNumber: number) => {
    return rowIndex * 3 + (rowNumber - 1);
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-ink-secondary dark:text-ink-muted">
        No items to display
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1 */}
      <div 
        ref={row1Ref}
        className="w-full overflow-x-auto scrollbar-hide -mx-6"
        onScroll={handleRow1Scroll}
      >
        <div className="flex gap-2 px-6 py-2" style={{ width: 'max-content' }}>
          {isLoading && row1Items.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-row1-${i}`} className="flex-shrink-0 w-[200px]">
                <CarouselCardSkeleton />
              </div>
            ))
          ) : (
            row1Items.map((item, index) => {
              const originalIndex = getOriginalIndex(index, 1);
              const isRead = showReadStatus ? readingProgressService.isRead(item.id) : false;
              const subtitle = item.tags?.slice(0, 2).join(', ') || undefined;

              return (
                <div key={item.id} className="flex-shrink-0 w-[200px]">
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
        className="w-full overflow-x-auto scrollbar-hide -mx-6"
        onScroll={handleRow2Scroll}
      >
        <div className="flex gap-2 px-6 py-2" style={{ width: 'max-content' }}>
          {isLoading && row2Items.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-row2-${i}`} className="flex-shrink-0 w-[200px]">
                <CarouselCardSkeleton />
              </div>
            ))
          ) : (
            row2Items.map((item, index) => {
              const originalIndex = getOriginalIndex(index, 2);
              const isRead = showReadStatus ? readingProgressService.isRead(item.id) : false;
              const subtitle = item.tags?.slice(0, 2).join(', ') || undefined;

              return (
                <div key={item.id} className="flex-shrink-0 w-[200px]">
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
        className="w-full overflow-x-auto scrollbar-hide -mx-6"
        onScroll={handleRow3Scroll}
      >
        <div className="flex gap-2 px-6 py-2" style={{ width: 'max-content' }}>
          {isLoading && row3Items.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-row3-${i}`} className="flex-shrink-0 w-[200px]">
                <CarouselCardSkeleton />
              </div>
            ))
          ) : (
            row3Items.map((item, index) => {
              const originalIndex = getOriginalIndex(index, 3);
              const isRead = showReadStatus ? readingProgressService.isRead(item.id) : false;
              const subtitle = item.tags?.slice(0, 2).join(', ') || undefined;

              return (
                <div key={item.id} className="flex-shrink-0 w-[200px]">
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

