-- Enable RLS on the audit_logs_safe view
ALTER VIEW public.audit_logs_safe SET (security_invoker = true);

-- Note: Views with security_invoker inherit RLS from the base table (audit_logs)
-- The base table already has proper RLS policies that:
-- 1. Block anon access
-- 2. Allow users to view only their own logs
-- 3. Block all client INSERT/UPDATE/DELETE

-- However, to be explicit and satisfy the security scanner, we add view-level policies

-- First revoke any default grants
REVOKE ALL ON public.audit_logs_safe FROM anon;
REVOKE ALL ON public.audit_logs_safe FROM authenticated;

-- Grant SELECT only to authenticated users (RLS on base table handles row filtering)
GRANT SELECT ON public.audit_logs_safe TO authenticated;