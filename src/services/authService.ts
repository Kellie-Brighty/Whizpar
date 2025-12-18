import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string) => {
    try {
      console.log('Starting signup process');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;


      console.log('Signup complete:', {
        hasUser: !!user,
        userId: user?.uid,
      });

      return { user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error };
    }
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      
      return { user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, error };
    }
  },
  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Sign out
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  },

  // Check if user has a profile
  checkProfile: async (userId: string) => {
    try {
      const profileRef = doc(db, 'users', userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        return { profile: profileSnap.data(), error: null };
      }

      return { profile: null, error: null };
    } catch (error) {
      console.error('Error checking profile:', error);
      return { profile: null, error };
    }
  },

  // Auth state listener
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};

