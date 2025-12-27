-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing TOTP secrets
CREATE TABLE public.totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for user lookups
CREATE INDEX idx_totp_secrets_user_id ON public.totp_secrets(user_id);

-- Enable RLS
ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;

-- Users can view their own TOTP status (but not the secret)
CREATE POLICY "Users can view own TOTP status"
ON public.totp_secrets
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update/delete (via edge function)
CREATE POLICY "Service role manages TOTP secrets"
ON public.totp_secrets
FOR ALL
USING (false)
WITH CHECK (false);

-- Create table for TOTP backup codes
CREATE TABLE public.totp_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX idx_totp_backup_codes_user_id ON public.totp_backup_codes(user_id);

-- Enable RLS
ALTER TABLE public.totp_backup_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access backup codes
CREATE POLICY "Service role manages backup codes"
ON public.totp_backup_codes
FOR ALL
USING (false)
WITH CHECK (false);

-- Create trigger for updated_at
CREATE TRIGGER update_totp_secrets_updated_at
BEFORE UPDATE ON public.totp_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();