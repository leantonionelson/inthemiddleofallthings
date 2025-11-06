import { BookChapter, Meditation, Story } from '../types';
import { progressiveLoader } from './progressiveLoader';

/**
 * Content cache service to store loaded content in memory
 * Prevents reloading content when navigating back to pages
 * Now integrates with progressive loader for optimized initial load
 */
class ContentCacheService {
  private static instance: ContentCacheService;
  
  private chaptersCache: BookChapter[] | null = null;
  private meditationsCache: Meditation[] | null = null;
  private storiesCache: Story[] | null = null;
  
  private chaptersLoading: Promise<BookChapter[]> | null = null;
  private meditationsLoading: Promise<Meditation[]> | null = null;
  private storiesLoading: Promise<Story[]> | null = null;

  private constructor() {}

  public static getInstance(): ContentCacheService {
    if (!ContentCacheService.instance) {
      ContentCacheService.instance = new ContentCacheService();
    }
    return ContentCacheService.instance;
  }

  /**
   * Get cached chapters or load them if not cached
   * Checks progressive loader first for already-loaded content
   */
  public async getChapters(
    loadFn: () => Promise<BookChapter[]>
  ): Promise<BookChapter[]> {
    // Return cached if available
    if (this.chaptersCache !== null) {
      return this.chaptersCache;
    }

    // Check if progressive loader has content
    const loadedContent = progressiveLoader.getLoadedContent();
    if (loadedContent.chapters.length > 0) {
      this.chaptersCache = loadedContent.chapters;
      return loadedContent.chapters;
    }

    // If already loading, return the existing promise
    if (this.chaptersLoading !== null) {
      return this.chaptersLoading;
    }

    // Start loading
    this.chaptersLoading = loadFn().then(chapters => {
      this.chaptersCache = chapters;
      this.chaptersLoading = null;
      return chapters;
    });

    return this.chaptersLoading;
  }

  /**
   * Get cached meditations or load them if not cached
   * Checks progressive loader first for already-loaded content
   */
  public async getMeditations(
    loadFn: () => Promise<Meditation[]>
  ): Promise<Meditation[]> {
    // Return cached if available
    if (this.meditationsCache !== null) {
      return this.meditationsCache;
    }

    // Check if progressive loader has content
    const loadedContent = progressiveLoader.getLoadedContent();
    if (loadedContent.meditations.length > 0) {
      this.meditationsCache = loadedContent.meditations;
      return loadedContent.meditations;
    }

    // If already loading, return the existing promise
    if (this.meditationsLoading !== null) {
      return this.meditationsLoading;
    }

    // Start loading
    this.meditationsLoading = loadFn().then(meditations => {
      this.meditationsCache = meditations;
      this.meditationsLoading = null;
      return meditations;
    });

    return this.meditationsLoading;
  }

  /**
   * Get cached stories or load them if not cached
   * Checks progressive loader first for already-loaded content
   */
  public async getStories(
    loadFn: () => Promise<Story[]>
  ): Promise<Story[]> {
    // Return cached if available
    if (this.storiesCache !== null) {
      return this.storiesCache;
    }

    // Check if progressive loader has content
    const loadedContent = progressiveLoader.getLoadedContent();
    if (loadedContent.stories.length > 0) {
      this.storiesCache = loadedContent.stories;
      return loadedContent.stories;
    }

    // If already loading, return the existing promise
    if (this.storiesLoading !== null) {
      return this.storiesLoading;
    }

    // Start loading
    this.storiesLoading = loadFn().then(stories => {
      this.storiesCache = stories;
      this.storiesLoading = null;
      return stories;
    });

    return this.storiesLoading;
  }

  /**
   * Check if chapters are cached
   */
  public hasChapters(): boolean {
    return this.chaptersCache !== null;
  }

  /**
   * Check if meditations are cached
   */
  public hasMeditations(): boolean {
    return this.meditationsCache !== null;
  }

  /**
   * Check if stories are cached
   */
  public hasStories(): boolean {
    return this.storiesCache !== null;
  }

  /**
   * Clear all caches (useful for testing or forced refresh)
   */
  public clearCache(): void {
    this.chaptersCache = null;
    this.meditationsCache = null;
    this.storiesCache = null;
    this.chaptersLoading = null;
    this.meditationsLoading = null;
    this.storiesLoading = null;
  }

  /**
   * Clear specific cache
   */
  public clearChaptersCache(): void {
    this.chaptersCache = null;
    this.chaptersLoading = null;
  }

  public clearMeditationsCache(): void {
    this.meditationsCache = null;
    this.meditationsLoading = null;
  }

  public clearStoriesCache(): void {
    this.storiesCache = null;
    this.storiesLoading = null;
  }
}

export const contentCache = ContentCacheService.getInstance();

