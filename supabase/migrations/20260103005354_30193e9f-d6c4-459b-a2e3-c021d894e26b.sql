-- Add explicit policy to block anonymous SELECT on profiles
CREATE POLICY "Deny anon SELECT on profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);