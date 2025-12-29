-- Add explicit RESTRICTIVE deny policy for anonymous SELECT on passkey_credentials
-- This ensures anon role cannot read any credentials even if other policies exist

-- First, drop any existing anon SELECT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Deny anon SELECT on passkey_credentials" ON public.passkey_credentials;

-- Create a new RESTRICTIVE policy that explicitly denies anon SELECT
CREATE POLICY "Deny anon SELECT on passkey_credentials"
ON public.passkey_credentials
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);