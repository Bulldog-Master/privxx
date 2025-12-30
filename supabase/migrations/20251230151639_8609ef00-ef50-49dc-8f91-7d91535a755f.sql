-- Add missing UPDATE policy for passkey_credentials
-- Users should be able to update their own passkeys (e.g., counter updates)
CREATE POLICY "Users can update own passkeys"
ON public.passkey_credentials
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add missing DELETE policy for profiles (GDPR compliance)
-- Users should be able to delete their own profile data
CREATE POLICY "Users can delete own profile"
ON public.profiles
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);