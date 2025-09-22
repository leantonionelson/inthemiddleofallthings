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
  duration: number;
  wordTimings: number[];
  isPreGenerated: boolean;
}

class PreGeneratedAudioService {
  private audioIndex: AudioIndex | null = null;
  private audioCache: Map<string, AudioMetadata> = new Map();
  private readonly AUDIO_BASE_PATH = '/media/audio/chapters/';
  private readonly INDEX_PATH = '/media/audio/chapters/index.json';
  private userVoicePreference: 'male' | 'female' = 'male'; // Default to male voice

  constructor() {
    this.loadUserVoicePreference();
    this.loadAudioIndex();
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
    // Clear cache since we need different audio files now
    this.audioCache.clear();
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
      const response = await fetch(this.INDEX_PATH);
      if (response.ok) {
        this.audioIndex = await response.json();
        console.log(`📄 Loaded audio index with ${this.audioIndex?.chapters.length || 0} chapters`);
      } else {
        console.log('📄 No pre-generated audio index found - will use real-time TTS');
      }
    } catch (error) {
      console.log('📄 Could not load audio index - will use real-time TTS');
    }
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
   * Check if a pre-generated audio file exists for this chapter
   */
  async hasPreGeneratedAudio(chapter: BookChapter): Promise<boolean> {
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
    const cacheKey = this.getChapterId(chapter);

    // Check memory cache first
    if (this.audioCache.has(cacheKey)) {
      console.log(`🎯 Using cached pre-generated audio for: ${chapter.title} (${this.userVoicePreference})`);
      return this.audioCache.get(cacheKey)!;
    }

    // Check if we have this chapter in our index
    if (!this.audioIndex) {
      return null;
    }

    const baseId = chapter.id || `chapter-${chapter.chapterNumber}`;
    
    // Look for voice-specific file with matching voiceType
    const indexEntry = this.audioIndex.chapters.find(c => 
      c.id === baseId && 
      c.voiceType === this.userVoicePreference && 
      c.hasAudio
    );
    
    if (!indexEntry) {
      return null;
    }

    try {
      const audioUrl = this.AUDIO_BASE_PATH + indexEntry.audioFile;
      
      // Verify the file exists and get metadata
      const response = await fetch(audioUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn(`⚠️ Pre-generated audio file not found: ${audioUrl}`);
        return null;
      }

      console.log(`🎵 Loading pre-generated audio: ${chapter.title} (${this.userVoicePreference} voice)`);

      // Create audio element to get duration
      const audio = new Audio(audioUrl);
      const duration = await new Promise<number>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration || this.estimateDuration(chapter.content));
        });
        audio.addEventListener('error', () => {
          resolve(this.estimateDuration(chapter.content));
        });
        // Set a timeout in case the audio doesn't load
        setTimeout(() => {
          resolve(this.estimateDuration(chapter.content));
        }, 5000);
        audio.load();
      });

      // Generate word timings based on estimated reading speed
      const wordTimings = this.generateWordTimings(chapter.content, duration);

      const audioMetadata: AudioMetadata = {
        audioUrl,
        duration,
        wordTimings,
        isPreGenerated: true
      };

      // Cache for future use
      this.audioCache.set(cacheKey, audioMetadata);

      console.log(`✅ Pre-generated audio loaded: ${chapter.title} (${this.userVoicePreference} voice, ${duration.toFixed(1)}s)`);
      
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
    await this.loadAudioIndex();
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
   * Clear memory cache
   */
  clearCache(): void {
    this.audioCache.clear();
    console.log('Pre-generated audio cache cleared');
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
