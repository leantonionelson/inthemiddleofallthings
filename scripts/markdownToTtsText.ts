/**
 * Markdown → TTS input text (no rewriting, line-break preserving).
 *
 * Goals:
 * - Strip markdown syntax (headings, emphasis, links) without paraphrasing
 * - Preserve line breaks and blank lines (cadence)
 * - Preserve punctuation
 * - Produce consistent output suitable for hashing
 */
export function markdownToTtsText(markdown: string): string {
  // Normalise newlines early so the rest of the pipeline is deterministic.
  const input = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = input.split('\n');

  let inFence = false;
  let fenceIndent = '';

  const out: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine;

    // Handle fenced code blocks: keep content, drop fence markers.
    // This preserves cadence and avoids deleting potentially meaningful text.
    const fenceMatch = line.match(/^(\s*)(```|~~~)/);
    if (fenceMatch) {
      const indent = fenceMatch[1] ?? '';
      if (!inFence) {
        inFence = true;
        fenceIndent = indent;
      } else if (indent === fenceIndent) {
        inFence = false;
        fenceIndent = '';
      }
      // Drop the fence line itself.
      out.push('');
      continue;
    }

    // Drop HTML tags but keep their text content (best-effort).
    // We do this before inline markdown stripping to avoid odd remnants like `<em>*x*</em>`.
    let t = line.replace(/<\/?[^>]+>/g, '');

    // Strip blockquote marker while keeping text.
    t = t.replace(/^\s{0,3}>\s?/g, '');

    // Headings: remove leading `#` markers but keep heading text.
    t = t.replace(/^\s{0,3}#{1,6}\s+/g, '');

    // Horizontal rules / markdown separators: convert to blank line.
    if (/^\s{0,3}(-{3,}|_{3,}|\*{3,})\s*$/.test(t)) {
      out.push('');
      continue;
    }

    // Lists: remove bullet/number markers but keep the text.
    t = t
      // Unordered list markers
      .replace(/^\s{0,3}[-*+]\s+/g, '')
      // Ordered list markers (1. 1) etc)
      .replace(/^\s{0,3}\d+[.)]\s+/g, '');

    // Inline code: keep content
    t = t.replace(/`([^`]+)`/g, '$1');

    // Images: keep alt text
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');

    // Links: keep link text (ignore URL)
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

    // Reference-style links: [text][id] → text
    t = t.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');

    // Remove leftover link reference definitions like: [id]: https://...
    if (/^\s*\[[^\]]+\]:\s+\S+/.test(t)) {
      out.push('');
      continue;
    }

    // Emphasis markers: unwrap but keep inner text
    t = t
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1');

    // Strikethrough: ~~text~~ → text
    t = t.replace(/~~([^~]+)~~/g, '$1');

    // Remove remaining markdown-only characters that commonly leak through.
    // Do not remove punctuation (.,:;!? etc).
    t = t.replace(/^[ \t]+/g, (m) => m.replace(/\t/g, '    ')); // tabs → spaces (stable)

    out.push(t);
  }

  return out.join('\n');
}

/**
 * Normalise TTS text for stable hashing without changing cadence.
 *
 * Rules:
 * - normalise newlines to `\n`
 * - trim trailing whitespace per line
 * - collapse 3+ blank lines → 2
 * - do NOT reflow or collapse single newlines
 * - trim outer whitespace
 */
export function normaliseForTtsHash(text: string): string {
  let t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');

  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
}




