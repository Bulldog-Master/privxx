-- Fix 1: Add missing DELETE policy on notification_preferences
CREATE POLICY "Users can delete their own notification preferences"
ON public.notification_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Fix 2: Drop overly permissive passkey counter update policy
-- Service role bypasses RLS anyway, so this policy is misleading
DROP POLICY IF EXISTS "Service can update passkey counter" ON public.passkey_credentials;

-- Fix 3: Add comments to SECURITY DEFINER functions for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY DEFINER required to insert profile on signup. Only inserts user own profile data. Fixed search_path prevents injection.';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'SECURITY DEFINER trigger function for timestamp updates. Simple, safe operation with fixed search_path.';