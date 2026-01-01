-- The client now uses public.audit_events_safe; remove legacy view to reduce attack surface
DROP VIEW IF EXISTS public.audit_logs_safe;