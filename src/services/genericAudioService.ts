/**
 * Generic Audio Service for handling all content types (book chapters, meditations, stories)
 * This service provides consistent voice selection logic across all content types
 */

interface AudioIndex {
  generated: number;
  type?: string;
  voiceType?: string;
  voice?: string;
  chapters?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    part?: string;
    chapterNumber?: number;
    audioFile: string;
    hasAudio: boolean;
  }>;
  items?: Array<{
    id: string;
    title: string;
    type?: string;
    audioFile: string;
    hasAudio: boolean;
  }>;
}

interface AudioMetadata {
  audioUrl: string;
  duration: number;
  wordTimings?: number[];
}

interface ContentItem {
  id: string;
  title: string;
  content: string;
  type?: string;
  part?: string;
}

class GenericAudioService {
  private audioIndexes: Map<string, AudioIndex> = new Map();
  private audioCache: Map<string, AudioMetadata> = new Map();
  private userVoicePreference: 'male' | 'female' = 'female';

  constructor() {
    this.loadUserVoicePreference();
    // Load audio indexes asynchronously
    this.loadAudioIndexes().then(() => {
      console.log('🔍 GenericAudioService: Audio indexes loaded successfully');
    }).catch((error) => {
      console.error('🔍 GenericAudioService: Failed to load audio indexes:', error);
    });
    console.log('🔍 GenericAudioService: Constructor called, loading audio indexes...');
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
   * Load audio indexes for all content types
   */
  private async loadAudioIndexes(): Promise<void> {
    console.log('🔍 GenericAudioService: Loading audio indexes for:', ['chapters', 'meditations', 'stories']);
    const contentTypes = ['chapters', 'meditations', 'stories'];
    
    for (const contentType of contentTypes) {
      try {
        console.log(`🔍 GenericAudioService: Fetching /media/audio/${contentType}/index.json`);
        const response = await fetch(`/media/audio/${contentType}/index.json`);
        if (response.ok) {
          const index = await response.json();
          this.audioIndexes.set(contentType, index);
          console.log(`📄 Loaded ${contentType} audio index with ${this.getIndexItems(index).length} items`);
        } else {
          console.log(`📄 No ${contentType} audio index found (Status: ${response.status})`);
        }
      } catch (error) {
        console.log(`📄 Could not load ${contentType} audio index:`, error);
      }
    }
  }

  /**
   * Get items from audio index (handles both chapters and items arrays)
   */
  private getIndexItems(index: AudioIndex): Array<{audioFile: string; hasAudio: boolean}> {
    return index.chapters || index.items || [];
  }

  /**
   * Get content type from item
   */
  private getContentType(item: ContentItem): string {
    console.log('🔍 getContentType called with:', {
      id: item.id,
      type: item.type,
      part: item.part
    });
    
    // Check explicit type first
    if (item.type === 'meditation') {
      console.log('🔍 Content type: meditations (from type)');
      return 'meditations';
    }
    if (item.type === 'story') {
      console.log('🔍 Content type: stories (from type)');
      return 'stories';
    }
    
    // Check part property for meditations and stories
    if (item.part === 'Meditation') {
      console.log('🔍 Content type: meditations (from part)');
      return 'meditations';
    }
    if (item.part === 'Story') {
      console.log('🔍 Content type: stories (from part)');
      return 'stories';
    }
    
    console.log('🔍 Content type: chapters (default)');
    return 'chapters'; // Default to chapters for book content
  }

  /**
   * Check if a pre-generated audio file exists for this content
   */
  async hasPreGeneratedAudio(item: ContentItem): Promise<boolean> {
    const contentType = this.getContentType(item);
    const audioIndex = this.audioIndexes.get(contentType);
    
    console.log(`🔍 DEBUG: Checking audio for item:`, {
      id: item.id,
      title: item.title,
      type: item.type,
      part: item.part,
      contentType,
      hasIndex: !!audioIndex,
      indexItems: audioIndex ? this.getIndexItems(audioIndex).length : 0,
      availableIndexes: Array.from(this.audioIndexes.keys())
    });
    
    if (!audioIndex) {
      console.log(`🔍 No audio index loaded for ${contentType}`);
      return false;
    }

    console.log(`🔍 Checking for pre-generated audio: ${item.title} (ID: ${item.id}, Voice: ${this.userVoicePreference}, Type: ${contentType})`);
    
    // Look for user's selected voice first
    let expectedFileName = `${item.id}_${this.userVoicePreference}.wav`;
    let indexEntry = this.getIndexItems(audioIndex).find(c => c.audioFile === expectedFileName);
    console.log(`🔍 Looking for selected voice: ${expectedFileName} - ${indexEntry ? 'Found' : 'Not found'}`);
    
    // Fallback to female voice if selected voice doesn't exist
    if (!indexEntry) {
      expectedFileName = `${item.id}_female.wav`;
      indexEntry = this.getIndexItems(audioIndex).find(c => c.audioFile === expectedFileName);
      console.log(`🔍 Fallback to female: ${expectedFileName} - ${indexEntry ? 'Found' : 'Not found'}`);
    }
    
    const hasAudio = indexEntry?.hasAudio || false;
    console.log(`🔍 Final result: ${hasAudio ? 'Has pre-generated audio' : 'No pre-generated audio'}`);
    return hasAudio;
  }

  /**
   * Get pre-generated audio for content
   */
  async getPreGeneratedAudio(item: ContentItem): Promise<AudioMetadata | null> {
    console.log('🔍 getPreGeneratedAudio called with:', item);
    
    const contentType = this.getContentType(item);
    const cacheKey = `${contentType}_${item.id}_${this.userVoicePreference}`;

    // Check memory cache first
    if (this.audioCache.has(cacheKey)) {
      console.log(`🎯 Using cached pre-generated audio for: ${item.title} (${this.userVoicePreference})`);
      return this.audioCache.get(cacheKey)!;
    }

    // Check if we have this content in our index
    let audioIndex = this.audioIndexes.get(contentType);
    if (!audioIndex) {
      console.log(`🔍 No audio index for ${contentType}, available indexes:`, Array.from(this.audioIndexes.keys()));
      // Try to reload the audio index
      await this.loadAudioIndexes();
      audioIndex = this.audioIndexes.get(contentType);
      if (!audioIndex) {
        console.log(`🔍 Still no audio index for ${contentType} after reload`);
        return null;
      }
    }
    
    console.log(`🔍 Audio index found for ${contentType}, items:`, this.getIndexItems(audioIndex!).length);

    // Look for user's selected voice first
    let expectedFileName = `${item.id}_${this.userVoicePreference}.wav`;
    let indexEntry = this.getIndexItems(audioIndex!).find(c => c.audioFile === expectedFileName);
    console.log(`🔍 Looking for selected voice: ${expectedFileName} - ${indexEntry ? 'Found' : 'Not found'}`);
    
    // Fallback to female voice if selected voice doesn't exist
    if (!indexEntry) {
      expectedFileName = `${item.id}_female.wav`;
      indexEntry = this.getIndexItems(audioIndex!).find(c => c.audioFile === expectedFileName);
      console.log(`🔍 Fallback to female: ${expectedFileName} - ${indexEntry ? 'Found' : 'Not found'}`);
    }
    
    if (!indexEntry?.hasAudio) {
      console.log(`🔍 No audio entry found or hasAudio is false for ${item.title}`);
      return null;
    }

    const audioUrl = `/media/audio/${contentType}/${indexEntry.audioFile}`;
    const duration = 0; // We'll get this from the audio element when it loads

    const audioMetadata: AudioMetadata = {
      audioUrl,
      duration
    };

    // Cache the result
    this.audioCache.set(cacheKey, audioMetadata);
    
    console.log(`🎵 Found pre-generated audio: ${audioUrl}`);
    return audioMetadata;
  }
}

// Export singleton instance
let instance: GenericAudioService | null = null;

export const getGenericAudioService = (): GenericAudioService => {
  if (!instance) {
    instance = new GenericAudioService();
  }
  return instance;
};
