# Audio Button Behavior

## Overview

The audio play button automatically shows/hides based on audio file availability.

## How It Works

### Audio Availability Check

The `ReaderNavigation` component uses the `useAudioAvailability` hook to check if audio exists for the current content:

```typescript
const { hasAudio, isChecking } = useAudioAvailability({
  contentId: contentId || '',
  contentType: contentType as 'story' | 'meditation' | 'chapter',
  contentTitle: contentTitle || '',
  content: content || ''
});
```

### Button Display Logic

```typescript
{hasAudio === true && (
  // Show button
)}
```

**When audio button is HIDDEN:**
- `hasAudio === false` - Audio file does not exist for this content
- `hasAudio === null` - Currently checking for audio availability (don't show button until confirmed)

**When audio button is SHOWN:**
- `hasAudio === true` - Audio file exists and is ready to play

## User Experience

### With Audio Available ✅
```
┌─────────────────────────────────┐
│  ▶️  Chapter 1   ← →            │
│  Audio button visible & active  │
└─────────────────────────────────┘
```

### Without Audio Available ❌
```
┌─────────────────────────────────┐
│      Chapter 1   ← →            │
│  No audio button shown          │
└─────────────────────────────────┘
```

### Checking for Audio ⏳
```
┌─────────────────────────────────┐
│  ⏸️  Chapter 1   ← →            │
│  Button disabled while checking │
└─────────────────────────────────┘
```

## Technical Details

### Audio Index Check

The system checks the audio index files:
- `public/media/audio/chapters/index.json`
- `public/media/audio/meditations/index.json`
- `public/media/audio/stories/index.json`

Each index contains entries like:
```json
{
  "items": [
    {
      "id": "chapter-id",
      "title": "Chapter Title",
      "audioFile": "chapter-id_male.wav",
      "hasAudio": true
    }
  ]
}
```

### Fallback Logic

The system checks for audio in this order:
1. User's preferred voice (male/female)
2. Female voice (fallback)
3. Male voice (final fallback)

If none exist, `hasAudio` returns `false` and the button is hidden.

## For Content Creators

### To Enable Audio Button
1. Upload audio file to appropriate folder
2. Name file: `{content-id}_{voice-type}.wav`
3. Update `index.json` with:
   ```json
   {
     "id": "content-id",
     "audioFile": "content-id_male.wav",
     "hasAudio": true
   }
   ```
4. Commit and push changes
5. Button will automatically appear for that content

### To Disable Audio Button
Simply don't upload an audio file, or set `hasAudio: false` in the index.

## Implementation

The audio button visibility is handled in:
- **Component**: `src/components/ReaderNavigation.tsx`
- **Hook**: `src/hooks/useAudioAvailability.ts`
- **Service**: `src/services/unifiedContentService.ts`

This ensures a clean, intuitive experience where users only see the audio button when audio is actually available to play.

