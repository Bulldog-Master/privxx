-- Ensure RLS is enabled on passkey_challenges table
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (belt and suspenders)
ALTER TABLE public.passkey_challenges FORCE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate with proper blocking
DROP POLICY IF EXISTS "Block all client access to passkey_challenges" ON public.passkey_challenges;

-- Create RESTRICTIVE policy that blocks ALL anonymous access
CREATE POLICY "Block anon access to passkey_challenges"
ON public.passkey_challenges
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Create RESTRICTIVE policy that blocks ALL authenticated client access
-- (this table should only be accessed by service role from edge functions)
CREATE POLICY "Block authenticated access to passkey_challenges"
ON public.passkey_challenges
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);