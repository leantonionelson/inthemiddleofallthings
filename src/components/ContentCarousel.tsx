import React, { useEffect, useRef } from 'react';
import { BookChapter, Meditation, Story } from '../types';
import CarouselCard from './CarouselCard';
import CarouselCardSkeleton from './CarouselCardSkeleton';
import { readingProgressService } from '../services/readingProgressService';

interface ContentCarouselProps {
  items: (BookChapter | Meditation | Story)[];
  contentType: 'chapter' | 'meditation' | 'story';
  onItemClick: (item: BookChapter | Meditation | Story, index: number) => void;
  showReadStatus?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  visibleCount?: number;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({
  items,
  contentType,
  onItemClick,
  showReadStatus = true,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  visibleCount: externalVisibleCount
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [internalVisibleCount, setInternalVisibleCount] = React.useState(6);
  const visibleCount = externalVisibleCount ?? internalVisibleCount;

  // Load more items when scrolling near the end
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const carousel = carouselRef.current;
    if (!carousel) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollLeft = carousel.scrollLeft;
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;
        const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

        // Load more when scrolled 80% to the right
        if (scrollPercentage > 0.8) {
          if (externalVisibleCount === undefined) {
            // Internal state management
            setInternalVisibleCount(prev => {
              const newCount = Math.min(prev + 6, items.length);
              return newCount;
            });
          } else if (onLoadMore && visibleCount < items.length) {
            // External state management - call parent's load more
            onLoadMore();
          }
        }
      }, 100);
    };

    carousel.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [visibleCount, items.length, hasMore, isLoading, onLoadMore, externalVisibleCount]);

  const visibleItems = items.slice(0, visibleCount);
  const showInitialSkeletons = isLoading && items.length === 0;
  const showLoadingSkeletons = isLoading && items.length > 0 && visibleCount < items.length;

  if (items.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-ink-secondary dark:text-ink-muted">
        No items to display
      </div>
    );
  }

  return (
    <div 
      ref={carouselRef}
      className="w-full overflow-x-auto scrollbar-hide -mx-6 scroll-smooth"
    >
      <div className="flex gap-2 px-6 py-4 pb-6" style={{ width: 'max-content' }}>
        {showInitialSkeletons ? (
          // Show skeletons while initial content is loading
          <>
            {[...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="flex-shrink-0 w-[200px]">
                <CarouselCardSkeleton />
              </div>
            ))}
          </>
        ) : (
          // Show loaded items
          <>
            {visibleItems.map((item, index) => {
              const isRead = showReadStatus ? readingProgressService.isRead(item.id) : false;
              
              let subtitle: string | undefined;
              if (contentType === 'chapter') {
                const chapter = item as BookChapter;
                subtitle = chapter.part || `Chapter ${chapter.chapterNumber}`;
              } else if (contentType === 'meditation' || contentType === 'story') {
                const content = item as Meditation | Story;
                subtitle = content.tags?.slice(0, 2).join(', ') || undefined;
              }

              return (
                <div key={item.id} className="flex-shrink-0 w-[200px]">
                  <CarouselCard
                    title={item.title}
                    subtitle={subtitle}
                    isRead={isRead}
                    onClick={() => onItemClick(item, index)}
                    contentType={contentType}
                  />
                </div>
              );
            })}
            {/* Show skeletons at the end while loading more */}
            {showLoadingSkeletons && (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={`skeleton-loading-${i}`} className="flex-shrink-0 w-[200px]">
                    <CarouselCardSkeleton />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContentCarousel;

