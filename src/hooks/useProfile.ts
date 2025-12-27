/**
 * Profile Hook
 * 
 * Manages user profile data including display name and avatar.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  session_timeout_minutes: number;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return null;

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setIsLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return null;
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
        return null;
      }

      setProfile(newProfile);
      return newProfile;
    }

    setProfile(data);
    return data;
  }, [user]);

  const updateProfile = useCallback(async (updates: { display_name?: string; bio?: string; session_timeout_minutes?: number }) => {
    if (!user) return { error: "Not authenticated" };

    setIsLoading(true);
    setError(null);

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return { error: updateError.message };
    }

    setProfile(data);
    return { error: null, data };
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { error: "Not authenticated" };

    setIsLoading(true);
    setError(null);

    // Create unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setIsLoading(false);
      setError(uploadError.message);
      return { error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Add cache buster to force refresh
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update profile with avatar URL
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", user.id)
      .select()
      .single();

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return { error: updateError.message };
    }

    setProfile(data);
    return { error: null, data };
  }, [user]);

  const removeAvatar = useCallback(async () => {
    if (!user || !profile?.avatar_url) return { error: "No avatar to remove" };

    setIsLoading(true);
    setError(null);

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

    if (deleteError) {
      console.warn("Could not delete avatar file:", deleteError.message);
    }

    // Update profile to remove avatar URL
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", user.id)
      .select()
      .single();

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return { error: updateError.message };
    }

    setProfile(data);
    return { error: null };
  }, [user, profile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
  };
}
