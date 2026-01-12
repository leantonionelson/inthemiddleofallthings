/**
 * chunkMarkdown
 *
 * Heading-first, paragraph-aware markdown chunking.
 * We keep this intentionally simple and deterministic:
 * - Split by H1/H2/H3 headings
 * - Within a heading section, split/merge paragraphs to target ~400–900 tokens
 *
 * Token estimate is conservative: ~4 chars per token.
 */

export interface MarkdownChunkMeta {
  filePath: string;
  headingPath: string[];
  chunkIndex: number;
  text: string;
}

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const normalise = (s: string) =>
  s
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function splitIntoParagraphs(sectionText: string): string[] {
  const t = normalise(sectionText);
  if (!t) return [];
  return t.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
}

function packParagraphs(paragraphs: string[], targetMinTokens: number, targetMaxTokens: number): string[] {
  const out: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    out.push(buffer.join('\n\n').trim());
    buffer = [];
  };

  for (const p of paragraphs) {
    const candidate = buffer.length === 0 ? p : `${buffer.join('\n\n')}\n\n${p}`;
    const t = estimateTokens(candidate);

    if (t <= targetMaxTokens) {
      buffer.push(p);
      continue;
    }

    // Candidate would be too large; flush what we have and start new buffer.
    flush();

    // Paragraph itself may still be too big; hard-split by sentences as a fallback.
    if (estimateTokens(p) > targetMaxTokens) {
      const sentences = p.split(/(?<=[.!?])\s+/g);
      let sBuf: string[] = [];
      for (const s of sentences) {
        const sCandidate = sBuf.length === 0 ? s : `${sBuf.join(' ')} ${s}`;
        if (estimateTokens(sCandidate) <= targetMaxTokens) {
          sBuf.push(s);
        } else {
          if (sBuf.length > 0) out.push(sBuf.join(' ').trim());
          sBuf = [s];
        }
      }
      if (sBuf.length > 0) out.push(sBuf.join(' ').trim());
    } else {
      buffer.push(p);
      flush();
    }
  }

  flush();

  // If we produced lots of tiny chunks, merge adjacent ones where safe.
  const merged: string[] = [];
  for (const chunk of out) {
    if (merged.length === 0) {
      merged.push(chunk);
      continue;
    }
    const last = merged[merged.length - 1];
    const candidate = `${last}\n\n${chunk}`;
    if (estimateTokens(candidate) <= targetMaxTokens && estimateTokens(candidate) >= targetMinTokens) {
      merged[merged.length - 1] = candidate;
    } else {
      merged.push(chunk);
    }
  }

  return merged;
}

export function chunkMarkdown(filePath: string, markdown: string): MarkdownChunkMeta[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  const sections: Array<{ headingPath: string[]; contentLines: string[] }> = [];
  let currentHeadingPath: string[] = [];
  let currentContent: string[] = [];

  const pushSection = () => {
    const text = currentContent.join('\n').trim();
    if (text.length === 0) return;
    sections.push({ headingPath: currentHeadingPath, contentLines: [...currentContent] });
  };

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (!m) {
      currentContent.push(line);
      continue;
    }

    // New heading starts: push previous.
    pushSection();
    currentContent = [];

    const level = m[1].length; // 1..3
    const title = m[2].trim();

    currentHeadingPath = currentHeadingPath.slice(0, level - 1);
    currentHeadingPath[level - 1] = title;
  }

  pushSection();

  const targetMinTokens = 400;
  const targetMaxTokens = 900;

  const chunks: MarkdownChunkMeta[] = [];
  for (const section of sections) {
    const sectionText = section.contentLines.join('\n');
    const paragraphs = splitIntoParagraphs(sectionText);
    const packed = packParagraphs(paragraphs, targetMinTokens, targetMaxTokens);
    packed.forEach((text, idx) => {
      chunks.push({
        filePath,
        headingPath: section.headingPath,
        chunkIndex: idx,
        text,
      });
    });
  }

  // If a file had no headings or yielded no sections, chunk the whole file.
  if (chunks.length === 0) {
    const paragraphs = splitIntoParagraphs(markdown);
    const packed = packParagraphs(paragraphs, targetMinTokens, targetMaxTokens);
    packed.forEach((text, idx) => {
      chunks.push({ filePath, headingPath: [], chunkIndex: idx, text });
    });
  }

  return chunks;
}


