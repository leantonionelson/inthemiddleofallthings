import type { ChatRole } from '../pages/Chat/ChatPage';
import type { ChatCitation } from '../pages/Chat/ChatPage';

export interface ChatRequestMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatRequestMessage[];
  userMessage: string;
}

export interface ChatResponse {
  reply: string;
  citations?: ChatCitation[];
}

function getDefaultEndpoint(): string {
  // Local dev (npm run dev): default to the Netlify Function path and rely on Vite dev proxy.
  // See vite.config.ts `server.proxy['/.netlify/functions']`.
  if (import.meta.env.DEV) {
    return '/.netlify/functions/chat';
  }

  // If we're running on our Netlify-hosted frontend (or custom domain), prefer the same-origin Netlify Function.
  // This avoids CORS entirely in production.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isNetlify = host.endsWith('.netlify.app');
    const isCustomDomain = host === 'inthemiddleofallthings.com' || host === 'middleofallthings.com';
    if (!isLocalhost && (isNetlify || isCustomDomain)) {
      return '/.netlify/functions/chat';
    }
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  if (!projectId) {
    // This is still useful in development even if not configured yet.
    return 'https://us-central1-UNKNOWN_PROJECT.cloudfunctions.net/chat';
  }
  return `https://us-central1-${projectId}.cloudfunctions.net/chat`;
}

/**
 * chatService
 *
 * Frontend client for the Firebase Cloud Function `chat`.
 *
 * Important:
 * - The Gemini API key must never be used here.
 * - This client talks only to our backend which handles RAG + Gemini calls.
 */
export const chatService = {
  async send(payload: ChatRequest): Promise<ChatResponse> {
    const endpoint = (import.meta.env.VITE_CHAT_ENDPOINT as string | undefined) ?? getDefaultEndpoint();

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Chat request failed (${res.status}). ${text}`.trim());
    }

    return (await res.json()) as ChatResponse;
  },
};


