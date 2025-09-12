import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface UserProgress {
  userId: string;
  currentBookChapter: number;
  currentMeditation: number;
  bookChaptersRead: number[];
  meditationsCompleted: string[];
  readingTimeTotal: number; // in minutes
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

export interface ReadingSession {
  id?: string;
  userId: string;
  contentType: 'book' | 'meditation';
  contentId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  completed: boolean;
}

class FirebaseProgressService {
  private readonly PROGRESS_COLLECTION = 'userProgress';
  private readonly SESSIONS_COLLECTION = 'readingSessions';

  // Check if user can save progress to cloud
  private canUseCloudStorage(): boolean {
    const user = auth.currentUser;
    return user !== null && !user.isAnonymous;
  }

  // Get user progress
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    if (!this.canUseCloudStorage()) {
      throw new Error('Cloud progress tracking not available for anonymous users');
    }

    try {
      const progressDoc = await getDoc(doc(db, this.PROGRESS_COLLECTION, userId));
      
      if (progressDoc.exists()) {
        const data = progressDoc.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        } as UserProgress;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return null;
    }
  }

  // Initialize progress for new user
  async initializeUserProgress(userId: string): Promise<UserProgress> {
    const initialProgress: UserProgress = {
      userId,
      currentBookChapter: 0,
      currentMeditation: 0,
      bookChaptersRead: [],
      meditationsCompleted: [],
      readingTimeTotal: 0,
      preferences: {
        fontSize: 'base',
        darkMode: false,
        autoPlayAudio: false,
        voicePreference: 'male'
      },
      lastUpdated: new Date()
    };

    try {
      await setDoc(doc(db, this.PROGRESS_COLLECTION, userId), {
        ...initialProgress,
        lastUpdated: Timestamp.fromDate(initialProgress.lastUpdated)
      });
      
      return initialProgress;
    } catch (error) {
      console.error('Error initializing user progress:', error);
      throw error;
    }
  }

  // Update current book chapter
  async updateBookProgress(userId: string, chapterIndex: number): Promise<void> {
    try {
      const progressRef = doc(db, this.PROGRESS_COLLECTION, userId);
      await updateDoc(progressRef, {
        currentBookChapter: chapterIndex,
        lastActiveChapter: `chapter-${chapterIndex}`,
        lastUpdated: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating book progress:', error);
      throw error;
    }
  }

  // Update current meditation
  async updateMeditationProgress(userId: string, meditationIndex: number, meditationId: string): Promise<void> {
    try {
      const progressRef = doc(db, this.PROGRESS_COLLECTION, userId);
      await updateDoc(progressRef, {
        currentMeditation: meditationIndex,
        lastActiveMeditation: meditationId,
        lastUpdated: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating meditation progress:', error);
      throw error;
    }
  }

  // Mark chapter as read
  async markChapterRead(userId: string, chapterIndex: number): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) return;

      const updatedChapters = [...new Set([...progress.bookChaptersRead, chapterIndex])];
      
      const progressRef = doc(db, this.PROGRESS_COLLECTION, userId);
      await updateDoc(progressRef, {
        bookChaptersRead: updatedChapters,
        lastUpdated: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error marking chapter as read:', error);
      throw error;
    }
  }

  // Mark meditation as completed
  async markMeditationCompleted(userId: string, meditationId: string): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) return;

      const updatedMeditations = [...new Set([...progress.meditationsCompleted, meditationId])];
      
      const progressRef = doc(db, this.PROGRESS_COLLECTION, userId);
      await updateDoc(progressRef, {
        meditationsCompleted: updatedMeditations,
        lastUpdated: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error marking meditation as completed:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(userId: string, preferences: Partial<UserProgress['preferences']>): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) return;

      const updatedPreferences = { ...progress.preferences, ...preferences };
      
      const progressRef = doc(db, this.PROGRESS_COLLECTION, userId);
      await updateDoc(progressRef, {
        preferences: updatedPreferences,
        lastUpdated: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Start reading session
  async startReadingSession(userId: string, contentType: 'book' | 'meditation', contentId: string): Promise<string> {
    try {
      const session: Omit<ReadingSession, 'id'> = {
        userId,
        contentType,
        contentId,
        startTime: new Date(),
        completed: false
      };

      const sessionRef = await setDoc(doc(collection(db, this.SESSIONS_COLLECTION)), {
        ...session,
        startTime: Timestamp.fromDate(session.startTime)
      });

      return sessionRef.id;
    } catch (error) {
      console.error('Error starting reading session:', error);
      throw error;
    }
  }

  // End reading session
  async endReadingSession(sessionId: string, completed: boolean = false): Promise<void> {
    try {
      const endTime = new Date();
      const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
      
      // Get session to calculate duration
      const sessionDoc = await getDoc(sessionRef);
      if (!sessionDoc.exists()) return;
      
      const sessionData = sessionDoc.data();
      const startTime = sessionData.startTime.toDate();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

      await updateDoc(sessionRef, {
        endTime: Timestamp.fromDate(endTime),
        duration,
        completed
      });

      // Update total reading time
      if (duration > 0) {
        await this.addReadingTime(sessionData.userId, duration);
      }
    } catch (error) {
      console.error('Error ending reading session:', error);
      throw error;
    }
  }

  // Add reading time to total
  private async addReadingTime(userId: string, minutes: number): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) return;

      const progressRef = doc(db, this.PROGRESS_COLLECTION, userId);
      await updateDoc(progressRef, {
        readingTimeTotal: progress.readingTimeTotal + minutes,
        lastUpdated: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error adding reading time:', error);
    }
  }

  // Get reading statistics
  async getReadingStats(userId: string): Promise<{
    totalReadingTime: number;
    chaptersRead: number;
    meditationsCompleted: number;
    currentStreak: number;
  }> {
    try {
      const progress = await this.getUserProgress(userId);
      if (!progress) {
        return {
          totalReadingTime: 0,
          chaptersRead: 0,
          meditationsCompleted: 0,
          currentStreak: 0
        };
      }

      // Calculate current streak (simplified - could be enhanced)
      const recentSessions = await this.getRecentSessions(userId, 7);
      const currentStreak = this.calculateStreak(recentSessions);

      return {
        totalReadingTime: progress.readingTimeTotal,
        chaptersRead: progress.bookChaptersRead.length,
        meditationsCompleted: progress.meditationsCompleted.length,
        currentStreak
      };
    } catch (error) {
      console.error('Error getting reading stats:', error);
      return {
        totalReadingTime: 0,
        chaptersRead: 0,
        meditationsCompleted: 0,
        currentStreak: 0
      };
    }
  }

  // Get recent reading sessions
  private async getRecentSessions(userId: string, days: number): Promise<ReadingSession[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const q = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      const sessions: ReadingSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime?.toDate()
        } as ReadingSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
  }

  // Calculate reading streak
  private calculateStreak(sessions: ReadingSession[]): number {
    // Simplified streak calculation
    // Group sessions by date and count consecutive days
    const datesWithSessions = new Set(
      sessions
        .filter(session => session.completed)
        .map(session => session.startTime.toDateString())
    );

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      if (datesWithSessions.has(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) { // Don't break on first day (today might not have session yet)
        break;
      }
    }

    return streak;
  }
}

export const progressService = new FirebaseProgressService();
export default progressService;
