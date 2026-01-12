/**
 * Service for handling pre-generated audio files
 * This service checks for pre-generated audio files before falling back to real-time TTS
 */

import { BookChapter } from '../types';

interface AudioIndex {
  generated: number;
  voiceType?: string;
  voice?: string;
  chapters: {
    id: string;
    title: string;
    subtitle?: string;
    part: string;
    chapterNumber: number;
    audioFile: string;
    hasAudio: boolean;
    voiceType?: 'male' | 'female';
  }[];
}

interface AudioMetadata {
  audioUrl: string;
  blobUrl?: string; // Blob URL for pre-generated audio
  duration: number;
  wordTimings: number[];
  isPreGenerated: boolean;
}

class PreGeneratedAudioService {
  private audioIndex: AudioIndex | null = null;
  private audioCache: Map<string, AudioMetadata> = new Map();
  private indexLoadPromise: Promise<void>;
  private readonly AUDIO_BASE_PATHS = {
    chapters: '/media/audio/chapters/',
    meditations: '/media/audio/meditations/',
    stories: '/media/audio/stories/'
  };
  private readonly INDEX_PATHS = {
    chapters: '/media/audio/chapters/index.json',
    meditations: '/media/audio/meditations/index.json',
    stories: '/media/audio/stories/index.json'
  };
  private userVoicePreference: 'male' | 'female' = 'male'; // Default to male voice

  constructor() {
    this.loadUserVoicePreference();
    this.indexLoadPromise = this.loadAudioIndex();
  }

  /**
   * Load user's voice preference from localStorage
   */
  private loadUserVoicePreference(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('audioVoicePreference');
      if (saved === 'male' || saved === 'female') {
        this.userVoicePreference = saved;
      }
    }
  }

  /**
   * Set user's voice preference
   */
  setVoicePreference(voice: 'male' | 'female'): void {
    this.userVoicePreference = voice;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('audioVoicePreference', voice);
    }
    // Clear cache and clean up blob URLs since we need different audio files now
    this.clearCache();
    console.log(`🎙️ Voice preference set to: ${voice}`);
  }

  /**
   * Get current voice preference
   */
  getVoicePreference(): 'male' | 'female' {
    return this.userVoicePreference;
  }

  /**
   * Load the audio index to see what pre-generated files are available
   */
  private async loadAudioIndex(): Promise<void> {
    try {
      // Try to load chapters index first (most common)
      const response = await fetch(this.INDEX_PATHS.chapters, {
        headers: { accept: 'application/json' }
      });

      // Vite (and some CDNs) can return index.html with 200 for unknown paths; guard against that.
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        console.log('📄 No chapters audio index found - will use real-time TTS');
        return;
      }

      const raw = await response.text();
      if (raw.trim().startsWith('<')) {
        console.log('📄 Chapters audio index resolved to HTML (likely SPA fallback) - will use real-time TTS');
        return;
      }

      this.audioIndex = JSON.parse(raw) as AudioIndex;
      console.log(`📄 Loaded chapters audio index with ${this.audioIndex?.chapters.length || 0} entries`);
    } catch (error) {
      console.log('📄 Could not load audio index - will use real-time TTS');
    }
  }

  /**
   * Determine content type from chapter part
   */
  private getContentType(chapter: BookChapter): 'chapters' | 'meditations' | 'stories' {
    if (chapter.part?.toLowerCase().includes('meditation')) {
      return 'meditations';
    } else if (chapter.part?.toLowerCase().includes('story')) {
      return 'stories';
    }
    return 'chapters';
  }

  /**
   * Get chapter ID for consistent naming with voice preference
   */
  private getChapterId(chapter: BookChapter): string {
    // Match the ID generation from the script
    const baseId = chapter.id || `chapter-${chapter.chapterNumber}`;
    return `${baseId}_${this.userVoicePreference}`;
  }

  /**
   * Get audio file directly for meditations and stories (no index file)
   */
  private async getDirectAudioFile(chapter: BookChapter, contentType: 'meditations' | 'stories'): Promise<AudioMetadata | null> {
    const baseId = chapter.id || `chapter-${chapter.chapterNumber}`;
    const audioFileName = `${baseId}_${this.userVoicePreference}.wav`;
    const audioUrl = this.AUDIO_BASE_PATHS[contentType] + audioFileName;
    
    console.log(`🔍 Checking direct audio file: ${audioUrl}`);
    
    try {
      // Verify the file exists
      const response = await fetch(audioUrl, { method: 'HEAD' });
      console.log('📡 Direct fetch response:', response.status, response.statusText);
      
      if (!response.ok) {
        console.log(`⚠️ Direct audio file not found: ${audioUrl}`);
        return null;
      }

      console.log(`🎵 Loading direct audio: ${chapter.title} (${this.userVoicePreference} voice)`);

      // Fetch audio file as blob to avoid CORS and cache issues
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
      }
      
      const audioBlob = await audioResponse.blob();
      const blobUrl = URL.createObjectURL(audioBlob);
      console.log('✅ Direct audio blob created, blob URL:', blobUrl);

      // Estimate duration based on content length (actual duration will be set by audioManager)
      // This avoids creating a duplicate Audio element here
      const estimatedDuration = this.estimateDuration(chapter.content);

      // Generate word timings based on estimated reading speed
      const wordTimings = this.generateWordTimings(chapter.content, estimatedDuration);

      const audioMetadata: AudioMetadata = {
        audioUrl,
        blobUrl,
        duration: estimatedDuration, // Will be updated by audioManager when actual duration is known
        wordTimings,
        isPreGenerated: true
      };

      // Cache for future use
      const cacheKey = this.getChapterId(chapter);
      this.audioCache.set(cacheKey, audioMetadata);

      console.log(`✅ Direct audio loaded: ${chapter.title} (${this.userVoicePreference} voice, estimated ${estimatedDuration.toFixed(1)}s)`);
      
      return audioMetadata;

    } catch (error) {
      console.error(`❌ Error loading direct audio for ${chapter.title}:`, error);
      return null;
    }
  }

  /**
   * Check if a pre-generated audio file exists for this chapter
   */
  async hasPreGeneratedAudio(chapter: BookChapter): Promise<boolean> {
    // Wait for index to load before proceeding
    await this.indexLoadPromise;
    
    if (!this.audioIndex) {
      return false;
    }

    const baseId = chapter.id || `chapter-${chapter.chapterNumber}`;
    
    // Look for voice-specific file with matching voiceType
    const indexEntry = this.audioIndex.chapters.find(c => 
      c.id === baseId && 
      c.voiceType === this.userVoicePreference && 
      c.hasAudio
    );
    
    return !!indexEntry;
  }

  /**
   * Get pre-generated audio for a chapter
   */
  async getPreGeneratedAudio(chapter: BookChapter): Promise<AudioMetadata | null> {
    console.log(`🔍 Getting pre-generated audio for: ${chapter.title}, voice preference: ${this.userVoicePreference}`);
    
    // Wait for index to load before proceeding
    await this.indexLoadPromise;
    
    const cacheKey = this.getChapterId(chapter);

    // Check memory cache first
    if (this.audioCache.has(cacheKey)) {
      console.log(`🎯 Using cached pre-generated audio for: ${chapter.title} (${this.userVoicePreference})`);
      return this.audioCache.get(cacheKey)!;
    }

    const contentType = this.getContentType(chapter);
    console.log(`🔍 Content type: ${contentType}`);

    // For meditations and stories, try direct file access since they may not have index files
    if (contentType === 'meditations' || contentType === 'stories') {
      return await this.getDirectAudioFile(chapter, contentType);
    }

    // For chapters, use the index-based approach
    if (!this.audioIndex) {
      console.log('⚠️ Audio index not loaded yet');
      return null;
    }

    const baseId = chapter.id || `chapter-${chapter.chapterNumber}`;
    console.log(`🔍 Looking for chapter: ${baseId}, voice: ${this.userVoicePreference}`);
    
    // Look for voice-specific file with matching voiceType
    const indexEntry = this.audioIndex.chapters.find(c => 
      c.id === baseId && 
      c.voiceType === this.userVoicePreference && 
      c.hasAudio
    );
    
    console.log(`🔍 Index entry found:`, indexEntry);
    
    if (!indexEntry) {
      console.log(`❌ No index entry found for ${baseId} with voice ${this.userVoicePreference}`);
      return null;
    }

    try {
      const audioUrl = this.AUDIO_BASE_PATHS.chapters + indexEntry.audioFile;
      console.log('🔍 Checking pre-generated audio file:', audioUrl);
      
      // Verify the file exists and get metadata
      const response = await fetch(audioUrl, { method: 'HEAD' });
      console.log('📡 Fetch response:', response.status, response.statusText);
      if (!response.ok) {
        console.warn(`⚠️ Pre-generated audio file not found: ${audioUrl}`);
        return null;
      }

      console.log(`🎵 Loading pre-generated audio: ${chapter.title} (${this.userVoicePreference} voice)`);

      // Fetch audio file as blob to avoid CORS and cache issues
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
      }
      
      const audioBlob = await audioResponse.blob();
      const blobUrl = URL.createObjectURL(audioBlob);
      console.log('✅ Audio blob created, blob URL:', blobUrl);

      // Estimate duration based on content length (actual duration will be set by audioManager)
      // This avoids creating a duplicate Audio element here
      const estimatedDuration = this.estimateDuration(chapter.content);

      // Generate word timings based on estimated reading speed
      const wordTimings = this.generateWordTimings(chapter.content, estimatedDuration);

      const audioMetadata: AudioMetadata = {
        audioUrl,
        blobUrl,
        duration: estimatedDuration, // Will be updated by audioManager when actual duration is known
        wordTimings,
        isPreGenerated: true
      };

      // Cache for future use
      this.audioCache.set(cacheKey, audioMetadata);

      console.log(`✅ Pre-generated audio loaded: ${chapter.title} (${this.userVoicePreference} voice, estimated ${estimatedDuration.toFixed(1)}s)`);
      
      return audioMetadata;

    } catch (error) {
      console.error(`❌ Error loading pre-generated audio for ${chapter.title}:`, error);
      return null;
    }
  }

  /**
   * Estimate duration based on text length (fallback)
   */
  private estimateDuration(content: string): number {
    // Average reading speed: ~150 words per minute
    const words = content.split(/\s+/).length;
    const wordsPerMinute = 150;
    return Math.max(1, (words / wordsPerMinute) * 60);
  }

  /**
   * Generate word timings based on estimated reading speed
   */
  private generateWordTimings(content: string, duration: number): number[] {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    if (wordCount === 0) {
      return [0];
    }

    const msPerWord = (duration * 1000) / wordCount;
    return Array.from({ length: wordCount }, (_, i) => i * msPerWord);
  }

  /**
   * Get status of pre-generated audio for all chapters
   */
  async getPreGeneratedStatus(chapters: BookChapter[]): Promise<{
    available: string[];
    missing: string[];
    total: number;
    availableCount: number;
  }> {
    const available: string[] = [];
    const missing: string[] = [];

    for (const chapter of chapters) {
      const hasAudio = await this.hasPreGeneratedAudio(chapter);
      if (hasAudio) {
        available.push(chapter.title);
      } else {
        missing.push(chapter.title);
      }
    }

    return {
      available,
      missing,
      total: chapters.length,
      availableCount: available.length
    };
  }

  /**
   * Refresh the audio index (call if new files have been generated)
   */
  async refreshIndex(): Promise<void> {
    this.audioIndex = null;
    this.audioCache.clear();
    this.indexLoadPromise = this.loadAudioIndex();
    await this.indexLoadPromise;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { indexLoaded: boolean; cachedChapters: number; totalAvailable: number } {
    return {
      indexLoaded: !!this.audioIndex,
      cachedChapters: this.audioCache.size,
      totalAvailable: this.audioIndex?.chapters.length || 0
    };
  }

  /**
   * Clear memory cache and clean up blob URLs
   */
  clearCache(): void {
    // Clean up blob URLs before clearing cache
    for (const [key, metadata] of this.audioCache.entries()) {
      if (metadata.blobUrl) {
        URL.revokeObjectURL(metadata.blobUrl);
      }
    }
    this.audioCache.clear();
    console.log('Pre-generated audio cache cleared and blob URLs cleaned up');
  }
}

// Singleton instance
let serviceInstance: PreGeneratedAudioService | null = null;

export const getPreGeneratedAudioService = (): PreGeneratedAudioService => {
  if (!serviceInstance) {
    serviceInstance = new PreGeneratedAudioService();
  }
  return serviceInstance;
};

export const preGeneratedAudioService = getPreGeneratedAudioService();
export type { AudioMetadata };
