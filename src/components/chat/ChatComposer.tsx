import React, { useCallback } from 'react';
import { RotateCcw, Send } from 'lucide-react';

interface ChatComposerProps {
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
  onSend: () => void;
  onRefresh?: () => void;
}

/**
 * ChatComposer
 *
 * UX rules:
 * - Enter to send
 * - Shift+Enter for newline
 * - Button send for touch / accessibility
 */
const ChatComposer: React.FC<ChatComposerProps> = ({ value, disabled, onChange, onSend, onRefresh }) => {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') return;
      if (e.shiftKey) return; // newline
      e.preventDefault();
      if (!disabled) onSend();
    },
    [disabled, onSend]
  );

  return (
    <div className="glass-subtle rounded-3xl border border-ink-muted/10 dark:border-paper-light/10 px-3 py-3">
      <div className="flex gap-2 items-end">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            className="h-10 w-10 rounded-xl flex items-center justify-center border border-ink-muted/10 dark:border-paper-light/10 bg-paper-light/40 dark:bg-paper-dark/40 hover:bg-paper-light/60 dark:hover:bg-paper-dark/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Refresh chat"
            title="Refresh chat"
          >
            <RotateCcw className="w-4 h-4 text-ink-primary dark:text-paper-light" />
          </button>
        ) : null}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="Ask for orientation…"
          rows={1}
          className="flex-1 h-10 resize-none outline-none rounded-2xl border border-ink-muted/10 dark:border-paper-light/10 bg-paper-light/60 dark:bg-paper-dark/50 text-ink-primary dark:text-paper-light placeholder:text-ink-secondary/60 dark:placeholder:text-ink-muted/70 text-sm leading-5 py-2 px-3 focus:border-ink-muted/30 dark:focus:border-paper-light/30 focus:ring-2 focus:ring-accent-twilight/15 dark:focus:ring-accent-twilight/20"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || value.trim().length === 0}
          className="h-10 w-10 rounded-xl flex items-center justify-center border border-ink-muted/10 dark:border-paper-light/10 bg-paper-light/40 dark:bg-paper-dark/40 hover:bg-paper-light/60 dark:hover:bg-paper-dark/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-ink-primary dark:text-paper-light" />
        </button>
      </div>
      
    </div>
  );
};

export default ChatComposer;


