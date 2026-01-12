export interface RagChunk {
  id: string;
  filePath: string;
  headingPath: string[];
  chunkIndex: number;
  text: string;
  embedding: number[];
  embeddingNorm: number;
}

export interface RagIndex {
  version: number;
  createdAt: string;
  embeddingModel: string;
  chunks: RagChunk[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestBody {
  messages?: ChatMessage[];
  userMessage?: string;
}

export interface ChatCitation {
  filePath: string;
  headingPath: string[];
  chunkIndex: number;
  excerpt: string;
}


