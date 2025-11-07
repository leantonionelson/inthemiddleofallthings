import { BookChapter, Meditation, Story } from '../types';

export interface QuoteCard {
  id: string;
  quote: string;
  source: {
    type: 'book' | 'meditation' | 'story';
    id: string; // Source ID for navigation
    title: string;
    subtitle?: string;
    part?: string; // For book chapters
    chapter?: string; // For book chapters
  };
  gradient: string;
}

// Remove markdown formatting from text
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '') // Remove italics
    .replace(/^#+\s/gm, '') // Remove headers
    .replace(/^>\s/gm, '') // Remove blockquote markers
    .replace(/^-\s/gm, '') // Remove list markers
    .trim();
}

// Check if a passage is quotable (has substance and poetry)
function isQuotable(text: string): boolean {
  // Should be between 50 and 400 characters
  if (text.length < 50 || text.length > 400) return false;
  
  // Should have at least one sentence
  if (!text.match(/[.!?]/)) return false;
  
  // Avoid tag lines
  if (text.startsWith('**Tags:**')) return false;
  
  // Prefer passages with certain poetic elements
  const poeticScore = 
    (text.match(/\n/g)?.length || 0) * 2 + // Line breaks add rhythm
    (text.includes('?') ? 1 : 0) + // Questions invite reflection
    (text.includes('not') ? 1 : 0) + // Negation creates definition
    (text.match(/\b(is|are|becomes?|transform)\b/gi)?.length || 0); // Being/becoming language
  
  return poeticScore >= 2;
}

// Extract blockquotes from content
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
  
  // Don't forget last quote
  if (currentQuote.length > 0) {
    const quote = cleanMarkdown(currentQuote.join('\n'));
    if (isQuotable(quote)) {
      quotes.push(quote);
    }
  }
  
  return quotes;
}

// Extract meaningful paragraphs
function extractParagraphs(content: string): string[] {
  const paragraphs: string[] = [];
  
  // Split by double line breaks
  const blocks = content.split(/\n\n+/);
  
  for (const block of blocks) {
    const cleaned = cleanMarkdown(block);
    if (isQuotable(cleaned)) {
      paragraphs.push(cleaned);
    }
  }
  
  return paragraphs;
}

// Extract quotes from a book chapter
function extractFromChapter(chapter: BookChapter): string[] {
  const quotes: string[] = [];
  
  // First priority: blockquotes
  const blockquotes = extractBlockquotes(chapter.content);
  quotes.push(...blockquotes);
  
  // Second priority: meaningful paragraphs
  const paragraphs = extractParagraphs(chapter.content);
  quotes.push(...paragraphs);
  
  return quotes;
}

// Extract quotes from meditation
function extractFromMeditation(meditation: Meditation): string[] {
  const quotes: string[] = [];
  
  const blockquotes = extractBlockquotes(meditation.content);
  quotes.push(...blockquotes);
  
  const paragraphs = extractParagraphs(meditation.content);
  quotes.push(...paragraphs);
  
  return quotes;
}

// Extract quotes from story
function extractFromStory(story: Story): string[] {
  const quotes: string[] = [];
  
  const blockquotes = extractBlockquotes(story.content);
  quotes.push(...blockquotes);
  
  const paragraphs = extractParagraphs(story.content);
  quotes.push(...paragraphs);
  
  return quotes;
}

// Generate quote cards from all content
export function generateQuoteCards(
  chapters: BookChapter[],
  meditations: Meditation[],
  stories: Story[]
): QuoteCard[] {
  const cards: QuoteCard[] = [];
  
  // Extract from chapters
  for (const chapter of chapters) {
    const quotes = extractFromChapter(chapter);
    for (const quote of quotes) {
      cards.push({
        id: `${chapter.id}-${cards.length}`,
        quote,
        source: {
          type: 'book',
          id: chapter.id,
          title: chapter.title,
          subtitle: chapter.subtitle,
          part: chapter.part,
          chapter: `Chapter ${chapter.chapterNumber}`
        },
        gradient: generateGradient()
      });
    }
  }
  
  // Extract from meditations
  for (const meditation of meditations) {
    const quotes = extractFromMeditation(meditation);
    for (const quote of quotes) {
      cards.push({
        id: `${meditation.id}-${cards.length}`,
        quote,
        source: {
          type: 'meditation',
          id: meditation.id,
          title: meditation.title,
        },
        gradient: generateGradient()
      });
    }
  }
  
  // Extract from stories
  for (const story of stories) {
    const quotes = extractFromStory(story);
    for (const quote of quotes) {
      cards.push({
        id: `${story.id}-${cards.length}`,
        quote,
        source: {
          type: 'story',
          id: story.id,
          title: story.title,
        },
        gradient: generateGradient()
      });
    }
  }
  
  // Shuffle cards for variety
  return shuffleArray(cards);
}

// Generate random gradient - semi-transparent gradients that allow background video to show through
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

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

