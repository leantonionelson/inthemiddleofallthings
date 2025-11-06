import { BookChapter, Meditation, Story } from '../types';

export interface QuoteCard {
  id: string;
  quote: string;
  source: {
    type: 'book' | 'meditation' | 'story';
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
          title: story.title,
        },
        gradient: generateGradient()
      });
    }
  }
  
  // Shuffle cards for variety
  return shuffleArray(cards);
}

// Generate random gradient - elegant, muted colors with excellent text legibility
function generateGradient(): string {
  const gradients = [
    // Muted blues and purples
    'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #5a67d8 0%, #553c9a 100%)',
    'linear-gradient(135deg, #4c51bf 0%, #434190 100%)',
    
    // Elegant earth tones
    'linear-gradient(135deg, #6b5b4d 0%, #4a4238 100%)',
    'linear-gradient(135deg, #7c6a5d 0%, #5a4a3c 100%)',
    'linear-gradient(135deg, #8b7355 0%, #6d5843 100%)',
    
    // Sophisticated teals and greens
    'linear-gradient(135deg, #2c5f6f 0%, #1e4552 100%)',
    'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
    'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    'linear-gradient(135deg, #4c6662 0%, #2d4844 100%)',
    
    // Deep warm tones
    'linear-gradient(135deg, #8e5572 0%, #6b3f5c 100%)',
    'linear-gradient(135deg, #a8616b 0%, #874b56 100%)',
    'linear-gradient(135deg, #9d6b84 0%, #7a5168 100%)',
    
    // Charcoal and slate
    'linear-gradient(135deg, #434343 0%, #262626 100%)',
    'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
    'linear-gradient(135deg, #52525b 0%, #3f3f46 100%)',
    
    // Muted navy and indigo
    'linear-gradient(135deg, #2d3561 0%, #1f2642 100%)',
    'linear-gradient(135deg, #1e3a5f 0%, #152a47 100%)',
    'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)',
    
    // Soft olive and sage
    'linear-gradient(135deg, #6b7c59 0%, #4f5d42 100%)',
    'linear-gradient(135deg, #5f6f52 0%, #495640 100%)',
    
    // Deep rose and mauve
    'linear-gradient(135deg, #7d5a6f 0%, #614558 100%)',
    'linear-gradient(135deg, #8b6f7d 0%, #6d5563 100%)',
    
    // Smokey blues
    'linear-gradient(135deg, #4a5f7a 0%, #344558 100%)',
    'linear-gradient(135deg, #556b82 0%, #3e4f61 100%)',
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

