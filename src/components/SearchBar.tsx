import React from 'react';
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

  // Check if relative positioning is requested
  const isRelative = className.includes('!relative');
  
  // Parse top offset from className if present (e.g., "!top-12")
  const topOffset = className.includes('!top-') 
    ? className.match(/!top-(\d+)/)?.[1] 
    : null;
  const topStyle = topOffset ? { top: `${parseInt(topOffset) * 0.25}rem` } : {};

  // Clean className for container
  const cleanClassName = className
    .replace(/!top-\d+/g, '')
    .replace(/!relative/g, '')
    .trim();

  // On mobile (fixed positioning), render through portal to escape stacking context
  // If relative, render inline without portal
  const searchBarContent = (
    <div 
      className={isRelative 
        ? `relative w-full ${cleanClassName}` 
        : `fixed left-0 right-0 z-[10000] ${cleanClassName}`
      } 
      style={!isRelative ? topStyle : {}}
    >
      <div className={`max-w-2xl mx-auto`}>
        <div className="relative">
          {/* Back Arrow / Search Icon - Animated */}
          <AnimatePresence mode="wait">
            {showBackArrow ? (
              <motion.button
                key="back-arrow"
                initial={{ opacity: 0, scale: 0.95, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.95, rotate: 15 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                onClick={onClear}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center leading-none text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors cursor-pointer z-10"
                style={{ marginTop: '-9px' }}
                aria-label="Close search"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </motion.button>
            ) : (
              <motion.div
                key="search-icon"
                initial={{ opacity: 0, scale: 0.95, rotate: 15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.95, rotate: -15 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center leading-none pointer-events-none z-20"
                style={{ marginTop: '-9px' }}
              >
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-0 transition-all relative"
            style={{ position: 'relative', zIndex: 1 }}
          />
          {shouldShowClear && onClear && !showBackArrow && (
            <button
              onClick={onClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center leading-none text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
              style={{ marginTop: '-9px' }}
              aria-label="Clear search"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal only for fixed positioning, render inline for relative
  if (isRelative) {
    return searchBarContent;
  }
  
  // Use portal to render at document body level to escape stacking context
  return createPortal(searchBarContent, document.body);
};

export default SearchBar;

