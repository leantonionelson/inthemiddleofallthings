#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check story files in the stories directory
const storiesDir = path.join(__dirname, '../src/stories/stories');

console.log('🔍 Checking story files...\n');

try {
  const files = fs.readdirSync(storiesDir);
  const mdFiles = files.filter(file => file.endsWith('.md'));
  
  console.log(`Found ${mdFiles.length} story files:`);
  console.log('=====================================');
  
  mdFiles.forEach((file, index) => {
    const filePath = path.join(storiesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract title and tags
    const lines = content.split('\n');
    const title = lines.find(line => line.startsWith('# '))?.substring(2) || 'No title';
    const tagsLine = lines.find(line => line.startsWith('**Tags:**'));
    const tags = tagsLine ? tagsLine.replace('**Tags:**', '').trim().split(',').map(t => t.trim()) : [];
    
    console.log(`${index + 1}. ${title}`);
    console.log(`   File: ${file}`);
    console.log(`   Tags: ${tags.join(', ')}`);
    console.log(`   Size: ${content.length} characters\n`);
  });
  
  console.log('✅ All story files checked successfully!');
  console.log('\n💡 Tips:');
  console.log('- New .md files will be automatically detected by Vite');
  console.log('- Use the refresh button in the app to reload stories');
  console.log('- Make sure files follow the format: # Title, **Tags:**, ---, content');
  
} catch (error) {
  console.error('❌ Error checking story files:', error.message);
  process.exit(1);
}

