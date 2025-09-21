#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../public/media/audio');
const BOOK_DIR = path.join(__dirname, '../src/book');
const MEDITATIONS_DIR = path.join(__dirname, '../src/meditations/meditations');
const STORIES_DIR = path.join(__dirname, '../src/stories/stories');

// TTS Configuration - Voice options
const VOICE_OPTIONS = {
  male: {
    name: 'Charon',
    speakingRate: 1.15
  },
  female: {
    name: 'Zephyr', 
    speakingRate: 1.15
  }
};

// API Quota Management
const QUOTA_CONFIG = {
  freeTier: {
    dailyLimit: 15,
    resetTime: '00:00', // UTC
    cooldownMs: 3000 // 3 seconds between requests
  },
  paidTier: {
    dailyLimit: 1000,
    resetTime: '00:00',
    cooldownMs: 1000 // 1 second between requests
  }
};

class AudioScheduler {
  constructor() {
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.client = new GoogleGenAI({
      apiKey: API_KEY
    });
    
    this.isPaidTier = this.detectPaidTier();
    this.quotaConfig = this.isPaidTier ? QUOTA_CONFIG.paidTier : QUOTA_CONFIG.freeTier;
    this.dailyUsage = 0;
    this.lastResetDate = new Date().toDateString();
    
    this.stats = {
      book: { processed: 0, skipped: 0, failed: 0 },
      meditations: { processed: 0, skipped: 0, failed: 0 },
      stories: { processed: 0, skipped: 0, failed: 0 }
    };
  }

  // Detect if using paid tier (basic detection)
  detectPaidTier() {
    // You can implement more sophisticated detection here
    // For now, assume free tier unless explicitly set
    return process.env.GEMINI_PAID_TIER === 'true';
  }

  // Check if we can make more API calls today
  canMakeRequest() {
    const today = new Date().toDateString();
    
    // Reset daily counter if it's a new day
    if (today !== this.lastResetDate) {
      this.dailyUsage = 0;
      this.lastResetDate = today;
      console.log('🔄 Daily quota reset - new day started');
    }
    
    return this.dailyUsage < this.quotaConfig.dailyLimit;
  }

  // Increment usage counter
  incrementUsage() {
    this.dailyUsage++;
    console.log(`📊 API Usage: ${this.dailyUsage}/${this.quotaConfig.dailyLimit} requests today`);
  }

  // Parse markdown content
  parseMarkdownContent(markdown) {
    const lines = markdown.split('\n');
    let title = '';
    let subtitle = '';
    let content = '';
    let inContent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ')) {
        title = line.substring(2);
        inContent = true;
      } else if (line.startsWith('## ') && !subtitle) {
        subtitle = line.substring(3);
      } else if (inContent && !line.startsWith('**Tags:**') && !line.startsWith('---')) {
        content += line + '\n';
      }
    }

    return {
      title: title || 'Untitled',
      subtitle: subtitle || '',
      content: content.trim()
    };
  }

  // Prepare text for TTS (remove markdown formatting, etc.)
  prepareTextForTTS(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic formatting
      .replace(/#{1,6}\s+/g, '')       // Remove headers
      .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
      .replace(/`(.*?)`/g, '$1')       // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/\n{3,}/g, '\n\n')      // Limit multiple newlines
      .trim();
  }

  // Create WAV file from raw audio data
  createWavFile(audioBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
    const buffer = new ArrayBuffer(44 + audioBuffer.byteLength);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
    view.setUint16(32, channels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, audioBuffer.byteLength, true);
    
    // Copy audio data
    const audioView = new Uint8Array(audioBuffer);
    const wavView = new Uint8Array(buffer, 44);
    wavView.set(audioView);
    
    return buffer;
  }

  // Generate audio using Gemini TTS
  async generateAudioWithGemini(text, voiceType = 'male') {
    if (!this.canMakeRequest()) {
      throw new Error(`Daily API quota exceeded (${this.quotaConfig.dailyLimit} requests)`);
    }

    const voiceConfig = VOICE_OPTIONS[voiceType];
    if (!voiceConfig) {
      throw new Error(`Invalid voice type: ${voiceType}`);
    }

    try {
      console.log(`🎤 Generating TTS for text (${text.length} characters)...`);
      
      const enhancedText = this.prepareTextForTTS(text);
      
      const speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceConfig.name },
        },
      };
      
      if (voiceConfig.speakingRate !== undefined) {
        speechConfig.speakingRate = voiceConfig.speakingRate;
      }
      
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: enhancedText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig,
        },
      });

      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) {
        throw new Error('No audio data received from Gemini TTS');
      }

      // Convert base64 to binary
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      if (bytes.length === 0) {
        throw new Error('Empty audio data received from Gemini TTS');
      }
      
      console.log(`✅ Generated ${bytes.length} bytes of audio data`);
      
      // Create WAV file
      const wavBuffer = this.createWavFile(bytes.buffer, 24000, 1, 2);
      
      this.incrementUsage();
      
      return wavBuffer;
    } catch (error) {
      console.error('❌ Error calling Gemini TTS API:', error.message);
      throw error;
    }
  }

  // Generate audio for a single content item
  async generateContentAudio(content, outputPath, voiceType = 'male') {
    try {
      // Check if file already exists
      try {
        await fs.access(outputPath);
        console.log(`⏭️  Skipping - audio file already exists`);
        return { status: 'skipped', size: 0 };
      } catch {
        // File doesn't exist, proceed with generation
      }

      // Check quota before generating
      if (!this.canMakeRequest()) {
        console.log(`⏸️  Quota exceeded - skipping ${path.basename(outputPath)}`);
        return { status: 'quota_exceeded', size: 0 };
      }

      const audioData = await this.generateAudioWithGemini(content, voiceType);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Write audio file
      await fs.writeFile(outputPath, Buffer.from(audioData));
      
      const sizeKB = Math.round(audioData.byteLength / 1024);
      console.log(`✅ Generated audio: ${sizeKB} KB`);
      
      // Wait between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, this.quotaConfig.cooldownMs));
      
      return { status: 'generated', size: audioData.byteLength };
    } catch (error) {
      console.error(`❌ Failed to generate audio for ${path.basename(outputPath)}:`, error.message);
      return { status: 'failed', size: 0, error: error.message };
    }
  }

  // Load and process book chapters
  async loadBookChapters() {
    console.log('📚 Loading book chapters...');
    
    const bookStructure = [
      {
        part: 'Introduction',
        path: 'introduction',
        chapters: [
          { id: 'introduction', filename: '0. Introduction: A Centre That Moves.mdx', order: 0 }
        ]
      },
      {
        part: 'Part I: The Axis of Becoming',
        path: 'Part I: The Axis of Becoming',
        chapters: [
          { id: 'part-1-intro', filename: 'intro.md', order: 1 },
          { id: 'chapter-1', filename: '1. The Axis of Consequence.md', order: 2 },
          { id: 'chapter-2', filename: '2. The Shape of Desire.md', order: 3 },
          { id: 'chapter-3', filename: '3. The Weight of Choice.md', order: 4 },
          { id: 'chapter-4', filename: '4. The Discipline of Becoming.md', order: 5 },
          { id: 'chapter-5', filename: '5. The Voice of Resistance.md', order: 6 },
          { id: 'chapter-6', filename: '6. Integration and Return.md', order: 7 }
        ]
      },
      {
        part: 'Part II: The Spiral Path',
        path: 'Part II: The Spiral Path',
        chapters: [
          { id: 'part-2-intro', filename: 'intro.md', order: 8 },
          { id: 'chapter-7', filename: '7. The Spiral Path.md', order: 9 },
          { id: 'chapter-8', filename: '8. The Return of the Old Self.md', order: 10 },
          { id: 'chapter-9', filename: '9. Rest and the Sacred Pause.md', order: 11 },
          { id: 'chapter-10', filename: '10. Other People, Other Mirrors.md', order: 12 },
          { id: 'chapter-11', filename: '11. Time and the Myth of Readiness.md', order: 13 },
          { id: 'chapter-12', filename: '12. Falling and Rising Again.md', order: 14 }
        ]
      },
      {
        part: 'Part III: The Living Axis',
        path: 'Part III: The Living Axis',
        chapters: [
          { id: 'part-3-intro', filename: 'intro.md', order: 15 },
          { id: 'chapter-13', filename: '13. The Body as Compass.md', order: 16 },
          { id: 'chapter-14', filename: '14. Emotion as Messenger, Not Master.md', order: 17 },
          { id: 'chapter-15', filename: '15. Living in the Middle.md', order: 18 },
          { id: 'chapter-16', filename: '16. The World as Field of Practice.md', order: 19 },
          { id: 'chapter-17', filename: '17. The Unfolding Now.md', order: 20 }
        ]
      },
      {
        part: 'Part IV: The Horizon Beyond',
        path: 'Part IV: The Horizon Beyond',
        chapters: [
          { id: 'part-4-intro', filename: 'intro.md', order: 21 },
          { id: 'chapter-18', filename: '18. Echoes and Imprints.md', order: 22 },
          { id: 'chapter-19', filename: '19. The Shape of Mortality.md', order: 23 },
          { id: 'chapter-20', filename: '20. Transcendence Without Escape.md', order: 24 },
          { id: 'chapter-21', filename: '21. Being Part of Something Larger.md', order: 25 },
          { id: 'chapter-22', filename: '22. The Silence That Holds Us.md', order: 26 },
          { id: 'chapter-23', filename: '23. The Spiral Never Ends.md', order: 27 }
        ]
      }
    ];

    const chapters = [];

    // Load chapters from book structure
    for (const part of bookStructure) {
      for (const chapter of part.chapters) {
        try {
          const filePath = path.join(BOOK_DIR, part.path, chapter.filename);
          const content = await fs.readFile(filePath, 'utf-8');
          const parsed = this.parseMarkdownContent(content);
          
          chapters.push({
            id: chapter.id,
            title: parsed.title,
            subtitle: parsed.subtitle,
            content: parsed.content,
            part: part.part,
            chapterNumber: chapters.length + 1,
            totalChapters: 28,
            filename: chapter.filename,
            order: chapter.order
          });
        } catch (error) {
          console.error(`❌ Error loading ${chapter.filename}:`, error.message);
        }
      }
    }

    // Load outro
    try {
      const outroPath = path.join(BOOK_DIR, 'outro.md', 'Begin Again.md');
      const outroContent = await fs.readFile(outroPath, 'utf-8');
      const parsed = this.parseMarkdownContent(outroContent);
      
      chapters.push({
        id: 'outro',
        title: parsed.title,
        subtitle: parsed.subtitle,
        content: parsed.content,
        part: 'Outro',
        chapterNumber: chapters.length + 1,
        totalChapters: 28,
        filename: 'Begin Again.md',
        order: 999
      });
    } catch (error) {
      console.error('❌ Error loading outro:', error.message);
    }

    return chapters.sort((a, b) => a.order - b.order);
  }

  // Load meditation files
  async loadMeditations() {
    console.log('🧘 Loading meditations...');
    
    try {
      const files = await fs.readdir(MEDITATIONS_DIR);
      const meditations = [];
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          try {
            const filePath = path.join(MEDITATIONS_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = this.parseMarkdownContent(content);
            
            const id = file.replace('.md', '');
            meditations.push({
              id,
              title: parsed.title,
              content: parsed.content,
              filename: file,
              type: 'meditation'
            });
          } catch (error) {
            console.error(`❌ Error loading meditation ${file}:`, error.message);
          }
        }
      }
      
      return meditations;
    } catch (error) {
      console.error('❌ Error loading meditations directory:', error.message);
      return [];
    }
  }

  // Load story files
  async loadStories() {
    console.log('📖 Loading stories...');
    
    try {
      const files = await fs.readdir(STORIES_DIR);
      const stories = [];
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          try {
            const filePath = path.join(STORIES_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = this.parseMarkdownContent(content);
            
            const id = file.replace('.md', '');
            stories.push({
              id,
              title: parsed.title,
              content: parsed.content,
              filename: file,
              type: 'story'
            });
          } catch (error) {
            console.error(`❌ Error loading story ${file}:`, error.message);
          }
        }
      }
      
      return stories;
    } catch (error) {
      console.error('❌ Error loading stories directory:', error.message);
      return [];
    }
  }

  // Generate audio for book chapters
  async generateBookAudio(voiceType = 'male') {
    console.log(`\n📚 Generating book audio (${voiceType} voice)...`);
    
    const chapters = await this.loadBookChapters();
    const outputDir = path.join(OUTPUT_DIR, 'chapters');
    
    for (const chapter of chapters) {
      if (!this.canMakeRequest()) {
        console.log(`⏸️  Daily quota exceeded - stopping book generation`);
        break;
      }
      
      const outputPath = path.join(outputDir, `${chapter.id}_${voiceType}.wav`);
      const result = await this.generateContentAudio(chapter.content, outputPath, voiceType);
      
      this.stats.book[result.status]++;
      
      if (result.status === 'quota_exceeded') {
        break;
      }
    }
  }

  // Generate audio for meditations
  async generateMeditationAudio(voiceType = 'male') {
    console.log(`\n🧘 Generating meditation audio (${voiceType} voice)...`);
    
    const meditations = await this.loadMeditations();
    const outputDir = path.join(OUTPUT_DIR, 'meditations');
    
    for (const meditation of meditations) {
      if (!this.canMakeRequest()) {
        console.log(`⏸️  Daily quota exceeded - stopping meditation generation`);
        break;
      }
      
      const outputPath = path.join(outputDir, `${meditation.id}_${voiceType}.wav`);
      const result = await this.generateContentAudio(meditation.content, outputPath, voiceType);
      
      this.stats.meditations[result.status]++;
      
      if (result.status === 'quota_exceeded') {
        break;
      }
    }
  }

  // Generate audio for stories
  async generateStoryAudio(voiceType = 'male') {
    console.log(`\n📖 Generating story audio (${voiceType} voice)...`);
    
    const stories = await this.loadStories();
    const outputDir = path.join(OUTPUT_DIR, 'stories');
    
    for (const story of stories) {
      if (!this.canMakeRequest()) {
        console.log(`⏸️  Daily quota exceeded - stopping story generation`);
        break;
      }
      
      const outputPath = path.join(outputDir, `${story.id}_${voiceType}.wav`);
      const result = await this.generateContentAudio(story.content, outputPath, voiceType);
      
      this.stats.stories[result.status]++;
      
      if (result.status === 'quota_exceeded') {
        break;
      }
    }
  }

  // Generate all audio content
  async generateAllAudio(voiceType = 'male') {
    console.log(`\n🎤 Starting comprehensive audio generation (${voiceType} voice)...`);
    console.log(`📊 API Usage: ${this.dailyUsage}/${this.quotaConfig.dailyLimit} requests today`);
    console.log(`💰 Tier: ${this.isPaidTier ? 'Paid' : 'Free'}`);
    
    // Reset stats
    this.stats = {
      book: { processed: 0, skipped: 0, failed: 0 },
      meditations: { processed: 0, skipped: 0, failed: 0 },
      stories: { processed: 0, skipped: 0, failed: 0 }
    };
    
    // Generate in priority order: book > meditations > stories
    await this.generateBookAudio(voiceType);
    await this.generateMeditationAudio(voiceType);
    await this.generateStoryAudio(voiceType);
    
    // Print final stats
    console.log('\n📊 Generation Complete!');
    console.log(`📚 Book: ${this.stats.book.processed} processed, ${this.stats.book.skipped} skipped, ${this.stats.book.failed} failed`);
    console.log(`🧘 Meditations: ${this.stats.meditations.processed} processed, ${this.stats.meditations.skipped} skipped, ${this.stats.meditations.failed} failed`);
    console.log(`📖 Stories: ${this.stats.stories.processed} processed, ${this.stats.stories.skipped} skipped, ${this.stats.stories.failed} failed`);
    console.log(`📊 Total API Usage: ${this.dailyUsage}/${this.quotaConfig.dailyLimit} requests today`);
  }

  // Schedule automatic generation
  scheduleGeneration() {
    console.log('⏰ Setting up automatic audio generation schedule...');
    
    // Schedule for daily at 2 AM UTC (when quota resets)
    const schedule = '0 2 * * *'; // 2 AM UTC daily
    
    cron.schedule(schedule, async () => {
      console.log('🕐 Scheduled audio generation starting...');
      
      try {
        // Reset daily usage counter
        this.dailyUsage = 0;
        this.lastResetDate = new Date().toDateString();
        
        // Generate male voice first (priority)
        await this.generateAllAudio('male');
        
        // If quota allows, generate female voice
        if (this.canMakeRequest()) {
          await this.generateAllAudio('female');
        } else {
          console.log('⏸️  Quota exhausted after male voice generation');
        }
        
        console.log('✅ Scheduled generation complete');
      } catch (error) {
        console.error('❌ Scheduled generation failed:', error.message);
      }
    }, {
      timezone: 'UTC'
    });
    
    console.log(`📅 Scheduled daily generation at 2:00 AM UTC`);
    console.log('🔄 Scheduler is running... (Press Ctrl+C to stop)');
  }

  // Manual generation with quota management
  async generateWithQuotaManagement(voiceType = 'male', contentTypes = ['book', 'meditations', 'stories']) {
    console.log(`\n🎯 Starting quota-managed generation for: ${contentTypes.join(', ')}`);
    
    for (const contentType of contentTypes) {
      if (!this.canMakeRequest()) {
        console.log(`⏸️  Daily quota exceeded - stopping generation`);
        break;
      }
      
      switch (contentType) {
        case 'book':
          await this.generateBookAudio(voiceType);
          break;
        case 'meditations':
          await this.generateMeditationAudio(voiceType);
          break;
        case 'stories':
          await this.generateStoryAudio(voiceType);
          break;
      }
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  try {
    const scheduler = new AudioScheduler();
    
    switch (command) {
      case 'generate':
        const voiceType = args[1] || 'male';
        const contentTypes = args[2] ? args[2].split(',') : ['book', 'meditations', 'stories'];
        await scheduler.generateWithQuotaManagement(voiceType, contentTypes);
        break;
        
      case 'schedule':
        scheduler.scheduleGeneration();
        // Keep the process running
        process.on('SIGINT', () => {
          console.log('\n👋 Stopping scheduler...');
          process.exit(0);
        });
        break;
        
      case 'status':
        console.log(`📊 API Usage: ${scheduler.dailyUsage}/${scheduler.quotaConfig.dailyLimit} requests today`);
        console.log(`💰 Tier: ${scheduler.isPaidTier ? 'Paid' : 'Free'}`);
        console.log(`🔄 Can make requests: ${scheduler.canMakeRequest()}`);
        break;
        
      case 'test':
        console.log('🧪 Testing API connection...');
        await scheduler.generateAudioWithGemini('This is a test of the audio generation system.', 'male');
        console.log('✅ API test successful!');
        break;
        
      case 'help':
      default:
        console.log(`
🎤 Audio Generation Scheduler

Usage:
  node scripts/audioScheduler.js <command> [options]

Commands:
  generate [voice] [content-types]  Generate audio for specified content
    voice: male|female (default: male)
    content-types: book,meditations,stories (default: all)
    
  schedule                        Start automatic daily generation
  status                          Show current quota status
  test                           Test API connection
  help                           Show this help message

Examples:
  node scripts/audioScheduler.js generate male book
  node scripts/audioScheduler.js generate female meditations,stories
  node scripts/audioScheduler.js schedule
  node scripts/audioScheduler.js status

Environment Variables:
  GEMINI_API_KEY                 Required: Your Gemini API key
  GEMINI_PAID_TIER              Optional: Set to 'true' for paid tier
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default AudioScheduler;
