/**
 * Profile Context
 * 
 * Pre-fetches and caches user profile data including avatar.
 * Reduces avatar loading time by starting the fetch as soon as auth state changes.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  session_timeout_minutes: number;
  referral_code: string | null;
  xx_coins_balance: number;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileContextValue {
  profile: Profile | null;
  avatarUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { display_name?: string; bio?: string; session_timeout_minutes?: number }) => Promise<{ error: string | null; data?: Profile }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// Signed URL expiry in seconds (4 hours)
const SIGNED_URL_EXPIRY_SECONDS = 14400;
// Cache key prefix for signed URLs
const AVATAR_CACHE_KEY = 'privxx_avatar_cache';

// Get cached avatar URL if still valid
function getCachedAvatarUrl(userId: string): string | null {
  try {
    const cached = sessionStorage.getItem(`${AVATAR_CACHE_KEY}_${userId}`);
    if (!cached) return null;
    
    const { url, expiresAt } = JSON.parse(cached);
    // Check if URL is still valid (with 10 min buffer)
    if (Date.now() < expiresAt - 600000) {
      return url;
    }
    // Expired, remove it
    sessionStorage.removeItem(`${AVATAR_CACHE_KEY}_${userId}`);
  } catch {
    // Ignore parse errors
  }
  return null;
}

// Cache avatar URL with expiry
function cacheAvatarUrl(userId: string, url: string): void {
  try {
    const expiresAt = Date.now() + (SIGNED_URL_EXPIRY_SECONDS * 1000);
    sessionStorage.setItem(`${AVATAR_CACHE_KEY}_${userId}`, JSON.stringify({ url, expiresAt }));
  } catch {
    // Ignore storage errors (privacy mode, quota exceeded)
  }
}

// Clear cached avatar URL
function clearCachedAvatarUrl(userId: string): void {
  try {
    sessionStorage.removeItem(`${AVATAR_CACHE_KEY}_${userId}`);
  } catch {
    // Ignore errors
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate signed URL for avatar
  const generateSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    if (!path) return null;
    
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

      if (error) {
        console.error('[ProfileContext] Error generating signed URL:', error);
        return null;
      }
      
      return data?.signedUrl || null;
    } catch (err) {
      console.error('[ProfileContext] Error generating signed URL:', err);
      return null;
    }
  }, []);

  // Fetch profile and avatar URL
  const fetchProfileAndAvatar = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setAvatarUrl(null);
      return;
    }

    // Check for cached avatar URL first (instant display)
    const cachedUrl = getCachedAvatarUrl(user.id);
    if (cachedUrl) {
      setAvatarUrl(cachedUrl);
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      // If no profile exists, create one
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) {
          setError(createError.message);
          setIsLoading(false);
          return;
        }

        setProfile(newProfile);
        setAvatarUrl(null);
        clearCachedAvatarUrl(user.id);
        setIsLoading(false);
        return;
      }

      setProfile(data);

      // Generate signed URL if avatar exists
      if (data.avatar_url) {
        // Check if it's a path (not already a signed URL)
        const isPath = !data.avatar_url.startsWith('http');
        if (isPath) {
          // If we already have a cached URL, don't block on new generation
          if (!cachedUrl) {
            const signedUrl = await generateSignedUrl(data.avatar_url);
            if (signedUrl) {
              setAvatarUrl(signedUrl);
              cacheAvatarUrl(user.id, signedUrl);
            }
          } else {
            // Refresh in background without blocking UI
            generateSignedUrl(data.avatar_url).then((signedUrl) => {
              if (signedUrl) {
                setAvatarUrl(signedUrl);
                cacheAvatarUrl(user.id, signedUrl);
              }
            });
          }
        } else {
          // It's already a URL, use it directly
          setAvatarUrl(data.avatar_url);
        }
      } else {
        setAvatarUrl(null);
        clearCachedAvatarUrl(user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user, generateSignedUrl]);

  // Refresh profile (public method) - clears cache for fresh data
  const refreshProfile = useCallback(async () => {
    if (user) {
      clearCachedAvatarUrl(user.id);
    }
    await fetchProfileAndAvatar();
  }, [user, fetchProfileAndAvatar]);

  // Update profile
  const updateProfile = useCallback(async (updates: { display_name?: string; bio?: string; session_timeout_minutes?: number }) => {
    if (!user) return { error: "Not authenticated" };

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return { error: updateError.message };
    }

    setProfile(data);
    return { error: null, data };
  }, [user]);

  // Fetch profile immediately when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfileAndAvatar();
    } else {
      setProfile(null);
      setAvatarUrl(null);
    }
  }, [isAuthenticated, user, fetchProfileAndAvatar]);

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as Profile;
          setProfile(newProfile);
          
          // Regenerate signed URL if avatar changed
          if (newProfile.avatar_url) {
            const isPath = !newProfile.avatar_url.startsWith('http');
            if (isPath) {
              const signedUrl = await generateSignedUrl(newProfile.avatar_url);
              setAvatarUrl(signedUrl);
            } else {
              setAvatarUrl(newProfile.avatar_url);
            }
          } else {
            setAvatarUrl(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, generateSignedUrl]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        avatarUrl,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }
  return context;
}
