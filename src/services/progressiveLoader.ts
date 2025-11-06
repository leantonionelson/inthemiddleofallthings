import { BookChapter, Meditation, Story } from '../types';

/**
 * Progressive content loader service
 * Loads content in batches to avoid blocking the UI on initial load
 */

export interface LoadProgress {
  chaptersLoaded: number;
  chaptersTotal: number;
  meditationsLoaded: number;
  meditationsTotal: number;
  storiesLoaded: number;
  storiesTotal: number;
  isComplete: boolean;
}

type ProgressCallback = (progress: LoadProgress) => void;

class ProgressiveLoaderService {
  private static instance: ProgressiveLoaderService;
  
  // Content storage
  private chapters: BookChapter[] = [];
  private meditations: Meditation[] = [];
  private stories: Story[] = [];
  
  // Loading state
  private isLoading = false;
  private loadingPromise: Promise<void> | null = null;
  private progressCallbacks: ProgressCallback[] = [];
  
  // Configuration
  private readonly INITIAL_BATCH_SIZE = 5; // Load just 5 items initially
  private readonly BACKGROUND_BATCH_SIZE = 10; // Load 10 at a time in background
  private readonly BATCH_DELAY_MS = 50; // Small delay between batches
  
  private constructor() {}
  
  public static getInstance(): ProgressiveLoaderService {
    if (!ProgressiveLoaderService.instance) {
      ProgressiveLoaderService.instance = new ProgressiveLoaderService();
    }
    return ProgressiveLoaderService.instance;
  }
  
  /**
   * Subscribe to loading progress updates
   */
  public onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all subscribers of progress
   */
  private notifyProgress(chaptersTotal: number, meditationsTotal: number, storiesTotal: number): void {
    const progress: LoadProgress = {
      chaptersLoaded: this.chapters.length,
      chaptersTotal,
      meditationsLoaded: this.meditations.length,
      meditationsTotal,
      storiesLoaded: this.stories.length,
      storiesTotal,
      isComplete: this.chapters.length === chaptersTotal && 
                  this.meditations.length === meditationsTotal && 
                  this.stories.length === storiesTotal
    };
    
    this.progressCallbacks.forEach(callback => callback(progress));
  }
  
  /**
   * Load initial batch of content quickly
   * Returns a small set of content to display immediately
   */
  public async loadInitialContent(
    loadChaptersFn: () => Promise<BookChapter[]>,
    loadMeditationsFn: () => Promise<Meditation[]>,
    loadStoriesFn: () => Promise<Story[]>
  ): Promise<{ chapters: BookChapter[]; meditations: Meditation[]; stories: Story[] }> {
    // If already loaded, return what we have
    if (this.chapters.length > 0 || this.meditations.length > 0 || this.stories.length > 0) {
      return {
        chapters: this.chapters,
        meditations: this.meditations,
        stories: this.stories
      };
    }
    
    // Start loading all content in parallel, but only return initial batch
    const [allChapters, allMeditations, allStories] = await Promise.all([
      loadChaptersFn(),
      loadMeditationsFn(),
      loadStoriesFn()
    ]);
    
    // Take initial batch
    this.chapters = allChapters.slice(0, this.INITIAL_BATCH_SIZE);
    this.meditations = allMeditations.slice(0, this.INITIAL_BATCH_SIZE);
    this.stories = allStories.slice(0, this.INITIAL_BATCH_SIZE);
    
    // Notify progress
    this.notifyProgress(allChapters.length, allMeditations.length, allStories.length);
    
    // Start background loading for the rest
    this.loadRemainingInBackground(allChapters, allMeditations, allStories);
    
    return {
      chapters: this.chapters,
      meditations: this.meditations,
      stories: this.stories
    };
  }
  
  /**
   * Load remaining content in the background progressively
   */
  private async loadRemainingInBackground(
    allChapters: BookChapter[],
    allMeditations: Meditation[],
    allStories: Story[]
  ): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    // Calculate what's left to load
    const remainingChapters = allChapters.slice(this.INITIAL_BATCH_SIZE);
    const remainingMeditations = allMeditations.slice(this.INITIAL_BATCH_SIZE);
    const remainingStories = allStories.slice(this.INITIAL_BATCH_SIZE);
    
    // Load in batches with delays to avoid blocking UI
    let chapterIndex = 0;
    let meditationIndex = 0;
    let storyIndex = 0;
    
    while (
      chapterIndex < remainingChapters.length ||
      meditationIndex < remainingMeditations.length ||
      storyIndex < remainingStories.length
    ) {
      // Load next batch of each type
      if (chapterIndex < remainingChapters.length) {
        const nextBatch = remainingChapters.slice(chapterIndex, chapterIndex + this.BACKGROUND_BATCH_SIZE);
        this.chapters.push(...nextBatch);
        chapterIndex += nextBatch.length;
      }
      
      if (meditationIndex < remainingMeditations.length) {
        const nextBatch = remainingMeditations.slice(meditationIndex, meditationIndex + this.BACKGROUND_BATCH_SIZE);
        this.meditations.push(...nextBatch);
        meditationIndex += nextBatch.length;
      }
      
      if (storyIndex < remainingStories.length) {
        const nextBatch = remainingStories.slice(storyIndex, storyIndex + this.BACKGROUND_BATCH_SIZE);
        this.stories.push(...nextBatch);
        storyIndex += nextBatch.length;
      }
      
      // Notify progress
      this.notifyProgress(allChapters.length, allMeditations.length, allStories.length);
      
      // Small delay before next batch
      await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY_MS));
    }
    
    this.isLoading = false;
  }
  
  /**
   * Get currently loaded content
   */
  public getLoadedContent(): { chapters: BookChapter[]; meditations: Meditation[]; stories: Story[] } {
    return {
      chapters: this.chapters,
      meditations: this.meditations,
      stories: this.stories
    };
  }
  
  /**
   * Check if loading is complete
   */
  public isLoadingComplete(): boolean {
    return !this.isLoading;
  }
  
  /**
   * Clear all loaded content (useful for testing)
   */
  public clear(): void {
    this.chapters = [];
    this.meditations = [];
    this.stories = [];
    this.isLoading = false;
    this.loadingPromise = null;
    this.progressCallbacks = [];
  }
}

export const progressiveLoader = ProgressiveLoaderService.getInstance();

