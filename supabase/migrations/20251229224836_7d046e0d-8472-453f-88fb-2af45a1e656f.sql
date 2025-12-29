-- Add columns for TOTP replay attack prevention
-- last_used_counter: tracks the most recently used TOTP counter
-- last_used_at: timestamp of when it was used (for time-windowed prevention)

ALTER TABLE public.totp_secrets 
ADD COLUMN IF NOT EXISTS last_used_counter bigint DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone DEFAULT NULL;