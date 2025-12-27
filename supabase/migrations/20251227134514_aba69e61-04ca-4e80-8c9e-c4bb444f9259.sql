-- Create table for storing passkey credentials
CREATE TABLE public.passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN DEFAULT false,
  transports TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX idx_passkey_credentials_user_id ON public.passkey_credentials(user_id);
CREATE INDEX idx_passkey_credentials_credential_id ON public.passkey_credentials(credential_id);

-- Enable RLS
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own passkeys
CREATE POLICY "Users can view their own passkeys"
ON public.passkey_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can register new passkeys
CREATE POLICY "Users can register their own passkeys"
ON public.passkey_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own passkeys
CREATE POLICY "Users can delete their own passkeys"
ON public.passkey_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can update counter (via edge function)
CREATE POLICY "Service can update passkey counter"
ON public.passkey_credentials
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Table for temporary WebAuthn challenges
CREATE TABLE public.passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for challenge lookups
CREATE INDEX idx_passkey_challenges_email ON public.passkey_challenges(user_email);

-- Enable RLS (challenges are managed by edge functions)
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

-- Only service role can access challenges
CREATE POLICY "Service role only for challenges"
ON public.passkey_challenges
FOR ALL
USING (false)
WITH CHECK (false);