-- Ensure policies explicitly block anonymous access by requiring auth.uid() IS NOT NULL
-- This adds an extra layer of protection on top of existing user-scoped policies

-- passkey_credentials - update SELECT policy to explicitly require authentication
DROP POLICY IF EXISTS "Users can view their own passkeys" ON public.passkey_credentials;
CREATE POLICY "Users can view their own passkeys"
ON public.passkey_credentials
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- profiles - update SELECT policy to explicitly require authentication  
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);