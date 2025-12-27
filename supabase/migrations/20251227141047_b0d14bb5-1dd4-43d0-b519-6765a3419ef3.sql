-- Add session timeout preference to profiles
ALTER TABLE public.profiles
ADD COLUMN session_timeout_minutes INTEGER NOT NULL DEFAULT 15
CHECK (session_timeout_minutes >= 5 AND session_timeout_minutes <= 120);