-- Add a PERMISSIVE policy allowing authenticated users to view their own audit logs
-- This enables security monitoring while maintaining privacy (users only see their own events)

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);