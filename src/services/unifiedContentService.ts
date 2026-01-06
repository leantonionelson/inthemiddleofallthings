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

export type AudioStatus = 'ok' | 'pending' | 'failed' | 'none';

type AudioManifestItem = {
  collection?: string;
  contentId?: string;
  slug?: string;
  status?: string;
};

type AudioManifest = {
  version?: number;
  ttsVersion?: string;
  generatedAt?: string;
  items?: Record<string, AudioManifestItem>;
};

class UnifiedContentService {
  // Legacy WAV index cache (kept for backward compatibility with meditations/stories if present)
  private audioIndexCache: Map<ContentType, any> = new Map();
  private audioIndexLoadPromise: Promise<void> | null = null;
  private userVoicePreference: 'male' | 'female' = 'female';

  // New MP3 manifest (public/audio/audio-manifest.json)
  private audioManifest: AudioManifest | null = null;
  private audioManifestLoadPromise: Promise<void> | null = null;

  constructor() {
    this.loadUserVoicePreference();
    // Start loading indexes immediately
    this.ensureIndexesLoaded();
    // Start loading MP3 manifest immediately (best effort)
    this.ensureManifestLoaded();
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

  private async ensureManifestLoaded(): Promise<void> {
    if (this.audioManifestLoadPromise) {
      return this.audioManifestLoadPromise;
    }
    this.audioManifestLoadPromise = this.loadAudioManifest();
    return this.audioManifestLoadPromise;
  }

  private async loadAudioManifest(): Promise<void> {
    try {
      const res = await fetch('/audio/audio-manifest.json');
      if (!res.ok) {
        this.audioManifest = null;
        return;
      }
      this.audioManifest = (await res.json()) as AudioManifest;
    } catch {
      this.audioManifest = null;
    }
  }

  private getManifestKey(contentId: string, contentType: ContentType): string {
    const collectionMap: Record<ContentType, 'book' | 'meditations' | 'stories'> = {
      chapter: 'book',
      meditation: 'meditations',
      story: 'stories',
    };
    return `${collectionMap[contentType]}/${contentId}`;
  }

  /**
   * Load all legacy WAV audio indexes (best-effort).
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
   * Audio status is used for UX messaging.
   * - ok: playable now (MP3 ok OR WAV fallback available)
   * - pending: not playable yet, but scheduled for generation (MP3 manifest says pending)
   * - failed: generation failed (MP3 manifest says failed)
   * - none: not in manifest and no WAV fallback found
   */
  async getAudioStatus(contentId: string, contentType: ContentType): Promise<AudioStatus> {
    if (!contentId || contentId.trim() === '') {
      return 'none';
    }

    await this.ensureManifestLoaded();

    const key = this.getManifestKey(contentId, contentType);
    const entry = this.audioManifest?.items?.[key];
    const entryStatus = (entry?.status ?? '').toLowerCase();

    if (entryStatus === 'ok') return 'ok';

    // Fallback to legacy WAV if it exists (mainly for meditations/stories).
    const wavOk = await this.hasWavAudio(contentId, contentType);
    if (wavOk) return 'ok';

    if (entryStatus === 'pending') return 'pending';
    if (entryStatus === 'failed') return 'failed';

    return 'none';
  }

  /**
   * Check if audio is available for a content item
   */
  async hasAudio(contentId: string, contentType: ContentType): Promise<boolean> {
    const status = await this.getAudioStatus(contentId, contentType);
    return status === 'ok';
  }

  /**
   * Get audio URL for a content item
   */
  async getAudioUrl(contentId: string, contentType: ContentType): Promise<string | null> {
    if (!contentId || contentId.trim() === '') return null;

    await this.ensureManifestLoaded();
    const key = this.getManifestKey(contentId, contentType);
    const entry = this.audioManifest?.items?.[key];
    if ((entry?.status ?? '').toLowerCase() === 'ok') {
      const collectionMap: Record<ContentType, 'book' | 'meditations' | 'stories'> = {
        chapter: 'book',
        meditation: 'meditations',
        story: 'stories',
      };
      return `/audio/${collectionMap[contentType]}/${contentId}.mp3`;
    }

    // Legacy fallback (if any WAVs exist for this content type).
    return await this.getWavAudioUrl(contentId, contentType);
  }

  /**
   * Get audio info for a content item
   */
  async getAudioInfo(contentId: string, contentType: ContentType): Promise<AudioInfo> {
    const hasAudio = await this.hasAudio(contentId, contentType);
    if (!hasAudio) return { hasAudio: false };

    const audioUrl = await this.getAudioUrl(contentId, contentType);
    return {
      hasAudio: true,
      audioUrl: audioUrl || undefined,
      voiceType: this.userVoicePreference,
    };
  }

  /**
   * Legacy WAV helpers (best-effort).
   */
  private async hasWavAudio(contentId: string, contentType: ContentType): Promise<boolean> {
    await this.ensureIndexesLoaded();

    const index = this.audioIndexCache.get(contentType);
    if (!index) return false;

    const items = index.chapters || index.items || [];

    let audioFile = `${contentId}_${this.userVoicePreference}.wav`;
    let found = items.some((item: any) => item.audioFile === audioFile && item.hasAudio);
    if (!found) {
      audioFile = `${contentId}_female.wav`;
      found = items.some((item: any) => item.audioFile === audioFile && item.hasAudio);
    }
    if (!found) {
      audioFile = `${contentId}_male.wav`;
      found = items.some((item: any) => item.audioFile === audioFile && item.hasAudio);
    }

    return found;
  }

  private async getWavAudioUrl(contentId: string, contentType: ContentType): Promise<string | null> {
    await this.ensureIndexesLoaded();

    const index = this.audioIndexCache.get(contentType);
    if (!index) return null;

    const items = index.chapters || index.items || [];
    const pluralMap = {
      chapter: 'chapters',
      meditation: 'meditations',
      story: 'stories',
    } as const;
    const pluralType = pluralMap[contentType];

    let audioFile = `${contentId}_${this.userVoicePreference}.wav`;
    let found = items.find((item: any) => item.audioFile === audioFile && item.hasAudio);
    if (!found) {
      audioFile = `${contentId}_female.wav`;
      found = items.find((item: any) => item.audioFile === audioFile && item.hasAudio);
    }
    if (!found) {
      audioFile = `${contentId}_male.wav`;
      found = items.find((item: any) => item.audioFile === audioFile && item.hasAudio);
    }

    if (!found) return null;
    return `/media/audio/${pluralType}/${found.audioFile}`;
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

















