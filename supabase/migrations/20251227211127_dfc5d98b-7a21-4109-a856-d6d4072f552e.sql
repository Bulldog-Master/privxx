-- Block anonymous access to all user-data tables
-- This ensures unauthenticated users cannot read any data

-- profiles: block anon access
CREATE POLICY "Deny anon access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- notification_preferences: block anon access
CREATE POLICY "Deny anon access to notification_preferences"
ON public.notification_preferences
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- passkey_credentials: block anon access
CREATE POLICY "Deny anon access to passkey_credentials"
ON public.passkey_credentials
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- totp_secrets: block anon access (SELECT already has authenticated-only policy)
CREATE POLICY "Deny anon access to totp_secrets"
ON public.totp_secrets
FOR SELECT
TO anon
USING (false);