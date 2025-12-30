-- Fix RLS policies for passkey_challenges
-- This table should ONLY be accessible via service_role (edge functions)
-- The existing policies are correct but let's ensure they're properly configured

-- Drop existing policies and recreate with proper configuration
DROP POLICY IF EXISTS "Deny anon SELECT on passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Deny anon access to passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Deny authenticated access to passkey_challenges" ON public.passkey_challenges;

-- Create a single comprehensive deny policy for all client access
-- No PERMISSIVE policies means no client access is possible
CREATE POLICY "Block all client access to passkey_challenges"
ON public.passkey_challenges
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Fix RLS policies for profiles
-- Users should be able to CRUD their own profile, anon should have no access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny anon access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anon SELECT on profiles" ON public.profiles;

-- Create PERMISSIVE policies for authenticated users to access their own data
CREATE POLICY "Users can view own profile"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RESTRICTIVE policy to block anonymous access
CREATE POLICY "Block anon access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);