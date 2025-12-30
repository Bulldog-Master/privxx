/**
 * Audit Log Section
 * 
 * Displays the user's security audit logs in settings.
 */

import { useTranslation } from 'react-i18next';
import { Shield, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useAuditLogs, type AuditLog } from '@/hooks/useAuditLogs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Event type display mappings
const eventTypeLabels: Record<string, string> = {
  auth_signin_success: 'Sign In',
  auth_signin_failure: 'Sign In Failed',
  auth_signup_success: 'Sign Up',
  auth_signup_failure: 'Sign Up Failed',
  auth_signout: 'Sign Out',
  auth_password_reset_request: 'Password Reset Request',
  auth_password_reset_complete: 'Password Reset Complete',
  auth_email_verification: 'Email Verified',
  passkey_registration_start: 'Passkey Registration Started',
  passkey_registration_complete: 'Passkey Registered',
  passkey_auth_success: 'Passkey Authentication',
  passkey_auth_failure: 'Passkey Auth Failed',
  totp_setup_start: '2FA Setup Started',
  totp_setup_complete: '2FA Enabled',
  totp_verify_success: '2FA Verified',
  totp_verify_failure: '2FA Verification Failed',
  totp_backup_code_used: 'Backup Code Used',
  profile_update: 'Profile Updated',
  session_timeout: 'Session Timeout',
  identity_create: 'Identity Created',
  identity_unlock: 'Identity Unlocked',
  identity_lock: 'Identity Locked',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function AuditLogItem({ log }: { log: AuditLog }) {
  const label = eventTypeLabels[log.event_type] || log.event_type;
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-3">
        {log.success ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {log.ip_address && `${log.ip_address} • `}
            {formatDate(log.created_at)}
          </p>
        </div>
      </div>
      <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
        {log.success ? 'Success' : 'Failed'}
      </Badge>
    </div>
  );
}

export function AuditLogSection() {
  const { t } = useTranslation();
  const { logs, isLoading, error, refetch } = useAuditLogs({ limit: 20 });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('settings.auditLog', 'Security Activity')}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          {t('settings.auditLogDescription', 'Recent security events for your account')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : isLoading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('settings.noAuditLogs', 'No security events recorded yet')}
          </p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            {logs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
