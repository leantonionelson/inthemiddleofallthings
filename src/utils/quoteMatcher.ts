import { BookChapter, Meditation, Story, LearnModule } from '../types';
import { PhilosopherQuote, QuoteSourceType } from '../data/philosopherQuotes';
import { Tag } from '../data/tags';
import { expandTags } from './synonymMap';

export interface MatchResult {
  type: QuoteSourceType;
  id: string;
  title: string;
  matchedTags: string[]; // For debugging and analytics
  score: number; // Tag-match strength (0-10+)
}

/**
 * Finds the best matching content for a philosopher quote based on tag overlap
 */
export function findBestMatch(
  quote: PhilosopherQuote,
  chapters: BookChapter[],
  meditations: Meditation[],
  stories: Story[],
  modules: LearnModule[]
): MatchResult | null {
  // Check for manual override first
  if (quote.preferredTargetId && quote.preferredSourceType) {
    const overrideMatch = findContentById(
      quote.preferredTargetId,
      quote.preferredSourceType,
      chapters,
      meditations,
      stories,
      modules
    );
    if (overrideMatch) {
      return {
        type: quote.preferredSourceType,
        id: quote.preferredTargetId,
        title: overrideMatch.title,
        matchedTags: quote.tags,
        score: 10 // High score for manual overrides
      };
    }
  }

  // Expand quote tags with synonyms for better matching
  // Include both primary and secondary tags
  const allQuoteTags = [...quote.tags, ...(quote.secondaryTags || [])];
  const expandedQuoteTags = expandTags(allQuoteTags);
  const quoteTagSet = new Set(expandedQuoteTags);

  let bestMatch: MatchResult | null = null;
  let bestScore = 0;

  // Match against chapters
  for (const chapter of chapters) {
    const chapterTags = chapter.tags || [];
    const chapterTagSet = new Set(chapterTags);
    const matchedTags = expandedQuoteTags.filter(tag => chapterTagSet.has(tag));
    const score = calculateScore(matchedTags, quote.tags.length);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        type: 'book',
        id: chapter.id,
        title: chapter.title,
        matchedTags: matchedTags,
        score: score
      };
    }
  }

  // Match against meditations
  for (const meditation of meditations) {
    // Skip meditations with religion or no-religion tags
    const meditationTags = meditation.tags || [];
    const hasReligionTag = meditationTags.some(tag => 
      tag.toLowerCase() === 'religion' || 
      tag.toLowerCase() === 'no-religion' ||
      tag.toLowerCase() === 'no religion'
    );
    if (hasReligionTag) {
      continue;
    }
    
    const meditationTagSet = new Set(meditationTags);
    const matchedTags = expandedQuoteTags.filter(tag => meditationTagSet.has(tag));
    const score = calculateScore(matchedTags, quote.tags.length);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        type: 'meditation',
        id: meditation.id,
        title: meditation.title,
        matchedTags: matchedTags,
        score: score
      };
    }
  }

  // Match against stories
  for (const story of stories) {
    const storyTags = story.tags || [];
    const storyTagSet = new Set(storyTags);
    const matchedTags = expandedQuoteTags.filter(tag => storyTagSet.has(tag));
    const score = calculateScore(matchedTags, quote.tags.length);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        type: 'story',
        id: story.id,
        title: story.title,
        matchedTags: matchedTags,
        score: score
      };
    }
  }

  // Match against learn modules
  for (const module of modules) {
    const moduleTags = module.tags || [];
    const moduleTagSet = new Set(moduleTags);
    const matchedTags = expandedQuoteTags.filter(tag => moduleTagSet.has(tag));
    const score = calculateScore(matchedTags, quote.tags.length);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        type: 'learn',
        id: module.id,
        title: module.title,
        matchedTags: matchedTags,
        score: score
      };
    }
  }

  // Only return matches with score >= 2 (threshold for weak matches)
  return bestScore >= 2 ? bestMatch : null;
}

/**
 * Calculates a relevance score based on matched tags
 * Score increases with number of matches and proportion of quote tags matched
 */
function calculateScore(matchedTags: string[], totalQuoteTags: number): number {
  if (matchedTags.length === 0) return 0;
  
  // Base score: number of matched tags
  let score = matchedTags.length;
  
  // Bonus for matching a high proportion of quote tags
  const matchRatio = matchedTags.length / Math.max(totalQuoteTags, 1);
  score += matchRatio * 2;
  
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Finds content by ID and type (for manual overrides)
 */
function findContentById(
  id: string,
  type: QuoteSourceType,
  chapters: BookChapter[],
  meditations: Meditation[],
  stories: Story[],
  modules: LearnModule[]
): { title: string } | null {
  switch (type) {
    case 'book':
      const chapter = chapters.find(c => c.id === id);
      return chapter ? { title: chapter.title } : null;
    case 'meditation':
      const meditation = meditations.find(m => m.id === id);
      return meditation ? { title: meditation.title } : null;
    case 'story':
      const story = stories.find(s => s.id === id);
      return story ? { title: story.title } : null;
    case 'learn':
      const module = modules.find(m => m.id === id);
      return module ? { title: module.title } : null;
    default:
      return null;
  }
}

/**
 * Checks if a quote should be shown based on rotation and disabled status
 */
export function shouldShowQuote(
  quote: PhilosopherQuote,
  rotationWindowDays: number = 30
): boolean {
  // Don't show disabled quotes
  if (quote.disabled) {
    return false;
  }

  // If no rotation tracking, allow it
  if (!quote.lastSeenAt) {
    return true;
  }

  // Check if enough time has passed since last seen
  const lastSeen = new Date(quote.lastSeenAt);
  const now = new Date();
  const daysSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);

  // If shown too recently, skip it
  if (daysSinceLastSeen < rotationWindowDays) {
    return false;
  }

  // Check frequency count (throttle overused quotes)
  if (quote.showCount && quote.showCount > 10) {
    // If shown more than 10 times, require longer rotation window
    return daysSinceLastSeen >= rotationWindowDays * 2;
  }

  return true;
}

