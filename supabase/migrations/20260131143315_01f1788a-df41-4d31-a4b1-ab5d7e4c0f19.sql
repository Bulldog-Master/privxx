-- Prevent direct client updates to sensitive profile fields (xx_coins_balance, referral_code, referred_by)
-- These should only be modified by server-side functions using service role

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block direct client modifications to xx_coins_balance
  IF OLD.xx_coins_balance IS DISTINCT FROM NEW.xx_coins_balance THEN
    RAISE EXCEPTION 'Cannot modify xx_coins_balance directly. Use authorized server functions.';
  END IF;
  
  -- Block direct client modifications to referral_code (auto-generated)
  IF OLD.referral_code IS DISTINCT FROM NEW.referral_code THEN
    RAISE EXCEPTION 'Cannot modify referral_code directly.';
  END IF;
  
  -- Block direct client modifications to referred_by (set once during signup)
  IF OLD.referred_by IS DISTINCT FROM NEW.referred_by THEN
    RAISE EXCEPTION 'Cannot modify referred_by directly.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce protection
DROP TRIGGER IF EXISTS protect_profile_sensitive_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();