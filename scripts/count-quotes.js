// Simple script to count quotes from markdown files
// Run with: node scripts/count-quotes.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Count quotes in a text (blockquotes and paragraphs)
function countQuotablePassages(content) {
  let count = 0;
  
  // Count blockquotes
  const blockquoteRegex = /^>.*$/gm;
  const blockquotes = content.match(blockquoteRegex);
  if (blockquotes) {
    const blockquoteText = blockquotes.join('\n').replace(/^>\s*/gm, '').trim();
    if (isQuotable(blockquoteText)) {
      count++;
    }
  }
  
  // Count paragraphs (split by double newlines)
  const paragraphs = content.split(/\n\n+/);
  for (const para of paragraphs) {
    const cleaned = cleanMarkdown(para);
    if (isQuotable(cleaned)) {
      count++;
    }
  }
  
  return count;
}

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

// Count external quotes from philosopherQuotes.ts
function countExternalQuotes() {
  const filePath = path.join(__dirname, '../src/data/philosopherQuotes.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const categories = {
    classical: 0,
    modern: 0,
    'poet-mystic': 0,
    physics: 0,
    complexity: 0,
    consciousness: 0,
  };
  
  // Count by category
  for (const category of Object.keys(categories)) {
    const regex = new RegExp(`category: '${category}'`, 'g');
    const matches = content.match(regex);
    categories[category] = matches ? matches.length : 0;
  }
  
  return categories;
}

// Count internal quotes
function countInternalQuotes() {
  const baseDir = path.join(__dirname, '../src');
  
  // Count book chapters
  const bookDir = path.join(baseDir, 'book');
  let bookQuotes = 0;
  let bookChapters = 0;
  
  function countInDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        countInDir(fullPath);
      } else if (file.name.endsWith('.md') || file.name.endsWith('.mdx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const quotes = countQuotablePassages(content);
        bookQuotes += quotes;
        bookChapters++;
      }
    }
  }
  
  countInDir(bookDir);
  
  // Count meditations
  const meditationDir = path.join(baseDir, 'meditations/meditations');
  let meditationQuotes = 0;
  let meditationFiles = 0;
  
  if (fs.existsSync(meditationDir)) {
    const files = fs.readdirSync(meditationDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(meditationDir, file), 'utf-8');
        const quotes = countQuotablePassages(content);
        meditationQuotes += quotes;
        meditationFiles++;
      }
    }
  }
  
  // Count stories
  const storyDir = path.join(baseDir, 'stories/stories');
  let storyQuotes = 0;
  let storyFiles = 0;
  
  if (fs.existsSync(storyDir)) {
    const files = fs.readdirSync(storyDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(storyDir, file), 'utf-8');
        const quotes = countQuotablePassages(content);
        storyQuotes += quotes;
        storyFiles++;
      }
    }
  }
  
  return {
    book: { raw: bookQuotes, afterDensity: bookQuotes, sources: bookChapters },
    meditation: { raw: meditationQuotes, afterDensity: Math.ceil(meditationQuotes * 0.6), sources: meditationFiles },
    story: { raw: storyQuotes, afterDensity: Math.ceil(storyQuotes * 0.4), sources: storyFiles },
  };
}

// Run diagnostics
console.log('📊 Quote Count Diagnostics\n');
console.log('='.repeat(60));

const external = countExternalQuotes();
const internal = countInternalQuotes();

console.log('\n📚 Internal Quotes:');
console.table({
  'Book': {
    'Raw Quotes': internal.book.raw,
    'After Density': internal.book.afterDensity,
    'Sources': internal.book.sources,
    'Avg/Chapter': (internal.book.raw / internal.book.sources).toFixed(1),
  },
  'Meditation': {
    'Raw Quotes': internal.meditation.raw,
    'After Density': internal.meditation.afterDensity,
    'Sources': internal.meditation.sources,
    'Avg/Meditation': (internal.meditation.raw / internal.meditation.sources).toFixed(1),
  },
  'Story': {
    'Raw Quotes': internal.story.raw,
    'After Density': internal.story.afterDensity,
    'Sources': internal.story.sources,
    'Avg/Story': (internal.story.raw / internal.story.sources).toFixed(1),
  },
});

console.log('\n🌍 External Quotes:');
console.table({
  'Classical': external.classical,
  'Modern': external.modern,
  'Poet-Mystic': external['poet-mystic'],
  'Physics': external.physics,
  'Complexity': external.complexity,
  'Consciousness': external.consciousness,
  'Total': Object.values(external).reduce((a, b) => a + b, 0),
});

const totalInternal = internal.book.afterDensity + internal.meditation.afterDensity + internal.story.afterDensity;
const totalExternal = Object.values(external).reduce((a, b) => a + b, 0);
const total = totalInternal + totalExternal;

console.log('\n📈 Summary:');
console.table({
  'Total Internal (After Density)': totalInternal,
  'Total External': totalExternal,
  'Total Pool': total,
  'Internal %': ((totalInternal / total) * 100).toFixed(1) + '%',
  'External %': ((totalExternal / total) * 100).toFixed(1) + '%',
});

