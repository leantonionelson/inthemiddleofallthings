import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  showClearButton?: boolean;
  onClear?: () => void;
  className?: string;
  isOpen?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  showClearButton = true,
  onClear,
  className = '',
  isOpen = false
}) => {
  const shouldShowClear = showClearButton && value.trim();
  const showBackArrow = isOpen;
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused when search is open - use requestAnimationFrame for smooth, immediate focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Use requestAnimationFrame for immediate, smooth focusing
      const rafId = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen]);

  // Handle blur - prevent blur when clicking within search area
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if the new focus target is within the search overlay or search bar
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const isClickingSearchOverlay = relatedTarget?.closest('[data-search-overlay]') !== null;
    const isClickingSearchBar = relatedTarget?.closest('[data-search-bar]') !== null;
    
    // Check if clicking the close/back arrow button - if so, allow blur
    const isClickingCloseButton = relatedTarget?.getAttribute('aria-label') === 'Close search';
    
    // If search is open and user clicked within search area (but not the close button), prevent blur by refocusing immediately
    if (isOpen && (isClickingSearchOverlay || isClickingSearchBar) && !isClickingCloseButton) {
      // Use requestAnimationFrame for immediate, smooth refocus
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return; // Don't call onBlur if we're keeping focus
    }
    
    // Call the original onBlur handler only if blurring outside search area or clicking close button
    onBlur(e);
  };

  // Check if relative positioning is requested
  const isRelative = className.includes('!relative');
  
  // When search is open, always use fixed positioning at top with highest z-index
  const shouldUseFixed = isOpen || !isRelative;
  
  // Parse top offset from className if present (e.g., "!top-12")
  const topOffset = className.includes('!top-') 
    ? className.match(/!top-(\d+)/)?.[1] 
    : null;
  const topStyle = topOffset && !isOpen ? { top: `${parseInt(topOffset) * 0.25}rem` } : { top: 0 };

  // Clean className for container
  const cleanClassName = className
    .replace(/!top-\d+/g, '')
    .replace(/!relative/g, '')
    .trim();

  // When open, render fixed at top with highest z-index via portal
  // Otherwise, use relative if requested, or fixed positioning
  const searchBarContent = (
    <div 
      data-search-bar
      className={shouldUseFixed
        ? `fixed left-0 right-0 top-0 z-[10003] px-4 py-3 ${cleanClassName}` 
        : `relative w-full z-[10002] ${cleanClassName}`
      } 
      style={shouldUseFixed ? topStyle : {}}
    >
      <div className={`max-w-2xl mx-auto`}>
        <div className="relative z-[10002]">
          {/* Back Arrow / Search Icon - Animated Transition */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-30">
            <AnimatePresence mode="wait" initial={false}>
              {showBackArrow ? (
                <motion.button
                  key="back-arrow"
                  initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputRef.current?.blur();
                    if (onClear) {
                      onClear();
                    }
                  }}
                  className="flex items-center justify-center w-5 h-5 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors cursor-pointer pointer-events-auto"
                  aria-label="Close search"
                >
                  <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                </motion.button>
              ) : (
                <motion.button
                  key="search-icon"
                  initial={{ opacity: 1, scale: 1, rotate: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputRef.current?.focus();
                  }}
                  className="flex items-center justify-center w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer pointer-events-auto"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={handleBlur}
            className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-0 transition-all relative z-20"
            style={{ position: 'relative' }}
          />
          {shouldShowClear && onClear && !showBackArrow && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onClear) {
                  onClear();
                }
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors z-40"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // When open, always use portal to ensure it's above everything
  // Otherwise, use portal for fixed positioning, render inline for relative
  if (isOpen || !isRelative) {
    return createPortal(searchBarContent, document.body);
  }
  
  // Render inline for relative positioning when not open
  return searchBarContent;
};

export default SearchBar;

