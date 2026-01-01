-- Add notification channels preferences as JSONB
-- Structure: { "password_changed": ["email", "push"], "new_device_login": ["email"], ... }
ALTER TABLE public.notification_preferences
ADD COLUMN notification_channels jsonb NOT NULL DEFAULT '{
  "password_changed": ["email"],
  "2fa_enabled": ["email"],
  "2fa_disabled": ["email"],
  "passkey_added": ["email"],
  "passkey_removed": ["email"],
  "new_device_login": ["email", "push"]
}'::jsonb;