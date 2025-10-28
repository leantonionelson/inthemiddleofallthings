/**
 * Unified Content and Audio Service
 * Handles all content types (chapters, meditations, stories) and their audio in one place
 */

export type ContentType = 'chapter' | 'meditation' | 'story';

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  part?: string;
  tags?: string[];
  chapterNumber?: number;
  totalChapters?: number;
}

export interface AudioInfo {
  hasAudio: boolean;
  audioUrl?: string;
  voiceType?: 'male' | 'female';
}

class UnifiedContentService {
  private audioIndexCache: Map<ContentType, any> = new Map();
  private audioIndexLoadPromise: Promise<void> | null = null;
  private userVoicePreference: 'male' | 'female' = 'female';

  constructor() {
    this.loadUserVoicePreference();
    // Start loading indexes immediately
    this.ensureIndexesLoaded();
  }

  /**
   * Load user's voice preference from localStorage
   */
  private loadUserVoicePreference(): void {
    const saved = localStorage.getItem('voicePreference');
    if (saved === 'male' || saved === 'female') {
      this.userVoicePreference = saved;
    }
  }

  /**
   * Ensure audio indexes are loaded (call this before any audio operations)
   */
  private async ensureIndexesLoaded(): Promise<void> {
    if (this.audioIndexLoadPromise) {
      return this.audioIndexLoadPromise;
    }

    this.audioIndexLoadPromise = this.loadAllAudioIndexes();
    return this.audioIndexLoadPromise;
  }

  /**
   * Load all audio indexes
   */
  private async loadAllAudioIndexes(): Promise<void> {
    console.log('📦 UnifiedContentService: Loading all audio indexes...');
    
    const contentTypes: ContentType[] = ['chapter', 'meditation', 'story'];
    const pluralMap = {
      chapter: 'chapters',
      meditation: 'meditations',
      story: 'stories'
    };

    for (const contentType of contentTypes) {
      try {
        const pluralType = pluralMap[contentType];
        const url = `/media/audio/${pluralType}/index.json`;
        console.log(`📦 Fetching: ${url}`);
        
        const response = await fetch(url);
        if (response.ok) {
          const index = await response.json();
          this.audioIndexCache.set(contentType, index);
          
          const items = index.chapters || index.items || [];
          console.log(`✅ Loaded ${contentType} audio index: ${items.length} items`);
        } else {
          console.log(`⚠️  No audio index for ${contentType} (${response.status})`);
        }
      } catch (error) {
        console.error(`❌ Failed to load ${contentType} audio index:`, error);
      }
    }

    console.log('📦 All audio indexes loaded successfully');
  }

  /**
   * Check if audio is available for a content item
   */
  async hasAudio(contentId: string, contentType: ContentType): Promise<boolean> {
    // Ensure indexes are loaded
    await this.ensureIndexesLoaded();

    if (!contentId || contentId.trim() === '') {
      console.log('⚠️  No content ID provided');
      return false;
    }

    const index = this.audioIndexCache.get(contentType);
    if (!index) {
      console.log(`⚠️  No audio index for ${contentType}`);
      return false;
    }

    const items = index.chapters || index.items || [];
    
    // Check for user's preferred voice first
    let audioFile = `${contentId}_${this.userVoicePreference}.wav`;
    let found = items.some((item: any) => item.audioFile === audioFile && item.hasAudio);
    
    if (!found) {
      // Fallback to female voice
      audioFile = `${contentId}_female.wav`;
      found = items.some((item: any) => item.audioFile === audioFile && item.hasAudio);
    }
    
    if (!found) {
      // Fallback to male voice
      audioFile = `${contentId}_male.wav`;
      found = items.some((item: any) => item.audioFile === audioFile && item.hasAudio);
    }

    console.log(`🔍 Audio check for ${contentType}/${contentId}: ${found ? 'AVAILABLE' : 'NOT FOUND'}`);
    return found;
  }

  /**
   * Get audio URL for a content item
   */
  async getAudioUrl(contentId: string, contentType: ContentType): Promise<string | null> {
    // Ensure indexes are loaded
    await this.ensureIndexesLoaded();

    if (!contentId || contentId.trim() === '') {
      return null;
    }

    const index = this.audioIndexCache.get(contentType);
    if (!index) {
      return null;
    }

    const items = index.chapters || index.items || [];
    const pluralMap = {
      chapter: 'chapters',
      meditation: 'meditations',
      story: 'stories'
    };
    const pluralType = pluralMap[contentType];
    
    // Check for user's preferred voice first
    let audioFile = `${contentId}_${this.userVoicePreference}.wav`;
    let found = items.find((item: any) => item.audioFile === audioFile && item.hasAudio);
    
    if (!found) {
      // Fallback to female voice
      audioFile = `${contentId}_female.wav`;
      found = items.find((item: any) => item.audioFile === audioFile && item.hasAudio);
    }
    
    if (!found) {
      // Fallback to male voice
      audioFile = `${contentId}_male.wav`;
      found = items.find((item: any) => item.audioFile === audioFile && item.hasAudio);
    }

    if (found) {
      const url = `/media/audio/${pluralType}/${found.audioFile}`;
      console.log(`🎵 Audio URL: ${url}`);
      return url;
    }

    return null;
  }

  /**
   * Get audio info for a content item
   */
  async getAudioInfo(contentId: string, contentType: ContentType): Promise<AudioInfo> {
    const hasAudio = await this.hasAudio(contentId, contentType);
    if (!hasAudio) {
      return { hasAudio: false };
    }

    const audioUrl = await this.getAudioUrl(contentId, contentType);
    return {
      hasAudio: true,
      audioUrl: audioUrl || undefined,
      voiceType: this.userVoicePreference
    };
  }
}

// Export singleton instance
let instance: UnifiedContentService | null = null;

export const getUnifiedContentService = (): UnifiedContentService => {
  if (!instance) {
    instance = new UnifiedContentService();
  }
  return instance;
};

export default UnifiedContentService;



