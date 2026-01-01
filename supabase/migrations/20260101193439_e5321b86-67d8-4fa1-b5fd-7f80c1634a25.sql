-- Add new_device_login column to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN new_device_login boolean NOT NULL DEFAULT true;