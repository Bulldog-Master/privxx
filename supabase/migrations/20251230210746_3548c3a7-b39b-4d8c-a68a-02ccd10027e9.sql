-- Create a safe view for audit logs that excludes sensitive metadata
-- This prevents direct client access to IP addresses and user agents
CREATE OR REPLACE VIEW public.audit_logs_safe AS
SELECT 
  id,
  user_id,
  event_type,
  success,
  created_at,
  -- Only expose non-sensitive metadata
  metadata - 'ip_address' - 'user_agent' AS metadata
FROM public.audit_logs;

-- Enable RLS on the view (requires security_invoker)
ALTER VIEW public.audit_logs_safe SET (security_invoker = true);

-- Grant select to authenticated users (RLS from underlying table applies)
GRANT SELECT ON public.audit_logs_safe TO authenticated;

-- Add comment explaining the purpose
COMMENT ON VIEW public.audit_logs_safe IS 'Privacy-safe view of audit logs excluding IP addresses and user agents';