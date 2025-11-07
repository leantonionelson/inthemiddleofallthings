import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  onAuthStateChange,
  updateUserProfile,
} from '../services/authService';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

/**
 * Hook to manage authentication state and provide auth methods
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set initial user state
    setUser(getCurrentUser());
    setLoading(false);

    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<User> => {
    const newUser = await signUp(email, password, name);
    return newUser;
  };

  const handleSignIn = async (
    email: string,
    password: string
  ): Promise<User> => {
    const signedInUser = await signIn(email, password);
    return signedInUser;
  };

  const handleSignOut = async (): Promise<void> => {
    await signOut();
  };

  const handleUpdateProfile = async (name: string): Promise<void> => {
    await updateUserProfile(name);
  };

  return {
    user,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
  };
}

