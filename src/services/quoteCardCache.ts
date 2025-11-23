import { QuoteCard } from '../utils/quoteExtractor';

const STORAGE_KEY = 'quoteCardsCache';
const CACHE_VERSION = 2; // Incremented to invalidate old cache without quota system
const CACHE_VERSION_KEY = 'quoteCardsCacheVersion';

/**
 * Quote Card Cache Service
 * Persists quote cards to localStorage for fast loading
 * Optimized with batched writes to reduce localStorage operations
 */
class QuoteCardCacheService {
  private static instance: QuoteCardCacheService;
  private pendingWrites: QuoteCard[] | null = null;
  private writeTimer: NodeJS.Timeout | null = null;
  private readonly WRITE_DEBOUNCE_MS = 500; // Batch writes every 500ms

  private constructor() {}

  public static getInstance(): QuoteCardCacheService {
    if (!QuoteCardCacheService.instance) {
      QuoteCardCacheService.instance = new QuoteCardCacheService();
    }
    return QuoteCardCacheService.instance;
  }

  /**
   * Get cached quote cards from localStorage
   */
  public getCachedCards(): QuoteCard[] | null {
    try {
      // Check cache version
      const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (cachedVersion !== String(CACHE_VERSION)) {
        this.clearCache();
        return null;
      }

      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const cards = JSON.parse(data) as QuoteCard[];
      return cards.length > 0 ? cards : null;
    } catch (error) {
      console.error('Error loading cached quote cards:', error);
      return null;
    }
  }

  /**
   * Save quote cards to localStorage (batched for performance)
   */
  public saveCards(cards: QuoteCard[]): void {
    this.pendingWrites = cards;
    
    // Debounce writes to batch multiple saves
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }
    
    this.writeTimer = setTimeout(() => {
      if (this.pendingWrites) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.pendingWrites));
          localStorage.setItem(CACHE_VERSION_KEY, String(CACHE_VERSION));
          this.pendingWrites = null;
        } catch (error) {
          console.error('Error saving quote cards to cache:', error);
          // If quota exceeded, try to clear old cache
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            this.clearCache();
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.pendingWrites));
              localStorage.setItem(CACHE_VERSION_KEY, String(CACHE_VERSION));
              this.pendingWrites = null;
            } catch (retryError) {
              console.error('Error saving after cache clear:', retryError);
            }
          }
        }
      }
      this.writeTimer = null;
    }, this.WRITE_DEBOUNCE_MS);
  }

  /**
   * Force immediate save (bypasses batching)
   */
  public saveCardsImmediate(cards: QuoteCard[]): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.pendingWrites = null;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      localStorage.setItem(CACHE_VERSION_KEY, String(CACHE_VERSION));
    } catch (error) {
      console.error('Error saving quote cards to cache:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearCache();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
          localStorage.setItem(CACHE_VERSION_KEY, String(CACHE_VERSION));
        } catch (retryError) {
          console.error('Error saving after cache clear:', retryError);
        }
      }
    }
  }

  /**
   * Get a random subset of cached cards
   */
  public getRandomSubset(count: number = 20): QuoteCard[] {
    const allCards = this.getCachedCards();
    if (!allCards || allCards.length === 0) return [];

    // Shuffle and return subset
    const shuffled = [...allCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Merge new cards with existing cache (avoid duplicates)
   */
  public mergeCards(newCards: QuoteCard[]): QuoteCard[] {
    const existing = this.getCachedCards() || [];
    const existingIds = new Set(existing.map(c => c.id));
    
    // Add only new cards
    const uniqueNewCards = newCards.filter(c => !existingIds.has(c.id));
    const merged = [...existing, ...uniqueNewCards];
    
    this.saveCards(merged);
    return merged;
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CACHE_VERSION_KEY);
    } catch (error) {
      console.error('Error clearing quote card cache:', error);
    }
  }

  /**
   * Check if cache exists
   */
  public hasCache(): boolean {
    return this.getCachedCards() !== null;
  }
}

export const quoteCardCache = QuoteCardCacheService.getInstance();

