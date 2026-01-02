-- Drop any existing permissive policies on passkey_challenges
DROP POLICY IF EXISTS "Allow read access to passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Allow insert access to passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Allow delete access to passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "passkey_challenges_select" ON public.passkey_challenges;
DROP POLICY IF EXISTS "passkey_challenges_insert" ON public.passkey_challenges;
DROP POLICY IF EXISTS "passkey_challenges_delete" ON public.passkey_challenges;

-- Enable RLS if not already enabled
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

-- Create RESTRICTIVE policy that blocks ALL client access (anon and authenticated)
-- Challenges are managed exclusively by backend service_role processes
CREATE POLICY "block_all_client_access"
ON public.passkey_challenges
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);