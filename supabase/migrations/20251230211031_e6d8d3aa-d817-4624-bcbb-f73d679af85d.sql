-- Enable RLS on the audit_logs_safe view
-- The view inherits from audit_logs which already has RLS, but we need explicit policies

-- First, grant usage and restrict via RLS
ALTER VIEW public.audit_logs_safe SET (security_invoker = true);

-- Create explicit RLS policy on the view (views with security_invoker inherit underlying table RLS)
-- Since audit_logs already has proper RLS, users can only see their own logs through the view

-- Revoke public access and only allow authenticated users
REVOKE ALL ON public.audit_logs_safe FROM anon;
REVOKE ALL ON public.audit_logs_safe FROM public;
GRANT SELECT ON public.audit_logs_safe TO authenticated;