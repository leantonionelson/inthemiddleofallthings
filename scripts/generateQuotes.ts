/**
 * Build-time script to pre-generate quote cards
 * This runs during build to create public/quotes.json for instant loading
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the quote extraction logic
// We'll need to adapt this to work in Node.js environment
import { BookChapter, Meditation } from '../src/types/index.js';

// Simple markdown parser (adapted from bookContent.ts)
function parseMarkdownContent(markdown: string): { title: string; subtitle?: string; content: string } {
  const lines = markdown.split('\n');
  let title = '';
  let subtitle = '';
  let content = '';
  let inContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ')) {
      title = line.substring(2);
    } else if (line.startsWith('## ')) {
      subtitle = line.substring(3);
    } else if (line === '---') {
      inContent = true;
    } else if (inContent && line) {
      content += line + '\n';
    } else if (inContent) {
      content += '\n';
    }
  }

  return {
    title: title.trim(),
    subtitle: subtitle.trim() || undefined,
    content: content.trim()
  };
}

function parseMeditationContent(markdown: string): { title: string; content: string; tags: string[] } {
  const lines = markdown.split('\n');
  let title = '';
  let content = '';
  let tags: string[] = [];
  let inContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ')) {
      title = line.substring(2);
    } else if (line.startsWith('**Tags:**')) {
      const tagLine = line.replace('**Tags:**', '').trim();
      tags = tagLine.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (line === '---') {
      inContent = true;
    } else if (inContent && line) {
      content += line + '\n';
    } else if (inContent) {
      content += '\n';
    }
  }

  return {
    title: title.trim(),
    content: content.trim(),
    tags
  };
}

// Quote extraction functions (from quoteExtractor.ts)
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*|\*/g, '')
    .replace(/^#+\s|^>\s|^-\s/gm, '')
    .trim();
}

function isQuotable(text: string): boolean {
  if (text.length < 50 || text.length > 400) return false;
  if (!text.match(/[.!?]/)) return false;
  if (text.startsWith('**Tags:**')) return false;
  
  const poeticScore = 
    (text.match(/\n/g)?.length || 0) * 2 +
    (text.includes('?') ? 1 : 0) +
    (text.includes('not') ? 1 : 0) +
    (text.match(/\b(is|are|becomes?|transform)\b/gi)?.length || 0);
  
  return poeticScore >= 2;
}

function extractBlockquotes(content: string): string[] {
  const quotes: string[] = [];
  const lines = content.split('\n');
  let currentQuote: string[] = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      currentQuote.push(line.replace(/^>\s*/, ''));
    } else if (currentQuote.length > 0) {
      const quote = cleanMarkdown(currentQuote.join('\n'));
      if (isQuotable(quote)) {
        quotes.push(quote);
      }
      currentQuote = [];
    }
  }
  
  if (currentQuote.length > 0) {
    const quote = cleanMarkdown(currentQuote.join('\n'));
    if (isQuotable(quote)) {
      quotes.push(quote);
    }
  }
  
  return quotes;
}

function extractParagraphs(content: string): string[] {
  const paragraphs: string[] = [];
  const blocks = content.split(/\n\n+/);
  
  for (const block of blocks) {
    const cleaned = cleanMarkdown(block);
    if (isQuotable(cleaned)) {
      paragraphs.push(cleaned);
    }
  }
  
  return paragraphs;
}

function generateGradient(): string {
  const gradients = [
    'linear-gradient(135deg, rgba(253, 251, 251, 0.75) 0%, rgba(235, 237, 238, 0.75) 100%)',
    'linear-gradient(135deg, rgba(255, 241, 235, 0.75) 0%, rgba(172, 224, 249, 0.75) 100%)',
    'linear-gradient(135deg, rgba(253, 226, 228, 0.75) 0%, rgba(226, 236, 233, 0.75) 100%)',
    'linear-gradient(135deg, rgba(252, 227, 236, 0.75) 0%, rgba(255, 232, 214, 0.75) 100%)',
    'linear-gradient(135deg, rgba(224, 247, 250, 0.75) 0%, rgba(232, 245, 233, 0.75) 100%)',
    'linear-gradient(135deg, rgba(230, 240, 255, 0.75) 0%, rgba(255, 246, 240, 0.75) 100%)',
    'linear-gradient(135deg, rgba(243, 232, 255, 0.75) 0%, rgba(232, 250, 255, 0.75) 100%)',
    'linear-gradient(135deg, rgba(232, 222, 248, 0.75) 0%, rgba(243, 232, 255, 0.75) 100%)',
    'linear-gradient(135deg, rgba(230, 255, 250, 0.75) 0%, rgba(255, 250, 240, 0.75) 100%)',
    'linear-gradient(135deg, rgba(250, 243, 221, 0.75) 0%, rgba(226, 240, 203, 0.75) 100%)',
    'linear-gradient(135deg, rgba(255, 229, 236, 0.75) 0%, rgba(226, 240, 255, 0.75) 100%)',
    'linear-gradient(135deg, rgba(254, 246, 228, 0.75) 0%, rgba(227, 240, 255, 0.75) 100%)',
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

interface QuoteCard {
  id: string;
  quote: string;
  source: {
    type: 'book' | 'meditation';
    id: string;
    title: string;
    subtitle?: string;
    part?: string;
    chapter?: string;
  };
  gradient: string;
}

async function generateQuoteCards(): Promise<QuoteCard[]> {
  const cards: QuoteCard[] = [];
  const rootDir = join(__dirname, '..');
  
  // Load book chapters
  const bookDir = join(rootDir, 'src/book');
  const bookStructure = [
    { path: 'introduction', chapters: [{ id: 'introduction', filename: 'introduction.mdx' }] },
    { path: 'Part I: The Axis of Becoming', chapters: [
      { id: 'chapter-1', filename: 'chapter-1.md' },
      { id: 'chapter-2', filename: 'chapter-2.md' },
      { id: 'chapter-3', filename: 'chapter-3.md' },
      { id: 'chapter-4', filename: 'chapter-4.md' },
      { id: 'chapter-5', filename: 'chapter-5.md' },
      { id: 'chapter-6', filename: 'chapter-6.md' },
      { id: 'chapter-7', filename: 'chapter-7.md' },
    ]},
    { path: 'Part II: The Spiral Path', chapters: [
      { id: 'chapter-8', filename: 'chapter-8.md' },
      { id: 'chapter-9', filename: 'chapter-9.md' },
      { id: 'chapter-10', filename: 'chapter-10.md' },
      { id: 'chapter-11', filename: 'chapter-11.md' },
      { id: 'chapter-12', filename: 'chapter-12.md' },
      { id: 'chapter-13', filename: 'chapter-13.md' },
      { id: 'chapter-14', filename: 'chapter-14.md' },
    ]},
    { path: 'Part III: The Living Axis', chapters: [
      { id: 'chapter-15', filename: 'chapter-15.md' },
      { id: 'chapter-16', filename: 'chapter-16.md' },
      { id: 'chapter-17', filename: 'chapter-17.md' },
      { id: 'chapter-18', filename: 'chapter-18.md' },
      { id: 'chapter-19', filename: 'chapter-19.md' },
      { id: 'chapter-20', filename: 'chapter-20.md' },
    ]},
    { path: 'Part IV: The Horizon Beyond', chapters: [
      { id: 'chapter-21', filename: 'chapter-21.md' },
      { id: 'chapter-22', filename: 'chapter-22.md' },
      { id: 'chapter-23', filename: 'chapter-23.md' },
      { id: 'chapter-24', filename: 'chapter-24.md' },
      { id: 'chapter-25', filename: 'chapter-25.md' },
      { id: 'chapter-26', filename: 'chapter-26.md' },
      { id: 'chapter-27', filename: 'chapter-27.md' },
    ]},
  ];

  let chapterNumber = 0;
  for (const part of bookStructure) {
    for (const chapterDef of part.chapters) {
      try {
        const filePath = join(bookDir, part.path, chapterDef.filename);
        const markdown = readFileSync(filePath, 'utf-8');
        const parsed = parseMarkdownContent(markdown);
        chapterNumber++;
        
        const quotes = [...extractBlockquotes(parsed.content), ...extractParagraphs(parsed.content)];
        for (const quote of quotes) {
          cards.push({
            id: `${chapterDef.id}-${cards.length}`,
            quote,
            source: {
              type: 'book',
              id: chapterDef.id,
              title: parsed.title,
              subtitle: parsed.subtitle,
              part: part.path,
              chapter: `Chapter ${chapterNumber}`
            },
            gradient: generateGradient()
          });
        }
      } catch (error) {
        console.warn(`Error loading chapter ${chapterDef.id}:`, error);
      }
    }
  }

  // Load meditations
  const meditationsDir = join(rootDir, 'src/meditations/meditations');
  try {
    const { readdirSync } = await import('fs');
    const meditationFiles = readdirSync(meditationsDir).filter(f => f.endsWith('.md'));
    
    for (const filename of meditationFiles) {
      try {
        const filePath = join(meditationsDir, filename);
        const markdown = readFileSync(filePath, 'utf-8');
        const parsed = parseMeditationContent(markdown);
        const id = filename.replace('.md', '');
        
        const quotes = [...extractBlockquotes(parsed.content), ...extractParagraphs(parsed.content)];
        for (const quote of quotes) {
          cards.push({
            id: `${id}-${cards.length}`,
            quote,
            source: {
              type: 'meditation',
              id,
              title: parsed.title,
            },
            gradient: generateGradient()
          });
        }
      } catch (error) {
        console.warn(`Error loading meditation ${filename}:`, error);
      }
    }
  } catch (error) {
    console.warn('Error loading meditations:', error);
  }

  return cards;
}

// Main execution
async function main() {
  console.log('Generating quote cards...');
  const cards = await generateQuoteCards();
  console.log(`Generated ${cards.length} quote cards`);
  
  const outputPath = join(__dirname, '..', 'public', 'quotes.json');
  writeFileSync(outputPath, JSON.stringify(cards, null, 2), 'utf-8');
  console.log(`Saved to ${outputPath}`);
}

main().catch(console.error);

