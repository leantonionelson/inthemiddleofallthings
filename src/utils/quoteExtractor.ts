import { BookChapter, Meditation, Story, LearnModule } from '../types';
import { Tag } from '../data/tags';
import { philosopherQuotes, PhilosopherQuote, QuoteCategory } from '../data/philosopherQuotes';
import { findBestMatch, shouldShowQuote, MatchResult } from './quoteMatcher';
import { logQuoteShown } from './quoteAnalytics';
import { expandTags } from './synonymMap';

// Fallback priority matrix for quota filling
const FALLBACK_PRIORITY: Record<string, string[]> = {
  classical: ['modern', 'poet-mystic'],
  modern: ['classical', 'poet-mystic'],
  'poet-mystic': ['modern', 'classical'],
  physics: ['complexity', 'consciousness'],
  complexity: ['physics', 'consciousness'],
  consciousness: ['physics', 'complexity'],
  book: ['meditation', 'story'],
  meditation: ['book', 'story'],
  story: ['book', 'meditation'],
};

// Quota configuration with min/max bounds
const QUOTA_CONFIG: Record<string, { target: number; min: number; max: number }> = {
  book: { target: 0.35, min: 0.30, max: 0.40 },
  meditation: { target: 0.15, min: 0.10, max: 0.20 },
  story: { target: 0.05, min: 0.03, max: 0.08 },
  classical: { target: 0.10, min: 0.08, max: 0.12 },
  modern: { target: 0.10, min: 0.08, max: 0.12 },
  'poet-mystic': { target: 0.05, min: 0.04, max: 0.06 },
  physics: { target: 0.10, min: 0.08, max: 0.12 },
  complexity: { target: 0.05, min: 0.04, max: 0.06 },
  consciousness: { target: 0.05, min: 0.04, max: 0.06 },
};

// Density multipliers to normalize quote density across content types
const DENSITY_MULTIPLIERS: Record<string, number> = {
  book: 1.0,
  meditation: 0.6,
  story: 0.4,
};

// Category and author caps
const MAX_PER_CATEGORY = 8; // per shuffle
const MAX_PER_AUTHOR = 3;

// Fixed session size for quota calculation
// This ensures consistent 55/25/20 ratio regardless of total pool size
const SESSION_SIZE = 40; // Number of cards to generate per session

export type QuoteSourceType = 'book' | 'meditation' | 'story' | 'learn';

export interface QuoteSource {
  type: QuoteSourceType;
  id: string; // Source ID for navigation
  title: string;
  author?: string; // Philosopher/scientist name
  score?: number; // Tag-match strength from quoteMatcher
  subtitle?: string; // For book chapters
  part?: string; // For book chapters
  chapter?: string; // For book chapters
}

export interface QuoteCard {
  id: string;
  quote: string;
  source: QuoteSource;
  gradient: string;
  matchedTags?: string[]; // For analytics/debugging
}

// Cache for extracted quotes to avoid reprocessing
const quoteCache = new Map<string, QuoteCard[]>();

// Generate cache key from content IDs
function generateCacheKey(chapters: BookChapter[], meditations: Meditation[], stories: Story[]): string {
  const chapterIds = chapters.map(c => c.id).join(',');
  const meditationIds = meditations.map(m => m.id).join(',');
  const storyIds = stories.map(s => s.id).join(',');
  return `${chapters.length}-${meditations.length}-${stories.length}-${chapterIds.slice(0, 50)}-${meditationIds.slice(0, 50)}-${storyIds.slice(0, 50)}`;
}

// Remove markdown formatting from text (optimized single-pass regex)
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*|\*/g, '') // Remove bold and italics in one pass
    .replace(/^#+\s|^>\s|^-\s/gm, '') // Remove headers, blockquotes, and list markers in one pass
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

// Get fallback categories for a given category
function getFallbackCategories(category: string): string[] {
  return FALLBACK_PRIORITY[category] || [];
}

// Calculate rotation weight for a quote (lower showCount and older lastSeenOrder = higher weight)
function calculateRotationWeight(quote: PhilosopherQuote, order: number): number {
  const showCount = quote.showCount || 0;
  const lastSeenOrder = quote.lastSeenOrder ?? -1; // -1 means never seen
  const ageWeight = lastSeenOrder < 0 ? 1 : 1 / (Math.abs(order - lastSeenOrder) + 1);
  const frequencyWeight = 1 / (showCount + 1);
  return ageWeight * frequencyWeight;
}

// Calculate quota targets based on fixed session size, respecting min/max bounds
// This ensures consistent 55/25/20 ratio every session
function calculateQuotaTargets(sessionSize: number = SESSION_SIZE): Record<string, number> {
  const targets: Record<string, number> = {};
  
  for (const [category, config] of Object.entries(QUOTA_CONFIG)) {
    const target = Math.floor(sessionSize * config.target);
    const min = Math.floor(sessionSize * config.min);
    const max = Math.floor(sessionSize * config.max);
    targets[category] = Math.max(min, Math.min(max, target));
  }
  
  return targets;
}

// Sample quotes with quota system, rotation weighting, and caps
function sampleQuotesWithQuota(
  categorizedQuotes: Record<string, QuoteCard[]>,
  targets: Record<string, number>,
  globalOrder: number
): QuoteCard[] {
  const sampled: QuoteCard[] = [];
  const authorCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  
  // Initialize counts
  for (const category of Object.keys(QUOTA_CONFIG)) {
    categoryCounts[category] = 0;
  }
  
  // Sample from each category
  for (const [category, target] of Object.entries(targets)) {
    const available = categorizedQuotes[category] || [];
    if (available.length === 0) {
      // Log in dev if category is empty
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Category "${category}" has no available quotes (target: ${target})`);
      }
      continue;
    }
    
    // Pool is already density-adjusted during extraction
    const pool = [...available];
    
    // Calculate rotation weights for philosopher quotes
    let weightedPool: { card: QuoteCard; weight: number }[] = [];
    if (['classical', 'modern', 'poet-mystic', 'physics', 'complexity', 'consciousness'].includes(category)) {
      weightedPool = pool.map((card, idx) => {
        // Only external quotes have author field
        if (card.source.author) {
          const quote = philosopherQuotes.find(q => q.id === card.id);
          const weight = quote ? calculateRotationWeight(quote, globalOrder + idx) : 1;
          return { card, weight };
        }
        return { card, weight: 1 };
      });
    } else {
      // Own quotes - no rotation weighting needed
      weightedPool = pool.map(card => ({ card, weight: 1 }));
    }
    
    // Sample with rotation weighting
    // Use target directly (not capped by MAX_PER_CATEGORY) to ensure quota is met
    let sampledFromCategory = 0;
    const targetCount = target; // Use full target to meet quota requirements
    
    while (sampledFromCategory < targetCount && weightedPool.length > 0) {
      // Weighted random selection
      const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      
      let selectedIndex = 0;
      for (let i = 0; i < weightedPool.length; i++) {
        random -= weightedPool[i].weight;
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }
      
      const selected = weightedPool[selectedIndex];
      const author = selected.card.source.author;
      
      // Check author cap
      if (author && (authorCounts[author] || 0) >= MAX_PER_AUTHOR) {
        weightedPool.splice(selectedIndex, 1);
        continue;
      }
      
      sampled.push(selected.card);
      sampledFromCategory++;
      categoryCounts[category]++;
      
      if (author) {
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      }
      
      // Remove selected from pool
      weightedPool.splice(selectedIndex, 1);
    }
  }
  
  // Fill remaining slots using fallback priority
  const totalSampled = sampled.length;
  const totalTarget = Object.values(targets).reduce((sum, t) => sum + t, 0);
  const remaining = Math.max(0, totalTarget - totalSampled);
  
  if (remaining > 0) {
    // Try to fill from fallback categories
    for (const [category, target] of Object.entries(targets)) {
      const current = categoryCounts[category] || 0;
      const needed = target - current;
      
      if (needed > 0) {
        const fallbacks = getFallbackCategories(category);
        for (const fallbackCategory of fallbacks) {
          const fallbackPool = categorizedQuotes[fallbackCategory] || [];
          if (fallbackPool.length === 0) continue;
          
          const available = fallbackPool.filter(card => {
            const author = card.source.author;
            return !author || (authorCounts[author] || 0) < MAX_PER_AUTHOR;
          });
          
          if (available.length > 0) {
            // Fill exactly what's needed to meet quota (don't cap with MAX_PER_CATEGORY during fallback)
            const toAdd = Math.min(needed, available.length);
            const selected = shuffleArray(available).slice(0, toAdd);
            
            for (const card of selected) {
              sampled.push(card);
              categoryCounts[fallbackCategory] = (categoryCounts[fallbackCategory] || 0) + 1;
              if (card.source.author) {
                authorCounts[card.source.author] = (authorCounts[card.source.author] || 0) + 1;
              }
            }
            
            if (sampled.length >= totalTarget) break;
          }
        }
      }
    }
  }
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    const resultsByCategory: Record<string, { target: number; actual: number; percentage: string }> = {};
    for (const [category, target] of Object.entries(targets)) {
      const actual = categoryCounts[category] || 0;
      const total = sampled.length;
      const percentage = total > 0 ? ((actual / total) * 100).toFixed(1) + '%' : '0%';
      resultsByCategory[category] = { target, actual, percentage };
    }
    
    // Calculate high-level ratios
    const internalTotal = (categoryCounts.book || 0) + (categoryCounts.meditation || 0) + (categoryCounts.story || 0);
    const philosopherTotal = (categoryCounts.classical || 0) + (categoryCounts.modern || 0) + (categoryCounts['poet-mystic'] || 0);
    const scientistTotal = (categoryCounts.physics || 0) + (categoryCounts.complexity || 0) + (categoryCounts.consciousness || 0);
    
    console.group('📊 Quote Quota Distribution');
    console.log('\n🎯 High-Level Ratios:');
    console.table({
      'Your Quotes (Target: 55%)': {
        'Target': '55%',
        'Actual': ((internalTotal / sampled.length) * 100).toFixed(1) + '%',
        'Count': internalTotal,
        'Breakdown': `Book: ${categoryCounts.book || 0}, Meditation: ${categoryCounts.meditation || 0}, Story: ${categoryCounts.story || 0}`
      },
      'Philosophers (Target: 25%)': {
        'Target': '25%',
        'Actual': ((philosopherTotal / sampled.length) * 100).toFixed(1) + '%',
        'Count': philosopherTotal,
        'Breakdown': `Classical: ${categoryCounts.classical || 0}, Modern: ${categoryCounts.modern || 0}, Poets: ${categoryCounts['poet-mystic'] || 0}`
      },
      'Scientists (Target: 20%)': {
        'Target': '20%',
        'Actual': ((scientistTotal / sampled.length) * 100).toFixed(1) + '%',
        'Count': scientistTotal,
        'Breakdown': `Physics: ${categoryCounts.physics || 0}, Complexity: ${categoryCounts.complexity || 0}, Consciousness: ${categoryCounts.consciousness || 0}`
      }
    });
    
    console.log('\n📋 Detailed Category Breakdown:');
    console.table(resultsByCategory);
    console.log(`\n✅ Total Cards Generated: ${sampled.length} (Target: ${SESSION_SIZE})`);
    console.groupEnd();
  }
  
  return sampled;
}

// Generate quote cards from all content with quota-based sampling
// Always shuffles fresh for variety, even if content is cached
export function generateQuoteCards(
  chapters: BookChapter[],
  meditations: Meditation[],
  stories: Story[],
  modules: LearnModule[] = [],
  options: { generateAll?: boolean } = {}
): QuoteCard[] {
  // Check cache for categorized quotes (to avoid reprocessing)
  const cacheKey = generateCacheKey(chapters, meditations, stories);
  let categorizedQuotes: Record<string, QuoteCard[]> = {};
  
  if (quoteCache.has(cacheKey)) {
    // Reconstruct categorized quotes from cache
    const cachedCards = quoteCache.get(cacheKey)!;
    categorizedQuotes = categorizeQuotes(cachedCards, chapters, meditations, stories, modules);
  } else {
    // Extract and categorize all quotes
    categorizedQuotes = extractAndCategorizeQuotes(chapters, meditations, stories, modules);
    
    // Flatten for caching
    const allCards: QuoteCard[] = [];
    for (const cards of Object.values(categorizedQuotes)) {
      allCards.push(...cards);
    }
    
    // Cache the categorized quotes (limit cache size to prevent memory issues)
    if (quoteCache.size > 10) {
      // Remove oldest entry (simple FIFO)
      const firstKey = quoteCache.keys().next().value;
      if (firstKey) {
        quoteCache.delete(firstKey);
      }
    }
    quoteCache.set(cacheKey, allCards);
  }

  // If generateAll is true, return all quotes shuffled
  if (options.generateAll) {
    const allCards: QuoteCard[] = [];
    for (const cards of Object.values(categorizedQuotes)) {
      allCards.push(...cards);
    }
    
    // Update rotation tracking for philosopher quotes
    let orderCounter = 0;
    for (const card of allCards) {
      if (card.source.author) {
        const quote = philosopherQuotes.find(q => q.id === card.id);
        if (quote) {
          quote.lastSeenAt = new Date().toISOString();
          quote.lastSeenOrder = orderCounter++;
          quote.showCount = (quote.showCount || 0) + 1;
          
          // Log quote shown via analytics
          logQuoteShown(
            quote.id,
            quote.author,
            card.source.type,
            card.source.id,
            card.source.score,
            card.matchedTags
          );
        }
      }
    }
    
    // Shuffle all cards for variety
    return shuffleArray(allCards);
  }

  // Calculate quota targets based on fixed session size
  // This ensures consistent 55/25/20 ratio every session
  const targets = calculateQuotaTargets(SESSION_SIZE);
  
  // Sample quotes with quota system
  const globalOrder = Date.now(); // Use timestamp for rotation ordering
  const sampledCards = sampleQuotesWithQuota(categorizedQuotes, targets, globalOrder);
  
  // Update rotation tracking for philosopher quotes
  let orderCounter = 0;
  for (const card of sampledCards) {
    if (card.source.author) {
      const quote = philosopherQuotes.find(q => q.id === card.id);
      if (quote) {
        quote.lastSeenAt = new Date().toISOString();
        quote.lastSeenOrder = orderCounter++;
        quote.showCount = (quote.showCount || 0) + 1;
        
        // Log quote shown via analytics
        logQuoteShown(
          quote.id,
          quote.author,
          card.source.type,
          card.source.id,
          card.source.score,
          card.matchedTags
        );
      }
    }
  }
  
  // Always shuffle fresh for variety - never return cached shuffle order
  return shuffleArray(sampledCards);
}

// Extract and categorize all quotes from content
function extractAndCategorizeQuotes(
  chapters: BookChapter[],
  meditations: Meditation[],
  stories: Story[],
  modules: LearnModule[]
): Record<string, QuoteCard[]> {
  const categorized: Record<string, QuoteCard[]> = {
    book: [],
    meditation: [],
    story: [],
    classical: [],
    modern: [],
    'poet-mystic': [],
    physics: [],
    complexity: [],
    consciousness: [],
  };
  
  // Extract from chapters (apply density multiplier)
  for (const chapter of chapters) {
    const quotes = extractFromChapter(chapter);
    // Apply density multiplier by sampling
    const multiplier = DENSITY_MULTIPLIERS.book;
    const sampledQuotes = multiplier < 1.0 
      ? shuffleArray(quotes).slice(0, Math.ceil(quotes.length * multiplier))
      : quotes;
    
    for (const quote of sampledQuotes) {
      categorized.book.push({
        id: `${chapter.id}-${categorized.book.length}`,
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
  
  // Extract from meditations (apply density multiplier)
  for (const meditation of meditations) {
    const quotes = extractFromMeditation(meditation);
    const multiplier = DENSITY_MULTIPLIERS.meditation;
    const sampledQuotes = multiplier < 1.0 
      ? shuffleArray(quotes).slice(0, Math.ceil(quotes.length * multiplier))
      : quotes;
    
    for (const quote of sampledQuotes) {
      categorized.meditation.push({
        id: `${meditation.id}-${categorized.meditation.length}`,
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
  
  // Extract from stories (apply density multiplier)
  for (const story of stories) {
    const quotes = extractFromStory(story);
    const multiplier = DENSITY_MULTIPLIERS.story;
    const sampledQuotes = multiplier < 1.0 
      ? shuffleArray(quotes).slice(0, Math.ceil(quotes.length * multiplier))
      : quotes;
    
    for (const quote of sampledQuotes) {
      categorized.story.push({
        id: `${story.id}-${categorized.story.length}`,
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
  
  // Track usage of each content item to promote diversity
  const contentUsageCount: Record<string, number> = {};
  
  // Helper to get usage key
  const getUsageKey = (type: string, id: string) => `${type}:${id}`;
  
  // Helper to find diverse match (prefers less-used content)
  const findDiverseMatch = (
    quote: PhilosopherQuote,
    chapters: BookChapter[],
    meditations: Meditation[],
    stories: Story[],
    modules: LearnModule[]
  ): MatchResult | null => {
    // Get all matches with scores >= 2
    const allMatches: (MatchResult & { usageCount: number })[] = [];
    
    // Expand quote tags
    const allQuoteTags = [...quote.tags, ...(quote.secondaryTags || [])];
    const expandedQuoteTags = expandTags(allQuoteTags);
    const quoteTagSet = new Set(expandedQuoteTags);
    
    // Collect matches from all content types
    for (const chapter of chapters) {
      const chapterTags = chapter.tags || [];
      const chapterTagSet = new Set(chapterTags);
      const matchedTags = expandedQuoteTags.filter(tag => chapterTagSet.has(tag));
      const score = calculateMatchScore(matchedTags, quote.tags.length);
      if (score >= 2) {
        const key = getUsageKey('book', chapter.id);
        allMatches.push({
          type: 'book',
          id: chapter.id,
          title: chapter.title,
          matchedTags,
          score,
          usageCount: contentUsageCount[key] || 0
        });
      }
    }
    
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
      const score = calculateMatchScore(matchedTags, quote.tags.length);
      if (score >= 2) {
        const key = getUsageKey('meditation', meditation.id);
        allMatches.push({
          type: 'meditation',
          id: meditation.id,
          title: meditation.title,
          matchedTags,
          score,
          usageCount: contentUsageCount[key] || 0
        });
      }
    }
    
    for (const story of stories) {
      const storyTags = story.tags || [];
      const storyTagSet = new Set(storyTags);
      const matchedTags = expandedQuoteTags.filter(tag => storyTagSet.has(tag));
      const score = calculateMatchScore(matchedTags, quote.tags.length);
      if (score >= 2) {
        const key = getUsageKey('story', story.id);
        allMatches.push({
          type: 'story',
          id: story.id,
          title: story.title,
          matchedTags,
          score,
          usageCount: contentUsageCount[key] || 0
        });
      }
    }
    
    for (const module of modules) {
      const moduleTags = module.tags || [];
      const moduleTagSet = new Set(moduleTags);
      const matchedTags = expandedQuoteTags.filter(tag => moduleTagSet.has(tag));
      const score = calculateMatchScore(matchedTags, quote.tags.length);
      if (score >= 2) {
        const key = getUsageKey('learn', module.id);
        allMatches.push({
          type: 'learn',
          id: module.id,
          title: module.title,
          matchedTags,
          score,
          usageCount: contentUsageCount[key] || 0
        });
      }
    }
    
    if (allMatches.length === 0) return null;
    
    // Sort by: lower usage first, then higher score
    allMatches.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return a.usageCount - b.usageCount;
      }
      return b.score - a.score;
    });
    
    // Select from top matches (within 0.5 score points of best, or top 3)
    const bestScore = allMatches[0].score;
    const threshold = bestScore - 0.5;
    const candidates = allMatches.filter(m => m.score >= threshold).slice(0, 3);
    
    // Randomly select from candidates to add variety
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Update usage count
    const key = getUsageKey(selected.type, selected.id);
    contentUsageCount[key] = (contentUsageCount[key] || 0) + 1;
    
    return {
      type: selected.type,
      id: selected.id,
      title: selected.title,
      matchedTags: selected.matchedTags,
      score: selected.score
    };
  };
  
  // Helper function to calculate match score (same as in quoteMatcher)
  const calculateMatchScore = (matchedTags: string[], totalQuoteTags: number): number => {
    if (matchedTags.length === 0) return 0;
    let score = matchedTags.length;
    const matchRatio = matchedTags.length / Math.max(totalQuoteTags, 1);
    score += matchRatio * 2;
    return Math.round(score * 10) / 10;
  };

  // Add philosopher quotes (categorized by their category field)
  for (const quote of philosopherQuotes) {
    // Check if quote should be shown (rotation, disabled)
    if (!shouldShowQuote(quote)) {
      continue;
    }

    // Check for manual override first
    let match: MatchResult | null = null;
    if (quote.preferredTargetId && quote.preferredSourceType) {
      // Use findBestMatch for manual overrides
      match = findBestMatch(quote, chapters, meditations, stories, modules);
    } else {
      // Use diverse matching for automatic matches
      match = findDiverseMatch(quote, chapters, meditations, stories, modules);
    }
    
    // Only include if relevance score meets threshold (score >= 2)
    if (!match || match.score < 2) {
      continue;
    }

    // Create quote card
    const card: QuoteCard = {
      id: quote.id,
      quote: quote.quote,
      source: {
        type: match.type,
        id: match.id,
        title: match.title,
        author: quote.author,
        score: match.score
      },
      gradient: generateGradient(),
      matchedTags: match.matchedTags
    };

    // Categorize by quote's category field
    const category = quote.category;
    if (categorized[category]) {
      categorized[category].push(card);
    }
  }
  
  return categorized;
}

// Reconstruct categorized quotes from cached cards
function categorizeQuotes(
  cachedCards: QuoteCard[],
  chapters: BookChapter[],
  meditations: Meditation[],
  stories: Story[],
  modules: LearnModule[]
): Record<string, QuoteCard[]> {
  const categorized: Record<string, QuoteCard[]> = {
    book: [],
    meditation: [],
    story: [],
    classical: [],
    modern: [],
    'poet-mystic': [],
    physics: [],
    complexity: [],
    consciousness: [],
  };
  
  for (const card of cachedCards) {
    if (card.source.author) {
      // External quote - find its category
      const quote = philosopherQuotes.find(q => q.id === card.id);
      if (quote) {
        const category = quote.category;
        if (categorized[category]) {
          categorized[category].push(card);
        }
      }
    } else {
      // Own quote - categorize by source type
      const type = card.source.type;
      if (type === 'book' && categorized.book) {
        categorized.book.push(card);
      } else if (type === 'meditation' && categorized.meditation) {
        categorized.meditation.push(card);
      } else if (type === 'story' && categorized.story) {
        categorized.story.push(card);
      }
    }
  }
  
  return categorized;
}

// Clear quote cache (useful for testing or memory management)
export function clearQuoteCache(): void {
  quoteCache.clear();
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

// Development-only diagnostic function to analyze quote counts
export interface QuoteDiagnostics {
  internal: {
    book: { raw: number; afterDensity: number; sources: number };
    meditation: { raw: number; afterDensity: number; sources: number };
    story: { raw: number; afterDensity: number; sources: number };
    total: { raw: number; afterDensity: number };
  };
  external: {
    classical: number;
    modern: number;
    'poet-mystic': number;
    physics: number;
    complexity: number;
    consciousness: number;
    total: number;
  };
  totals: {
    allQuotes: number;
    allQuotesAfterDensity: number;
  };
  quotaTargets: Record<string, { target: number; min: number; max: number; actual?: number }>;
}

/**
 * Development-only function to diagnose quote counts by category
 * Only available when NODE_ENV === 'development'
 */
export async function diagnoseQuoteCounts(
  chapters: BookChapter[],
  meditations: Meditation[],
  stories: Story[],
  modules: LearnModule[] = []
): Promise<QuoteDiagnostics | null> {
  // Only available in development
  if (process.env.NODE_ENV !== 'development') {
    console.warn('diagnoseQuoteCounts is only available in development mode');
    return null;
  }

  // Extract quotes from internal content (before density multipliers)
  const bookQuotesRaw: string[] = [];
  const meditationQuotesRaw: string[] = [];
  const storyQuotesRaw: string[] = [];

  // Extract from chapters
  for (const chapter of chapters) {
    const quotes = extractFromChapter(chapter);
    bookQuotesRaw.push(...quotes);
  }

  // Extract from meditations
  for (const meditation of meditations) {
    const quotes = extractFromMeditation(meditation);
    meditationQuotesRaw.push(...quotes);
  }

  // Extract from stories
  for (const story of stories) {
    const quotes = extractFromStory(story);
    storyQuotesRaw.push(...quotes);
  }

  // Apply density multipliers
  const bookQuotesAfterDensity = bookQuotesRaw.length; // 1.0 multiplier
  const meditationQuotesAfterDensity = Math.ceil(meditationQuotesRaw.length * DENSITY_MULTIPLIERS.meditation);
  const storyQuotesAfterDensity = Math.ceil(storyQuotesRaw.length * DENSITY_MULTIPLIERS.story);

  // Count external quotes by category
  const externalCounts: Record<string, number> = {
    classical: 0,
    modern: 0,
    'poet-mystic': 0,
    physics: 0,
    complexity: 0,
    consciousness: 0,
  };

  for (const quote of philosopherQuotes) {
    if (!shouldShowQuote(quote)) continue;
    const match = findBestMatch(quote, chapters, meditations, stories, modules);
    if (match && match.score >= 2) {
      externalCounts[quote.category]++;
    }
  }

  const totalExternal = Object.values(externalCounts).reduce((sum, count) => sum + count, 0);
  const totalInternalAfterDensity = bookQuotesAfterDensity + meditationQuotesAfterDensity + storyQuotesAfterDensity;
  const totalAllQuotesAfterDensity = totalInternalAfterDensity + totalExternal;

  // Calculate quota targets based on fixed session size
  const targets = calculateQuotaTargets(SESSION_SIZE);
  const quotaTargets: Record<string, { target: number; min: number; max: number; actual?: number }> = {};
  for (const [category, config] of Object.entries(QUOTA_CONFIG)) {
    quotaTargets[category] = {
      target: targets[category] || 0,
      min: Math.floor(totalAllQuotesAfterDensity * config.min),
      max: Math.floor(totalAllQuotesAfterDensity * config.max),
    };
  }

  const diagnostics: QuoteDiagnostics = {
    internal: {
      book: {
        raw: bookQuotesRaw.length,
        afterDensity: bookQuotesAfterDensity,
        sources: chapters.length,
      },
      meditation: {
        raw: meditationQuotesRaw.length,
        afterDensity: meditationQuotesAfterDensity,
        sources: meditations.length,
      },
      story: {
        raw: storyQuotesRaw.length,
        afterDensity: storyQuotesAfterDensity,
        sources: stories.length,
      },
      total: {
        raw: bookQuotesRaw.length + meditationQuotesRaw.length + storyQuotesRaw.length,
        afterDensity: totalInternalAfterDensity,
      },
    },
    external: {
      classical: externalCounts.classical,
      modern: externalCounts.modern,
      'poet-mystic': externalCounts['poet-mystic'],
      physics: externalCounts.physics,
      complexity: externalCounts.complexity,
      consciousness: externalCounts.consciousness,
      total: totalExternal,
    },
    totals: {
      allQuotes: bookQuotesRaw.length + meditationQuotesRaw.length + storyQuotesRaw.length + totalExternal,
      allQuotesAfterDensity: totalAllQuotesAfterDensity,
    },
    quotaTargets,
  };

  // Log detailed diagnostics
  console.group('📊 Quote Diagnostics');
  console.log('\n📚 Internal Quotes:');
  console.table({
    'Book': {
      'Raw Quotes': diagnostics.internal.book.raw,
      'After Density (1.0x)': diagnostics.internal.book.afterDensity,
      'Sources (Chapters)': diagnostics.internal.book.sources,
      'Avg Quotes/Chapter': (diagnostics.internal.book.raw / diagnostics.internal.book.sources).toFixed(1),
    },
    'Meditation': {
      'Raw Quotes': diagnostics.internal.meditation.raw,
      'After Density (0.6x)': diagnostics.internal.meditation.afterDensity,
      'Sources (Meditations)': diagnostics.internal.meditation.sources,
      'Avg Quotes/Meditation': (diagnostics.internal.meditation.raw / diagnostics.internal.meditation.sources).toFixed(1),
    },
    'Story': {
      'Raw Quotes': diagnostics.internal.story.raw,
      'After Density (0.4x)': diagnostics.internal.story.afterDensity,
      'Sources (Stories)': diagnostics.internal.story.sources,
      'Avg Quotes/Story': (diagnostics.internal.story.raw / diagnostics.internal.story.sources).toFixed(1),
    },
  });

  console.log('\n🌍 External Quotes:');
  console.table({
    'Classical': { 'Count': diagnostics.external.classical, 'Available': philosopherQuotes.filter(q => q.category === 'classical').length },
    'Modern': { 'Count': diagnostics.external.modern, 'Available': philosopherQuotes.filter(q => q.category === 'modern').length },
    'Poet-Mystic': { 'Count': diagnostics.external['poet-mystic'], 'Available': philosopherQuotes.filter(q => q.category === 'poet-mystic').length },
    'Physics': { 'Count': diagnostics.external.physics, 'Available': philosopherQuotes.filter(q => q.category === 'physics').length },
    'Complexity': { 'Count': diagnostics.external.complexity, 'Available': philosopherQuotes.filter(q => q.category === 'complexity').length },
    'Consciousness': { 'Count': diagnostics.external.consciousness, 'Available': philosopherQuotes.filter(q => q.category === 'consciousness').length },
  });

  console.log('\n🎯 Quota Targets (based on total pool after density):');
  console.table(
    Object.entries(quotaTargets).map(([category, config]) => ({
      Category: category,
      'Target Count': config.target,
      'Min Count': config.min,
      'Max Count': config.max,
      'Target %': ((config.target / totalAllQuotesAfterDensity) * 100).toFixed(1) + '%',
    }))
  );

  console.log('\n📈 Summary:');
  console.table({
    'Total Raw Internal Quotes': diagnostics.internal.total.raw,
    'Total Internal (After Density)': diagnostics.internal.total.afterDensity,
    'Total External (Available)': diagnostics.external.total,
    'Total Pool (After Density)': diagnostics.totals.allQuotesAfterDensity,
    'Internal %': ((diagnostics.internal.total.afterDensity / diagnostics.totals.allQuotesAfterDensity) * 100).toFixed(1) + '%',
    'External %': ((diagnostics.external.total / diagnostics.totals.allQuotesAfterDensity) * 100).toFixed(1) + '%',
  });

  console.groupEnd();

  return diagnostics;
}

