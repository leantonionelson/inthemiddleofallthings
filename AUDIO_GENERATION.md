# Audio Generation System

This project now includes an efficient batch processing system for generating audio files using AI text-to-speech, eliminating the need for real-time audio generation.

## 🎯 Overview

Instead of generating audio on-demand in the browser (which is slow and uses API quota), this system:

1. **Pre-generates** all audio files using a Node.js script
2. **Saves** WAV files to `public/media/audio/chapters/`
3. **Serves** static audio files to users instantly
4. **Falls back** to real-time TTS only if pre-generated audio is unavailable

## 🚀 Quick Start

### 1. Set up your API key
```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
```

### 2. Test the API connection
```bash
npm run test-audio-api
```

### 3. Generate all audio files
```bash
npm run generate-audio
```

## 📁 File Structure

After running the script, you'll have:

```
public/media/audio/chapters/
├── index.json              # Metadata about all audio files
├── introduction.wav        # Introduction chapter
├── chapter-1.wav          # Chapter 1: The Axis of Consequence
├── chapter-2.wav          # Chapter 2: The Shape of Desire
├── part-1-intro.wav       # Part I introduction
└── ...                    # All other chapters (28 total)
```

## 🔧 How It Works

### The Batch Script (`scripts/generateAudio.js`)
- Reads all markdown files from `src/book/`
- Processes text to remove markdown formatting
- Calls Gemini TTS API to generate high-quality audio
- Saves WAV files with consistent naming
- Creates an index file for the frontend
- Includes progress tracking and error handling

### Frontend Integration
The existing TTS service now checks for pre-generated audio in this order:

1. **Pre-generated audio** (fastest - static files)
2. **Memory cache** (in-browser temporary cache)
3. **IndexedDB cache** (persistent browser cache)
4. **Real-time TTS** (slowest - API calls)

### Performance Benefits

| Method | Speed | API Usage | User Experience |
|--------|-------|-----------|-----------------|
| **Pre-generated** | Instant | Zero | Perfect |
| Real-time TTS | 5-15s | High | Poor |

## 📊 Expected Results

- **Total chapters**: ~28 chapters
- **Average file size**: ~200-500 KB per chapter
- **Total storage**: ~10-15 MB for all audio
- **Generation time**: ~15-30 minutes (one-time)
- **User experience**: Instant audio playback

## 🛠️ Customization

### Voice Settings
Edit `scripts/generateAudio.js`:

```javascript
const TTS_CONFIG = {
  voiceName: 'Zephyr',     // Options: Zephyr, Aoede, Aria
  speakingRate: 1.15       // 0.5 to 2.0 (1.0 = normal)
};
```

### Output Directory
Change the output path in the script:

```javascript
const OUTPUT_DIR = path.join(__dirname, '../public/media/audio/chapters');
```

## 🔍 Monitoring & Debug

### Check generation status
```bash
# See what chapters need generation
node scripts/generateAudio.js generate --dry-run
```

### Browser debugging
In development, access debug tools:
```javascript
// In browser console
audioDebug.cacheStatus()    // See what's cached
audioDebug.getCacheSize()   // Cache statistics
audioDebug.clearCache()     // Clear all caches
```

## 🚨 Troubleshooting

### "No API key configured"
```bash
export GEMINI_API_KEY="your_actual_api_key"
```

### "Rate limit exceeded"
- Wait for quota reset (usually 24 hours)
- The script will resume where it left off

### Files not loading in app
- Check that `public/media/audio/chapters/index.json` exists
- Verify audio files are in the correct directory
- Refresh the audio index: `preGeneratedAudioService.refreshIndex()`

### Large chapters timing out
- The script automatically chunks large content
- Increase delays between API calls if needed

## 💰 Cost Optimization

### Gemini TTS Pricing
- Check current pricing at [Google AI Studio](https://ai.google.dev/)
- Monitor usage in Google Cloud Console
- Consider generating audio in batches during off-peak hours

### Storage Optimization
- WAV files are uncompressed but high quality
- Consider converting to MP3 for smaller file sizes (requires additional processing)
- Audio files are cached by browsers after first download

## 🔄 Maintenance

### Adding new chapters
1. Add markdown files to `src/book/`
2. Update `bookStructure` in both:
   - `scripts/generateAudio.js`
   - `src/data/bookContent.ts`
3. Run `npm run generate-audio` to generate new audio files

### Updating existing chapters
1. Edit the markdown content
2. Delete the corresponding WAV file from `public/media/audio/chapters/`
3. Run `npm run generate-audio` (it will skip existing files)

### Voice changes
1. Update `TTS_CONFIG` in the script
2. Delete all existing WAV files to force regeneration
3. Run `npm run generate-audio`

## ✅ Verification

After generation, verify everything works:

1. **Check files exist**: `ls -la public/media/audio/chapters/`
2. **Verify index**: `cat public/media/audio/chapters/index.json`
3. **Test in app**: Open a chapter and check for instant audio playback
4. **Check console**: Should see "🎵 Using pre-generated audio"

## 🎉 Benefits Achieved

- ✅ **Instant audio**: No more 5-15 second waits
- ✅ **Zero API usage**: During normal app usage
- ✅ **Offline capable**: Audio works without internet (after first load)
- ✅ **Consistent quality**: All audio generated with same voice/settings
- ✅ **Scalable**: New users don't trigger API calls
- ✅ **Cost effective**: One-time generation vs per-user generation

Your app now provides a professional, instant audio experience! 🎵
