import { supabase } from "../lib/supabase";

export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string) => {
    try {
      console.log("Starting signup process");
      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Signup complete:", {
        hasUser: !!user,
        hasError: !!signUpError,
      });

      if (signUpError) throw signUpError;
      return { user, error: null };
    } catch (error) {
      console.error("Error signing up:", error);
      return { user: null, error };
    }
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error("Error signing in:", error);
      return { user: null, error };
    }
  },

  // Get current session
  getSession: async () => {
    try {
      console.log("Getting session...");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      console.log("Session result:", !!session, "Error:", !!error);
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      console.error("Error getting session:", error);
      return { session: null, error };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error signing out:", error);
      return { error };
    }
  },

  // Check if user has a profile
  checkProfile: async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return { profile, error: null };
    } catch (error) {
      console.error("Error checking profile:", error);
      return { profile: null, error };
    }
  },
};
