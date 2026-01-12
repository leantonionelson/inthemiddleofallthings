import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="text-sm px-3 py-2 rounded-full border border-ink-muted/10 dark:border-paper-light/10 hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors text-ink-primary dark:text-paper-light"
        >
          {s}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;


