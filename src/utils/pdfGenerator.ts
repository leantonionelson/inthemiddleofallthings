import { jsPDF } from 'jspdf';
import { BookChapter } from '../types';
import { partDescriptions } from '../data/bookContent';

type RGB = [number, number, number];

/**
 * Strips markdown formatting and extracts plain text
 */
function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .trim();
}

/**
 * Processes markdown content and extracts formatted text blocks
 */
type TextBlock =
  | { kind: 'blank' }
  | { kind: 'section_heading'; text: string }
  | { kind: 'quote_line'; text: string }
  | { kind: 'numbered_item'; number: string; text: string }
  | { kind: 'bulleted_item'; text: string }
  | { kind: 'text_line'; text: string; isBold: boolean; isItalic: boolean };

function processMarkdownContent(markdown: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ kind: 'blank' });
      continue;
    }

    // Horizontal rules / separators (rendered as whitespace only; no decorative marks)
    if (trimmed === '---' || trimmed === '***' || trimmed === '* * *') {
      blocks.push({ kind: 'blank' });
      blocks.push({ kind: 'blank' });
      continue;
    }

    // Headings inside chapters: keep same size as body, differentiate via spacing + weight.
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ kind: 'section_heading', text: headingMatch[1] });
      continue;
    }

    // Blockquotes: strip the markdown marker, keep the text.
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s?/, '');
      blocks.push({ kind: 'quote_line', text });
      continue;
    }

    // Numbered sections / corollaries.
    const numberedMatch = trimmed.match(/^(\d{1,3})[.)]\s+(.+)$/);
    if (numberedMatch) {
      blocks.push({ kind: 'numbered_item', number: numberedMatch[1], text: numberedMatch[2] });
      continue;
    }

    // Bulleted lists (markdown '- ').
    const bulletMatch = trimmed.match(/^[-•]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({ kind: 'bulleted_item', text: bulletMatch[1] });
      continue;
    }

    // Inline formatting (best-effort; jsPDF doesn't support mixed styling within one line)
    let text = trimmed;
    let isBold = false;
    let isItalic = false;

    if (text.includes('**')) {
      isBold = true;
      text = text.replace(/\*\*/g, '');
    }
    if (text.includes('*') && !isBold) {
      isItalic = true;
      text = text.replace(/\*/g, '');
    }

    text = text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .trim();

    if (text) {
      blocks.push({ kind: 'text_line', text, isBold, isItalic });
    }
  }

  return blocks;
}

/**
 * Generates a PDF from book chapters
 */
export async function generateBookPDF(chapters: BookChapter[]): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 is a good size for books
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 0;

  // Print-only palette: black + grayscale only.
  const INK_PRIMARY: RGB = [0, 0, 0];
  const INK_SECONDARY: RGB = [90, 90, 90];

  // Typography (jsPDF built-ins): Times for body + headings (serif); Helvetica for meta (page numbers).
  const coverTitleSize = 20;
  const partTitleSize = 14.5;
  const chapterTitleSize = 12.5;
  const bodySize = 10;
  const pageNumberSize = 8;

  const ptToMm = (pt: number) => pt * 0.3527777778;
  const lineHeightFor = (pt: number, leading: number = 1.52) => ptToMm(pt) * leading;

  // We don't print the page number on the cover; numbering begins on first content page.
  let pageNumber = 0;

  const marginsFor = (pageNumForSpread: number) => {
    // Book-like mirrored margins: generous inner (gutter), slightly larger outer.
    const inner = 18;
    const outer = 22;
    const top = 20;
    const bottom = 22;

    const isOdd = pageNumForSpread % 2 === 1; // 1 = recto (right-hand page)
    const left = isOdd ? inner : outer;
    const right = isOdd ? outer : inner;

    return { left, right, top, bottom, inner, outer, isOdd };
  };

  const drawPageNumber = () => {
    if (pageNumber <= 0) return;
    const m = marginsFor(pageNumber);
    const y = pageHeight - 12;
    pdf.setTextColor(...INK_SECONDARY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(pageNumberSize);

    if (m.isOdd) {
      pdf.text(String(pageNumber), pageWidth - m.outer, y, { align: 'right' });
    } else {
      pdf.text(String(pageNumber), m.outer, y, { align: 'left' });
    }
  };

  const startNewPage = (opts?: { showPageNumber?: boolean }) => {
    if (pageNumber === 0) {
      // Cover has already been drawn on page 1; this call begins content numbering.
      pdf.addPage();
      pageNumber = 1;
    } else {
      pdf.addPage();
      pageNumber += 1;
    }
    if (opts?.showPageNumber !== false) drawPageNumber();

    const m = marginsFor(pageNumber);
    yPosition = m.top;
  };

  // Helper to add a new page if needed
  const checkNewPage = (requiredHeight: number) => {
    const m = marginsFor(pageNumber <= 0 ? 1 : pageNumber);
    if (yPosition + requiredHeight > pageHeight - m.bottom) {
      startNewPage();
      return true;
    }
    return false;
  };

  // Helper to add text with word wrapping
  const addWrappedText = (text: string, fontSize: number, opts?: { font?: 'helvetica' | 'times'; style?: 'normal' | 'bold' | 'italic'; color?: RGB; x?: number; maxWidth?: number; leading?: number }) => {
    const font = opts?.font ?? 'times';
    const style = opts?.style ?? 'normal';
    const color = opts?.color ?? INK_PRIMARY;
    const leading = opts?.leading ?? 1.52;
    const m = marginsFor(pageNumber <= 0 ? 1 : pageNumber);
    const x = opts?.x ?? m.left;
    const maxWidth = opts?.maxWidth ?? (pageWidth - m.left - m.right);

    pdf.setFontSize(fontSize);
    pdf.setFont(font, style);
    pdf.setTextColor(...color);

    const lines = pdf.splitTextToSize(text, maxWidth);
    const lh = lineHeightFor(fontSize, leading);
    checkNewPage(lines.length * lh);

    lines.forEach((line: string) => {
      pdf.text(line, x, yPosition);
      yPosition += lh;
    });
  };

  // Helper to add markdown content
  const addMarkdownContent = (markdown: string) => {
    const blocks = processMarkdownContent(markdown);
    // Rhythm:
    // - Source line breaks should feel connected (clusters stay clusters)
    // - Blank lines create the real paragraph / pause spacing
    const lineGap = 0.8;
    const blankGap = 5.0;
    const listItemGap = 2.6;
    const quoteIndent = 4;

    for (const block of blocks) {
      if (block.kind === 'blank') {
        yPosition += blankGap;
        continue;
      }

      if (block.kind === 'section_heading') {
        checkNewPage(14);
        yPosition += 5;
        addWrappedText(block.text, bodySize, { font: 'times', style: 'bold', color: INK_PRIMARY, leading: 1.48 });
        yPosition += 3.5;
        continue;
      }

      if (block.kind === 'quote_line') {
        checkNewPage(10);
        addWrappedText(block.text, bodySize, { font: 'times', style: 'italic', color: INK_PRIMARY, x: marginsFor(pageNumber).left + quoteIndent, leading: 1.55 });
        yPosition += 2.2;
        continue;
      }

      if (block.kind === 'numbered_item') {
        checkNewPage(10);
        const m = marginsFor(pageNumber);
        const numberText = `${block.number}.`;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(bodySize);
        pdf.setTextColor(...INK_SECONDARY);
        pdf.text(numberText, m.left, yPosition);

        // Text starts after a small gutter.
        addWrappedText(block.text, bodySize, {
          font: 'times',
          style: 'normal',
          color: INK_PRIMARY,
          x: m.left + 8,
          maxWidth: pageWidth - (m.left + 8) - m.right,
        });
        yPosition += listItemGap;
        continue;
      }

      if (block.kind === 'bulleted_item') {
        checkNewPage(10);
        const m = marginsFor(pageNumber);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(bodySize);
        pdf.setTextColor(...INK_SECONDARY);
        pdf.text('•', m.left + 0.5, yPosition);

        addWrappedText(block.text, bodySize, {
          font: 'times',
          style: 'normal',
          color: INK_PRIMARY,
          x: m.left + 6,
          maxWidth: pageWidth - (m.left + 6) - m.right,
        });
        yPosition += listItemGap;
        continue;
      }

      if (block.kind === 'text_line') {
        const style = block.isBold ? 'bold' : block.isItalic ? 'italic' : 'normal';
        addWrappedText(block.text, bodySize, { font: 'times', style, color: INK_PRIMARY, leading: 1.55 });
        yPosition += lineGap;
      }
    }
  };

  // Cover page: quiet, typographic only (no decorative rules, no extra subtitle).
  pdf.setTextColor(...INK_PRIMARY);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(coverTitleSize);
  pdf.text('In the Middle of All Things', pageWidth / 2, pageHeight / 2, { align: 'center' });

  // Group chapters by part
  const chaptersByPart: Record<string, BookChapter[]> = {};
  chapters.forEach(chapter => {
    const part = chapter.part || 'Introduction';
    if (!chaptersByPart[part]) {
      chaptersByPart[part] = [];
    }
    chaptersByPart[part].push(chapter);
  });

  // Process each part
  const partOrder = ['Introduction', 'Part I: The Axis of Becoming', 'Part II: The Spiral Path', 'Part III: The Living Axis', 'Part IV: The Horizon Beyond', 'Outro'];
  
  for (const part of partOrder) {
    if (!chaptersByPart[part] || chaptersByPart[part].length === 0) continue;

    // Part title pages must begin on a new page (and stand as a structural shift).
    startNewPage({ showPageNumber: false });
    {
      const m = marginsFor(pageNumber);
      const titleY = Math.max(m.top + 22, pageHeight * 0.33);
      yPosition = titleY;

      pdf.setFont('times', 'bold');
      pdf.setFontSize(partTitleSize);
      pdf.setTextColor(...INK_PRIMARY);
      pdf.text(part, m.left, yPosition);
      yPosition += lineHeightFor(partTitleSize, 1.25) + 6;

      const desc = partDescriptions[part];
      if (desc) {
        addWrappedText(desc, bodySize, { font: 'times', style: 'normal', color: INK_PRIMARY, leading: 1.6 });
      }
    }

    // Chapters begin on a new page.
    // (This also creates clear separation between part orientation and chapter entry.)
    startNewPage({ showPageNumber: true });

    // Process chapters in this part
    for (const chapter of chaptersByPart[part]) {
      // Each chapter begins on a new page.
      // (But avoid an extra blank page if we're already at top because we just started the part's chapter run.)
      if (yPosition > marginsFor(pageNumber).top + 0.1) {
        startNewPage({ showPageNumber: true });
      }

      const chapterTitle = markdownToPlainText(chapter.title || 'Untitled Chapter');
      pdf.setFont('times', 'bold');
      pdf.setFontSize(chapterTitleSize);
      pdf.setTextColor(...INK_PRIMARY);
      const m = marginsFor(pageNumber);
      const titleLines = pdf.splitTextToSize(chapterTitle, pageWidth - m.left - m.right);
      titleLines.forEach((l: string) => {
        pdf.text(l, m.left, yPosition);
        yPosition += lineHeightFor(chapterTitleSize);
      });
      yPosition += 6; // entry vector: generous air before the first paragraph
      
      // Add chapter content
      if (chapter.content) {
        addMarkdownContent(chapter.content);
      }
    }
  }

  // Save the PDF
  pdf.save('In-the-Middle-of-All-Things.pdf');
}
