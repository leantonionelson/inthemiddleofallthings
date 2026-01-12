/**
 * build-rag-index
 *
 * Development + deploy-time index builder.
 *
 * What it does:
 * - Scans markdown files in the repo (book/meditations/stories/content)
 * - Chunks them heading-first, paragraph-aware
 * - Embeds each chunk with Gemini embeddings
 * - Writes `functions/lib/rag/index.json` for runtime retrieval
 *
 * Notes:
 * - This script is intended to run during Firebase Functions predeploy.
 * - It reads GEMINI_API_KEY from the environment, or falls back to the repo root `.env`.
 */

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { chunkMarkdown } from '../src/rag/chunkMarkdown';
import { createGeminiClient, requireGeminiApiKey } from '../src/rag/gemini';
import { norm } from '../src/rag/math';
import type { RagChunk, RagIndex } from '../src/rag/types';

const EMBEDDING_MODEL = 'text-embedding-004';

function loadEnvFromRepoRootIfNeeded() {
  if (process.env.GEMINI_API_KEY) return;

  const repoRoot = path.resolve(process.cwd(), '..');
  const envPath = path.join(repoRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key === 'GEMINI_API_KEY') {
      process.env.GEMINI_API_KEY = value;
      return;
    }
  }
}

async function embedText(text: string): Promise<number[]> {
  const genAI = createGeminiClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const res = await model.embedContent(text);
  return res.embedding.values;
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function main() {
  loadEnvFromRepoRootIfNeeded();
  requireGeminiApiKey();

  const repoRoot = path.resolve(process.cwd(), '..');

  const patterns = [
    'src/book/**/*.md',
    'src/meditations/**/*.md',
    'src/stories/**/*.md',
    'book/**/*.md',
    'meditations/**/*.md',
    'content/**/*.md',
  ];

  const files = await fg(patterns, {
    cwd: repoRoot,
    onlyFiles: true,
    unique: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/android/**', '**/ios/**'],
  });

  if (files.length === 0) {
    throw new Error('No markdown files found for RAG indexing.');
  }

  const allChunkMetas = files.flatMap((relPath) => {
    const absPath = path.join(repoRoot, relPath);
    const markdown = fs.readFileSync(absPath, 'utf8');
    return chunkMarkdown(relPath, markdown);
  });

  const chunks: RagChunk[] = [];
  for (const meta of allChunkMetas) {
    const id = `${meta.filePath}::${meta.headingPath.join('>')}::${meta.chunkIndex}`;
    const embedding = await embedText(meta.text);
    const embeddingNorm = norm(embedding);
    chunks.push({
      id,
      filePath: meta.filePath,
      headingPath: meta.headingPath,
      chunkIndex: meta.chunkIndex,
      text: meta.text,
      embedding,
      embeddingNorm,
    });
  }

  const index: RagIndex = {
    version: 1,
    createdAt: new Date().toISOString(),
    embeddingModel: EMBEDDING_MODEL,
    chunks,
  };

  // Runtime reads from the compiled bundle under `functions/lib/src/rag/index.json`.
  // (Our TS output keeps `src/` under `lib/`.)
  const outDir = path.join(process.cwd(), 'lib', 'src', 'rag');
  ensureDir(outDir);
  const outPath = path.join(outDir, 'index.json');
  fs.writeFileSync(outPath, JSON.stringify(index), 'utf8');

  // Also write to src for visibility during development (non-authoritative at runtime).
  const srcOutDir = path.join(process.cwd(), 'src', 'rag');
  ensureDir(srcOutDir);
  fs.writeFileSync(path.join(srcOutDir, 'index.json'), JSON.stringify(index), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`RAG index written: ${outPath} (${chunks.length} chunks from ${files.length} files)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


