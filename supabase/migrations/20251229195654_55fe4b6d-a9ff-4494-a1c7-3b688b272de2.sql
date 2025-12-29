-- Fix: passkey_challenges - Add explicit SELECT denial for anonymous users
-- The existing ALL policy may not be sufficient for all RLS evaluation paths
CREATE POLICY "Deny anon SELECT on passkey_challenges" 
ON public.passkey_challenges 
AS RESTRICTIVE
FOR SELECT 
TO anon 
USING (false);

-- Fix: profiles - Add explicit SELECT denial for anonymous users  
CREATE POLICY "Deny anon SELECT on profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR SELECT 
TO anon 
USING (false);