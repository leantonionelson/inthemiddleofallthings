import React from 'react';

const CarouselCardSkeleton: React.FC = () => {
  return (
    <div className="w-full p-4 bg-paper-light dark:bg-paper-dark rounded-lg border border-ink-muted/10 dark:border-paper-light/10 h-full flex flex-col min-h-[110px] animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          {/* Title skeleton */}
          <div className="h-4 bg-ink-muted/20 dark:bg-paper-light/20 rounded w-3/4"></div>
          <div className="h-4 bg-ink-muted/20 dark:bg-paper-light/20 rounded w-1/2"></div>
          {/* Subtitle skeleton */}
          <div className="h-3 bg-ink-muted/10 dark:bg-paper-light/10 rounded w-2/3 mt-2"></div>
        </div>
      </div>
    </div>
  );
};

export default CarouselCardSkeleton;

