-- Remove the policy that could expose IP addresses and user agents
-- Users should access audit data through audit_events_safe table instead

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;