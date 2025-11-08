import React from 'react';
import { Search } from 'lucide-react';

interface SearchOverlayProps<T> {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  selectedTags: string[];
  allTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  visibleCount: number;
  totalCount: number;
  onViewMore: () => void;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
}

function SearchOverlay<T extends { id: string }>({
  isOpen,
  onClose,
  searchQuery,
  selectedTags,
  allTags,
  onTagToggle,
  onClearFilters,
  items,
  renderItem,
  visibleCount,
  totalCount,
  onViewMore,
  emptyStateTitle = 'No results found',
  emptyStateMessage = 'Try adjusting your search terms'
}: SearchOverlayProps<T>) {
  if (!isOpen) return null;

  const hasMore = visibleCount < totalCount;
  const hasFilters = searchQuery.trim() || selectedTags.length > 0;
  const filteredItems = items.slice(0, visibleCount);

  // Split tags into two rows
  const midPoint = Math.ceil(allTags.length / 2);
  const firstRow = allTags.slice(0, midPoint);
  const secondRow = allTags.slice(midPoint);

  return (
    <>
      {/* Backdrop with Video Background */}
      <div 
        className="fixed inset-0 z-[60]"
        onClick={onClose}
      >
        {/* Background Video */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-100"
          >
            <source src="/media/bg.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better content readability */}
          <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
        </div>
      </div>
      
      {/* Search Results Full Screen */}
      <div data-search-overlay className="fixed top-20 left-0 right-0 bottom-0 z-[60] overflow-hidden lg:absolute lg:top-full lg:mt-2">
        <div className="max-w-2xl lg:max-w-4xl mx-auto h-full flex flex-col">
          {/* Tag Cloud - Horizontal Scrollable, Two Rows */}
          <div className="px-6 py-4 border-b border-ink-muted/10 dark:border-paper-light/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-ink-secondary dark:text-ink-muted">
                Filter by tags
              </h3>
              {hasFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex flex-col gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                {/* First row */}
                <div className="flex gap-2">
                  {firstRow.map((tag, index) => (
                    <button
                      key={`filter-tag-1-${tag}-${index}`}
                      onClick={() => onTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                          : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 border border-transparent'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                {/* Second row */}
                <div className="flex gap-2">
                  {secondRow.map((tag, index) => (
                    <button
                      key={`filter-tag-2-${tag}-${index}`}
                      onClick={() => onTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                          : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 border border-transparent'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ul role="list" className="divide-y divide-ink-muted/10 dark:divide-paper-light/10">
              {filteredItems.map((item, index) => renderItem(item, index))}
            </ul>

            {/* View More Button */}
            {hasMore && (
              <div className="px-6 py-4 border-t border-ink-muted/10 dark:border-paper-light/10">
                <button
                  onClick={onViewMore}
                  className="w-full px-4 py-3 bg-ink-primary/5 dark:bg-paper-light/5 hover:bg-ink-primary/10 dark:hover:bg-paper-light/10 border border-ink-muted/20 dark:border-paper-light/20 rounded-xl text-ink-primary dark:text-paper-light font-medium transition-all duration-200"
                >
                  View More ({totalCount - visibleCount} remaining)
                </button>
              </div>
            )}
            
            {/* Empty State */}
            {hasFilters && filteredItems.length === 0 && (
              <div className="text-center py-16 px-6">
                <Search className="w-16 h-16 mx-auto mb-4 text-ink-muted/50 dark:text-ink-muted/30" />
                <h3 className="text-xl font-medium text-ink-primary dark:text-paper-light mb-2">
                  {emptyStateTitle}
                </h3>
                <p className="text-ink-secondary dark:text-ink-muted">
                  {emptyStateMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchOverlay;

