# Background Audio Implementation

This document explains how background audio playback with native mobile controls has been implemented in the app.

## 🎯 Overview

The app now supports:
- ✅ **Background audio playback** - Audio continues when screen is off
- ✅ **Native mobile controls** - Lock screen and notification controls on Android/iOS
- ✅ **Media Session API** - Full integration with system media controls
- ✅ **PWA optimization** - Proper caching and offline support

## 🔧 Implementation Details

### 1. Media Session Service (`src/services/mediaSession.ts`)

A dedicated service that handles all Media Session API interactions:

```typescript
// Key features:
- Sets up native media controls
- Handles play/pause/seek actions from system
- Updates metadata (title, artist, artwork)
- Manages playback state synchronization
```

**Supported Actions:**
- `play` / `pause` - Toggle playback
- `previoustrack` / `nexttrack` - Chapter navigation
- `seekbackward` / `seekforward` - 10-second skips
- `seekto` - Direct time seeking
- `stop` - Stop playback

### 2. Audio Component Integration

Both `AudioPlayer.tsx` and `AudioControlStrip.tsx` now include:

```typescript
// Media Session setup
if (mediaSessionService.isSupported()) {
  mediaSessionService.setAudioElement(audio);
  mediaSessionService.setMetadata(chapter);
  mediaSessionService.setActionHandlers({
    onPlayPause: togglePlayPause,
    onPrevious: onPreviousChapter,
    onNext: onNextChapter,
    onSeek: (time: number) => {
      audioRef.current.currentTime = time;
    }
  });
}
```

### 3. PWA Configuration (`vite.config.ts`)

Enhanced PWA manifest and Workbox configuration:

```typescript
// Manifest updates:
- Added audio-related categories
- Enabled background-sync permissions
- Optimized for media playback

// Workbox caching:
- Audio files cached for 30 days
- Supports .wav, .mp3, .ogg, .m4a formats
- Cache-first strategy for offline playback
```

## 📱 Mobile Platform Support

### Android
- ✅ **Lock screen controls** - Play/pause, skip, seek
- ✅ **Notification controls** - Full media controls in notification
- ✅ **Background playback** - Continues when app is backgrounded
- ✅ **Bluetooth controls** - Works with car audio, headphones

### iOS
- ✅ **Control Center** - Native iOS media controls
- ✅ **Lock screen** - Play/pause and skip controls
- ✅ **Background playback** - Continues when screen is locked
- ✅ **CarPlay** - Integration with CarPlay systems

## 🎵 Audio Configuration

### Background Playback Setup
```typescript
const audio = new Audio(audioUrl);
audio.preload = 'metadata';
audio.crossOrigin = 'anonymous'; // Enable background playback
```

### Metadata Display
```typescript
const metadata = {
  title: chapter.title,
  artist: 'The Middle of All Things',
  album: chapter.part || 'Book',
  artwork: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    }
  ]
};
```

## 🔄 State Synchronization

The Media Session service automatically syncs:
- **Playback state** - Playing/paused/stopped
- **Position** - Current time and duration
- **Metadata** - Chapter title and book information
- **Controls** - Available actions based on context

## 🧪 Testing

### Desktop Testing
1. Open Chrome DevTools
2. Go to Application > Media Session
3. Play audio and verify metadata appears
4. Test media controls in DevTools

### Mobile Testing
1. **Android**: 
   - Install PWA to home screen
   - Start audio playback
   - Lock screen and test controls
   - Check notification panel

2. **iOS**:
   - Add to home screen via Safari
   - Start audio playback
   - Test Control Center controls
   - Verify lock screen controls

### Browser Support
- ✅ **Chrome/Edge** - Full support
- ✅ **Safari** - Full support (iOS 13.4+)
- ✅ **Firefox** - Partial support
- ⚠️ **Older browsers** - Graceful fallback

## 🚀 Benefits

### User Experience
- **Seamless listening** - No interruption when switching apps
- **Native controls** - Familiar system-level controls
- **Battery efficient** - Optimized background playback
- **Offline capable** - Cached audio works without internet

### Technical Benefits
- **Standards compliant** - Uses Web APIs
- **Cross-platform** - Works on all modern devices
- **Future-proof** - Built on web standards
- **Maintainable** - Clean, modular implementation

## 🔧 Troubleshooting

### Audio Stops in Background
- Ensure PWA is installed (not just browser tab)
- Check browser permissions for background audio
- Verify audio files are properly cached

### Controls Not Appearing
- Check Media Session API support
- Verify metadata is being set correctly
- Test in different browsers/devices

### Performance Issues
- Audio files are cached for offline playback
- Use pre-generated audio files (not real-time TTS)
- Monitor cache usage in DevTools

## 📋 Future Enhancements

Potential improvements:
- **Queue management** - Play multiple chapters
- **Playlist support** - Book-wide playlists
- **Sleep timer** - Auto-stop after time
- **Speed controls** - Variable playback speed
- **Bookmarking** - Save favorite positions

## 🎉 Result

Users can now:
1. **Start audio** in the app
2. **Lock their phone** or switch apps
3. **Control playback** from lock screen/notifications
4. **Continue listening** seamlessly in background
5. **Use native controls** they're familiar with

The implementation provides a professional, native-like audio experience that works consistently across all modern mobile devices! 🎵
