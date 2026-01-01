-- Fix profiles table RLS policies
-- The current "Block anon access to profiles" policy is too broad
-- We need PERMISSIVE policies for legitimate access and a targeted RESTRICTIVE for anon

-- Drop the problematic restrictive policy that blocks everyone
DROP POLICY IF EXISTS "Block anon access to profiles" ON public.profiles;

-- Drop existing restrictive user policies (we'll recreate as permissive)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Create PERMISSIVE policies for authenticated users to access their own data
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add explicit RESTRICTIVE policy to block anonymous role
-- This ensures anon role cannot access even if other policies exist
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);