import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthErrorWithCode extends Error {
  code?: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update the user's display name
    if (displayName) {
      await updateProfile(user, {
        displayName: displayName,
      });
    }

    return user;
  } catch (error) {
    const authError = error as AuthError;
    const customError: AuthErrorWithCode = new Error(
      authError.message || 'Failed to create account'
    );
    customError.code = authError.code;
    throw customError;
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;
    const customError: AuthErrorWithCode = new Error(
      authError.message || 'Failed to sign in'
    );
    customError.code = authError.code;
    throw customError;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(authError.message || 'Failed to sign out');
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Update user profile (display name)
 */
export async function updateUserProfile(displayName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  try {
    await updateProfile(user, {
      displayName: displayName,
    });
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(authError.message || 'Failed to update profile');
  }
}


