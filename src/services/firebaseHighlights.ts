import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { TextHighlight } from '../types';

export interface FirebaseHighlight extends Omit<TextHighlight, 'timestamp'> {
  userId: string;
  timestamp: Timestamp;
}

class FirebaseHighlightsService {
  private readonly COLLECTION_NAME = 'highlights';

  // Check if user can save to cloud
  private canUseCloudStorage(): boolean {
    const user = auth.currentUser;
    return user !== null && !user.isAnonymous;
  }

  // Save a highlight to Firestore (only for authenticated users)
  async saveHighlight(userId: string, highlight: Omit<TextHighlight, 'id'>): Promise<string> {
    if (!this.canUseCloudStorage()) {
      throw new Error('Cloud storage not available for anonymous users');
    }

    try {
      const highlightData: Omit<FirebaseHighlight, 'id'> = {
        ...highlight,
        userId,
        timestamp: Timestamp.fromDate(new Date(highlight.timestamp))
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), highlightData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving highlight:', error);
      throw error;
    }
  }

  // Get all highlights for a user
  async getUserHighlights(userId: string): Promise<TextHighlight[]> {
    if (!this.canUseCloudStorage()) {
      throw new Error('Cloud storage not available for anonymous users');
    }

    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const highlights: TextHighlight[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseHighlight;
        highlights.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate()
        });
      });

      return highlights;
    } catch (error) {
      console.error('Error fetching highlights:', error);
      throw error;
    }
  }

  // Get highlights for a specific chapter/meditation
  async getChapterHighlights(userId: string, chapterId: string): Promise<TextHighlight[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('chapterId', '==', chapterId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const highlights: TextHighlight[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseHighlight;
        highlights.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate()
        });
      });

      return highlights;
    } catch (error) {
      console.error('Error fetching chapter highlights:', error);
      throw error;
    }
  }

  // Update a highlight
  async updateHighlight(highlightId: string, updates: Partial<Omit<TextHighlight, 'id' | 'userId' | 'timestamp'>>): Promise<void> {
    try {
      const highlightRef = doc(db, this.COLLECTION_NAME, highlightId);
      await updateDoc(highlightRef, updates);
    } catch (error) {
      console.error('Error updating highlight:', error);
      throw error;
    }
  }

  // Delete a highlight
  async deleteHighlight(highlightId: string): Promise<void> {
    try {
      const highlightRef = doc(db, this.COLLECTION_NAME, highlightId);
      await deleteDoc(highlightRef);
    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  }

  // Delete all highlights for a user
  async deleteAllUserHighlights(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting all highlights:', error);
      throw error;
    }
  }

  // Search highlights by text content
  async searchHighlights(userId: string, searchTerm: string, limitResults: number = 50): Promise<TextHighlight[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // For better search, consider using Algolia or similar service
      // This is a basic implementation that gets all highlights and filters client-side
      
      const allHighlights = await this.getUserHighlights(userId);
      const searchLower = searchTerm.toLowerCase();
      
      return allHighlights
        .filter(highlight => 
          highlight.text.toLowerCase().includes(searchLower) ||
          highlight.chapterTitle.toLowerCase().includes(searchLower)
        )
        .slice(0, limitResults);
    } catch (error) {
      console.error('Error searching highlights:', error);
      throw error;
    }
  }

  // Get recent highlights
  async getRecentHighlights(userId: string, limitResults: number = 10): Promise<TextHighlight[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitResults)
      );

      const querySnapshot = await getDocs(q);
      const highlights: TextHighlight[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseHighlight;
        highlights.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp.toDate()
        });
      });

      return highlights;
    } catch (error) {
      console.error('Error fetching recent highlights:', error);
      throw error;
    }
  }
}

export const highlightsService = new FirebaseHighlightsService();
export default highlightsService;
