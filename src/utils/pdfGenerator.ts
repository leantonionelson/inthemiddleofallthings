import { jsPDF } from 'jspdf';
import { BookChapter, Meditation, Story } from '../types';
import { partDescriptions } from '../data/bookContent';

type RGB = [number, number, number];

// --- Shared Utilities ---

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

type TextBlock =
  | { kind: 'blank' }
  | { kind: 'section_heading'; text: string }
  | { kind: 'quote_line'; text: string }
  | { kind: 'numbered_item'; number: string; text: string }
  | { kind: 'bulleted_item'; text: string }
  | { kind: 'paragraph'; text: string; isBold: boolean; isItalic: boolean };

/**
 * FIXED: Merges consecutive text lines into single paragraph blocks.
 * This prevents hard-wrapped source text from breaking into separate lines in the PDF.
 */
function processMarkdownContent(markdown: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const lines = markdown.split('\n');

  // Buffer to hold lines of the current paragraph being built
  let paragraphBuffer: string[] = [];
  
  // Helper to flush the buffer into a single block
  const flushBuffer = () => {
    if (paragraphBuffer.length === 0) return;
    
    // Join lines with spaces to form one flowing text body
    let fullText = paragraphBuffer.join(' ');
    
    // Basic styling detection (applies to the whole paragraph block)
    let isBold = false;
    let isItalic = false;

    if (fullText.includes('**')) {
      isBold = true;
      fullText = fullText.replace(/\*\*/g, '');
    }
    if (fullText.includes('*') && !isBold) {
      isItalic = true;
      fullText = fullText.replace(/\*/g, '');
    }

    fullText = fullText
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .trim();

    if (fullText) {
      blocks.push({ kind: 'paragraph', text: fullText, isBold, isItalic });
    }
    paragraphBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 1. Handle Blank Lines (Paragraph Separators)
    if (!trimmed) {
      flushBuffer();
      blocks.push({ kind: 'blank' });
      continue;
    }

    // 2. Handle Horizontal Rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '* * *') {
      flushBuffer();
      blocks.push({ kind: 'blank' }, { kind: 'blank' });
      continue;
    }

    // 3. Handle Headings
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      flushBuffer();
      blocks.push({ kind: 'section_heading', text: headingMatch[1] });
      continue;
    }

    // 4. Handle Blockquotes
    if (trimmed.startsWith('>')) {
      flushBuffer();
      blocks.push({ kind: 'quote_line', text: trimmed.replace(/^>\s?/, '') });
      continue;
    }

    // 5. Handle Numbered Lists
    const numberedMatch = trimmed.match(/^(\d{1,3})[.)]\s+(.+)$/);
    if (numberedMatch) {
      flushBuffer();
      blocks.push({ kind: 'numbered_item', number: numberedMatch[1], text: numberedMatch[2] });
      continue;
    }

    // 6. Handle Bullet Lists
    const bulletMatch = trimmed.match(/^[-•]\s+(.+)$/);
    if (bulletMatch) {
      flushBuffer();
      blocks.push({ kind: 'bulleted_item', text: bulletMatch[1] });
      continue;
    }

    // 7. Standard Text Line -> Add to buffer (don't push block yet)
    paragraphBuffer.push(trimmed);
  }

  // Flush any remaining text at the end of the document
  flushBuffer();

  return blocks;
}

// --- The PDF Engine Class ---

class PDFEngine {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private yPosition: number = 0;
  private pageNumber: number = 0;

  // Palette
  private readonly INK_PRIMARY: RGB = [0, 0, 0];
  private readonly INK_SECONDARY: RGB = [90, 90, 90];

  // Sizes
  public readonly bodySize = 10;
  private readonly pageNumberSize = 8;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
      compress: true,
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  // --- Core Layout Methods ---

  private ptToMm(pt: number) {
    return pt * 0.3527777778;
  }

  public lineHeightFor(pt: number, leading: number = 1.52) {
    return this.ptToMm(pt) * leading;
  }

  public marginsFor(pageNumForSpread: number) {
    const inner = 18;
    const outer = 22;
    const top = 20;
    const bottom = 22;

    const isOdd = pageNumForSpread % 2 === 1;
    const left = isOdd ? inner : outer;
    const right = isOdd ? outer : inner;

    return { left, right, top, bottom, inner, outer, isOdd };
  };

  public startNewPage() {
    if (this.pageNumber === 0) {
      this.pdf.addPage();
      this.pageNumber = 1;
    } else {
      this.pdf.addPage();
      this.pageNumber += 1;
    }
    const m = this.marginsFor(this.pageNumber);
    this.yPosition = m.top;
  }

  public checkNewPage(requiredHeight: number) {
    const m = this.marginsFor(this.pageNumber <= 0 ? 1 : this.pageNumber);
    if (this.yPosition + requiredHeight > this.pageHeight - m.bottom) {
      this.startNewPage();
      return true;
    }
    return false;
  }

  public addWrappedText(
    text: string, 
    fontSize: number, 
    opts?: { font?: 'helvetica' | 'times'; style?: 'normal' | 'bold' | 'italic'; color?: RGB; x?: number; maxWidth?: number; leading?: number }
  ) {
    const font = opts?.font ?? 'times';
    const style = opts?.style ?? 'normal';
    const color = opts?.color ?? this.INK_PRIMARY;
    const leading = opts?.leading ?? 1.52;
    const m = this.marginsFor(this.pageNumber <= 0 ? 1 : this.pageNumber);
    const x = opts?.x ?? m.left;
    const maxWidth = opts?.maxWidth ?? (this.pageWidth - m.left - m.right);

    this.pdf.setFontSize(fontSize);
    this.pdf.setFont(font, style);
    this.pdf.setTextColor(...color);

    const lines = this.pdf.splitTextToSize(text, maxWidth);
    const lh = this.lineHeightFor(fontSize, leading);
    this.checkNewPage(lines.length * lh);

    lines.forEach((line: string) => {
      this.pdf.text(line, x, this.yPosition);
      this.yPosition += lh;
    });
  }

  public addMarkdownContent(markdown: string) {
    const blocks = processMarkdownContent(markdown);
    const blankGap = 5.0;
    const lineGap = 0.8;
    const listItemGap = 2.6;
    const quoteIndent = 4;

    for (const block of blocks) {
      if (block.kind === 'blank') {
        this.yPosition += blankGap;
        continue;
      }

      if (block.kind === 'section_heading') {
        this.checkNewPage(14);
        this.yPosition += 5;
        this.addWrappedText(block.text, this.bodySize, { font: 'times', style: 'bold', color: this.INK_PRIMARY, leading: 1.48 });
        this.yPosition += 3.5;
        continue;
      }

      if (block.kind === 'quote_line') {
        this.checkNewPage(10);
        this.addWrappedText(block.text, this.bodySize, { 
          font: 'times', style: 'italic', 
          color: this.INK_PRIMARY, 
          x: this.marginsFor(this.pageNumber).left + quoteIndent, 
          leading: 1.55 
        });
        this.yPosition += 2.2;
        continue;
      }

      if (block.kind === 'numbered_item') {
        this.checkNewPage(10);
        const m = this.marginsFor(this.pageNumber);
        
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(this.bodySize);
        this.pdf.setTextColor(...this.INK_SECONDARY);
        this.pdf.text(`${block.number}.`, m.left, this.yPosition);

        this.addWrappedText(block.text, this.bodySize, {
          font: 'times',
          style: 'normal',
          color: this.INK_PRIMARY,
          x: m.left + 8,
          maxWidth: this.pageWidth - (m.left + 8) - m.right,
        });
        this.yPosition += listItemGap;
        continue;
      }

      if (block.kind === 'bulleted_item') {
        this.checkNewPage(10);
        const m = this.marginsFor(this.pageNumber);
        
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(this.bodySize);
        this.pdf.setTextColor(...this.INK_SECONDARY);
        this.pdf.text('•', m.left + 0.5, this.yPosition);

        this.addWrappedText(block.text, this.bodySize, {
          font: 'times',
          style: 'normal',
          color: this.INK_PRIMARY,
          x: m.left + 6,
          maxWidth: this.pageWidth - (m.left + 6) - m.right,
        });
        this.yPosition += listItemGap;
        continue;
      }

      if (block.kind === 'paragraph') {
        const style = block.isBold ? 'bold' : block.isItalic ? 'italic' : 'normal';
        this.addWrappedText(block.text, this.bodySize, { font: 'times', style, color: this.INK_PRIMARY, leading: 1.55 });
        this.yPosition += lineGap;
      }
    }
  }

  // --- Accessors for specific manual layouts ---
  public getPDF() { return this.pdf; }
  public getPageWidth() { return this.pageWidth; }
  public getPageHeight() { return this.pageHeight; }
  public getY() { return this.yPosition; }
  public setY(y: number) { this.yPosition = y; }
  public getPageNumber() { return this.pageNumber; }

  /**
   * Finalizes the document by looping through all pages and adding numbers.
   */
  public save(filename: string, startNumberingFromPage: number = 1) {
    const totalPages = this.pdf.getNumberOfPages();

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(this.pageNumberSize);
    this.pdf.setTextColor(...this.INK_SECONDARY);

    for (let i = 1; i <= totalPages; i++) {
      if (i < startNumberingFromPage) continue;

      this.pdf.setPage(i);
      const m = this.marginsFor(i);
      const y = this.pageHeight - 12;
      const displayNum = String(i);

      if (m.isOdd) {
        this.pdf.text(displayNum, this.pageWidth - m.outer, y, { align: 'right' });
      } else {
        this.pdf.text(displayNum, m.outer, y, { align: 'left' });
      }
    }

    this.pdf.save(filename);
  }
}

// --- Exported Functions ---

export async function generateBookPDF(chapters: BookChapter[]): Promise<void> {
  const engine = new PDFEngine();
  const pdf = engine.getPDF();
  
  // Cover page
  pdf.setTextColor(0,0,0);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.text('In the Middle of All Things', engine.getPageWidth() / 2, engine.getPageHeight() / 2, { align: 'center' });
  
  const chaptersByPart: Record<string, BookChapter[]> = {};
  chapters.forEach(chapter => {
    const part = chapter.part || 'Introduction';
    if (!chaptersByPart[part]) chaptersByPart[part] = [];
    chaptersByPart[part].push(chapter);
  });

  const partOrder = ['Introduction', 'Part I: The Axis of Becoming', 'Part II: The Spiral Path', 'Part III: The Living Axis', 'Part IV: The Horizon Beyond', 'Outro'];
  
  for (const part of partOrder) {
    if (!chaptersByPart[part] || chaptersByPart[part].length === 0) continue;

    engine.startNewPage();
    const m = engine.marginsFor(engine.getPageNumber());
    const titleY = Math.max(m.top + 22, engine.getPageHeight() * 0.33);
    engine.setY(titleY);

    engine.addWrappedText(part, 14.5, { font: 'times', style: 'bold', leading: 1.25 });
    engine.setY(engine.getY() + 6);

    const desc = partDescriptions[part];
    if (desc) {
      engine.addWrappedText(desc, engine.bodySize, { font: 'times', style: 'normal', leading: 1.6 });
    }

    engine.startNewPage();

    for (const chapter of chaptersByPart[part]) {
      if (engine.getY() > engine.marginsFor(engine.getPageNumber()).top + 0.1) {
        engine.startNewPage();
      }

      const chapterTitle = markdownToPlainText(chapter.title || 'Untitled Chapter');
      const m = engine.marginsFor(engine.getPageNumber());
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12.5);
      pdf.setTextColor(0,0,0);
      
      const titleLines = pdf.splitTextToSize(chapterTitle, engine.getPageWidth() - m.left - m.right);
      titleLines.forEach((l: string) => {
        pdf.text(l, m.left, engine.getY());
        engine.setY(engine.getY() + engine.lineHeightFor(12.5));
      });
      engine.setY(engine.getY() + 6);
      
      if (chapter.content) {
        engine.addMarkdownContent(chapter.content);
      }
    }
  }

  engine.save('In-the-Middle-of-All-Things.pdf', 2);
}

export async function generateMeditationsPDF(meditations: Meditation[]): Promise<void> {
  const engine = new PDFEngine();
  const pdf = engine.getPDF();

  pdf.setTextColor(0,0,0);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.text('Meditations', engine.getPageWidth() / 2, engine.getPageHeight() / 2, { align: 'center' });

  for (const meditation of meditations) {
    engine.startNewPage();

    const title = markdownToPlainText(meditation.title || 'Untitled Meditation');
    const m = engine.marginsFor(engine.getPageNumber());
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12.5);
    pdf.setTextColor(0,0,0);
    
    const titleLines = pdf.splitTextToSize(title, engine.getPageWidth() - m.left - m.right);
    titleLines.forEach((l: string) => {
      pdf.text(l, m.left, engine.getY());
      engine.setY(engine.getY() + engine.lineHeightFor(12.5));
    });
    engine.setY(engine.getY() + 6);

    if (meditation.content) {
      engine.addMarkdownContent(meditation.content);
    }
  }

  engine.save('Meditations.pdf', 2);
}

export async function generateStoriesPDF(stories: Story[]): Promise<void> {
  const engine = new PDFEngine();
  const pdf = engine.getPDF();

  pdf.setTextColor(0,0,0);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.text('Stories', engine.getPageWidth() / 2, engine.getPageHeight() / 2, { align: 'center' });

  for (const story of stories) {
    engine.startNewPage();

    const title = markdownToPlainText(story.title || 'Untitled Story');
    const m = engine.marginsFor(engine.getPageNumber());
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12.5);
    pdf.setTextColor(0,0,0);
    
    const titleLines = pdf.splitTextToSize(title, engine.getPageWidth() - m.left - m.right);
    titleLines.forEach((l: string) => {
      pdf.text(l, m.left, engine.getY());
      engine.setY(engine.getY() + engine.lineHeightFor(12.5));
    });
    engine.setY(engine.getY() + 6);

    if (story.content) {
      engine.addMarkdownContent(story.content);
    }
  }

  engine.save('Stories.pdf', 2);
}