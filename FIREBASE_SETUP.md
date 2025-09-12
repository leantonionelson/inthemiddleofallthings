# Firebase Integration Setup

## Overview
Firebase has been fully integrated into the application to provide:
- **User Authentication** (Email/Password, Anonymous)
- **Highlight Storage** (Firestore)
- **User Progress Tracking** (Firestore)
- **Cross-device Synchronization**

## Firebase Services Implemented

### 1. Firebase Configuration (`src/services/firebase.ts`)
- Updated with your Firebase project credentials
- Initialized Firebase app, Auth, and Firestore
- Project: `inthemiddleofallthings`

### 2. Authentication Service (`src/services/firebaseAuth.ts`)
**Features:**
- Email/password sign up and sign in
- Anonymous authentication
- User profile management in Firestore
- Onboarding completion tracking
- Last active timestamp updates

**Methods:**
- `signInWithEmail(email, password)`
- `createAccount(email, password, name?)`
- `signInAnonymously()`
- `signOut()`
- `getUserProfile(uid)`
- `updateUserProfile(uid, updates)`
- `completeOnboarding(uid, data)`

### 3. Highlights Service (`src/services/firebaseHighlights.ts`)
**Features:**
- Save user highlights to Firestore
- Retrieve highlights by user or chapter
- Search highlights by content
- Delete individual or all highlights
- Real-time sync across devices

**Methods:**
- `saveHighlight(userId, highlight)`
- `getUserHighlights(userId)`
- `getChapterHighlights(userId, chapterId)`
- `searchHighlights(userId, searchTerm)`
- `deleteHighlight(highlightId)`
- `deleteAllUserHighlights(userId)`

### 4. Progress Service (`src/services/firebaseProgress.ts`)
**Features:**
- Track reading progress across devices
- Monitor reading sessions and time
- Store user preferences
- Calculate reading statistics and streaks

**Methods:**
- `getUserProgress(userId)`
- `updateBookProgress(userId, chapterIndex)`
- `updateMeditationProgress(userId, index, id)`
- `markChapterRead(userId, chapterIndex)`
- `markMeditationCompleted(userId, meditationId)`
- `updatePreferences(userId, preferences)`
- `getReadingStats(userId)`

## Data Structure

### User Profile (Firestore: `users` collection)
```typescript
{
  uid: string;
  email?: string;
  name?: string;
  isAnonymous: boolean;
  onboardingCompleted: boolean;
  selectedAIPersona?: string;
  createdAt: Date;
  lastActive: Date;
}
```

### User Progress (Firestore: `userProgress` collection)
```typescript
{
  userId: string;
  currentBookChapter: number;
  currentMeditation: number;
  bookChaptersRead: number[];
  meditationsCompleted: string[];
  readingTimeTotal: number;
  lastActiveChapter?: string;
  lastActiveMeditation?: string;
  preferences: {
    fontSize: string;
    darkMode: boolean;
    autoPlayAudio: boolean;
    voicePreference: 'male' | 'female';
  };
  lastUpdated: Date;
}
```

### Highlights (Firestore: `highlights` collection)
```typescript
{
  id: string;
  userId: string;
  text: string;
  chapterId: string;
  chapterTitle: string;
  timestamp: Date;
  position: { start: number; end: number; };
  reflection?: { content: string; };
}
```

### Reading Sessions (Firestore: `readingSessions` collection)
```typescript
{
  userId: string;
  contentType: 'book' | 'meditation';
  contentId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  completed: boolean;
}
```

## Updated Components

### SavedPage (`src/features/Saved/SavedPage.tsx`)
- Now loads highlights from Firebase for authenticated users
- Falls back to localStorage for anonymous/demo users
- Implements cloud sync for highlight management

### AuthPage (`src/features/Auth/AuthPage.tsx`)
- Added Firebase authentication options
- Email/password and anonymous sign-in
- Maintains demo mode as fallback
- Automatic progress initialization for new users

## Authentication Flow

1. **Anonymous Users**: Sign in anonymously → Onboarding → App usage (local storage only)
2. **Email Users**: Sign up/in with email → Onboarding (if new) → App usage (cloud sync)
3. **Demo Users**: Fallback to localStorage-based demo mode

## User Capabilities by Auth Type

### Anonymous Users (Restricted)
❌ **Cloud progress tracking** - Progress only saved locally  
❌ **Cloud highlight storage** - Highlights only saved locally  
❌ **AI features** - No access to AI functionality  
❌ **Cross-device sync** - No cloud synchronization  
✅ **Local functionality** - Full app usage with local storage  
✅ **Upgrade prompts** - Encouraged to create accounts for full features  

### Authenticated Users (Full Access)
✅ **Cloud progress tracking** - Progress synced across devices  
✅ **Cloud highlight storage** - Highlights saved to Firestore  
✅ **AI features** - Full access to AI functionality  
✅ **Cross-device sync** - All data synchronized  
✅ **Analytics tracking** - Reading sessions and statistics  
✅ **Preference sync** - Settings synced across devices  

## Features Enabled

### For Authenticated Users:
✅ **Cross-device sync** - Progress and highlights sync across devices  
✅ **Cloud backup** - Data safely stored in Firestore  
✅ **Reading analytics** - Track time spent, chapters read, streaks  
✅ **Preference sync** - Font size, theme, audio settings sync  
✅ **Highlight search** - Advanced search across all saved highlights  
✅ **Progress restoration** - Resume exactly where you left off  

### For Anonymous/Demo Users:
✅ **Local storage** - Data stored locally as fallback  
✅ **Full functionality** - All features work offline  
✅ **Easy upgrade** - Can create account later to sync data  

## Security Rules (To be configured in Firebase Console)

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data (authenticated users only, no anonymous)
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId && 
        request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
    
    // Progress tracking restricted to authenticated users only
    match /userProgress/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId && 
        request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
    
    // Highlights restricted to authenticated users only
    match /highlights/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId &&
        request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
    
    // Reading sessions restricted to authenticated users only
    match /readingSessions/{document} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId &&
        request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
  }
}
```

## Next Steps

1. **Configure Firestore Security Rules** in Firebase Console
2. **Enable Authentication Methods** (Email/Password, Anonymous)
3. **Test cross-device synchronization**
4. **Monitor Firebase usage** and quotas
5. **Consider upgrading** to Firebase paid plan for production

## Dependencies Installed
- `firebase` - Latest Firebase SDK

The app now provides a seamless experience with cloud synchronization while maintaining offline capability as a fallback!
