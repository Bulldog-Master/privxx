-- Create privacy-safe audit events table for client access (no IP/User-Agent)
CREATE TABLE IF NOT EXISTS public.audit_events_safe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type public.audit_event_type NOT NULL,
  success boolean NOT NULL DEFAULT true,
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_safe_user_created_at
  ON public.audit_events_safe (user_id, created_at DESC);

ALTER TABLE public.audit_events_safe ENABLE ROW LEVEL SECURITY;

-- Block anon access (defense-in-depth)
DROP POLICY IF EXISTS "Deny anon access to audit_events_safe" ON public.audit_events_safe;
CREATE POLICY "Deny anon access to audit_events_safe"
ON public.audit_events_safe
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Authenticated users can only read their own safe events
DROP POLICY IF EXISTS "Users can view their own audit events (safe)" ON public.audit_events_safe;
CREATE POLICY "Users can view their own audit events (safe)"
ON public.audit_events_safe
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Block all client writes
DROP POLICY IF EXISTS "Block client INSERT on audit_events_safe" ON public.audit_events_safe;
CREATE POLICY "Block client INSERT on audit_events_safe"
ON public.audit_events_safe
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Block client UPDATE on audit_events_safe" ON public.audit_events_safe;
CREATE POLICY "Block client UPDATE on audit_events_safe"
ON public.audit_events_safe
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Block client DELETE on audit_events_safe" ON public.audit_events_safe;
CREATE POLICY "Block client DELETE on audit_events_safe"
ON public.audit_events_safe
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);

-- Remove direct client SELECT access to raw audit_logs (contains IP/User-Agent)
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Block client SELECT on audit_logs" ON public.audit_logs;
CREATE POLICY "Block client SELECT on audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (false);

-- Copy raw audit_logs inserts into the safe table
CREATE OR REPLACE FUNCTION public.copy_audit_log_to_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_events_safe (id, user_id, event_type, success, metadata, created_at)
  VALUES (NEW.id, NEW.user_id, NEW.event_type, NEW.success, COALESCE(NEW.metadata, '{}'::jsonb), NEW.created_at)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_copy_to_safe ON public.audit_logs;
CREATE TRIGGER audit_logs_copy_to_safe
AFTER INSERT ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.copy_audit_log_to_safe();
