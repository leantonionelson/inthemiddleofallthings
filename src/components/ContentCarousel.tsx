import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

  // Load more items using Intersection Observer (more efficient than scroll events)
  useEffect(() => {
    if (!hasMore || isLoading || items.length === 0 || visibleCount >= items.length) return;

    const carousel = carouselRef.current;
    if (!carousel) return;

    const container = carousel.querySelector('div');
    if (!container) return;

    // Create sentinel element to observe (positioned near the end of visible items)
    const sentinel = document.createElement('div');
    sentinel.style.width = '1px';
    sentinel.style.height = '1px';
    sentinel.style.flexShrink = '0';
    sentinel.style.pointerEvents = 'none';
    sentinel.style.visibility = 'hidden';
    sentinel.setAttribute('data-sentinel', 'true');

    // Insert sentinel after visible items
    const visibleItemsContainer = container;
    const lastVisibleItem = visibleItemsContainer.children[visibleCount - 1];
    if (lastVisibleItem && lastVisibleItem.nextSibling) {
      visibleItemsContainer.insertBefore(sentinel, lastVisibleItem.nextSibling);
    } else {
      visibleItemsContainer.appendChild(sentinel);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
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
        });
      },
      {
        root: carousel,
        rootMargin: '200px', // Trigger 200px before sentinel is visible
        threshold: 0.1
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (sentinel.parentNode) {
        sentinel.remove();
      }
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
      className="w-screen overflow-x-auto scrollbar-hide -ml-6 scroll-smooth"
    >
      <div className="flex gap-2 pl-6 pr-6 py-4 pb-6" style={{ width: 'max-content' }}>
        {showInitialSkeletons ? (
          // Show skeletons while initial content is loading
          <>
            {[...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="flex-shrink-0 w-[210px]">
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
                <motion.div 
                  key={item.id} 
                  className="flex-shrink-0 w-[210px]"
                  initial={{ 
                    opacity: 0,
                    x: 20,
                    scale: 0.95
                  }}
                  animate={{ 
                    opacity: 1,
                    x: 0,
                    scale: 1
                  }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <CarouselCard
                    title={item.title}
                    subtitle={subtitle}
                    isRead={isRead}
                    onClick={() => onItemClick(item, index)}
                    contentType={contentType}
                  />
                </motion.div>
              );
            })}
            {/* Show skeletons at the end while loading more */}
            {showLoadingSkeletons && (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={`skeleton-loading-${i}`} className="flex-shrink-0 w-[210px]">
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

export default React.memo(ContentCarousel);

