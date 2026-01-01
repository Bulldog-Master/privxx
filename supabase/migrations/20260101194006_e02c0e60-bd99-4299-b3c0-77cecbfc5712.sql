-- Add digest_frequency column to notification_preferences
-- Values: 'immediate', 'daily', 'weekly'
ALTER TABLE public.notification_preferences
ADD COLUMN digest_frequency text NOT NULL DEFAULT 'immediate'
CHECK (digest_frequency IN ('immediate', 'daily', 'weekly'));