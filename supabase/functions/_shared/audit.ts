/**
 * Audit Logging Utility for Privxx Edge Functions
 * 
 * Provides centralized audit logging for security-sensitive operations.
 * All audit events are stored server-side via the log_audit_event function.
 */

// Audit event types matching the database enum
export type AuditEventType = 
  | 'auth_signin_success'
  | 'auth_signin_failure'
  | 'auth_signup_success'
  | 'auth_signup_failure'
  | 'auth_signout'
  | 'auth_password_reset_request'
  | 'auth_password_reset_complete'
  | 'auth_email_verification'
  | 'passkey_registration_start'
  | 'passkey_registration_complete'
  | 'passkey_auth_success'
  | 'passkey_auth_failure'
  | 'totp_setup_start'
  | 'totp_setup_complete'
  | 'totp_verify_success'
  | 'totp_verify_failure'
  | 'totp_backup_code_used'
  | 'profile_update'
  | 'session_timeout'
  | 'identity_create'
  | 'identity_unlock'
  | 'identity_lock';

interface AuditLogParams {
  userId?: string | null;
  eventType: AuditEventType;
  success?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

/**
 * Log an audit event to the database
 * Uses the log_audit_event function which bypasses RLS
 */
export async function logAuditEvent(
  supabase: any,
  params: AuditLogParams
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_audit_event', {
      _user_id: params.userId || null,
      _event_type: params.eventType,
      _success: params.success ?? true,
      _ip_address: params.ipAddress || null,
      _user_agent: params.userAgent || null,
      _metadata: params.metadata || {},
    });

    if (error) {
      // Log to console but don't throw - audit logging should not break main functionality
      console.error('[audit] Failed to log event:', error.message);
    }
  } catch (err) {
    console.error('[audit] Error logging event:', err instanceof Error ? err.message : 'Unknown error');
  }
}

/**
 * Helper to create audit context from a request
 */
export function createAuditContext(req: Request): { ipAddress: string; userAgent: string } {
  return {
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  };
}
