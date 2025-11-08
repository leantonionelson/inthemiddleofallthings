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

  // On mobile (fixed positioning), render through portal to escape stacking context
  // On desktop (lg:relative), render normally
  const searchBarContent = (
    <div className={`fixed top-0 left-0 right-0 z-[10000] lg:relative ${className}`}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-6 py-4 lg:pt-6">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center leading-none pointer-events-none"
                style={{ marginTop: '-9px' }}
              >
                <Search className="w-5 h-5 text-ink-secondary dark:text-ink-muted" strokeWidth={2} />
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
            className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none border-0 transition-all"
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

  // Use portal to render at document body level to escape stacking context
  return createPortal(searchBarContent, document.body);
};

export default SearchBar;

