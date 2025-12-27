-- Add deny policy for authenticated users on passkey_challenges
-- This table should only be accessed by edge functions using service role key
CREATE POLICY "Deny authenticated access to passkey_challenges" 
ON public.passkey_challenges 
FOR ALL 
TO authenticated
USING (false)
WITH CHECK (false);