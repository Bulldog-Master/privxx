/**
 * Supabase Auth Context
 * 
 * Manages user authentication state with magic link, email/password support.
 * JWT token is used for bridge authorization.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, referralCode?: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** @deprecated Use getAccessTokenAsync for fresh tokens */
  getAccessToken: () => string | null;
  /** Fetches a FRESH access token via supabase.auth.getSession() - never cached */
  getAccessTokenAsync: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, referralCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "An account with this email already exists. Please sign in instead." };
      }
      return { error: error.message };
    }

    // Process referral if code provided and user was created
    if (referralCode && data.user) {
      try {
        const response = await supabase.functions.invoke('process-referral', {
          body: {
            referral_code: referralCode,
            referred_user_id: data.user.id,
          },
        });
        
        if (response.error) {
          console.error('[AuthContext] Referral processing error:', response.error);
        } else {
          console.log('[AuthContext] Referral processed:', response.data);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to process referral:', err);
      }
    }

    return { error: null };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!user?.email) {
      return { error: "No email address found" };
    }
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, [user]);

  const getAccessToken = useCallback(() => {
    return session?.access_token ?? null;
  }, [session]);

  /** 
   * ALWAYS fetch fresh token from Supabase - NEVER cache or reuse.
   * This relies on Supabase's built-in auto-refresh using refresh tokens.
   */
  const getAccessTokenAsync = useCallback(async (): Promise<string | null> => {
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    return freshSession?.access_token ?? null;
  }, []);

  // Check if email is verified
  const isEmailVerified = !!user?.email_confirmed_at;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        isEmailVerified,
        signInWithEmail,
        signUpWithEmail,
        signInWithMagicLink,
        resetPassword,
        updatePassword,
        resendVerificationEmail,
        signOut,
        getAccessToken,
        getAccessTokenAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
