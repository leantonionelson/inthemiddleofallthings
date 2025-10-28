# Manual Audio Upload System

## Overview

The audio system has been simplified to **only play pre-generated audio files** that you upload manually via Pages CMS. All automatic audio generation has been removed.

## What Changed

### ✅ Removed
- ❌ All audio generation scripts (`audioScheduler.js`, `generateAudio.js`, etc.)
- ❌ Gemini TTS service and API integrations
- ❌ Browser speech synthesis fallbacks
- ❌ Automatic audio scheduling
- ❌ Audio cache management
- ❌ All audio generation documentation

### ✅ Kept
- ✅ Simple audio playback from `/public/media/audio/` folders
- ✅ Voice preference (male/female) selection
- ✅ Audio index JSON files for tracking available audio
- ✅ Pre-generated audio service for playback
- ✅ Media session controls (play/pause/seek)
- ✅ Background audio support

## How It Works Now

### 1. Audio Storage Structure

Audio files are stored in these public folders:

```
public/media/audio/
├── chapters/
│   ├── index.json
│   ├── chapter-1_male.wav
│   ├── chapter-1_female.wav
│   └── ...
├── meditations/
│   ├── index.json
│   ├── meditation-id_male.wav
│   ├── meditation-id_female.wav
│   └── ...
└── stories/
    ├── index.json
    ├── story-id_male.wav
    ├── story-id_female.wav
    └── ...
```

### 2. File Naming Convention

Audio files must follow this naming pattern:
- **Format**: `{content-id}_{voice-type}.wav`
- **Example**: `the-mirror-of-everything-and-nothing_male.wav`
- **Voice types**: `male` or `female`
- **File format**: `.wav` (preferred)

### 3. Index Files

Each content type folder needs an `index.json` file that lists all available audio:

```json
{
  "generated": 1234567890,
  "type": "meditations",
  "voiceType": "male",
  "items": [
    {
      "id": "the-mirror-of-everything-and-nothing",
      "title": "The Mirror of Everything and Nothing",
      "audioFile": "the-mirror-of-everything-and-nothing_male.wav",
      "hasAudio": true
    }
  ]
}
```

## Uploading New Audio

### Via Pages CMS

1. Go to [https://pagescms.org](https://pagescms.org)
2. Sign in with GitHub
3. Select your repository
4. Navigate to the content collection (Meditations, Stories, or Book chapters)
5. Click "New" or edit existing content
6. **Upload audio file** in the "Audio File" field
7. Click "Save"

Pages CMS will automatically:
- Upload the audio to the correct folder
- Use the correct naming convention
- Update the index.json file (you may need to do this manually)

### Manual Upload

If you prefer to upload files manually:

1. **Prepare the audio file**:
   - Convert to WAV format
   - Name it correctly: `{content-id}_{voice-type}.wav`

2. **Upload to correct folder**:
   - Book chapters → `public/media/audio/chapters/`
   - Meditations → `public/media/audio/meditations/`
   - Stories → `public/media/audio/stories/`

3. **Update the index.json**:
   Add an entry to the `items` array:
   ```json
   {
     "id": "your-content-id",
     "title": "Your Content Title",
     "audioFile": "your-content-id_male.wav",
     "hasAudio": true
   }
   ```

4. **Commit and push**:
   ```bash
   git add public/media/audio/
   git commit -m "Add audio for [content name]"
   git push
   ```

## Audio Playback Behavior

### When Audio is Available
- ✅ Audio player appears with play button
- ✅ Full controls: play/pause, seek, speed adjustment
- ✅ Background audio support
- ✅ Media session controls (lock screen, headphones)

### When Audio is NOT Available
- ❌ No audio player appears
- ℹ️ User sees content only (no audio option)
- ℹ️ Error message: "No audio file available for this content"

### Voice Preference
Users can select their preferred voice in **Settings**:
- **Male Voice**: Deeper, resonant tone
- **Female Voice**: Smooth, natural tone

The app will play the user's preferred voice if available, otherwise it falls back to female voice, then male voice.

## For Developers

### Audio Services

The simplified audio system consists of:

1. **`audioManager.ts`** - Main playback service
   - Only handles pre-generated audio
   - No TTS generation
   - Simple play/pause/seek controls

2. **`genericAudioService.ts`** - Content audio lookup
   - Checks for available audio files
   - Loads audio indexes
   - Returns audio URLs

3. **`unifiedContentService.ts`** - Content + audio integration
   - Checks audio availability by content ID
   - Used by the audio availability hook

### Audio Availability Check

Components use the `useAudioAvailability` hook:

```typescript
const { hasAudio, isChecking } = useAudioAvailability({
  contentId: 'meditation-id',
  contentType: 'meditation',
  contentTitle: 'Content Title',
  content: 'Content text...'
});
```

### Testing Audio

1. **Build the project**: `npm run build`
2. **Start dev server**: `npm run dev`
3. **Navigate to content** with audio
4. **Click audio button** to test playback
5. **Check console** for audio loading messages

### Troubleshooting

**Audio not playing?**
- Check file exists in correct folder
- Verify file naming: `{id}_{voice}.wav`
- Check `index.json` has entry with `hasAudio: true`
- Check browser console for errors

**Wrong voice playing?**
- Check voice preference in Settings
- Verify both voice files exist
- Check `index.json` lists both files

**Audio button not appearing?**
- Audio availability check may be failing
- Check `index.json` is loaded correctly
- Verify content ID matches audio file name

## Summary

The audio system is now **completely manual**:
- ✅ You upload audio files via CMS or manually
- ✅ App plays existing audio files only
- ❌ No automatic generation
- ❌ No TTS fallbacks
- ❌ No browser speech

This gives you full control over audio quality and consistency!

