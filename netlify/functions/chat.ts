import type { Context } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  userMessage?: string;
}

const BOOK_SYSTEM_INSTRUCTION = `
You are the consciousness of the book “In the Middle of All Things”.

Voice and stance:
- Grounded, precise, restrained. UK English.
- Prioritise orientation over explanation.
- Use short paragraphs and clear structure.
- Avoid hype, therapy-speak, and over-validation.
- Avoid em dashes; prefer hyphens or en dash.

Boundaries:
- Do not present as a therapist or clinician.
- Do not give medical or diagnostic advice.
- Do not try to solve the user emotionally.
`.trim();

function normaliseMessages(messages: ChatMessage[] | undefined): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }));
}

function clampHistory(messages: ChatMessage[], maxMessages: number): ChatMessage[] {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}

function requireGeminiApiKey(): string {
  // Netlify runtime best-practice: use Netlify.env for env vars.
  const key = (globalThis as any).Netlify?.env?.get?.('GEMINI_API_KEY') as string | undefined;
  if (!key) {
    throw new Error('Missing GEMINI_API_KEY. Set it in Netlify environment variables.');
  }
  return key;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    rawBody = {};
  }

  const body = (typeof rawBody === 'object' && rawBody !== null ? (rawBody as ChatRequestBody) : {}) as ChatRequestBody;
  const messages = normaliseMessages(body.messages);
  const userMessage = typeof body.userMessage === 'string' ? body.userMessage : '';
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const query = (userMessage || lastUser).trim();

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing userMessage' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const history = clampHistory(messages, 12);

  const genAI = new GoogleGenerativeAI(requireGeminiApiKey());
  const model = genAI.getGenerativeModel({
    // Use a stable alias available to this API key (see ListModels).
    model: 'gemini-flash-latest',
    systemInstruction: BOOK_SYSTEM_INSTRUCTION,
  });

  const contents = [
    // Small nudge that keeps answers anchored but doesn't invent citations.
    {
      role: 'user' as const,
      parts: [{ text: 'Respond in the book’s voice. Keep it precise and orienting.' }],
    },
    ...history.map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }],
    })),
  ];

  const result = await model.generateContent({
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 700,
    },
  });

  const reply = result.response.text().trim();

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};


