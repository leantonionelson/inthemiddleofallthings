# Audio Generation Scheduler

A comprehensive, automated audio generation system that manages API quotas and generates audio for all content types (book chapters, meditations, and stories) with intelligent scheduling.

## 🎯 Overview

The Audio Scheduler is designed to:
- **Automatically generate audio** for all content types
- **Manage API quotas** intelligently to avoid rate limiting
- **Schedule daily generation** to maximize efficiency
- **Support multiple voice types** (male/female)
- **Handle large content libraries** with progress tracking
- **Resume interrupted generation** seamlessly

## 🚀 Quick Start

### 1. Set up your API key
```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
```

### 2. Test the scheduler
```bash
npm run audio-test
```

### 3. Generate audio manually
```bash
# Generate all content types with male voice (only new/missing files)
npm run audio-generate male

# Generate only meditations with female voice
npm run audio-generate female meditations

# Generate book chapters and stories
npm run audio-generate male book,stories

# Check for modified files and regenerate only changed content
npm run audio-check male book

# Force regenerate all files (useful after voice changes)
npm run audio-force female meditations
```

### 4. Start automatic scheduling
```bash
npm run audio-schedule
```

## 📁 Content Types Supported

### 📚 Book Chapters (29 files)
- **Introduction**: 1 file
- **Part I-VI**: 28 chapters + part introductions
- **Outro**: 1 file
- **Output**: `public/media/audio/chapters/`

### 🧘 Meditations (45 files)
- **45 meditation files** from `src/meditations/meditations/`
- **Topics**: breath, awareness, presence, mindfulness
- **Output**: `public/media/audio/meditations/`

### 📖 Stories (1+ files)
- **Story files** from `src/stories/stories/`
- **Current**: 1 story ("INTRUDENT")
- **Output**: `public/media/audio/stories/`

## 🎙️ Voice Options

### Male Voice (Charon)
- **Style**: Deep, resonant, authoritative
- **Use case**: Book chapters, stories
- **Suffix**: `_male.wav`

### Female Voice (Zephyr)
- **Style**: Smooth, natural, calming
- **Use case**: Meditations, gentle content
- **Suffix**: `_female.wav`

## ⚙️ Configuration

### API Quota Management
```javascript
const QUOTA_CONFIG = {
  freeTier: {
    dailyLimit: 15,        // 15 requests per day
    resetTime: '00:00',    // UTC reset time
    cooldownMs: 3000       // 3 seconds between requests
  },
  paidTier: {
    dailyLimit: 1000,      // 1000 requests per day
    resetTime: '00:00',
    cooldownMs: 1000       // 1 second between requests
  }
};
```

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional - set to 'true' for paid tier
GEMINI_PAID_TIER=true
```

## 📊 Usage Commands

### Manual Generation
```bash
# Generate all content with male voice (only new/missing files)
node scripts/audioScheduler.js generate male

# Generate specific content types
node scripts/audioScheduler.js generate female meditations,stories

# Generate only book chapters
node scripts/audioScheduler.js generate male book

# Check for modified files and regenerate only changed content
node scripts/audioScheduler.js check male book

# Force regenerate all files (ignore modification times)
node scripts/audioScheduler.js force female meditations
```

### Automatic Scheduling
```bash
# Start the scheduler (runs daily at 2 AM UTC)
node scripts/audioScheduler.js schedule
```

### Status and Testing
```bash
# Check current quota status
node scripts/audioScheduler.js status

# Test API connection
node scripts/audioScheduler.js test
```

### NPM Scripts (Recommended)
```bash
# Generate audio (only new/missing files)
npm run audio-generate male
npm run audio-generate female meditations

# Check for modified files and regenerate only changed content
npm run audio-check male book
npm run audio-check female meditations

# Force regenerate all files
npm run audio-force male book
npm run audio-force female meditations

# Start automatic scheduling
npm run audio-schedule

# Check quota status
npm run audio-status

# Test API connection
npm run audio-test
```

## 🕐 Scheduling Strategy

### Daily Schedule (2:00 AM UTC)
1. **Reset quota counter** for new day
2. **Generate male voice** (priority content)
3. **Generate female voice** (if quota allows)
4. **Log completion status**

### Priority Order
1. **Book chapters** (most important)
2. **Meditations** (secondary)
3. **Stories** (tertiary)

### Quota Management
- **Free tier**: 15 requests/day → ~2-3 days to complete all content
- **Paid tier**: 1000 requests/day → Complete in 1 day
- **Smart resumption**: Continues where it left off

## 📈 Progress Tracking

### Real-time Statistics
```
📊 Generation Complete!
📚 Book: 5 processed, 24 skipped, 0 failed
🧘 Meditations: 10 processed, 35 skipped, 0 failed
📖 Stories: 1 processed, 0 skipped, 0 failed
📊 Total API Usage: 16/15 requests today
```

### File Organization
```
public/media/audio/
├── chapters/
│   ├── introduction_male.wav
│   ├── chapter-1_male.wav
│   └── ...
├── meditations/
│   ├── between-two-breaths_male.wav
│   ├── the-anchor-of-breath_female.wav
│   └── ...
└── stories/
    ├── intrudent_male.wav
    └── ...
```

## 🔧 Advanced Features

### Intelligent File Change Detection
- **Modification time checking**: Compares source file timestamps with audio files
- **Automatic regeneration**: Only regenerates audio for modified content
- **Quota efficiency**: Saves API requests by skipping unchanged files
- **Force regeneration**: Option to regenerate all files regardless of modification time

### Intelligent Quota Management
- **Daily reset detection**: Automatically resets at midnight UTC
- **Usage tracking**: Real-time quota monitoring
- **Graceful degradation**: Stops when quota exceeded
- **Resume capability**: Continues from where it left off

### Content Processing
- **Markdown parsing**: Removes formatting for clean audio
- **Text optimization**: Prepares content for TTS
- **WAV generation**: Creates proper audio files
- **Error handling**: Robust error recovery

### Scheduling Options
- **Cron-based**: Uses node-cron for reliable scheduling
- **Timezone aware**: Runs in UTC for consistency
- **Background operation**: Runs continuously
- **Graceful shutdown**: Handles SIGINT properly

## 🚨 Troubleshooting

### Common Issues

#### "Daily API quota exceeded"
```bash
# Check current status
npm run audio-status

# Wait for quota reset (24 hours) or upgrade to paid tier
```

#### "No audio data received from API"
```bash
# Test API connection
npm run audio-test

# Check API key configuration
echo $GEMINI_API_KEY
```

#### "File already exists" (skipping)
```bash
# This is normal - files are skipped if they already exist
# To force regeneration, delete the file first
rm public/media/audio/chapters/chapter-1_male.wav
```

### Debug Mode
```bash
# Run with verbose logging
DEBUG=* npm run audio-generate male book
```

## 📊 Expected Results

### Content Volume
- **Book chapters**: 29 files × 2 voices = 58 files
- **Meditations**: 45 files × 2 voices = 90 files  
- **Stories**: 1+ files × 2 voices = 2+ files
- **Total**: 150+ audio files

### File Sizes
- **Average chapter**: 5-7 MB
- **Average meditation**: 2-4 MB
- **Average story**: 10-15 MB
- **Total storage**: ~500-800 MB

### Generation Time
- **Free tier**: 2-3 days (15 requests/day)
- **Paid tier**: 1 day (1000 requests/day)
- **Per file**: 3-5 seconds generation + 3 seconds cooldown

## 🎯 Benefits

### For Users
- ✅ **Instant audio playback** for all content
- ✅ **Multiple voice options** for preference
- ✅ **Consistent quality** across all content
- ✅ **Offline capability** after first load

### For Development
- ✅ **Zero API usage** during normal app usage
- ✅ **Automated generation** with scheduling
- ✅ **Quota management** prevents rate limiting
- ✅ **Progress tracking** for monitoring

### For Operations
- ✅ **Cost effective** one-time generation
- ✅ **Scalable** for new content
- ✅ **Reliable** with error handling
- ✅ **Maintainable** with clear structure

## 🔄 Maintenance

### Adding New Content
1. **Add markdown files** to appropriate directories
2. **Run generation** for new content:
   ```bash
   npm run audio-generate male meditations
   ```
3. **Files are automatically detected** and processed

### Editing Existing Content
1. **Edit markdown files** as needed
2. **Run check command** to regenerate only changed files:
   ```bash
   npm run audio-check male book
   ```
3. **Only modified files** will be regenerated, saving API quota

### Updating Existing Content
1. **Edit markdown files** as needed
2. **Delete corresponding audio files** to force regeneration
3. **Run generation** to update audio

### Voice Changes
1. **Update voice settings** in `scripts/audioScheduler.js`
2. **Delete all audio files** to force regeneration
3. **Run full generation** with new voice settings

## 🎉 Current Status

### Implementation Complete ✅
- ✅ **Scheduler script** created and tested
- ✅ **All content types** supported (book, meditations, stories)
- ✅ **Quota management** implemented
- ✅ **Automatic scheduling** configured
- ✅ **Error handling** robust
- ✅ **Documentation** comprehensive

### Ready for Production 🚀
The Audio Scheduler is ready for production use and will automatically generate audio for all content types while respecting API quotas and providing excellent user experience.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console output for specific errors
3. Verify API key configuration
4. Check quota status with `npm run audio-status`

The scheduler is designed to be robust and self-healing, automatically managing quotas and resuming generation as needed.
