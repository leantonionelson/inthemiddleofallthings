import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  showClearButton?: boolean;
  onClear?: () => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  showClearButton = true,
  onClear,
  className = ''
}) => {
  const shouldShowClear = showClearButton && value.trim();

  return (
    <div className={`fixed top-0 left-0 right-0 z-[70] lg:relative ${className}`}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-6 py-4 lg:pt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none border-0 transition-all"
          />
          {shouldShowClear && onClear && (
            <button
              onClick={onClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;

