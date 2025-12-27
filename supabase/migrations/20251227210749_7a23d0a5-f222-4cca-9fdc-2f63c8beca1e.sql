-- Fix passkey_challenges RLS policies to properly block all access
-- The current policy uses USING (false) WITH CHECK (false) which should work,
-- but we need to ensure RLS is properly enforced

-- First, drop the existing policy
DROP POLICY IF EXISTS "Service role only for challenges" ON public.passkey_challenges;

-- Create separate restrictive policies for each operation
-- These policies explicitly deny all access except for service role
CREATE POLICY "Block all SELECT on passkey_challenges"
ON public.passkey_challenges
FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "Block all INSERT on passkey_challenges"
ON public.passkey_challenges
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Block all UPDATE on passkey_challenges"
ON public.passkey_challenges
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Block all DELETE on passkey_challenges"
ON public.passkey_challenges
FOR DELETE
TO authenticated, anon
USING (false);