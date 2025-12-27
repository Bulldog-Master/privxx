-- Create rate limiting table for edge function protection
CREATE TABLE public.rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 1,
    first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    locked_until TIMESTAMP WITH TIME ZONE,
    UNIQUE(identifier, action)
);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX idx_rate_limits_cleanup ON public.rate_limits(last_attempt_at);

-- Enable RLS - only service role can access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for rate limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- Create TOTP failed attempts tracking on totp_secrets
ALTER TABLE public.totp_secrets 
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Function to clean up old rate limit entries (call periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete entries older than 1 hour
  DELETE FROM public.rate_limits 
  WHERE last_attempt_at < now() - interval '1 hour';
END;
$$;