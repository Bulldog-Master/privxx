-- Fix 1: Revoke EXECUTE permission on cleanup_rate_limits() from public/authenticated
-- This function should only be callable by service_role or pg_cron
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon;

-- Fix 2: Make avatars bucket private
-- The app already uses signed URLs via useAvatarUrl hook
UPDATE storage.buckets SET public = false WHERE id = 'avatars';