import { GoogleGenAI } from '@google/genai';
import { BookChapter } from '../types';
import { getPreGeneratedAudioService } from './preGeneratedAudio';

interface TTSConfig {
  voiceName: string;
  speakingRate?: number;
}

interface AudioData {
  id: string;
  chapterId: string;
  data: string; // Base64 encoded audio data
  duration: number;
  wordTimings: number[];
  size: number;
  timestamp: number;
  type: string;
}

interface MemoryCacheEntry {
    audioUrl: string;
    duration: number;
    wordTimings: number[];
}

class GeminiTTSService {
  private client: GoogleGenAI | null;
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();
  private readonly API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'AudioCacheDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'audioFiles';
  private preGeneratedService = getPreGeneratedAudioService();

  constructor() {
    this.client = null;
    this.initIndexedDB().then(() => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        (window as any).audioDebug = {
          cacheStatus: () => this.debugCacheStatus(),
          clearCache: () => this.clearCache(),
          getCacheSize: () => this.getCacheSize(),
          clearMemoryCache: () => this.clearMemoryCache()
        };
        console.log('Audio debug methods available on window.audioDebug');
      }
    });
    
    if (this.API_KEY && this.API_KEY !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenAI({
          apiKey: this.API_KEY
        });
        console.log('Gemini TTS initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize Gemini TTS, using mock mode:', error);
        this.client = null;
      }
    } else {
      console.warn('Gemini API key not set. Using mock TTS for development.');
    }
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.error('IndexedDB not available - audio caching will be disabled');
        resolve();
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        console.error('Audio caching will be disabled - audio will not persist between sessions');
        resolve();
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('chapterId', 'chapterId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Audio store created in IndexedDB');
        }
      };
    });
  }

  private getChapterId(chapter: BookChapter): string {
    return `${chapter.title}-${chapter.content.length}`;
  }

  private prepareTextForTTS(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async generateAudioWithGemini(text: string, config: TTSConfig): Promise<ArrayBuffer> {
    try {
      if (!this.client) {
        console.log('Using mock TTS for text:', text.substring(0, 100) + '...');
        console.log('Using voice:', config.voiceName);
        console.warn('⚠️ Gemini client not initialized - this means the API key is missing or invalid');
        
        const sampleRate = 24000;
        const duration = Math.max(2, text.length * 0.05);
        const samples = Math.floor(sampleRate * duration);
        
        const wavBuffer = this.createDemoWavFile(samples, sampleRate);
        return wavBuffer;
      }

      console.log('Generating real TTS audio for text:', text.substring(0, 100) + '...');
      console.log('Using voice:', config.voiceName);
      console.log('API Key available:', !!this.API_KEY);
      
      try {
        const enhancedText = this.prepareTextForTTS(text);
        
        console.log('Calling Gemini TTS API...');
        const speechConfig: any = {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: config.voiceName },
          },
        };
        
        if (config.speakingRate !== undefined) {
          speechConfig.speakingRate = config.speakingRate;
        }
        
        const response = await this.client.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: enhancedText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig,
          },
        });

        console.log('Gemini TTS API response received:', response);

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) {
          console.error('❌ No audio data received from Gemini TTS');
          console.error('Response structure:', JSON.stringify(response, null, 2));
          throw new Error('No audio data received from Gemini TTS');
        }

        console.log('Converting base64 data to audio buffer...');
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        if (bytes.length === 0) {
          console.error('❌ Empty audio data received from Gemini TTS');
          throw new Error('Empty audio data received from Gemini TTS');
        }
        
        console.log('✅ Generated audio data size:', bytes.length, 'bytes');
        
        const wavBuffer = this.createWavFile(bytes.buffer, 24000, 1, 2);
        console.log('✅ WAV file created successfully');
        
        return wavBuffer;
        
      } catch (error) {
        console.error('❌ Error calling Gemini TTS API:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        if (error && typeof error === 'object' && 'error' in error) {
          const apiError = error as any;
          if (apiError.error?.code === 429) {
            console.error('❌ Rate limit exceeded. Daily quota reached.');
            this.recordApiError();
            throw new Error('RATE_LIMIT_EXCEEDED: Daily API quota reached. Please try again tomorrow or upgrade your plan.');
          }
        }
        
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as any).message;
          if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
            console.error('❌ API quota exceeded');
            this.recordApiError();
            throw new Error('QUOTA_EXCEEDED: API quota exceeded. Please check your billing plan.');
          }
        }
        
        console.warn('⚠️ Falling back to simple audio due to API error');
        console.warn('This is why you hear beeps instead of speech');
        
        const fallbackBuffer = this.createFallbackAudio(text);
        return fallbackBuffer;
      }
    } catch (error) {
      console.error('❌ Error generating audio with Gemini TTS:', error);
      throw error;
    }
  }

  private createWavFile(pcmData: ArrayBuffer, sampleRate: number, channels: number, sampleWidth: number): ArrayBuffer {
    const header = new ArrayBuffer(44);
    const headerView = new DataView(header);
    
    // RIFF header
    headerView.setUint32(0, 0x52494646, false); // "RIFF"
    headerView.setUint32(4, 36 + pcmData.byteLength, true); // File size
    headerView.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt chunk
    headerView.setUint32(12, 0x666D7420, false); // "fmt "
    headerView.setUint32(16, 16, true); // Chunk size
    headerView.setUint16(20, 1, true); // Audio format (PCM)
    headerView.setUint16(22, channels, true); // Channels
    headerView.setUint32(24, sampleRate, true); // Sample rate
    headerView.setUint32(28, sampleRate * channels * sampleWidth, true); // Byte rate
    headerView.setUint16(32, channels * sampleWidth, true); // Block align
    headerView.setUint16(34, sampleWidth * 8, true); // Bits per sample
    
    // data chunk
    headerView.setUint32(36, 0x64617461, false); // "data"
    headerView.setUint32(40, pcmData.byteLength, true); // Data size
    
    // Combine header and PCM data
    const combinedBuffer = new ArrayBuffer(header.byteLength + pcmData.byteLength);
    const combinedView = new Uint8Array(combinedBuffer);
    combinedView.set(new Uint8Array(header), 0);
    combinedView.set(new Uint8Array(pcmData), header.byteLength);
    
    return combinedBuffer;
  }

  private createDemoWavFile(samples: number, sampleRate: number): ArrayBuffer {
    // Generate speech-like audio data
    const pcmData = new ArrayBuffer(samples * 2); // 16-bit = 2 bytes per sample
    const audioData = new Int16Array(pcmData);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      const f1 = 200 + 100 * Math.sin(2 * Math.PI * 2 * t);
      const f2 = 800 + 200 * Math.sin(2 * Math.PI * 1.5 * t);
      const f3 = 2400 + 300 * Math.sin(2 * Math.PI * 0.8 * t);
      
      const envelope = Math.exp(-t * 0.5) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t));
      
      const sample = envelope * (
        0.6 * Math.sin(2 * Math.PI * f1 * t) +
        0.3 * Math.sin(2 * Math.PI * f2 * t) +
        0.1 * Math.sin(2 * Math.PI * f3 * t)
      );
      
      audioData[i] = Math.max(-32768, Math.min(32767, sample * 16000));
    }
    
    // Use the centralized WAV creation function
    return this.createWavFile(pcmData, sampleRate, 1, 2);
  }

  private createFallbackAudio(text: string): ArrayBuffer {
    console.log('Creating fallback audio for text:', text.substring(0, 50) + '...');
    
    const sampleRate = 24000;
    const duration = Math.max(1, Math.min(5, text.length * 0.02));
    const samples = Math.floor(sampleRate * duration);
    
    // Generate beep tone data
    const pcmData = new ArrayBuffer(samples * 2); // 16-bit = 2 bytes per sample
    const audioData = new Int16Array(pcmData);
    
    const frequency = 440; // A4 note
    const amplitude = 0.3;
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
      audioData[i] = Math.round(sample * 32767);
    }
    
    // Use the centralized WAV creation function
    return this.createWavFile(pcmData, sampleRate, 1, 2);
  }

  private recordApiError(): void {
    localStorage.setItem('geminiTTS_lastError', Date.now().toString());
  }

  public isApiAvailable(): boolean {
    const lastError = localStorage.getItem('geminiTTS_lastError');
    if (lastError) {
      const errorTime = parseInt(lastError);
      const now = Date.now();
      if (now - errorTime < 3600000) {
        return false;
      }
    }
    return true;
  }

  private async saveToIndexedDB(blob: Blob, chapterId: string, duration: number, wordTimings: number[]): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error('IndexedDB not available - cannot save audio permanently');
        reject(new Error('IndexedDB not available'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const audioRecord: AudioData = {
          id: chapterId,
          chapterId: chapterId,
          data: base64Data,
          duration: duration,
          wordTimings: wordTimings,
          size: blob.size,
          timestamp: Date.now(),
          type: 'audio/wav'
        };
        
        const request = store.put(audioRecord);
        
        request.onsuccess = () => {
          const blobUrl = URL.createObjectURL(blob);
          console.log(`Audio saved to IndexedDB: ${chapterId} (${(blob.size / 1024).toFixed(1)} KB)`);
          
          this.memoryCache.set(chapterId, {
            audioUrl: blobUrl,
            duration: duration,
            wordTimings: wordTimings
          });
          
          resolve(blobUrl);
        };
        
        request.onerror = () => {
          console.error('Error saving to IndexedDB:', request.error);
          reject(request.error);
        };
      };
      
      reader.onerror = () => {
        console.error('Error reading blob data:', reader.error);
        reject(reader.error);
      };
      
      reader.readAsDataURL(blob);
    });
  }



  private async loadFromIndexedDB(chapterId: string): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(chapterId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          try {
            const base64Data = result.data.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: result.type || 'audio/wav' });
            const blobUrl = URL.createObjectURL(blob);
            
            this.memoryCache.set(chapterId, {
              audioUrl: blobUrl,
              duration: result.duration || 0,
              wordTimings: result.wordTimings || []
            });
            
            console.log(`Audio loaded from IndexedDB: ${chapterId}`);
            resolve(blobUrl);
          } catch (error) {
            console.error('Error recreating blob from IndexedDB:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('Error loading from IndexedDB:', request.error);
        resolve(null);
      };
    });
  }



  async generateChapterAudio(chapter: BookChapter, config: TTSConfig = { voiceName: 'Zephyr', speakingRate: 1.15 }): Promise<{
    audioUrl: string;
    duration: number;
    wordTimings: number[];
  }> {
    const chapterId = this.getChapterId(chapter);

    // 1. Check for pre-generated audio first (most efficient)
    try {
      const preGeneratedAudio = await this.preGeneratedService.getPreGeneratedAudio(chapter);
      if (preGeneratedAudio) {
        console.log(`🎵 Using pre-generated audio for chapter: ${chapter.title}`);
        return {
          audioUrl: preGeneratedAudio.audioUrl,
          duration: preGeneratedAudio.duration,
          wordTimings: preGeneratedAudio.wordTimings
        };
      }
    } catch (error) {
      console.warn(`⚠️ Could not load pre-generated audio for ${chapter.title}, falling back to cache/TTS`);
    }

    // 2. Check memory cache (fast)
    if (this.memoryCache.has(chapterId)) {
      const cached = this.memoryCache.get(chapterId);
      if (cached) {
        console.log(`🎯 Using memory cache for chapter: ${chapter.title}`);
        return cached;
      }
    }

    // 3. Check persistent storage (IndexedDB)
    const persistentUrl = await this.loadFromIndexedDB(chapterId);
    if (persistentUrl) {
      console.log(`🎯 Using persistent cache for chapter: ${chapter.title}`);
      const cached = this.memoryCache.get(chapterId);
      if (cached) {
        return cached;
      }
    }

    console.log('🎯 Generating new audio for chapter:', chapter.title);
    console.log('🔧 No pre-generated or cached audio found - calling Gemini TTS API (this will be saved permanently)');

    try {
      const cleanText = this.prepareTextForTTS(chapter.content);
      const maxChunkLength = 5000;
      const chunks = this.splitTextIntoChunks(cleanText, maxChunkLength);
      
      if (chunks.length === 1) {
        console.log('📝 Generating audio for single chunk...');
        const audioBuffer = await this.generateAudioWithGemini(cleanText, config);
        
        // Get actual duration from audio
        const blob = new Blob([audioBuffer], { type: 'audio/wav' });
        const audio = new Audio(URL.createObjectURL(blob));
        const duration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration || Math.max(1, cleanText.length * 0.08));
          });
          audio.addEventListener('error', () => {
            resolve(Math.max(1, cleanText.length * 0.08));
          });
          audio.load();
        });
        
        // Calculate word timings
        const wordsPerMinute = 150;
        const wordCount = Math.max(1, Math.ceil(duration * wordsPerMinute / 60));
        const msPerWord = (duration * 1000) / wordCount;
        const wordTimings = Array.from({ length: wordCount }, (_, i) => i * msPerWord);
        
        // Save to persistent storage
        const audioUrl = await this.saveToIndexedDB(blob, chapterId, duration, wordTimings);
        
        const result = {
          audioUrl,
          duration,
          wordTimings
        };
        
        console.log('✅ Audio generated and saved permanently:', {
          duration,
          wordCount,
          audioSize: audioBuffer.byteLength
        });
        
        return result;
      } else {
        console.log(`📝 Generating audio for ${chunks.length} chunks...`);
        const audioBuffers: ArrayBuffer[] = [];
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`Generating audio chunk ${i + 1}/${chunks.length}`);
          const chunkBuffer = await this.generateAudioWithGemini(chunks[i], config);
          audioBuffers.push(chunkBuffer);
          
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const combinedBuffer = this.combineAudioBuffers(audioBuffers);
        const blob = new Blob([combinedBuffer], { type: 'audio/wav' });
        
        // Get actual duration
        const audio = new Audio(URL.createObjectURL(blob));
        const duration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration || Math.max(1, cleanText.length * 0.08));
          });
          audio.addEventListener('error', () => {
            resolve(Math.max(1, cleanText.length * 0.08));
          });
          audio.load();
        });
        
        const wordsPerMinute = 150;
        const wordCount = Math.max(1, Math.ceil(duration * wordsPerMinute / 60));
        const msPerWord = (duration * 1000) / wordCount;
        const wordTimings = Array.from({ length: wordCount }, (_, i) => i * msPerWord);
        
        const audioUrl = await this.saveToIndexedDB(blob, chapterId, duration, wordTimings);
        
        const result = {
          audioUrl,
          duration,
          wordTimings
        };
        
        console.log('✅ Combined audio generated and saved permanently');
        
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to generate audio for chapter:', chapter.title, error);
      
      if (error instanceof Error) {
        if (error.message.includes('RATE_LIMIT_EXCEEDED') || error.message.includes('QUOTA_EXCEEDED')) {
          throw error;
        }
      }
      
      console.log('⚠️ Using simple fallback due to generation error');
      const fallbackBuffer = this.createFallbackAudio(this.prepareTextForTTS(chapter.content));
      const blob = new Blob([fallbackBuffer], { type: 'audio/wav' });
      
      const estimatedDuration = Math.max(1, chapter.content.length * 0.02);
      const wordTimings = [0];
      
      const audioUrl = await this.saveToIndexedDB(blob, chapterId, estimatedDuration, wordTimings);
      
      const result = {
        audioUrl,
        duration: estimatedDuration,
        wordTimings
      };
      
      return result;
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const sentenceWithPunctuation = trimmedSentence + '.';
      
      if (currentChunk.length + sentenceWithPunctuation.length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = sentenceWithPunctuation;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [text];
  }

  private combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    if (buffers.length === 1) {
      return buffers[0];
    }

    console.log(`Combining ${buffers.length} audio buffers (using first buffer for demo)`);
    return buffers[0];
  }

  async getCachedAudio(chapter: BookChapter): Promise<string | null> {
    const chapterId = this.getChapterId(chapter);
    
    // Check memory cache first
    if (this.memoryCache.has(chapterId)) {
      const cached = this.memoryCache.get(chapterId);
      if (cached) {
        console.log(`Serving audio from memory cache for chapter: ${chapterId}`);
        return cached.audioUrl;
      }
    }

    // Try to load from IndexedDB
    const indexedDbUrl = await this.loadFromIndexedDB(chapterId);
    if (indexedDbUrl) {
      return indexedDbUrl;
    }
    
    return null;
  }

  async isChapterInDB(chapter: BookChapter): Promise<boolean> {
    const chapterId = this.getChapterId(chapter);
    
    // First, check the fast in-memory cache
    if (this.memoryCache.has(chapterId)) {
      return true;
    }
    
    // If not in memory, perform a lightweight DB check
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getKey(chapterId); // Just get the key, not the whole object
      
      request.onsuccess = () => {
        resolve(!!request.result); // Resolve true if key exists, false otherwise
      };
      request.onerror = () => {
        resolve(false); // On error, assume it doesn't exist
      };
    });
  }

  async isAudioCached(chapter: BookChapter): Promise<boolean> {
    return this.isChapterInDB(chapter);
  }

  async isChapterGenerated(chapter: BookChapter): Promise<boolean> {
    return this.isChapterInDB(chapter);
  }

  async getGenerationStatus(chapters: BookChapter[]): Promise<{
    generated: string[];
    notGenerated: string[];
    total: number;
    generatedCount: number;
  }> {
    const generated: string[] = [];
    const notGenerated: string[] = [];
    
    for (const chapter of chapters) {
      const isGenerated = await this.isChapterGenerated(chapter);
      if (isGenerated) {
        generated.push(chapter.title);
      } else {
        notGenerated.push(chapter.title);
      }
    }
    
    return {
      generated,
      notGenerated,
      total: chapters.length,
      generatedCount: generated.length
    };
  }

  async bulkGenerateMissingChapters(
    chapters: BookChapter[], 
    config: TTSConfig = { voiceName: 'Zephyr' },
    onProgress?: (current: number, total: number, chapterTitle: string) => void
  ): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const status = await this.getGenerationStatus(chapters);
    const missingChapters = chapters.filter(chapter => 
      !status.generated.includes(chapter.title)
    );
    
    if (missingChapters.length === 0) {
      console.log('✅ All chapters already generated!');
      return { success: 0, failed: 0, errors: [] };
    }
    
    console.log(`🔄 Starting bulk generation for ${missingChapters.length} chapters...`);
    
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < missingChapters.length; i++) {
      const chapter = missingChapters[i];
      
      try {
        onProgress?.(i + 1, missingChapters.length, chapter.title);
        console.log(`📝 Generating chapter ${i + 1}/${missingChapters.length}: ${chapter.title}`);
        
        await this.generateChapterAudio(chapter, config);
        success++;
        
        if (i < missingChapters.length - 1) {
          console.log('⏳ Waiting 2 seconds before next request...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${chapter.title}: ${errorMessage}`);
        console.error(`❌ Failed to generate ${chapter.title}:`, error);
      }
    }
    
    console.log(`✅ Bulk generation complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
    console.log('Memory cache cleared.');
  }

  getMemoryCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys())
    };
  }

  async debugCacheStatus(): Promise<void> {
    console.log('=== Audio Cache Debug Info ===');
    console.log('Memory cache entries:', this.memoryCache.size);
    console.log('Memory cache keys:', Array.from(this.memoryCache.keys()));
    
    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result;
        console.log('IndexedDB entries:', results.length);
        results.forEach((entry, index) => {
          console.log(`Entry ${index + 1}:`, {
            id: entry.id,
            size: entry.size,
            timestamp: new Date(entry.timestamp).toLocaleString(),
            hasData: !!entry.data
          });
        });
      };
      
      request.onerror = () => {
        console.error('Error reading from IndexedDB:', request.error);
      };
    } else {
      console.log('IndexedDB not initialized');
    }
    
    console.log('=== End Debug Info ===');
  }

  async clearCache() {
    this.memoryCache.forEach(cache => {
      URL.revokeObjectURL(cache.audioUrl);
    });
    
    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    this.memoryCache.clear();
    localStorage.removeItem('geminiTTS_lastError');
    console.log('Audio cache cleared (IndexedDB)');
  }

  getCacheSize(): number {
    return this.memoryCache.size;
  }

  validateApiKey(): { isValid: boolean; message: string } {
    if (!this.API_KEY) {
      return { isValid: false, message: 'No API key configured' };
    }
    
    if (this.API_KEY === 'your_gemini_api_key_here') {
      return { isValid: false, message: 'API key not set - using placeholder value' };
    }
    
    if (this.API_KEY.length < 20) {
      return { isValid: false, message: 'API key appears to be too short' };
    }
    
    if (!this.client) {
      return { isValid: false, message: 'Gemini client failed to initialize with this API key' };
    }
    
    return { isValid: true, message: 'API key appears valid' };
  }

  async testApiKey(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.client) {
        return { success: false, message: 'Gemini client not initialized' };
      }

      console.log('🧪 Testing API key with a simple TTS call...');
      
              const speechConfig: any = {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
          speakingRate: 1.15,
        };
        
        const response = await this.client.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: 'Hello' }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig,
          },
        });

      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        console.log('✅ API key test successful - received audio data');
        return { success: true, message: 'API key is working correctly' };
      } else {
        console.log('❌ API key test failed - no audio data received');
        return { success: false, message: 'No audio data received from API' };
      }
    } catch (error) {
      console.error('❌ API key test failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `API call failed: ${errorMessage}` };
    }
  }

  async testTTS(testText: string = "In the middle of all things, we find ourselves becoming. This is not a destination, but a way of being."): Promise<boolean> {
    try {
      console.log('🧪 Testing Gemini TTS service...');
      console.log('API Key configured:', !!this.API_KEY);
      console.log('Gemini client initialized:', !!this.client);
      
      if (!this.client) {
        console.error('❌ Gemini client not initialized - API key may be missing or invalid');
        console.log('Current API key:', this.API_KEY ? `${this.API_KEY.substring(0, 10)}...` : 'NOT SET');
        return false;
      }

              const config: TTSConfig = { 
          voiceName: 'Zephyr',
          speakingRate: 1.15
        };
      
      console.log('Calling Gemini TTS API with test text...');
      const audioBuffer = await this.generateAudioWithGemini(testText, config);
      console.log('✅ TTS test successful, generated', audioBuffer.byteLength, 'bytes of audio');
      return true;
    } catch (error) {
      console.error('❌ TTS test failed:', error);
      console.error('This explains why you hear beeps instead of speech');
      return false;
    }
  }

  createTestAudio(): string {
    console.log('🔧 Creating test audio file...');
    
    const sampleRate = 24000;
    const duration = 3;
    const samples = Math.floor(sampleRate * duration);
    
    const channels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const fileSize = 36 + dataSize;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, fileSize, true); // File size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, channels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample
    
    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true); // Subchunk2Size
    
    // Generate speech-like audio
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      const f1 = 200 + 50 * Math.sin(2 * Math.PI * 0.5 * t);
      const f2 = 800 + 100 * Math.sin(2 * Math.PI * 0.3 * t);
      const f3 = 2400 + 200 * Math.sin(2 * Math.PI * 0.2 * t);
      
      const envelope = Math.exp(-t * 0.3) * (0.3 + 0.7 * Math.sin(2 * Math.PI * 2 * t));
      
      const sample = envelope * (
        0.5 * Math.sin(2 * Math.PI * f1 * t) +
        0.3 * Math.sin(2 * Math.PI * f2 * t) +
        0.2 * Math.sin(2 * Math.PI * f3 * t)
      );
      
      const sampleValue = Math.max(-32768, Math.min(32767, sample * 12000));
      view.setInt16(44 + i * 2, sampleValue, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);
    
    console.log('✅ Test audio created successfully');
    return audioUrl;
  }
}

// Lazy initialization to avoid API key errors
let geminiTTSServiceInstance: GeminiTTSService | null = null;

export const getGeminiTTSService = (): GeminiTTSService => {
  if (!geminiTTSServiceInstance) {
    geminiTTSServiceInstance = new GeminiTTSService();
  }
  return geminiTTSServiceInstance;
};

export const geminiTTSService = getGeminiTTSService();
export type { TTSConfig };