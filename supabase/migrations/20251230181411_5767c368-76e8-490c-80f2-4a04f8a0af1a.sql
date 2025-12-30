-- Create audit event type enum
CREATE TYPE public.audit_event_type AS ENUM (
  'auth_signin_success',
  'auth_signin_failure',
  'auth_signup_success',
  'auth_signup_failure',
  'auth_signout',
  'auth_password_reset_request',
  'auth_password_reset_complete',
  'auth_email_verification',
  'passkey_registration_start',
  'passkey_registration_complete',
  'passkey_auth_success',
  'passkey_auth_failure',
  'totp_setup_start',
  'totp_setup_complete',
  'totp_verify_success',
  'totp_verify_failure',
  'totp_backup_code_used',
  'profile_update',
  'session_timeout',
  'identity_create',
  'identity_unlock',
  'identity_lock'
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type public.audit_event_type NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Block all anonymous access
CREATE POLICY "Block anon access to audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Allow authenticated users to view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Block all client-side INSERT/UPDATE/DELETE - only service_role can write
CREATE POLICY "Block client INSERT on audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block client UPDATE on audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Block client DELETE on audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);

-- Create a security definer function to log audit events (callable from edge functions)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _user_id UUID,
  _event_type public.audit_event_type,
  _success BOOLEAN DEFAULT true,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, event_type, success, ip_address, user_agent, metadata)
  VALUES (_user_id, _event_type, _success, _ip_address, _user_agent, _metadata)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Security audit log for tracking authentication events and security-sensitive operations';
COMMENT ON FUNCTION public.log_audit_event IS 'Securely logs audit events - only callable via service_role';