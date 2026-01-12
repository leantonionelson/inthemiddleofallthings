import React, { useEffect, useMemo, useRef, useState } from 'react';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatComposer from '../../components/chat/ChatComposer';
import SuggestionChips from '../../components/chat/SuggestionChips';
import SourcesModal from '../../components/chat/SourcesModal';
import OverlayPortal from '../../components/OverlayPortal';
import { chatService } from '../../services/chatService';

export type ChatRole = 'user' | 'assistant';

export interface ChatCitation {
  filePath: string;
  headingPath: string[];
  chunkIndex: number;
  excerpt: string;
}

export interface ChatMessageModel {
  id: string;
  role: ChatRole;
  content: string;
  citations?: ChatCitation[];
}

const SUGGESTIONS: string[] = [
  'Bring me back to the centre',
  'Help me orient',
  'Give me a short meditation',
  'Explain the middle simply',
];

const makeId = (): string => {
  // `crypto.randomUUID()` is ideal, but we keep a safe fallback for older runtimes.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * ChatPage
 *
 * New homepage (`/`) – a conversational interface embodying the book’s voice.
 * The backend (Firebase Cloud Function) performs retrieval + Gemini calls.
 */
const ChatPage: React.FC = () => {
  const SESSION_KEY = 'middle.chat.messages.v1';

  const loadSessionMessages = (): ChatMessageModel[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      // Minimal validation to avoid crashing on malformed storage.
      return parsed.filter((m) => m && typeof m.id === 'string' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') as ChatMessageModel[];
    } catch {
      return [];
    }
  };

  const [messages, setMessages] = useState<ChatMessageModel[]>(() => loadSessionMessages());
  const [isSending, setIsSending] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [sourcesFor, setSourcesFor] = useState<ChatMessageModel | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const latestMessagesRef = useRef<ChatMessageModel[]>(messages);

  const canSend = useMemo(() => composerValue.trim().length > 0 && !isSending, [composerValue, isSending]);

  // Keep a ref of latest messages so sendUserText never uses stale state.
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  // Persist messages for the browser session so navigation doesn't clear chat.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage failures
    }
  }, [messages]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    // In a fixed-height container, scrolling the list itself is most reliable.
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const sendUserText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSending(true);
    setComposerValue('');

    const userMsg: ChatMessageModel = {
      id: makeId(),
      role: 'user',
      content: trimmed,
    };

    const pendingAssistantId = makeId();
    const assistantPending: ChatMessageModel = {
      id: pendingAssistantId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMsg, assistantPending]);
    queueMicrotask(scrollToBottom);

    try {
      const historyForRequest = [...latestMessagesRef.current, userMsg];
      const response = await chatService.send({
        messages: historyForRequest.map((m) => ({ role: m.role, content: m.content })),
        userMessage: trimmed,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistantId
            ? {
                ...m,
                content: response.reply,
                citations: response.citations,
              }
            : m
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistantId
            ? {
                ...m,
                content:
                  "I can’t respond right now.\n\n" +
                  'Try again in a moment. If it persists, the chat service may not be deployed yet.\n\n' +
                  `Details: ${message}`,
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
      queueMicrotask(scrollToBottom);
    }
  };

  const onRefresh = () => {
    // "Refresh" in chat context = reset conversation.
    setMessages([]);
    setSourcesFor(null);
    setComposerValue('');
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
      } catch {
        // ignore
      }
    }
    queueMicrotask(scrollToBottom);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto px-4">
        {/* Message list */}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto pt-2"
          aria-label="Conversation"
        >
          {messages.length === 0 ? (
            <div className="mt-10 glass-subtle rounded-3xl p-6 sm:p-8">
              <h2 className="text-xl font-serif text-ink-primary dark:text-paper-light mb-2">Start here</h2>
              <p className="text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
                Ask for orientation. Ask for a short practice. Ask for a clear reframing. Keep it simple.
              </p>
              <div className="mt-4">
                <SuggestionChips suggestions={SUGGESTIONS} onSelect={(s) => sendUserText(s)} />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  isTyping={m.role === 'assistant' && isSending && m.content.trim().length === 0}
                  onCopy={async (text) => {
                    await navigator.clipboard.writeText(text);
                  }}
                  onShowSources={m.citations && m.citations.length > 0 ? () => setSourcesFor(m) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer (fixed UI) rendered OUTSIDE the masked scroll container */}
      <OverlayPortal>
        <div
          className="fixed inset-x-0 z-[80]"
          style={{ bottom: 'calc(var(--bottom-nav-h, 0px) + env(safe-area-inset-bottom) + 4rem)' }}
        >
          <div className="pointer-events-auto max-w-4xl mx-auto px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <ChatComposer
              value={composerValue}
              disabled={isSending}
              onChange={setComposerValue}
              onRefresh={onRefresh}
              onSend={() => {
                if (!canSend) return;
                void sendUserText(composerValue);
              }}
            />
          </div>
        </div>
      </OverlayPortal>

      <SourcesModal
        open={sourcesFor !== null}
        onClose={() => setSourcesFor(null)}
        citations={sourcesFor?.citations ?? []}
      />
    </div>
  );
};

export default ChatPage;


