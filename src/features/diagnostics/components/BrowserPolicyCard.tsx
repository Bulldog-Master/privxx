/**
 * Browser Policy Decision Card (Phase-2 Diagnostic Stub)
 * 
 * Displays the policy decision for current browser signals.
 * No enforcement - diagnostics display only.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, CheckCircle2, AlertCircle, ShieldAlert, ShieldOff } from 'lucide-react';
import { useBrowserPolicyDecision } from '@/hooks/useBrowserPolicyDecision';
import type { PolicyDecision } from '@/lib/policy/types';

interface BrowserPolicyCardProps {
  anomalies: string[];
  signals: unknown;
}

const decisionConfig: Record<PolicyDecision, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  allow: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500/30' },
  warn: { icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10 border-warning/30' },
  require_reauth: { icon: ShieldAlert, color: 'text-orange-500', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  deny: { icon: ShieldOff, color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/30' },
};

export function BrowserPolicyCard({ anomalies, signals }: BrowserPolicyCardProps) {
  const { t } = useTranslation();
  
  const context = useMemo(() => ({ anomalies, signals }), [anomalies, signals]);
  const policyResult = useBrowserPolicyDecision(context);
  
  const config = decisionConfig[policyResult.decision];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4" />
          {t('diagnostics.policyDecision', 'Policy Decision')}
          <Badge variant="outline" className="text-xs ml-2">
            {t('diagnostics.phase2Preview', 'Phase-2 Preview')}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {t('diagnostics.policyDecisionDesc', 'Anomaly policy evaluation result (no enforcement)')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Decision Display */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color} flex-shrink-0`} />
          <div className="flex-1">
            <div className="font-medium capitalize">
              {t(`diagnostics.policy.${policyResult.decision}`, policyResult.decision.replace('_', ' '))}
            </div>
            {policyResult.reason && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {policyResult.reason}
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
          {t('diagnostics.policyPrivacy', 'Diagnostic only. No enforcement is applied. Always returns "allow" in Phase-2.')}
        </div>
      </CardContent>
    </Card>
  );
}
