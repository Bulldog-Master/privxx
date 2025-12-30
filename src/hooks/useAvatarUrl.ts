/**
 * Avatar URL Hook
 * 
 * Generates signed URLs for avatar images with automatic refresh
 * when URLs expire. Stores paths in profile, generates signed URLs on demand.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Signed URL validity: 4 hours
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 4;
// Refresh 10 minutes before expiry
const REFRESH_BUFFER_SECONDS = 60 * 10;

interface UseAvatarUrlResult {
  avatarUrl: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Check if a URL looks like a storage path (not a signed URL)
 */
function isStoragePath(url: string | null): boolean {
  if (!url) return false;
  // Storage paths don't contain http/https
  return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:');
}

/**
 * Check if a signed URL is expired or about to expire
 */
function isUrlExpiredOrExpiring(url: string | null): boolean {
  if (!url) return true;
  
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    
    if (!token) return true;
    
    // Decode JWT to check expiry (JWT is base64url encoded)
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = payload.exp;
    
    if (!exp) return true;
    
    // Check if expired or will expire within buffer
    const now = Math.floor(Date.now() / 1000);
    return now >= (exp - REFRESH_BUFFER_SECONDS);
  } catch {
    // If we can't parse the URL, assume it needs refresh
    return true;
  }
}

export function useAvatarUrl(avatarPath: string | null): UseAvatarUrlResult {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPathRef = useRef<string | null>(null);

  const generateSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
      
      if (error) {
        console.error('Failed to generate signed URL:', error.message);
        return null;
      }
      
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }, []);

  const scheduleRefresh = useCallback((url: string) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    try {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      
      if (!token) return;
      
      const parts = token.split('.');
      if (parts.length !== 3) return;
      
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const exp = payload.exp;
      
      if (!exp) return;
      
      // Calculate when to refresh (10 minutes before expiry)
      const now = Math.floor(Date.now() / 1000);
      const refreshIn = (exp - REFRESH_BUFFER_SECONDS - now) * 1000;
      
      if (refreshIn > 0) {
        refreshTimeoutRef.current = setTimeout(async () => {
          if (currentPathRef.current) {
            const newUrl = await generateSignedUrl(currentPathRef.current);
            if (newUrl) {
              setAvatarUrl(newUrl);
              scheduleRefresh(newUrl);
            }
          }
        }, refreshIn);
      }
    } catch {
      // Ignore parse errors
    }
  }, [generateSignedUrl]);

  const refresh = useCallback(async () => {
    if (!currentPathRef.current) return;
    
    setIsLoading(true);
    const newUrl = await generateSignedUrl(currentPathRef.current);
    if (newUrl) {
      setAvatarUrl(newUrl);
      scheduleRefresh(newUrl);
    }
    setIsLoading(false);
  }, [generateSignedUrl, scheduleRefresh]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleAvatarPath = async () => {
      // If no path, clear everything
      if (!avatarPath) {
        currentPathRef.current = null;
        setAvatarUrl(null);
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        return;
      }

      // If it's already a signed URL, check if valid
      if (!isStoragePath(avatarPath)) {
        if (!isUrlExpiredOrExpiring(avatarPath)) {
          // URL is still valid
          setAvatarUrl(avatarPath);
          scheduleRefresh(avatarPath);
          return;
        }
        
        // URL is expired, we need the path to regenerate
        // Try to extract path from URL if possible
        try {
          const urlObj = new URL(avatarPath);
          const pathMatch = urlObj.pathname.match(/\/avatars\/(.+)/);
          if (pathMatch) {
            currentPathRef.current = pathMatch[1];
          }
        } catch {
          setAvatarUrl(null);
          return;
        }
      } else {
        // It's a storage path
        currentPathRef.current = avatarPath;
      }

      // Generate new signed URL
      if (currentPathRef.current) {
        setIsLoading(true);
        const newUrl = await generateSignedUrl(currentPathRef.current);
        if (newUrl) {
          setAvatarUrl(newUrl);
          scheduleRefresh(newUrl);
        }
        setIsLoading(false);
      }
    };

    handleAvatarPath();
  }, [avatarPath, generateSignedUrl, scheduleRefresh]);

  return { avatarUrl, isLoading, refresh };
}
