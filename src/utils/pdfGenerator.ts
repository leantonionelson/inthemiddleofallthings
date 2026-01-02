import { jsPDF } from 'jspdf';
import { BookChapter } from '../types';

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
function processMarkdownContent(markdown: string): Array<{ text: string; isBold: boolean; isItalic: boolean; isHeading: boolean }> {
  const blocks: Array<{ text: string; isBold: boolean; isItalic: boolean; isHeading: boolean }> = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ text: '', isBold: false, isItalic: false, isHeading: false });
      continue;
    }
    
    // Check for headings
    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 0;
      const text = trimmed.replace(/^#+\s+/, '');
      blocks.push({ text, isBold: true, isItalic: false, isHeading: true });
      continue;
    }
    
    // Process inline formatting
    let text = trimmed;
    let isBold = false;
    let isItalic = false;
    
    // Check for bold
    if (text.includes('**')) {
      isBold = true;
      text = text.replace(/\*\*/g, '');
    }
    
    // Check for italic
    if (text.includes('*') && !isBold) {
      isItalic = true;
      text = text.replace(/\*/g, '');
    }
    
    // Remove other markdown syntax
    text = text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .trim();
    
    if (text) {
      blocks.push({ text, isBold, isItalic, isHeading: false });
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
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  const lineHeight = 7;
  const titleFontSize = 18;
  const chapterTitleFontSize = 14;
  const bodyFontSize = 11;

  // Helper to add a new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper to add text with word wrapping
  const addWrappedText = (text: string, fontSize: number, isBold = false, color: string = '#000000') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(color);
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    checkNewPage(lines.length * lineHeight);
    
    lines.forEach((line: string) => {
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  // Helper to add markdown content
  const addMarkdownContent = (markdown: string) => {
    const blocks = processMarkdownContent(markdown);
    
    for (const block of blocks) {
      if (!block.text && !block.isHeading) {
        yPosition += lineHeight / 2; // Small space for empty lines
        continue;
      }
      
      if (block.isHeading) {
        checkNewPage(15);
        yPosition += 5;
        addWrappedText(block.text, chapterTitleFontSize, true);
        yPosition += 5;
      } else {
        const fontStyle = block.isBold ? 'bold' : block.isItalic ? 'italic' : 'normal';
        pdf.setFont('helvetica', fontStyle);
        addWrappedText(block.text, bodyFontSize, block.isBold);
        pdf.setFont('helvetica', 'normal');
        yPosition += 2; // Small space after paragraph
      }
    }
  };

  // Add cover page
  pdf.setFontSize(titleFontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor('#000000');
  const titleY = pageHeight / 2 - 20;
  pdf.text('In the Middle of All Things', pageWidth / 2, titleY, { align: 'center' });
  
  pdf.setFontSize(bodyFontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.text('A philosophical exploration of existence, consciousness, and the nature of being.', pageWidth / 2, titleY + 15, { align: 'center' });
  
  // Add new page for content
  pdf.addPage();
  yPosition = margin;

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
    
    // Add part header
    checkNewPage(20);
    yPosition += 10;
    pdf.setFontSize(chapterTitleFontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.text(part, margin, yPosition);
    yPosition += 10;
    
    // Process chapters in this part
    for (const chapter of chaptersByPart[part]) {
      // Add chapter title
      checkNewPage(25);
      yPosition += 5;
      
      const chapterTitle = markdownToPlainText(chapter.title || 'Untitled Chapter');
      pdf.setFontSize(chapterTitleFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text(chapterTitle, margin, yPosition);
      yPosition += 8;
      
      // Add chapter content
      if (chapter.content) {
        addMarkdownContent(chapter.content);
      }
      
      // Add space between chapters
      yPosition += 10;
    }
  }

  // Save the PDF
  pdf.save('In-the-Middle-of-All-Things.pdf');
}
