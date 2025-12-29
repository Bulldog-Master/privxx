import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  weight: number;
}

interface HealthScorePanelProps {
  bridgeHealth?: boolean | null;
  xxdkInfo?: boolean | null;
  cmixxStatus?: boolean | null;
  isAuthenticated?: boolean;
  hasIdentity?: boolean;
  isLoading?: boolean;
}

function calculateHealthScore(checks: HealthCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const score = checks.reduce((sum, c) => {
    switch (c.status) {
      case 'healthy': return sum + c.weight;
      case 'warning': return sum + (c.weight * 0.5);
      case 'critical': return sum;
      case 'unknown': return sum + (c.weight * 0.25);
    }
  }, 0);
  return Math.round((score / totalWeight) * 100);
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-destructive';
}

function getScoreLabel(score: number, t: (key: string, fallback: string) => string): string {
  if (score >= 80) return t('diagnostics.healthExcellent', 'Excellent');
  if (score >= 60) return t('diagnostics.healthGood', 'Good');
  if (score >= 40) return t('diagnostics.healthFair', 'Fair');
  return t('diagnostics.healthPoor', 'Poor');
}

function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-destructive';
}

export function HealthScorePanel({
  bridgeHealth,
  xxdkInfo,
  cmixxStatus,
  isAuthenticated = false,
  hasIdentity = false,
  isLoading = false,
}: HealthScorePanelProps) {
  const { t } = useTranslation();

  const checks = useMemo<HealthCheck[]>(() => {
    const getStatus = (value: boolean | null | undefined): HealthCheck['status'] => {
      if (value === null || value === undefined) return 'unknown';
      return value ? 'healthy' : 'critical';
    };

    return [
      { 
        name: t('diagnostics.bridgeApi', 'Bridge API'), 
        status: getStatus(bridgeHealth), 
        weight: 3 
      },
      { 
        name: t('diagnostics.xxdkService', 'xxDK Service'), 
        status: getStatus(xxdkInfo), 
        weight: 2 
      },
      { 
        name: t('diagnostics.cmixxNetwork', 'cMixx Network'), 
        status: getStatus(cmixxStatus), 
        weight: 2 
      },
      { 
        name: t('diagnostics.authentication', 'Authentication'), 
        status: isAuthenticated ? 'healthy' : 'warning', 
        weight: 1 
      },
      { 
        name: t('diagnostics.identityStatus', 'Identity'), 
        status: hasIdentity ? 'healthy' : 'warning', 
        weight: 1 
      },
    ];
  }, [bridgeHealth, xxdkInfo, cmixxStatus, isAuthenticated, hasIdentity, t]);

  const score = useMemo(() => calculateHealthScore(checks), [checks]);
  const healthyCount = checks.filter(c => c.status === 'healthy').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const criticalCount = checks.filter(c => c.status === 'critical').length;

  const StatusIcon = ({ status }: { status: HealthCheck['status'] }) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'unknown':
        return <Activity className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {t('diagnostics.systemHealth', 'System Health')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {t('diagnostics.systemHealth', 'System Health')}
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={cn("font-mono text-xs", getScoreColor(score))}
          >
            {getScoreLabel(score, t)}
          </Badge>
        </div>
        <CardDescription>
          {t('diagnostics.healthScoreDesc', 'Overall system status and service availability')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score display */}
        <div className="flex items-center gap-4">
          <div className={cn("text-4xl font-bold tabular-nums", getScoreColor(score))}>
            {score}%
          </div>
          <div className="flex-1 space-y-1">
            <Progress 
              value={score} 
              className="h-2"
              style={{
                ['--progress-foreground' as string]: getProgressColor(score),
              }}
            />
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {healthyCount} {t('diagnostics.healthy', 'healthy')}
              </span>
              {warningCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  {warningCount} {t('diagnostics.warnings', 'warnings')}
                </span>
              )}
              {criticalCount > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-destructive" />
                  {criticalCount} {t('diagnostics.critical', 'critical')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Individual checks */}
        <div className="grid grid-cols-1 gap-1.5 pt-2 border-t">
          {checks.map((check) => (
            <div 
              key={check.name}
              className="flex items-center justify-between py-1 px-2 rounded-sm bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <StatusIcon status={check.status} />
                <span className="text-sm">{check.name}</span>
              </div>
              <span className={cn(
                "text-xs capitalize",
                check.status === 'healthy' && 'text-emerald-500',
                check.status === 'warning' && 'text-amber-500',
                check.status === 'critical' && 'text-destructive',
                check.status === 'unknown' && 'text-muted-foreground',
              )}>
                {t(`diagnostics.status.${check.status}`, check.status)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
