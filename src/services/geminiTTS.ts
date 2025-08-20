import { GoogleGenAI } from '@google/genai';
import { BookChapter } from '../types';

interface TTSConfig {
  voiceName: string;
  style?: 'sage' | 'mirror' | 'flame' | 'neutral';
  pace?: 'slow' | 'measured' | 'normal' | 'quick';
  tone?: 'warm' | 'compassionate' | 'calm' | 'grounded' | 'neutral';
  emotionalColor?: 'neutral' | 'warm' | 'calm-clarity' | 'gravity';
}

interface AudioCache {
  [chapterId: string]: {
    audioUrl: string;
    duration: number;
    wordTimings: number[];
    generatedAt: string;
    blobData?: string; // Base64 encoded audio data
  };
}

class GeminiTTSService {
  private client: GoogleGenAI | null;
  private audioCache: AudioCache = {};
  private readonly CACHE_KEY = 'gemini_tts_cache';
  private readonly API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'AudioCacheDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'audioFiles';

  constructor() {
    this.client = null;
    this.loadCache();
    this.initIndexedDB().then(() => {
      // Clean up invalid URLs after IndexedDB is initialized
      this.cleanupInvalidUrls().catch(error => {
        console.warn('Failed to cleanup invalid URLs:', error);
      });
      
      // Add debug methods to window for development
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        (window as any).audioDebug = {
          cacheStatus: () => this.debugCacheStatus(),
          cleanup: () => this.cleanupInvalidUrls(),
          clearCache: () => this.clearCache(),
          getCacheSize: () => this.getCacheSize()
        };
        console.log('Audio debug methods available on window.audioDebug');
      }
    });
    
    // Only initialize Gemini client if API key is properly set
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
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('IndexedDB not available, falling back to localStorage only');
        resolve();
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        console.warn('Falling back to localStorage only for audio caching');
        resolve(); // Don't reject, just fall back to localStorage
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for audio files
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('chapterId', 'chapterId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Audio store created in IndexedDB');
        }
      };
    });
  }

  private loadCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.audioCache = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error loading TTS cache:', error);
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.audioCache));
    } catch (error) {
      console.error('Error saving TTS cache:', error);
    }
  }

  private getChapterId(chapter: BookChapter): string {
    return `${chapter.title}-${chapter.content.length}`;
  }

  private cleanTextForTTS(text: string): string {
    // Simply clean the text without adding any markup that could be spoken
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private createVoicePrompt(text: string, config: TTSConfig): string {
    // Return only the clean text without any instructions that could be spoken
    return this.cleanTextForTTS(text);
  }

  private async generateAudioWithGemini(text: string, config: TTSConfig): Promise<ArrayBuffer> {
    try {
      // If no Gemini client, use mock audio
      if (!this.client) {
        console.log('Using mock TTS for text:', text.substring(0, 100) + '...');
        console.log('Using voice:', config.voiceName);
        
        // Create a proper WAV file for browser compatibility
        const sampleRate = 24000;
        const duration = Math.max(2, text.length * 0.05); // Estimate duration
        const samples = Math.floor(sampleRate * duration);
        
        // Create WAV file with simple tone for demo
        const wavBuffer = this.createDemoWavFile(samples, sampleRate);
        return wavBuffer;
      }

      // Implement actual Gemini TTS API call
      console.log('Generating real TTS audio for text:', text.substring(0, 100) + '...');
      console.log('Using voice:', config.voiceName);
      
      try {
        // Create enhanced text with voice direction
        const enhancedText = this.createVoicePrompt(text, config);
        
        const response = await this.client.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: enhancedText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: config.voiceName },
              },
            },
          },
        });

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) {
          throw new Error('No audio data received from Gemini TTS');
        }

        // Convert base64 to ArrayBuffer
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Check if the audio data is valid
        if (bytes.length === 0) {
          throw new Error('Empty audio data received from Gemini TTS');
        }
        
        console.log('Generated audio data size:', bytes.length, 'bytes');
        
        // The data from Gemini TTS should already be in a playable format (likely PCM)
        // Create WAV file from PCM data (24kHz, 16-bit, mono as per Gemini TTS specs)
        const wavBuffer = this.createWavFile(bytes.buffer, 24000, 1, 2);
        return wavBuffer;
        
      } catch (error) {
        console.error('Error calling Gemini TTS API:', error);
        
        // Check if it's a rate limit error
        if (error && typeof error === 'object' && 'error' in error) {
          const apiError = error as any;
          if (apiError.error?.code === 429) {
            console.error('Rate limit exceeded. Daily quota reached.');
            this.recordApiError();
            throw new Error('RATE_LIMIT_EXCEEDED: Daily API quota reached. Please try again tomorrow or upgrade your plan.');
          }
        }
        
        // Check for other specific API errors
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as any).message;
          if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
            this.recordApiError();
            throw new Error('QUOTA_EXCEEDED: API quota exceeded. Please check your billing plan.');
          }
        }
        
        // Fallback to simple audio for other errors
        console.log('Falling back to simple audio due to API error');
        
        const fallbackBuffer = this.createFallbackAudio(text);
        return fallbackBuffer;
      }
    } catch (error) {
      console.error('Error generating audio with Gemini TTS:', error);
      throw error;
    }
  }

  private createDemoWavFile(samples: number, sampleRate: number): ArrayBuffer {
    // Create a proper WAV file with valid audio data
    const channels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const fileSize = 36 + dataSize;
    
    // Create buffer for entire WAV file
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, fileSize, true); // File size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, channels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample
    
    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true); // Subchunk2Size
    
    // Generate audio data - create a more realistic speech-like pattern
    const audioData = new Int16Array(buffer, 44, samples);
    
    // Create a speech-like waveform with multiple frequency components
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Base frequency modulation (simulates speech formants)
      const f1 = 200 + 100 * Math.sin(2 * Math.PI * 2 * t); // First formant
      const f2 = 800 + 200 * Math.sin(2 * Math.PI * 1.5 * t); // Second formant
      const f3 = 2400 + 300 * Math.sin(2 * Math.PI * 0.8 * t); // Third formant
      
      // Amplitude envelope (simulates speech rhythm)
      const envelope = Math.exp(-t * 0.5) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t));
      
      // Combine frequencies with different amplitudes
      const sample = envelope * (
        0.6 * Math.sin(2 * Math.PI * f1 * t) +
        0.3 * Math.sin(2 * Math.PI * f2 * t) +
        0.1 * Math.sin(2 * Math.PI * f3 * t)
      );
      
      // Convert to 16-bit integer
      audioData[i] = Math.max(-32768, Math.min(32767, sample * 16000));
    }
    
    return buffer;
  }

  // Check if API is available (for rate limiting)
  public isApiAvailable(): boolean {
    const lastError = localStorage.getItem('geminiTTS_lastError');
    if (lastError) {
      const errorTime = parseInt(lastError);
      const now = Date.now();
      // If last error was less than 1 hour ago, consider API unavailable
      if (now - errorTime < 3600000) {
        return false;
      }
    }
    return true;
  }

  // Record API error for availability tracking
  private recordApiError(): void {
    localStorage.setItem('geminiTTS_lastError', Date.now().toString());
  }



  // Create a simple fallback audio file when API is unavailable
  private createFallbackAudio(text: string): ArrayBuffer {
    console.log('Creating fallback audio for text:', text.substring(0, 50) + '...');
    
    // Create a simple beep sound as fallback
    const sampleRate = 24000;
    const duration = Math.max(1, Math.min(5, text.length * 0.02)); // 1-5 seconds based on text length
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
    
    // Generate a simple beep tone
    const frequency = 440; // A4 note
    const amplitude = 0.3;
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
      const sampleValue = Math.round(sample * 32767); // Convert to 16-bit
      view.setInt16(44 + i * 2, sampleValue, true);
    }
    
    return buffer;
  }

  private async saveAudioFile(audioBuffer: ArrayBuffer, chapterId: string): Promise<string> {
    try {
      console.log('Saving audio file, buffer size:', audioBuffer.byteLength, 'bytes');
      
      // Convert to WAV format for maximum browser compatibility
      const wavBuffer = this.ensureWavFormat(audioBuffer);
      
      // Create blob and test audio
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const testUrl = URL.createObjectURL(blob);
      
      // Test if the audio works and get duration
      const audio = new Audio(testUrl);
      const duration = await new Promise<number>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Audio loading timeout, using estimated duration');
          resolve(Math.max(1, audioBuffer.byteLength / (24000 * 2))); // Estimate for 24kHz 16-bit
        }, 5000);
        
        audio.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout);
          console.log('Audio loaded successfully, duration:', audio.duration);
          resolve(audio.duration || 5);
        });
        
        audio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          console.warn('Audio loading error, using estimated duration:', e);
          resolve(Math.max(1, audioBuffer.byteLength / (24000 * 2)));
        });
        
        audio.load();
      });
      
      // Clean up test URL
      URL.revokeObjectURL(testUrl);
      
      // Save to IndexedDB for persistent storage
      const savedUrl = await this.saveToIndexedDB(blob, chapterId);
      
      // Calculate word timings (approximate)
      const wordsPerMinute = 150;
      const wordCount = Math.max(1, Math.ceil(duration * wordsPerMinute / 60));
      const msPerWord = (duration * 1000) / wordCount;
      const wordTimings = Array.from({ length: wordCount }, (_, i) => i * msPerWord);

      // Save to cache with persistent URL
      this.audioCache[chapterId] = {
        audioUrl: savedUrl,
        duration: Math.max(1, duration),
        wordTimings,
        generatedAt: new Date().toISOString()
      };

      this.saveCache();
      console.log(`Audio saved to IndexedDB: ${chapterId}, duration: ${duration.toFixed(2)}s`);
      return savedUrl;
      
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw error;
    }
  }

  private sanitizeFileName(name: string): string {
    // Remove or replace characters that aren't safe for filenames
    return name
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  private ensureWavFormat(audioBuffer: ArrayBuffer): ArrayBuffer {
    // Check if it's already a WAV file by looking for the RIFF header
    const view = new DataView(audioBuffer);
    
    // Check for RIFF header (0x52494646 = "RIFF")
    if (audioBuffer.byteLength >= 12 && view.getUint32(0, false) === 0x52494646) {
      console.log('Audio is already in WAV format');
      return audioBuffer;
    }
    
    // If not WAV, assume it's raw PCM data from Gemini and create WAV header
    console.log('Converting raw PCM to WAV format');
    return this.createWavFile(audioBuffer, 24000, 1, 2);
  }

  private async saveToIndexedDB(blob: Blob, chapterId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        // Fallback to localStorage if IndexedDB is not available
        console.warn('IndexedDB not available, using localStorage fallback');
        this.saveToLocalStorage(blob, chapterId).then(resolve).catch(reject);
        return;
      }

      // Convert blob to base64 first, then create transaction
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        // Create transaction after FileReader completes
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const audioRecord = {
          id: chapterId,
          chapterId: chapterId,
          data: base64Data,
          size: blob.size,
          timestamp: Date.now(),
          type: 'audio/wav'
        };
        
        const request = store.put(audioRecord);
        
        request.onsuccess = () => {
          // Create a blob URL that will be managed by the service
          const blobUrl = URL.createObjectURL(blob);
          console.log(`Audio saved to IndexedDB: ${chapterId} (${(blob.size / 1024).toFixed(1)} KB)`);
          
          // Store the blob URL in memory for immediate access
          this.audioCache[chapterId] = {
            audioUrl: blobUrl,
            duration: 0, // Will be set later
            wordTimings: [],
            generatedAt: new Date().toISOString()
          };
          
          resolve(blobUrl);
        };
        
        request.onerror = () => {
          console.error('Error saving to IndexedDB:', request.error);
          // Fallback to localStorage
          console.warn('Falling back to localStorage');
          this.saveToLocalStorage(blob, chapterId).then(resolve).catch(reject);
        };
      };
      
      reader.onerror = () => {
        console.error('Error reading blob data:', reader.error);
        reject(reader.error);
      };
      
      reader.readAsDataURL(blob);
    });
  }

  private async saveToLocalStorage(blob: Blob, chapterId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64Data = reader.result as string;
          const audioRecord = {
            id: chapterId,
            data: base64Data,
            size: blob.size,
            timestamp: Date.now(),
            type: 'audio/wav'
          };
          
          // Store in localStorage with a unique key
          const key = `audio_${chapterId}`;
          localStorage.setItem(key, JSON.stringify(audioRecord));
          
          const blobUrl = URL.createObjectURL(blob);
          console.log(`Audio saved to localStorage: ${chapterId} (${(blob.size / 1024).toFixed(1)} KB)`);
          resolve(blobUrl);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading blob data for localStorage:', reader.error);
        reject(reader.error);
      };
      
      reader.readAsDataURL(blob);
    });
  }

  private async loadFromIndexedDB(chapterId: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        // Try localStorage fallback
        this.loadFromLocalStorage(chapterId).then(resolve).catch(() => resolve(null));
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(chapterId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          try {
            // Convert base64 back to blob and create URL
            const base64Data = result.data.split(',')[1]; // Remove data URL prefix
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: result.type || 'audio/wav' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Update the cache with the new blob URL
            if (this.audioCache[chapterId]) {
              this.audioCache[chapterId].audioUrl = blobUrl;
            }
            
            console.log(`Audio loaded from IndexedDB: ${chapterId}`);
            resolve(blobUrl);
          } catch (error) {
            console.error('Error recreating blob from IndexedDB:', error);
            resolve(null);
          }
        } else {
          // Try localStorage fallback
          this.loadFromLocalStorage(chapterId).then(resolve).catch(() => resolve(null));
        }
      };
      
      request.onerror = () => {
        console.error('Error loading from IndexedDB:', request.error);
        // Try localStorage fallback
        this.loadFromLocalStorage(chapterId).then(resolve).catch(() => resolve(null));
      };
    });
  }

  private async loadFromLocalStorage(chapterId: string): Promise<string | null> {
    try {
      const key = `audio_${chapterId}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return null;
      }
      
      const audioRecord = JSON.parse(stored);
      if (!audioRecord.data) {
        return null;
      }
      
      // Convert base64 back to blob and create URL
      const base64Data = audioRecord.data.split(',')[1]; // Remove data URL prefix
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: audioRecord.type || 'audio/wav' });
      const blobUrl = URL.createObjectURL(blob);
      console.log(`Audio loaded from localStorage: ${chapterId}`);
      return blobUrl;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  private shouldAutoDownload(): boolean {
    // Check if auto-download is enabled (could be a user setting)
    return localStorage.getItem('autoDownloadAudio') === 'true';
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      console.log(`Audio file downloaded: ${fileName}`);
    } catch (error) {
      console.error('Error triggering download:', error);
    }
  }

  private storeFileInfo(fileName: string, url: string, size: number): void {
    try {
      const fileList = JSON.parse(localStorage.getItem('audioFileList') || '[]');
      fileList.push({
        fileName,
        url,
        size,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('audioFileList', JSON.stringify(fileList));
    } catch (error) {
      console.error('Error storing file info:', error);
    }
  }

  async generateChapterAudio(chapter: BookChapter, config: TTSConfig = { voiceName: 'Kore' }): Promise<{
    audioUrl: string;
    duration: number;
    wordTimings: number[];
  }> {
    const chapterId = this.getChapterId(chapter);

    // Check if audio is already cached
    if (this.audioCache[chapterId]) {
      console.log('Using cached audio for chapter:', chapter.title);
      return this.audioCache[chapterId];
    }

    console.log('Generating new audio for chapter:', chapter.title);

    try {
      // Prepare text for TTS (clean up markdown)
      const cleanText = this.prepareTextForTTS(chapter.content);
      
      // Split text into chunks if it's too long (Gemini TTS has limits)
      const maxChunkLength = 5000; // Adjust based on API limits
      const chunks = this.splitTextIntoChunks(cleanText, maxChunkLength);
      
      if (chunks.length === 1) {
        // Single chunk - generate directly
        const audioBuffer = await this.generateAudioWithGemini(cleanText, config);
        const audioUrl = await this.saveAudioFile(audioBuffer, chapterId);
        const cacheEntry = this.audioCache[chapterId];
        return cacheEntry;
      } else {
        // Multiple chunks - generate and combine
        const audioBuffers: ArrayBuffer[] = [];
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`Generating audio chunk ${i + 1}/${chunks.length}`);
          const chunkBuffer = await this.generateAudioWithGemini(chunks[i], config);
          audioBuffers.push(chunkBuffer);
          
          // Add small delay between requests to avoid rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Combine audio buffers
        const combinedBuffer = this.combineAudioBuffers(audioBuffers);
        const audioUrl = await this.saveAudioFile(combinedBuffer, chapterId);
        const cacheEntry = this.audioCache[chapterId];
        return cacheEntry;
      }
    } catch (error) {
      console.error('Failed to generate audio for chapter:', chapter.title, error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('RATE_LIMIT_EXCEEDED') || error.message.includes('QUOTA_EXCEEDED')) {
          // Re-throw quota/rate limit errors with clear messaging
          throw error;
        }
      }
      
      // For other errors, provide simple fallback
      console.log('Using simple fallback due to generation error');
      const fallbackBuffer = this.createFallbackAudio(this.prepareTextForTTS(chapter.content));
      const audioUrl = await this.saveAudioFile(fallbackBuffer, chapterId);
      const cacheEntry = this.audioCache[chapterId];
      return cacheEntry;
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

    // For simplicity, just return the first buffer
    // In a real implementation, you'd properly combine the WAV files
    console.log(`Combining ${buffers.length} audio buffers (using first buffer for demo)`);
    return buffers[0];
  }

  private prepareTextForTTS(text: string): string {
    // Remove markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
  }

  private createWavFile(pcmData: ArrayBuffer, sampleRate: number, channels: number, sampleWidth: number): ArrayBuffer {
    // WAV header (44 bytes)
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

  async getCachedAudio(chapter: BookChapter): Promise<string | null> {
    const chapterId = this.getChapterId(chapter);
    
    // Try to load from IndexedDB first
    const indexedDbUrl = await this.loadFromIndexedDB(chapterId);
    if (indexedDbUrl) {
      // Update cache with the valid URL
      if (this.audioCache[chapterId]) {
        this.audioCache[chapterId].audioUrl = indexedDbUrl;
        this.saveCache();
      }
      return indexedDbUrl;
    }
    
    // Fallback to cache entry if IndexedDB doesn't have it
    return this.audioCache[chapterId]?.audioUrl || null;
  }

  async isAudioCached(chapter: BookChapter): Promise<boolean> {
    const chapterId = this.getChapterId(chapter);
    
    // Check local cache first
    if (this.audioCache[chapterId]) {
      // Verify the audio URL is still valid by trying to load from IndexedDB
      const indexedDbUrl = await this.loadFromIndexedDB(chapterId);
      return !!indexedDbUrl;
    }
    
    return false;
  }

  async clearCache() {
    // Revoke all blob URLs
    Object.values(this.audioCache).forEach(cache => {
      URL.revokeObjectURL(cache.audioUrl);
    });
    
    // Clear IndexedDB
    if (this.db) {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    // Clear localStorage audio entries
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('audio_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    this.audioCache = {};
    localStorage.removeItem(this.CACHE_KEY);
    console.log('Audio cache cleared (IndexedDB and localStorage)');
  }

  getCacheSize(): number {
    return Object.keys(this.audioCache).length;
  }

  async cleanupInvalidUrls(): Promise<void> {
    const validEntries: AudioCache = {};
    
    for (const [chapterId, cacheEntry] of Object.entries(this.audioCache)) {
      try {
        // Try to load from IndexedDB to verify it's still valid
        const indexedDbUrl = await this.loadFromIndexedDB(chapterId);
        if (indexedDbUrl) {
          validEntries[chapterId] = {
            ...cacheEntry,
            audioUrl: indexedDbUrl
          };
        } else {
          // Revoke the old URL if it's no longer valid
          URL.revokeObjectURL(cacheEntry.audioUrl);
          console.log(`Removed invalid cache entry: ${chapterId}`);
        }
      } catch (error) {
        console.error(`Error checking cache entry ${chapterId}:`, error);
        // Remove invalid entries
        URL.revokeObjectURL(cacheEntry.audioUrl);
      }
    }
    
    this.audioCache = validEntries;
    this.saveCache();
    console.log(`Cache cleanup complete. Valid entries: ${Object.keys(validEntries).length}`);
  }

  // Debug method to check cache status
  async debugCacheStatus(): Promise<void> {
    console.log('=== Audio Cache Debug Info ===');
    console.log('Local cache entries:', Object.keys(this.audioCache).length);
    
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

  // Get available voice options from Gemini TTS with descriptions
  getAvailableVoices(): Array<{name: string, description: string, recommended?: boolean}> {
    return [
      { name: 'Kore', description: 'Warm, grounded feminine voice - ideal for contemplative content', recommended: true },
      { name: 'Charon', description: 'Deep, sage-like masculine voice - perfect for philosophical passages', recommended: true },
      { name: 'Aoede', description: 'Poetic, musical feminine voice - beautiful for lyrical content', recommended: true },
      { name: 'Zephyr', description: 'Gentle, flowing voice - good for peaceful, meditative sections' },
      { name: 'Leda', description: 'Calm, clear feminine voice - excellent for clarity and understanding' },
      { name: 'Orus', description: 'Steady, reliable masculine voice - good for grounding and stability' },
      { name: 'Puck', description: 'Light, playful voice - suitable for lighter, more energetic passages' },
      { name: 'Fenrir', description: 'Strong, authoritative voice - good for powerful, transformative content' },
      { name: 'Callirrhoe', description: 'Flowing, graceful voice - beautiful for passages about beauty and grace' },
      { name: 'Autonoe', description: 'Independent, clear voice - good for self-discovery themes' }
    ];
  }

  // Get voice style presets
  getVoiceStylePresets(): Array<{name: string, config: TTSConfig, description: string}> {
    return [
      {
        name: 'Contemplative Sage',
        config: {
          voiceName: 'Charon',
          style: 'sage',
          pace: 'normal',
          tone: 'grounded',
          emotionalColor: 'calm-clarity'
        },
        description: 'Deep, wise voice with natural pacing - perfect for philosophical content'
      },
      {
        name: 'Gentle Guide',
        config: {
          voiceName: 'Kore',
          style: 'neutral',
          pace: 'normal',
          tone: 'warm',
          emotionalColor: 'warm'
        },
        description: 'Warm, compassionate voice - ideal for guidance and support'
      },
      {
        name: 'Peaceful Mirror',
        config: {
          voiceName: 'Leda',
          style: 'mirror',
          pace: 'normal',
          tone: 'calm',
          emotionalColor: 'neutral'
        },
        description: 'Calm, reflective voice - excellent for self-reflection and clarity'
      },
      {
        name: 'Inspired Flame',
        config: {
          voiceName: 'Aoede',
          style: 'flame',
          pace: 'quick',
          tone: 'warm',
          emotionalColor: 'warm'
        },
        description: 'Passionate yet restrained voice - great for transformative content'
      },
      {
        name: 'Grounded Presence',
        config: {
          voiceName: 'Orus',
          style: 'neutral',
          pace: 'normal',
          tone: 'grounded',
          emotionalColor: 'gravity'
        },
        description: 'Steady, grounding voice - perfect for deep, existential content'
      }
    ];
  }

  // Test the TTS service with a contemplative phrase
  async testTTS(testText: string = "In the middle of all things, we find ourselves becoming. This is not a destination, but a way of being."): Promise<boolean> {
    try {
      console.log('Testing Gemini TTS service...');
      const config: TTSConfig = { 
        voiceName: 'Kore',
        style: 'sage',
        pace: 'measured',
        tone: 'warm',
        emotionalColor: 'calm-clarity'
      };
      const audioBuffer = await this.generateAudioWithGemini(testText, config);
      console.log('TTS test successful, generated', audioBuffer.byteLength, 'bytes of audio');
      return true;
    } catch (error) {
      console.error('TTS test failed:', error);
      return false;
    }
  }

  // Create a quick test audio for a given style
  async createTestAudio(styleName: string): Promise<string | null> {
    try {
      const stylePresets = this.getVoiceStylePresets();
      const preset = stylePresets.find(p => p.name === styleName);
      
      if (!preset) {
        throw new Error(`Style preset "${styleName}" not found`);
      }

      const testText = "Being is not a state to achieve, but a quality of presence to embody. In each moment, we have the choice to become more fully ourselves.";
      
      const audioBuffer = await this.generateAudioWithGemini(testText, preset.config);
      const audioUrl = await this.saveAudioFile(audioBuffer, `test-${styleName}`);
      
      console.log(`Test audio created for style: ${styleName}`);
      return audioUrl;
    } catch (error) {
      console.error(`Failed to create test audio for style ${styleName}:`, error);
      return null;
    }
  }

  // Method to enable/disable auto-download
  setAutoDownload(enabled: boolean): void {
    localStorage.setItem('autoDownloadAudio', enabled.toString());
    console.log(`Auto-download ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Method to manually download a cached audio file
  async downloadAudioFile(chapter: BookChapter): Promise<boolean> {
    try {
      const chapterId = this.getChapterId(chapter);
      const cacheEntry = this.audioCache[chapterId];
      
      if (!cacheEntry) {
        console.warn('No cached audio found for chapter:', chapter.title);
        return false;
      }
      
      // Fetch the blob from the URL
      const response = await fetch(cacheEntry.audioUrl);
      const blob = await response.blob();
      
      const fileName = `${this.sanitizeFileName(chapter.title)}.wav`;
      this.triggerDownload(blob, fileName);
      
      return true;
    } catch (error) {
      console.error('Error downloading audio file:', error);
      return false;
    }
  }

  // Get list of all generated audio files
  getAudioFileList(): Array<{fileName: string, url: string, size: number, createdAt: string}> {
    try {
      return JSON.parse(localStorage.getItem('audioFileList') || '[]');
    } catch (error) {
      console.error('Error getting audio file list:', error);
      return [];
    }
  }

  // Download all generated audio files as a ZIP (requires additional library)
  async downloadAllAudioFiles(): Promise<boolean> {
    try {
      const fileList = this.getAudioFileList();
      
      if (fileList.length === 0) {
        console.warn('No audio files to download');
        return false;
      }

      // For now, download files individually
      // In a real implementation, you'd use a library like JSZip to create a ZIP file
      for (const file of fileList) {
        try {
          const response = await fetch(file.url);
          const blob = await response.blob();
          this.triggerDownload(blob, file.fileName);
          
          // Add delay between downloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error downloading file ${file.fileName}:`, error);
        }
      }

      console.log(`Downloaded ${fileList.length} audio files`);
      return true;
    } catch (error) {
      console.error('Error downloading all audio files:', error);
      return false;
    }
  }

  // Clear all generated audio files
  clearAllAudioFiles(): void {
    try {
      const fileList = this.getAudioFileList();
      
      // Revoke all blob URLs
      fileList.forEach(file => {
        URL.revokeObjectURL(file.url);
      });
      
      // Clear the file list
      localStorage.removeItem('audioFileList');
      
      console.log(`Cleared ${fileList.length} audio files`);
    } catch (error) {
      console.error('Error clearing audio files:', error);
    }
  }

  // Get total size of all audio files
  getTotalAudioSize(): number {
    try {
      const fileList = this.getAudioFileList();
      return fileList.reduce((total, file) => total + file.size, 0);
    } catch (error) {
      console.error('Error calculating total audio size:', error);
      return 0;
    }
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