import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Profile = {
  id: string;
  username: string;
  avatar_seed: string;
  coins: number;
  // Add any other profile fields here
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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  checkProfile: async () => null,
  createProfile: async () => null,
  signOut: async () => {},
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
      console.log("No user to check profile for");
      return null;
    }

    try {
      console.log("Checking profile for user:", user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_seed, coins")
        .eq("id", user.id)
        .single();

      console.log("Profile check response:", {
        data,
        errorCode: error?.code,
        errorMessage: error?.message,
        userId: user.id,
      });

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No profile found for user:", user.id);
          setProfile(null);
          return null;
        }
        throw error;
      }

      if (data) {
        console.log("Profile found:", {
          userId: user.id,
          username: data.username,
          hasAvatar: !!data.avatar_seed,
        });
        setProfile(data);
        return data;
      }

      console.log("No profile data returned for user:", user.id);
      setProfile(null);
      return null;
    } catch (error) {
      console.error("Error checking profile:", error);
      setProfile(null);
      return null;
    }
  };

  const createProfile = async (username: string, avatarSeed: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            username,
            avatar_seed: avatarSeed,
            coins: 1000,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Error creating profile:", error);
      return null;
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      await AsyncStorage.removeItem("@user_avatar");
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", {
        event,
        hasUser: !!session?.user,
        userId: session?.user?.id,
      });
      if (!mounted) return;

      try {
        if (session?.user) {
          setUser(session.user);
          const profileData = await checkProfile();
          console.log("Auth state update complete:", {
            hasUser: true,
            hasProfile: !!profileData,
            event,
            userId: session.user.id,
          });
        } else {
          setUser(null);
          setProfile(null);
          console.log("Auth state cleared");
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    // Initial check
    const initAuth = async () => {
      if (!mounted) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const profileData = await checkProfile();
          console.log("Initial auth check complete:", {
            hasUser: true,
            hasProfile: !!profileData,
          });
        } else {
          console.log("No initial session");
        }
      } catch (error) {
        console.error("Error in initial auth check:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
