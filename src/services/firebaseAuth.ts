import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User,
  UserCredential,
  signInAnonymously as firebaseSignInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email?: string;
  name?: string;
  isAnonymous: boolean;
  onboardingCompleted: boolean;
  selectedAIPersona?: string;
  role?: 'user' | 'admin'; // Admin role field
  onboardingData?: {
    paymentCompleted?: boolean;
    [key: string]: any;
  };
  subscriptionStatus?: {
    isActive: boolean;
    status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    planName: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  createdAt: Date;
  lastActive: Date;
}

class FirebaseAuthService {
  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLastActive(userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Create account with email and password
  async createAccount(email: string, password: string, name?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await this.createUserProfile(userCredential.user, { email, name });
      
      return userCredential;
    } catch (error) {
      console.error('Account creation error:', error);
      throw error;
    }
  }

  // Sign in anonymously
  async signInAnonymously(): Promise<UserCredential> {
    try {
      const userCredential = await firebaseSignInAnonymously(auth);
      
      // Create anonymous user profile
      await this.createUserProfile(userCredential.user, { isAnonymous: true });
      
      return userCredential;
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Create user profile in Firestore
  private async createUserProfile(user: User, additionalData: Partial<UserProfile> = {}): Promise<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || additionalData.email || undefined, // Avoid storing undefined
      name: additionalData.name || undefined,
      isAnonymous: user.isAnonymous || additionalData.isAnonymous || false,
      onboardingCompleted: false,
      createdAt: new Date(),
      lastActive: new Date(),
      ...additionalData
    };

    // Remove undefined fields to prevent Firestore errors
    const cleanedProfile = Object.fromEntries(
      Object.entries(userProfile).filter(([_, value]) => value !== undefined)
    ) as UserProfile;

    await setDoc(doc(db, 'users', user.uid), cleanedProfile);
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date()
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update last active timestamp
  async updateLastActive(uid: string): Promise<void> {
    if (!this.isUserAuthenticated()) {
      return; // Skip for anonymous users
    }
    
    try {
      // Check if document exists first
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        await updateDoc(doc(db, 'users', uid), {
          lastActive: new Date()
        });
      } else {
        // Document doesn't exist, create it with basic info
        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, 'users', uid), {
            uid: uid,
            email: user.email,
            name: user.displayName,
            isAnonymous: user.isAnonymous,
            onboardingCompleted: false,
            createdAt: new Date(),
            lastActive: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error updating last active:', error);
      // Don't throw error to prevent authentication from failing
    }
  }

  // Mark onboarding as completed
  async completeOnboarding(uid: string, onboardingData: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        onboardingCompleted: true,
        selectedAIPersona: onboardingData.selectedAIPersona,
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // Auth state listener
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Check if current user is authenticated (not anonymous)
  isUserAuthenticated(): boolean {
    const user = auth.currentUser;
    return user !== null && !user.isAnonymous;
  }

  // Check if current user is anonymous
  isUserAnonymous(): boolean {
    const user = auth.currentUser;
    return user !== null && user.isAnonymous;
  }

  // Check if user is admin
  async isAdmin(user?: User): Promise<boolean> {
    const currentUser = user || auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) return false;
    
    // Check for admin email addresses
    const adminEmails = [
      'admin@middleapp.com',
      'leantonionelson@gmail.com', // Add your email here
      'dev@middleapp.com'
    ];
    
    if (adminEmails.includes(currentUser.email || '')) return true;
    
    // Check user profile for admin role
    try {
      const userProfile = await this.getUserProfile(currentUser.uid);
      return userProfile?.role === 'admin' || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get user capabilities based on auth status and subscription
  async getUserCapabilities() {
    const user = auth.currentUser;
    const freeAuth = localStorage.getItem('freeAuth') === 'true';
    const userType = localStorage.getItem('userType');
    
    // Handle free mode (guest users)
    if (freeAuth && !user) {
      return {
        canSaveProgress: true, // Local storage only
        canSaveHighlights: false, // No saving for guest users
        canUseAI: false, // No AI for free users
        canSync: false, // No cloud sync
        userType: 'guest',
        hasActiveSubscription: false,
        isAdmin: false
      };
    }
    
    if (!user) {
      return {
        canSaveProgress: false,
        canSaveHighlights: false,
        canUseAI: false,
        canSync: false,
        userType: 'guest',
        hasActiveSubscription: false,
        isAdmin: false
      };
    }

    if (user.isAnonymous) {
      return {
        canSaveProgress: true, // Local storage only
        canSaveHighlights: true, // Local storage only
        canUseAI: false,
        canSync: false,
        userType: 'anonymous',
        hasActiveSubscription: false,
        isAdmin: false
      };
    }

    // Check if user is admin
    const isAdmin = await this.isAdmin(user);
    
    // Admins have full access to everything
    if (isAdmin) {
      return {
        canSaveProgress: true,
        canSaveHighlights: true,
        canUseAI: true, // Full AI access
        canSync: true,
        userType: 'admin',
        hasActiveSubscription: true, // Treated as premium
        isAdmin: true
      };
    }

    // For authenticated users, check subscription status
    const userProfile = await this.getUserProfile(user.uid);
    const hasActiveSubscription = userProfile?.subscriptionStatus?.isActive || false;
    
    // Check if user completed payment during onboarding
    const completedPayment = userProfile?.onboardingData?.paymentCompleted || false;

    return {
      canSaveProgress: true, // Authenticated users can save progress
      canSaveHighlights: true, // Authenticated users can save highlights
      canUseAI: hasActiveSubscription || completedPayment,
      canSync: true, // Authenticated users can sync
      userType: 'authenticated',
      hasActiveSubscription: hasActiveSubscription || completedPayment,
      isAdmin: false
    };
  }
}

export const authService = new FirebaseAuthService();
export default authService;
