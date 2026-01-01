-- Fix RLS for audit_logs_safe view
-- The view already exists with security_invoker = true, but we need proper policies

-- First, revoke any existing public access
REVOKE ALL ON public.audit_logs_safe FROM anon;
REVOKE ALL ON public.audit_logs_safe FROM public;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.audit_logs_safe TO authenticated;

-- Ensure the underlying audit_logs table has proper RLS
-- Add a SELECT policy for authenticated users to read their own logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Users can view their own audit logs'
  ) THEN
    CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;