import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import cors from 'cors';
import type { ChatCitation, ChatRequestBody, ChatMessage } from './rag/types';
import { BOOK_SYSTEM_INSTRUCTION, buildContextBlock, clampHistory } from './rag/prompt';
import { loadRagIndex } from './rag/indexStore';
import { retrieveTopK } from './rag/retrieve';
import { createGeminiClient } from './rag/gemini';

// Initialise Firebase Admin SDK (available for future extensions, telemetry, etc).
admin.initializeApp();

const corsHandler = cors({ origin: true });

const ALLOWED_ORIGINS = new Set<string>([
  'http://localhost:5173',
  'http://localhost:4173',
  'https://inthemiddleofallthings.com',
  'https://middleofallthings.com',
]);

// Runtime secret (Gen 2 best-practice). The deploy-time index build still reads GEMINI_API_KEY from env.
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const GENERATION_MODEL = 'gemini-flash-latest';
const TOP_K = 8;

function parseBody(raw: unknown): ChatRequestBody {
  if (typeof raw !== 'object' || raw === null) return {};
  return raw as ChatRequestBody;
}

function normaliseMessages(messages: ChatMessage[] | undefined): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }));
}

function makeCitations(chunks: Array<{ filePath: string; headingPath: string[]; chunkIndex: number; text: string }>): ChatCitation[] {
  return chunks.map((c) => ({
    filePath: c.filePath,
    headingPath: c.headingPath,
    chunkIndex: c.chunkIndex,
    excerpt: c.text.slice(0, 800),
  }));
}

export const chat = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
    secrets: [GEMINI_API_KEY],
  },
  (req, res) => {
    // Always set CORS headers early so even errors/405s carry the right headers.
    // This avoids "blocked by CORS policy" masking the real server response (404/500/etc).
    const origin = req.headers.origin;
    if (typeof origin === 'string') {
      const isNetlifyPreview = origin.endsWith('.netlify.app');
      if (ALLOWED_ORIGINS.has(origin) || isNetlifyPreview) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Max-Age', '3600');

    // Explicitly handle CORS preflight.
    // In some runtimes/environments, relying on middleware auto-shortcircuiting OPTIONS can be brittle.
    // If we don't answer the preflight with CORS headers, browsers will block the real POST request.
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      try {
        // Provide the secret to shared helpers that read `process.env.GEMINI_API_KEY`.
        // This keeps the embedding + generation code usable by both runtime and deploy-time scripts.
        process.env.GEMINI_API_KEY = GEMINI_API_KEY.value();

        const body = parseBody(req.body);
        const messages = normaliseMessages(body.messages);
        const userMessage = typeof body.userMessage === 'string' ? body.userMessage : '';

        const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
        const query = (userMessage || lastUser).trim();
        if (!query) {
          res.status(400).json({ error: 'Missing userMessage' });
          return;
        }

        const history = clampHistory(messages, 12);

        const index = loadRagIndex();
        let retrievedChunks: Array<{ filePath: string; headingPath: string[]; chunkIndex: number; text: string }> = [];
        let includeCitations = false;

        if (index) {
          const { chunks, topScore } = await retrieveTopK(index, query, TOP_K);

          // Conservative threshold: if we are not clearly close to the content, do not cite.
          includeCitations = topScore >= 0.62;
          retrievedChunks = includeCitations ? chunks : [];
        }

        const contextBlock = buildContextBlock(retrievedChunks as any);

        const genAI = createGeminiClient();
        const model = genAI.getGenerativeModel({
          model: GENERATION_MODEL,
          systemInstruction: BOOK_SYSTEM_INSTRUCTION,
        });

        const contents = [
          {
            role: 'user' as const,
            parts: [
              {
                text:
                  `Retrieved context (use only if relevant):\n\n${contextBlock}\n\n` +
                  `Now respond to the user in the book’s voice.\n`,
              },
            ],
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

        res.json({
          reply,
          citations: includeCitations ? makeCitations(retrievedChunks) : undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
      }
    });
  }
);


