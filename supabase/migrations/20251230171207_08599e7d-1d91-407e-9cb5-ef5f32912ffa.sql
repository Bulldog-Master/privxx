-- Fix passkey_credentials UPDATE policy to restrict modifiable fields
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update own passkeys" ON public.passkey_credentials;

-- Create a restricted UPDATE policy that only allows updating safe fields
-- Critical fields (credential_id, public_key, user_id) cannot be changed
CREATE POLICY "Users can update own passkeys safely"
ON public.passkey_credentials
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- The policy allows the update, but we use a trigger to enforce field restrictions
);

-- Create a trigger function to enforce field-level restrictions on passkey updates
CREATE OR REPLACE FUNCTION public.enforce_passkey_update_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent modification of authentication-critical fields
  IF NEW.credential_id IS DISTINCT FROM OLD.credential_id THEN
    RAISE EXCEPTION 'Cannot modify credential_id';
  END IF;
  
  IF NEW.public_key IS DISTINCT FROM OLD.public_key THEN
    RAISE EXCEPTION 'Cannot modify public_key';
  END IF;
  
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id';
  END IF;
  
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;
  
  -- Allow updates to safe fields: counter, last_used_at, device_type, transports, backed_up
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_passkey_update_restrictions_trigger ON public.passkey_credentials;
CREATE TRIGGER enforce_passkey_update_restrictions_trigger
  BEFORE UPDATE ON public.passkey_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_passkey_update_restrictions();