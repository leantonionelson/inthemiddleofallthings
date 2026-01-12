import React from 'react';
import { Copy, FileText } from 'lucide-react';
import type { ChatMessageModel } from '../../pages/Chat/ChatPage';

interface ChatMessageProps {
  message: ChatMessageModel;
  isTyping?: boolean;
  onCopy: (text: string) => Promise<void> | void;
  onShowSources?: () => void;
}

type InlineToken = { type: 'text'; value: string } | { type: 'code' | 'bold' | 'italic'; value: string };

function tokenizeInlineMarkdown(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = input;

  // Minimal, safe inline Markdown support:
  // - `code`
  // - **bold**
  // - *italic*
  //
  // This intentionally does NOT support raw HTML.
  while (remaining.length > 0) {
    const patterns: Array<{ type: InlineToken['type']; re: RegExp }> = [
      { type: 'code', re: /`([^`]+)`/ },
      { type: 'bold', re: /\*\*([\s\S]+?)\*\*/ },
      { type: 'italic', re: /\*([^*\n][\s\S]*?)\*/ },
    ];

    const matches = patterns
      .map(({ type, re }) => {
        const m = re.exec(remaining);
        if (!m) return null;
        return { type, index: m.index, full: m[0], inner: m[1] };
      })
      .filter(Boolean) as Array<{ type: InlineToken['type']; index: number; full: string; inner: string }>;

    if (matches.length === 0) {
      tokens.push({ type: 'text', value: remaining });
      break;
    }

    // Pick earliest match; if tie, prefer code > bold > italic (order in patterns).
    matches.sort((a, b) => a.index - b.index);
    const first = matches[0];

    if (first.index > 0) {
      tokens.push({ type: 'text', value: remaining.slice(0, first.index) });
    }

    tokens.push({ type: first.type as 'code' | 'bold' | 'italic', value: first.inner });
    remaining = remaining.slice(first.index + first.full.length);
  }

  return tokens;
}

function renderInlineMarkdown(input: string): React.ReactNode {
  const tokens = tokenizeInlineMarkdown(input);
  return tokens.map((t, i) => {
    if (t.type === 'text') return <React.Fragment key={i}>{t.value}</React.Fragment>;
    if (t.type === 'code') {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-ink-primary/5 dark:bg-paper-light/10 border border-ink-muted/10 dark:border-paper-light/10 font-mono text-[0.85em]"
        >
          {t.value}
        </code>
      );
    }
    if (t.type === 'bold') return <strong key={i}>{t.value}</strong>;
    return <em key={i}>{t.value}</em>;
  });
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false, onCopy, onShowSources }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 border ${
          isUser
            ? 'bg-blue-600/10 dark:bg-blue-400/10 border-blue-600/20 dark:border-blue-400/20'
            : 'glass-subtle border-ink-muted/10 dark:border-paper-light/10'
        }`}
      >
        <div className="text-[12px] mb-1 text-ink-secondary/70 dark:text-ink-muted/70">
          {isUser ? 'You' : 'The book'}
        </div>

        {isTyping ? (
          <div className="flex items-center gap-2 text-sm text-ink-secondary dark:text-ink-muted">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-secondary/60 dark:bg-ink-muted/60 animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-secondary/60 dark:bg-ink-muted/60 animate-bounce [animation-delay:-0.1s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-secondary/60 dark:bg-ink-muted/60 animate-bounce" />
            </span>
            <span>Thinking</span>
          </div>
        ) : (
          <div
            className={`whitespace-pre-wrap text-sm leading-relaxed text-ink-primary dark:text-paper-light ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {renderInlineMarkdown(message.content)}
          </div>
        )}

        {!isTyping && (
          <div className="mt-3 flex items-center gap-2 justify-end">
            {onShowSources ? (
              <button
                type="button"
                onClick={onShowSources}
                className="text-xs px-2 py-1 rounded-lg border border-ink-muted/10 dark:border-paper-light/10 hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors text-ink-secondary dark:text-ink-muted inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                Source
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onCopy(message.content)}
              className="text-xs px-2 py-1 rounded-lg border border-ink-muted/10 dark:border-paper-light/10 hover:bg-ink-muted/5 dark:hover:bg-paper-light/5 transition-colors text-ink-secondary dark:text-ink-muted inline-flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;


