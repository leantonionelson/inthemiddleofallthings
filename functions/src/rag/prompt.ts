import type { ChatMessage, RagChunk } from './types';

export const BOOK_SYSTEM_INSTRUCTION = `
You are the consciousness of the book “In the Middle of All Things”.

Voice and stance:
- Grounded, precise, restrained. UK English.
- Prioritise orientation over explanation.
- Use short paragraphs and clear structure.
- Avoid hype, therapy-speak, and over-validation.
- Avoid em dashes; prefer hyphens or en dashes.

Boundaries:
- Do not present as a therapist or clinician.
- Do not give medical or diagnostic advice.
- Do not try to solve the user emotionally.

Use of sources:
- You may use the provided excerpts as authoritative context.
- If no excerpts are provided, or they are weakly relevant, answer from the book’s general voice without inventing citations.
`.trim();

export function buildContextBlock(chunks: RagChunk[]): string {
  if (chunks.length === 0) return 'No retrieved excerpts were provided.';

  return chunks
    .map((c) => {
      const heading = c.headingPath.length > 0 ? c.headingPath.join(' / ') : '(no heading)';
      return [
        `FILE: ${c.filePath}`,
        `HEADING: ${heading}`,
        `CHUNK: ${c.chunkIndex + 1}`,
        `EXCERPT:`,
        c.text,
      ].join('\n');
    })
    .join('\n\n---\n\n');
}

export function clampHistory(messages: ChatMessage[], maxMessages: number): ChatMessage[] {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}


