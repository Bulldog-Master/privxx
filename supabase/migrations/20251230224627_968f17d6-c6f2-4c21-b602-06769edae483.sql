-- Verify and reinforce security on audit_logs_safe view
-- Views don't support RLS directly - security comes from:
-- 1. security_invoker=true (inherits RLS from base audit_logs table)
-- 2. GRANT/REVOKE to control role access

-- Ensure anon role has NO access to the view
REVOKE ALL ON public.audit_logs_safe FROM anon;

-- Ensure authenticated users can only SELECT (RLS on audit_logs filters to own rows)
REVOKE ALL ON public.audit_logs_safe FROM authenticated;
GRANT SELECT ON public.audit_logs_safe TO authenticated;

-- Add comment documenting the security model
COMMENT ON VIEW public.audit_logs_safe IS 
'Privacy-safe audit log view that excludes ip_address and user_agent columns. 
Security: Uses security_invoker=true so RLS on audit_logs applies. 
Anon access revoked. Authenticated users see only their own logs via RLS.';