-- Add explicit deny policies for anon role on service-role-only tables
-- This ensures that even anonymous users explicitly get denied

-- passkey_challenges: block anon explicitly
CREATE POLICY "Deny anon access to passkey_challenges"
ON public.passkey_challenges
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- totp_backup_codes: block anon and authenticated explicitly (service role only)
CREATE POLICY "Deny anon access to totp_backup_codes"
ON public.totp_backup_codes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny authenticated access to totp_backup_codes"
ON public.totp_backup_codes
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- rate_limits: block anon and authenticated explicitly (service role only)
CREATE POLICY "Deny anon access to rate_limits"
ON public.rate_limits
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny authenticated access to rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- totp_secrets: add INSERT/UPDATE/DELETE deny policies
-- These operations must go through edge functions using service role
CREATE POLICY "Deny INSERT on totp_secrets"
ON public.totp_secrets
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny UPDATE on totp_secrets"
ON public.totp_secrets
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny DELETE on totp_secrets"
ON public.totp_secrets
FOR DELETE
TO authenticated, anon
USING (false);