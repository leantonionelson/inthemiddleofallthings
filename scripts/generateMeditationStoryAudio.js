#!/usr/bin/env node

/**
 * Generate audio for meditations and stories using Gemini TTS
 * Usage: node generateMeditationStoryAudio.js generate [meditations|stories] [male|female]
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VOICE_CONFIGS = {
  male: {
    name: 'Charon',
    speakingRate: 1.0,
    pitch: -2.0
  },
  female: {
    name: 'Zephyr', 
    speakingRate: 1.15,
    pitch: 2.0
  }
};

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate audio for a single content item
 */
async function generateAudio(content, voiceConfig, outputPath) {
  try {
    console.log(`🎵 Generating audio: ${path.basename(outputPath)}`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: `Generate high-quality audio narration for this content using the voice "${voiceConfig.name}" with speaking rate ${voiceConfig.speakingRate} and pitch ${voiceConfig.pitch}. The content is:

${content}`
        }]
      }],
      generationConfig: {
        responseMimeType: 'audio/wav',
        responseSchema: {
          type: 'object',
          properties: {
            audio: {
              type: 'string',
              description: 'Base64 encoded WAV audio data'
            }
          }
        }
      }
    });

    const response = await result.response;
    const data = response.text();
    
    // Parse the JSON response
    const audioData = JSON.parse(data);
    
    if (audioData.audio) {
      // Decode base64 audio data
      const audioBuffer = Buffer.from(audioData.audio, 'base64');
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write audio file
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`✅ Generated: ${path.basename(outputPath)}`);
      return true;
    } else {
      console.error(`❌ No audio data in response for ${path.basename(outputPath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error generating audio for ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

/**
 * Load content from markdown files
 */
function loadContent(contentType) {
  const contentDir = path.join(__dirname, '..', 'src', contentType, contentType);
  const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'));
  
  const content = [];
  
  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const contentText = fs.readFileSync(filePath, 'utf8');
    const id = path.basename(file, '.md');
    
    content.push({
      id,
      title: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: contentText,
      file
    });
  }
  
  return content;
}

/**
 * Generate audio for all content of a type
 */
async function generateAllAudio(contentType, voiceType) {
  console.log(`🎵 Generating ${voiceType} audio for ${contentType}...`);
  
  const content = loadContent(contentType);
  const voiceConfig = VOICE_CONFIGS[voiceType];
  
  if (!voiceConfig) {
    console.error(`❌ Invalid voice type: ${voiceType}. Use 'male' or 'female'`);
    return;
  }
  
  const outputDir = path.join(__dirname, '..', 'public', 'media', 'audio', contentType);
  const indexFile = path.join(outputDir, 'index.json');
  
  // Load existing index or create new one
  let index = { items: [] };
  if (fs.existsSync(indexFile)) {
    try {
      index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    } catch (error) {
      console.log('📄 Creating new index file');
    }
  }
  
  let successCount = 0;
  let totalCount = content.length;
  
  for (const item of content) {
    const audioFileName = `${item.id}_${voiceType}.wav`;
    const audioPath = path.join(outputDir, audioFileName);
    
    // Skip if audio already exists
    if (fs.existsSync(audioPath)) {
      console.log(`⏭️  Skipping ${audioFileName} (already exists)`);
      successCount++;
      continue;
    }
    
    const success = await generateAudio(item.content, voiceConfig, audioPath);
    if (success) {
      successCount++;
      
      // Update index
      const existingItem = index.items.find(i => i.id === item.id);
      if (existingItem) {
        existingItem.audioFile = audioFileName;
        existingItem.hasAudio = true;
      } else {
        index.items.push({
          id: item.id,
          title: item.title,
          type: contentType.slice(0, -1), // Remove 's' from 'meditations' -> 'meditation'
          audioFile: audioFileName,
          hasAudio: true
        });
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save updated index
  index.generated = Date.now();
  index.type = contentType;
  index.voiceType = voiceType;
  index.voice = voiceConfig.name;
  
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
  
  console.log(`\n🎉 Audio generation complete!`);
  console.log(`✅ Successfully generated: ${successCount}/${totalCount} files`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`📄 Index file: ${indexFile}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node generateMeditationStoryAudio.js generate [meditations|stories] [male|female]');
  console.log('Example: node generateMeditationStoryAudio.js generate meditations female');
  process.exit(1);
}

const [command, contentType, voiceType] = args;

if (command !== 'generate') {
  console.error('❌ Invalid command. Use "generate"');
  process.exit(1);
}

if (!['meditations', 'stories'].includes(contentType)) {
  console.error('❌ Invalid content type. Use "meditations" or "stories"');
  process.exit(1);
}

if (!['male', 'female'].includes(voiceType)) {
  console.error('❌ Invalid voice type. Use "male" or "female"');
  process.exit(1);
}

generateAllAudio(contentType, voiceType).catch(console.error);