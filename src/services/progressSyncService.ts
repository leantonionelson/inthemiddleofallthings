import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';
import { readingProgressService, ReadingProgress } from './readingProgressService';

const PROGRESS_COLLECTION = 'userProgress';

/**
 * Get Firestore document reference for user's progress
 */
function getUserProgressRef(userId: string) {
  return doc(db, PROGRESS_COLLECTION, userId);
}

/**
 * Sync local progress to Firebase
 */
export async function syncProgressToFirebase(user: User): Promise<void> {
  try {
    const localProgress = readingProgressService.getAllProgress();
    
    // Convert to format suitable for Firestore
    const progressData = {
      userId: user.uid,
      progress: localProgress,
      lastSynced: new Date().toISOString(),
    };

    await setDoc(getUserProgressRef(user.uid), progressData, { merge: true });
    console.log('[ProgressSync] Synced local progress to Firebase');
  } catch (error) {
    console.error('[ProgressSync] Error syncing to Firebase:', error);
    throw error;
  }
}

/**
 * Load progress from Firebase and merge with local
 */
export async function loadProgressFromFirebase(user: User): Promise<void> {
  try {
    const progressRef = getUserProgressRef(user.uid);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      const firebaseData = progressSnap.data();
      const firebaseProgress = firebaseData.progress as Record<string, ReadingProgress> || {};

      // Get local progress
      const localProgress = readingProgressService.getAllProgress();

      // Merge: Firebase takes precedence for conflicts, but keep local items not in Firebase
      const merged: Record<string, ReadingProgress> = { ...localProgress };

      // Update with Firebase data (newer data wins)
      Object.entries(firebaseProgress).forEach(([id, fbProgress]) => {
        const local = localProgress[id];
        if (!local || new Date(fbProgress.lastReadDate) >= new Date(local.lastReadDate)) {
          merged[id] = fbProgress;
        } else {
          // Local is newer, keep it but merge some fields
          merged[id] = {
            ...fbProgress,
            lastPosition: Math.max(local.lastPosition, fbProgress.lastPosition),
            isRead: local.isRead || fbProgress.isRead,
            readCount: Math.max(local.readCount || 0, fbProgress.readCount || 0),
          };
        }
      });

      // Save merged progress to localStorage
      readingProgressService.saveAllProgress(merged);

      // Sync merged data back to Firebase
      await syncProgressToFirebase(user);

      console.log('[ProgressSync] Loaded and merged progress from Firebase');
    } else {
      // No Firebase data, sync local to Firebase
      await syncProgressToFirebase(user);
      console.log('[ProgressSync] No Firebase data, synced local to Firebase');
    }
  } catch (error) {
    console.error('[ProgressSync] Error loading from Firebase:', error);
    throw error;
  }
}

/**
 * Set up real-time sync listener for progress updates
 */
export function setupProgressSyncListener(
  user: User,
  onUpdate?: (progress: Record<string, ReadingProgress>) => void
): Unsubscribe {
  const progressRef = getUserProgressRef(user.uid);

  return onSnapshot(
    progressRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const firebaseProgress = data.progress as Record<string, ReadingProgress> || {};

        // Update local storage with Firebase data
        readingProgressService.saveAllProgress(firebaseProgress);

        if (onUpdate) {
          onUpdate(firebaseProgress);
        }

        console.log('[ProgressSync] Real-time update received from Firebase');
      }
    },
    (error) => {
      console.error('[ProgressSync] Error in real-time listener:', error);
    }
  );
}

/**
 * Sync progress when it's updated locally
 */
export async function syncOnProgressUpdate(user: User | null): Promise<void> {
  if (!user) return;

  try {
    // Debounce: only sync if enough time has passed since last sync
    const lastSyncKey = `lastProgressSync_${user.uid}`;
    const lastSync = localStorage.getItem(lastSyncKey);
    const now = Date.now();
    const SYNC_DEBOUNCE_MS = 2000; // 2 seconds

    if (lastSync && now - parseInt(lastSync) < SYNC_DEBOUNCE_MS) {
      return; // Skip sync, too soon
    }

    localStorage.setItem(lastSyncKey, now.toString());
    await syncProgressToFirebase(user);
  } catch (error) {
    console.error('[ProgressSync] Error syncing on update:', error);
    // Don't throw - this is a background operation
  }
}

// Note: getAllProgress is now public in readingProgressService
// No need for helper function

