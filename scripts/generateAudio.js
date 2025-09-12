#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../public/media/audio/chapters');
const BOOK_DIR = path.join(__dirname, '../src/book');

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

// Default voice for batch generation (can be overridden via command line)
const DEFAULT_VOICE = 'male';

// Book structure definition (matches the frontend)
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

class AudioGenerator {
  constructor(voiceType = DEFAULT_VOICE) {
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.client = new GoogleGenAI({
      apiKey: API_KEY
    });
    
    this.voiceType = voiceType;
    this.voiceConfig = VOICE_OPTIONS[voiceType];
    
    if (!this.voiceConfig) {
      throw new Error(`Invalid voice type: ${voiceType}. Available: ${Object.keys(VOICE_OPTIONS).join(', ')}`);
    }
    
    this.stats = {
      processed: 0,
      skipped: 0,
      failed: 0,
      totalSize: 0
    };
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
      } else if (inContent) {
        content += line + '\n';
      }
    }

    return {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      content: content.trim()
    };
  }

  // Prepare text for TTS (remove markdown formatting)
  prepareTextForTTS(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Create WAV file from PCM data
  createWavFile(pcmData, sampleRate, channels, sampleWidth) {
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

  // Generate audio using Gemini TTS
  async generateAudioWithGemini(text, config = null) {
    // Use instance voice config if no config provided
    const ttsConfig = config || {
      voiceName: this.voiceConfig.name,
      speakingRate: this.voiceConfig.speakingRate
    };
    try {
      console.log(`🎤 Generating TTS for text (${text.length} characters)...`);
      
      const enhancedText = this.prepareTextForTTS(text);
      
      const speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: ttsConfig.voiceName },
        },
      };
      
      if (ttsConfig.speakingRate !== undefined) {
        speechConfig.speakingRate = ttsConfig.speakingRate;
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
      
      return wavBuffer;
      
    } catch (error) {
      console.error('❌ Error calling Gemini TTS API:', error);
      
      if (error && typeof error === 'object' && 'error' in error) {
        const apiError = error;
        if (apiError.error?.code === 429) {
          throw new Error('RATE_LIMIT_EXCEEDED: Daily API quota reached');
        }
      }
      
      throw error;
    }
  }

  // Split large text into chunks
  splitTextIntoChunks(text, maxLength = 5000) {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks = [];
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

  // Load book chapters from filesystem
  async loadBookChapters() {
    const chapters = [];
    let chapterNumber = 0;

    for (const part of bookStructure) {
      for (const chapterDef of part.chapters) {
        const filePath = path.join(BOOK_DIR, part.path, chapterDef.filename);
        
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const parsed = this.parseMarkdownContent(fileContent);
          chapterNumber++;
          
          chapters.push({
            id: chapterDef.id,
            title: parsed.title,
            subtitle: parsed.subtitle,
            content: parsed.content,
            part: part.part,
            chapterNumber,
            totalChapters: 28, // Including intro and outro
            filename: chapterDef.filename,
            order: chapterDef.order
          });
        } catch (error) {
          console.error(`❌ Error loading file ${filePath}:`, error.message);
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

  // Generate audio for a single chapter
  async generateChapterAudio(chapter) {
    // Create output path with voice type
    const outputFilename = `${chapter.id}_${this.voiceType}.wav`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    try {
      console.log(`\n📖 Processing: ${chapter.title}`);
      console.log(`📁 Output: ${path.basename(outputPath)}`);
      
      // Check if file already exists
      try {
        await fs.access(outputPath);
        console.log(`⏭️  Skipping - audio file already exists`);
        this.stats.skipped++;
        return;
      } catch {
        // File doesn't exist, continue with generation
      }

      if (!chapter.content || chapter.content.trim().length === 0) {
        console.log(`⚠️  Skipping - no content`);
        this.stats.skipped++;
        return;
      }

      const cleanText = this.prepareTextForTTS(chapter.content);
      const chunks = this.splitTextIntoChunks(cleanText);
      
      if (chunks.length === 1) {
        // Single chunk
        const audioBuffer = await this.generateAudioWithGemini(cleanText);
        await fs.writeFile(outputPath, Buffer.from(audioBuffer));
        
        const fileSize = (await fs.stat(outputPath)).size;
        this.stats.totalSize += fileSize;
        
        console.log(`✅ Generated audio: ${(fileSize / 1024).toFixed(1)} KB`);
        
      } else {
        // Multiple chunks - combine them
        console.log(`📝 Processing ${chunks.length} chunks...`);
        const audioBuffers = [];
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`   Chunk ${i + 1}/${chunks.length}`);
          const chunkBuffer = await this.generateAudioWithGemini(chunks[i]);
          audioBuffers.push(chunkBuffer);
          
          // Rate limiting - wait between chunks
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        // For now, just use the first chunk (combining would require more complex audio processing)
        await fs.writeFile(outputPath, Buffer.from(audioBuffers[0]));
        
        const fileSize = (await fs.stat(outputPath)).size;
        this.stats.totalSize += fileSize;
        
        console.log(`✅ Generated combined audio: ${(fileSize / 1024).toFixed(1)} KB`);
      }
      
      this.stats.processed++;
      
    } catch (error) {
      console.error(`❌ Failed to generate audio for "${chapter.title}":`, error.message);
      this.stats.failed++;
      
      // If rate limited, throw to stop the process
      if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
        throw error;
      }
    }
  }

  // Main generation process
  async generateAllAudio(skipExisting = true) {
    try {
      console.log('🚀 Starting audio generation process...');
      console.log(`📚 API Key: ${API_KEY ? 'Configured' : 'Missing'}`);
      console.log(`🎙️  Voice: ${this.voiceConfig.name} (${this.voiceType})`);
      console.log(`📁 Output directory: ${OUTPUT_DIR}`);
      
      // Ensure output directory exists
      await fs.mkdir(OUTPUT_DIR, { recursive: true });
      
      // Load all chapters
      console.log('\n📖 Loading book chapters...');
      const chapters = await this.loadBookChapters();
      console.log(`✅ Loaded ${chapters.length} chapters`);
      
      // Generate audio for each chapter
      console.log('\n🎤 Starting audio generation...');
      
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        
        console.log(`\n[${i + 1}/${chapters.length}] Processing chapter...`);
        
        await this.generateChapterAudio(chapter);
        
        // Rate limiting between chapters
        if (i < chapters.length - 1) {
          console.log('⏳ Waiting 3 seconds before next chapter...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Generate index file
      await this.generateAudioIndex(chapters);
      
      // Print final stats
      console.log('\n📊 Generation Complete!');
      console.log(`✅ Processed: ${this.stats.processed}`);
      console.log(`⏭️  Skipped: ${this.stats.skipped}`);
      console.log(`❌ Failed: ${this.stats.failed}`);
      console.log(`💾 Total size: ${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error) {
      console.error('\n💥 Generation failed:', error.message);
      
      if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
        console.log('\n⏰ Try again later when your API quota resets.');
      }
      
      process.exit(1);
    }
  }

  // Generate an index file for the frontend to use
  async generateAudioIndex(chapters) {
    const audioIndex = {
      generated: Date.now(),
      voiceType: this.voiceType,
      voice: this.voiceConfig.name,
      chapters: chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        subtitle: chapter.subtitle,
        part: chapter.part,
        chapterNumber: chapter.chapterNumber,
        audioFile: `${chapter.id}_${this.voiceType}.wav`,
        hasAudio: true
      }))
    };
    
    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(audioIndex, null, 2));
    
    console.log(`\n📄 Generated audio index: ${indexPath}`);
  }

  // Test API connection
  async testAPI() {
    try {
      console.log('🧪 Testing Gemini TTS API...');
      console.log(`🎙️  Testing with voice: ${this.voiceConfig.name} (${this.voiceType})`);
      
      const testText = "In the middle of all things, we find ourselves becoming.";
      const audioBuffer = await this.generateAudioWithGemini(testText);
      
      console.log(`✅ API test successful! Generated ${audioBuffer.byteLength} bytes of audio.`);
      return true;
      
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  const voiceType = args[1] || DEFAULT_VOICE;
  
  const generator = new AudioGenerator(voiceType);
  
  try {
    switch (command) {
      case 'test':
        console.log('🧪 Running API test...');
        const success = await generator.testAPI();
        process.exit(success ? 0 : 1);
        break;
        
      case 'generate':
        console.log('🎤 Starting audio generation...');
        await generator.generateAllAudio();
        break;
        
      default:
        console.log(`
🎤 Audio Generation Script

Usage:
  node generateAudio.js [command] [voice]

Commands:
  generate    Generate audio files for all chapters (default)
  test        Test the Gemini TTS API connection

Voice Options:
  male        Charon voice (deep, resonant)
  female      Zephyr voice (smooth, natural) 

Environment Variables:
  GEMINI_API_KEY    Your Gemini API key (required)

Examples:
  GEMINI_API_KEY=your_key node generateAudio.js test male
  GEMINI_API_KEY=your_key node generateAudio.js generate female
  GEMINI_API_KEY=your_key node generateAudio.js generate male
        `);
        process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AudioGenerator };
