import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = {
  id: string;
  username: string;
  avatar_seed: string;
  coins: number;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  checkProfile: () => Promise<Profile | null>;
  createProfile: (
    username: string,
    avatarSeed: string
  ) => Promise<Profile | null>;
  signOut: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  checkProfile: async () => null,
  createProfile: async () => null,
  signOut: async () => {},
  setProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkProfile = async () => {
    if (!user) {
      console.log('checkProfile: No user to check profile for');
      return null;
    }

    try {
      console.log('checkProfile: Checking profile for user:', user.uid);

      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);

      console.log('checkProfile: Database response:', {
        exists: profileSnap.exists(),
        userId: user.uid,
      });

      if (profileSnap.exists()) {
        const data = profileSnap.data() as Profile;
        console.log('checkProfile: Profile found and set:', {
          userId: user.uid,
          username: data.username,
        });
        setProfile(data);
        return data;
      }

      console.log('checkProfile: No profile found for user:', user.uid);
      setProfile(null);
      return null;
    } catch (error) {
      console.error('checkProfile: Error checking profile:', error);
      setProfile(null);
      return null;
    }
  };

  const createProfile = async (username: string, avatarSeed: string) => {
    if (!user) return null;
    try {
      const profileData: Profile = {
        id: user.uid,
        username,
        avatar_seed: avatarSeed,
        coins: 1000,
      };

      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, profileData);

      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      await AsyncStorage.removeItem('@user_avatar');
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (mounted) setLoading(true); // Start loading immediately

      console.log('Auth state changed:', {
        hasUser: !!firebaseUser,
        userId: firebaseUser?.uid,
      });

      if (!mounted) return;

      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          // Immediately check for profile when user is available
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const profileData = profileSnap.data() as Profile;
            setProfile(profileData);

            console.log('Auth state update complete:', {
              hasUser: true,
              hasProfile: true,
              userId: firebaseUser.uid,
              profileUsername: profileData.username,
            });
          } else {
            console.log('Auth state update complete:', {
              hasUser: true,
              hasProfile: false,
              userId: firebaseUser.uid,
            });
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        checkProfile,
        createProfile,
        signOut: handleSignOut,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

