import React from 'react';

const CarouselCardSkeleton: React.FC = () => {
  return (
    <div className="relative w-full p-4 rounded-lg h-full flex flex-col min-h-[110px] overflow-hidden">
      {/* Subtle glassmorphism background */}
      <div className="absolute inset-0 glass-subtle rounded-lg shadow-sm" />
      
      {/* Gentle shimmer overlay */}
      <div className="absolute inset-0 shimmer-subtle rounded-lg" />
      
      {/* Content skeleton */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-ink-muted/10 dark:bg-paper-light/10 rounded w-3/4" />
          <div className="h-4 bg-ink-muted/10 dark:bg-paper-light/10 rounded w-1/2" />
          <div className="h-3 bg-ink-muted/5 dark:bg-paper-light/5 rounded w-2/3 mt-2" />
        </div>
      </div>
    </div>
  );
};

export default CarouselCardSkeleton;

