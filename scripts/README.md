# Audio Generation Script

This script pre-generates audio files for all book chapters using Gemini TTS, eliminating the need for real-time audio generation in the browser.

## Setup

1. **Set your Gemini API key**:
   ```bash
   export GEMINI_API_KEY="your_gemini_api_key_here"
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

## Usage

### Test API Connection
Before generating audio, test that your API key works:

```bash
npm run test-audio-api
```

### Generate All Audio Files
Generate WAV files for all book chapters:

```bash
npm run generate-audio
```

This will:
- Read all markdown files from `src/book/`
- Process text to remove markdown formatting
- Generate high-quality audio using Gemini TTS
- Save WAV files to `public/media/audio/chapters/`
- Create an index file for the frontend to use
- Skip chapters that already have audio files

## Output

The script generates:
- **Audio files**: `public/media/audio/chapters/{chapter-id}.wav`
- **Index file**: `public/media/audio/chapters/index.json`

## Configuration

### TTS Settings (in generateAudio.js)
```javascript
const TTS_CONFIG = {
  voiceName: 'Zephyr',  // Gemini voice to use
  speakingRate: 1.15    // Speech rate (1.0 = normal)
};
```

### Available Voices
- Zephyr (default) - Natural, smooth voice
- Aoede - Expressive, dramatic voice
- Aria - Clear, professional voice

## Features

- **Efficient Processing**: Skips existing files to avoid re-generation
- **Error Handling**: Continues processing even if individual chapters fail
- **Rate Limiting**: Respects API limits with delays between requests
- **Chunking**: Splits large chapters into manageable pieces
- **Progress Tracking**: Shows detailed progress and statistics

## API Costs

Gemini TTS pricing varies by usage. Monitor your API usage in the Google Cloud Console. The script includes rate limiting to avoid hitting quotas too quickly.

## Troubleshooting

### "No API key configured"
- Set the `GEMINI_API_KEY` environment variable
- Ensure the key has access to Gemini TTS API

### "Rate limit exceeded"
- Wait for your quota to reset (usually daily)
- Consider upgrading your API plan for higher limits

### Large chapters taking too long
- The script automatically splits long chapters into chunks
- Each chunk is processed separately with delays

## Integration with App

After running the script, update your app to use the pre-generated files instead of real-time TTS:

1. The script creates `public/media/audio/chapters/index.json` with all available audio files
2. Your app can check this index and serve static audio files
3. Fallback to real-time TTS only if pre-generated audio is unavailable

## File Structure

```
public/media/audio/chapters/
├── index.json              # Index of all generated audio
├── introduction.wav        # Introduction chapter
├── chapter-1.wav          # Chapter 1: The Axis of Consequence  
├── chapter-2.wav          # Chapter 2: The Shape of Desire
└── ...                    # All other chapters
```

## Manual Usage

You can also run the script directly:

```bash
# Test API
node scripts/generateAudio.js test

# Generate all audio
node scripts/generateAudio.js generate

# With environment variable inline
GEMINI_API_KEY=your_key node scripts/generateAudio.js generate
```
