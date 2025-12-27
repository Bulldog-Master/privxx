-- Fix RLS policies to use PERMISSIVE instead of RESTRICTIVE
-- This ensures proper access control where users can only access their own data

-- ============================================
-- FIX passkey_credentials
-- ============================================
DROP POLICY IF EXISTS "Users can delete their own passkeys" ON public.passkey_credentials;
DROP POLICY IF EXISTS "Users can register their own passkeys" ON public.passkey_credentials;
DROP POLICY IF EXISTS "Users can view their own passkeys" ON public.passkey_credentials;

CREATE POLICY "Users can view their own passkeys"
ON public.passkey_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can register their own passkeys"
ON public.passkey_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passkeys"
ON public.passkey_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FIX totp_secrets - users can view status, service role manages
-- ============================================
DROP POLICY IF EXISTS "Service role manages TOTP secrets" ON public.totp_secrets;
DROP POLICY IF EXISTS "Users can view own TOTP status" ON public.totp_secrets;

CREATE POLICY "Users can view own TOTP status"
ON public.totp_secrets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FIX totp_backup_codes - service role only
-- ============================================
DROP POLICY IF EXISTS "Service role manages backup codes" ON public.totp_backup_codes;

-- No permissive policy needed - service role bypasses RLS
-- This table should not be accessible by regular users

-- ============================================
-- FIX profiles
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FIX notification_preferences
-- ============================================
DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences"
ON public.notification_preferences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FIX rate_limits - service role only (no user access)
-- ============================================
DROP POLICY IF EXISTS "Service role only for rate limits" ON public.rate_limits;

-- No permissive policy - service role bypasses RLS
-- Regular users should never access this table

-- ============================================
-- FIX passkey_challenges - already fixed, but ensure clean state
-- ============================================
DROP POLICY IF EXISTS "Block all SELECT on passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Block all INSERT on passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Block all UPDATE on passkey_challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Block all DELETE on passkey_challenges" ON public.passkey_challenges;

-- No permissive policy - service role bypasses RLS
-- Regular users should never access this table