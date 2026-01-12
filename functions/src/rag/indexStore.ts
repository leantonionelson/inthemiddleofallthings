import fs from 'node:fs';
import path from 'node:path';
import type { RagIndex } from './types';

let cachedIndex: RagIndex | null = null;

/**
 * loadRagIndex
 *
 * Loads the prebuilt index from the deployed bundle (generated at deploy-time).
 * If the file is missing, retrieval will be disabled and the chat will fall back to voice-only responses.
 */
export function loadRagIndex(): RagIndex | null {
  if (cachedIndex) return cachedIndex;

  // In compiled code, `__dirname` is `functions/lib/src/rag`.
  // Our build script writes the runtime index into `functions/lib/src/rag/index.json`.
  const candidatePaths = [path.join(__dirname, 'index.json')];

  for (const p of candidatePaths) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    cachedIndex = JSON.parse(raw) as RagIndex;
    return cachedIndex;
  }

  return null;
}


