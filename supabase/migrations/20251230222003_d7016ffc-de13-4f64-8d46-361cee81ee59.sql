-- audit_logs_safe is a VIEW, not a table
-- Views inherit RLS from their underlying tables, but we need to ensure proper access control
-- The underlying audit_logs table already has RLS, so the view should be secure
-- However, let's verify by checking if we need to add security barrier

-- Recreate the view with SECURITY INVOKER (default) to ensure RLS is respected
DROP VIEW IF EXISTS public.audit_logs_safe;

CREATE VIEW public.audit_logs_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  event_type,
  success,
  metadata,
  created_at
FROM public.audit_logs;

-- Grant select to authenticated users (RLS on audit_logs will filter)
GRANT SELECT ON public.audit_logs_safe TO authenticated;

-- Revoke access from anon role
REVOKE ALL ON public.audit_logs_safe FROM anon;

-- Ensure rate_limits has FORCE RLS as well
ALTER TABLE public.rate_limits FORCE ROW LEVEL SECURITY;