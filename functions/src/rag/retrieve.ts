import type { RagChunk, RagIndex } from './types';
import { cosineSimilarity, norm } from './math';
import { createGeminiClient } from './gemini';

const EMBEDDING_MODEL = 'text-embedding-004';

export interface RetrievalResult {
  chunks: RagChunk[];
  topScore: number;
}

export async function embedQuery(text: string): Promise<number[]> {
  const genAI = createGeminiClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // SDK accepts either a string or a structured content object depending on version.
  // Use the simplest form to be resilient.
  const res = await model.embedContent(text);

  // @google/generative-ai returns { embedding: { values: number[] } }
  return res.embedding.values;
}

export async function retrieveTopK(index: RagIndex, queryText: string, k: number): Promise<RetrievalResult> {
  const queryEmbedding = await embedQuery(queryText);
  const queryNorm = norm(queryEmbedding);

  const scored = index.chunks
    .map((c) => ({
      chunk: c,
      score: cosineSimilarity(queryEmbedding, queryNorm, c.embedding, c.embeddingNorm),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, k);
  const topScore = top.length > 0 ? top[0].score : 0;

  return {
    chunks: top.map((t) => t.chunk),
    topScore,
  };
}


