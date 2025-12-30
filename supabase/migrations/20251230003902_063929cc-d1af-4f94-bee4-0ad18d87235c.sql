-- Fix RLS policies: Convert PERMISSIVE deny policies to RESTRICTIVE
-- PERMISSIVE policies with USING(false) don't actually block because RLS uses OR logic

-- notification_preferences
DROP POLICY IF EXISTS "Deny anon access to notification_preferences" ON public.notification_preferences;
CREATE POLICY "Deny anon access to notification_preferences"
ON public.notification_preferences AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);

-- passkey_challenges
DROP POLICY IF EXISTS "Deny anon access to passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Deny authenticated access to passkey_challenges" ON public.passkey_challenges;
CREATE POLICY "Deny anon access to passkey_challenges"
ON public.passkey_challenges AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);
CREATE POLICY "Deny authenticated access to passkey_challenges"
ON public.passkey_challenges AS RESTRICTIVE
FOR ALL TO authenticated
USING (false) WITH CHECK (false);

-- passkey_credentials
DROP POLICY IF EXISTS "Deny anon access to passkey_credentials" ON public.passkey_credentials;
CREATE POLICY "Deny anon access to passkey_credentials"
ON public.passkey_credentials AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);

-- profiles
DROP POLICY IF EXISTS "Deny anon access to profiles" ON public.profiles;
CREATE POLICY "Deny anon access to profiles"
ON public.profiles AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);

-- rate_limits
DROP POLICY IF EXISTS "Deny anon access to rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Deny authenticated access to rate_limits" ON public.rate_limits;
CREATE POLICY "Deny anon access to rate_limits"
ON public.rate_limits AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);
CREATE POLICY "Deny authenticated access to rate_limits"
ON public.rate_limits AS RESTRICTIVE
FOR ALL TO authenticated
USING (false) WITH CHECK (false);

-- totp_backup_codes
DROP POLICY IF EXISTS "Deny anon access to totp_backup_codes" ON public.totp_backup_codes;
DROP POLICY IF EXISTS "Deny authenticated access to totp_backup_codes" ON public.totp_backup_codes;
CREATE POLICY "Deny anon access to totp_backup_codes"
ON public.totp_backup_codes AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);
CREATE POLICY "Deny authenticated access to totp_backup_codes"
ON public.totp_backup_codes AS RESTRICTIVE
FOR ALL TO authenticated
USING (false) WITH CHECK (false);

-- totp_secrets
DROP POLICY IF EXISTS "Deny anon access to totp_secrets" ON public.totp_secrets;
DROP POLICY IF EXISTS "Deny INSERT on totp_secrets" ON public.totp_secrets;
DROP POLICY IF EXISTS "Deny UPDATE on totp_secrets" ON public.totp_secrets;
DROP POLICY IF EXISTS "Deny DELETE on totp_secrets" ON public.totp_secrets;
CREATE POLICY "Deny anon access to totp_secrets"
ON public.totp_secrets AS RESTRICTIVE
FOR ALL TO anon
USING (false) WITH CHECK (false);
CREATE POLICY "Deny INSERT on totp_secrets"
ON public.totp_secrets AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (false);
CREATE POLICY "Deny UPDATE on totp_secrets"
ON public.totp_secrets AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);
CREATE POLICY "Deny DELETE on totp_secrets"
ON public.totp_secrets AS RESTRICTIVE
FOR DELETE TO authenticated
USING (false);