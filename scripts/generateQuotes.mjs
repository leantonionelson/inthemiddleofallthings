/**
 * Build-time script to pre-generate quote cards
 * Run with: node scripts/generateQuotes.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Simple markdown parser
function parseMarkdownContent(markdown) {
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

function parseMeditationContent(markdown) {
  const lines = markdown.split('\n');
  let title = '';
  let content = '';
  let tags = [];
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

// Quote extraction functions
function cleanMarkdown(text) {
  return text
    .replace(/\*\*|\*/g, '')
    .replace(/^#+\s|^>\s|^-\s/gm, '')
    .trim();
}

function isQuotable(text) {
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

function extractBlockquotes(content) {
  const quotes = [];
  const lines = content.split('\n');
  let currentQuote = [];
  
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

function extractParagraphs(content) {
  const paragraphs = [];
  const blocks = content.split(/\n\n+/);
  
  for (const block of blocks) {
    const cleaned = cleanMarkdown(block);
    if (isQuotable(cleaned)) {
      paragraphs.push(cleaned);
    }
  }
  
  return paragraphs;
}

function generateGradient() {
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

async function generateQuoteCards() {
  const cards = [];
  const bookDir = join(rootDir, 'src/book');
  
  // Book structure matching bookContent.ts
  const bookStructure = [
    {
      part: 'Introduction',
      path: 'introduction',
      chapters: [
        { id: 'introduction', filename: '0. Introduction: A Centre That Moves.mdx' }
      ]
    },
    {
      part: 'Part I: The Axis of Becoming',
      path: 'Part I: The Axis of Becoming',
      chapters: [
        { id: 'part-1-intro', filename: 'intro.md' },
        { id: 'chapter-1', filename: '1. The Axis of Consequence.md' },
        { id: 'chapter-2', filename: '2. The Shape of Desire.md' },
        { id: 'chapter-3', filename: '3. The Weight of Choice.md' },
        { id: 'chapter-4', filename: '4. The Discipline of Becoming.md' },
        { id: 'chapter-5', filename: '5. The Voice of Resistance.md' },
        { id: 'chapter-6', filename: '6. Integration and Return.md' }
      ]
    },
    {
      part: 'Part II: The Spiral Path',
      path: 'Part II: The Spiral Path',
      chapters: [
        { id: 'part-2-intro', filename: 'intro.md' },
        { id: 'chapter-7', filename: '7. The Spiral Path.md' },
        { id: 'chapter-8', filename: '8. The Return of the Old Self.md' },
        { id: 'chapter-9', filename: '9. Rest and the Sacred Pause.md' },
        { id: 'chapter-10', filename: '10. Other People, Other Mirrors.md' },
        { id: 'chapter-11', filename: '11. Time and the Myth of Readiness.md' },
        { id: 'chapter-12', filename: '12. Falling and Rising Again.md' }
      ]
    },
    {
      part: 'Part III: The Living Axis',
      path: 'Part III: The Living Axis',
      chapters: [
        { id: 'part-3-intro', filename: 'intro.md' },
        { id: 'chapter-13', filename: '13. The Body as Compass.md' },
        { id: 'chapter-14', filename: '14. Emotion as Messenger, Not Master.md' },
        { id: 'chapter-15', filename: '15. Living in the Middle.md' },
        { id: 'chapter-16', filename: '16. The World as Field of Practice.md' },
        { id: 'chapter-17', filename: '17. The Unfolding Now.md' }
      ]
    },
    {
      part: 'Part IV: The Horizon Beyond',
      path: 'Part IV: The Horizon Beyond',
      chapters: [
        { id: 'part-4-intro', filename: 'intro.md' },
        { id: 'chapter-18', filename: '18. Echoes and Imprints.md' },
        { id: 'chapter-19', filename: '19. The Shape of Mortality.md' },
        { id: 'chapter-20', filename: '20. Transcendence Without Escape.md' },
        { id: 'chapter-21', filename: '21. Being Part of Something Larger.md' },
        { id: 'chapter-22', filename: '22. The Silence That Holds Us.md' },
        { id: 'chapter-23', filename: '23. The Spiral Never Ends.md' }
      ]
    }
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
              part: part.part,
              chapter: `Chapter ${chapterNumber}`
            },
            gradient: generateGradient()
          });
        }
      } catch (error) {
        console.warn(`Error loading chapter ${chapterDef.id}:`, error.message);
      }
    }
  }

  // Load meditations
  const meditationsDir = join(rootDir, 'src/meditations/meditations');
  try {
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
        console.warn(`Error loading meditation ${filename}:`, error.message);
      }
    }
  } catch (error) {
    console.warn('Error loading meditations:', error.message);
  }

  return cards;
}

// Main execution
async function main() {
  console.log('Generating quote cards...');
  const cards = await generateQuoteCards();
  console.log(`Generated ${cards.length} quote cards`);
  
  const outputPath = join(rootDir, 'public', 'quotes.json');
  writeFileSync(outputPath, JSON.stringify(cards, null, 2), 'utf-8');
  console.log(`Saved to ${outputPath}`);
}

main().catch(console.error);

