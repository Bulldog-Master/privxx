import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Server, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIdentity } from '@/features/identity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageBackground } from '@/components/layout';
import {
  StatusCard,
  StatusCardSkeleton,
  DiagnosticsFooter,
  useDiagnosticsState,
  getBackendStatusDisplay,
  getModeDisplay,
  BridgeStatusCard,
  ConnectionHistoryLog,
  TranslationStatusDashboard,
  ReadinessPanel,
  LatencyTrendChart,
  HealthScorePanel,
  BrowserAnomalyCard,
  BrowserPolicyCard,
  PaymentIntentPreview,
  ConnectionPathDiagram,
  OverallStatusBar,
  TranslationCoverageBadge,
  NetworkStatsPanel,
  HealthPayloadCard,
} from '@/components/diagnostics';
import type { LayerState } from '@/components/diagnostics';
import { RefreshCw } from 'lucide-react';
import { buildInfo } from '@/lib/buildInfo';
import { collectBrowserAnomalySignals, detectAnomalies } from '@/lib/browserAnomalySignals';

export default function Diagnostics() {
  const { t } = useTranslation();
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const { isAuthenticated } = useAuth();
  const { isUnlocked } = useIdentity();
  const {
    copied,
    isRetrying,
    showSuccess,
    status,
    uiState,
    isLoading,
    refetch,
    handleRetry,
    copyStatus,
  } = useDiagnosticsState();

  // Update last check time when data refreshes
  useEffect(() => {
    if (!isLoading) {
      setLastCheckTime(new Date());
    }
  }, [status.state, isLoading]);

  const backendStatus = getBackendStatusDisplay(uiState, isLoading, t);
  const modeStatus = getModeDisplay(status.isMock, t);

  // Collect browser signals for policy card
  const { signals, anomalies } = useMemo(() => {
    const collected = collectBrowserAnomalySignals();
    const detected = detectAnomalies(collected);
    return { signals: collected, anomalies: detected };
  }, []);

  // Derive layer states from unified backend status (not separate bridgeHealth)
  const layerState = useMemo((): LayerState => {
    // Client is always reachable (it's the browser)
    const client = "reachable" as const;
    
    // Map uiState to layer statuses - use the same source for consistency
    const isReady = uiState === "ready";
    const isError = uiState === "error";
    const isConnecting = uiState === "connecting";
    
    // Proxy/Health status - based on backend status
    let proxy: LayerState["proxy"] = "unknown";
    if (isLoading) {
      proxy = "starting";
    } else if (isReady || isConnecting) {
      proxy = "reachable";
    } else if (isError) {
      proxy = "unreachable";
    }

    // Bridge status - based on backend status
    let bridge: LayerState["bridge"] = "unknown";
    if (isLoading) {
      bridge = "starting";
    } else if (isReady || isConnecting) {
      bridge = "reachable";
    } else if (isError) {
      bridge = "unreachable";
    }

    // xxDK status - based on connection state
    let xxdk: LayerState["xxdk"] = "unknown";
    if (isLoading) {
      xxdk = "starting";
    } else if (status.state === "secure") {
      xxdk = "reachable";
    } else if (status.state === "connecting") {
      xxdk = "starting";
    } else if (isError) {
      xxdk = "unreachable";
    } else if (status.state === "idle") {
      // Idle means bridge is reachable but not connected yet
      xxdk = "unknown";
    }

    return { client, proxy, bridge, xxdk };
  }, [uiState, isLoading, status.state]);

  const handleRefreshAll = () => {
    refetch();
  };

  return (
    <PageBackground>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                {t('diagnostics.pageTitle', 'System Diagnostics')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('diagnostics.pageDescription', 'Monitor system health and translation status')}
              </p>
            </div>
          </div>
          <TranslationCoverageBadge />
        </div>

        {/* Overall Status Bar */}
        <OverallStatusBar
          layerState={layerState}
          isMock={status.isMock}
          lastCheckTime={lastCheckTime}
          onRefresh={handleRefreshAll}
          isRefreshing={isLoading}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Health Section */}
          <div className="space-y-6">
            {/* Connection Path Diagram */}
            <ConnectionPathDiagram
              layerState={layerState}
              isLoading={isLoading}
            />

            {/* Health Score Summary */}
            <HealthScorePanel 
              bridgeHealth={uiState === "ready" ? true : uiState === "error" ? false : null}
              xxdkInfo={uiState === "ready" ? true : uiState === "error" ? false : null}
              cmixxStatus={uiState === "ready" ? true : uiState === "error" ? false : null}
              isAuthenticated={isAuthenticated}
              hasIdentity={isUnlocked}
              isLoading={isLoading} 
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {t('diagnostics.systemHealth', 'System Health')}
                </CardTitle>
                <CardDescription>
                  {t('diagnostics.systemHealthDesc', 'Backend connectivity and service status')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Health Payload - shows /health response including xxdkReady */}
                <HealthPayloadCard />

                {/* Bridge Status Card */}
                <BridgeStatusCard />

                {/* Backend Status */}
                {isLoading ? (
                  <StatusCardSkeleton titleWidth="w-16" subtitleWidth="w-24" labelWidth="w-14" />
                ) : (
                  <StatusCard
                    icon={backendStatus.icon}
                    iconColor={backendStatus.color}
                    bgColor={backendStatus.bgColor}
                    title={t('diagnosticsBackend')}
                    subtitle={t('diagnosticsBackendSubtext')}
                    label={backendStatus.label}
                    labelColor={backendStatus.color}
                    pulse={backendStatus.pulse}
                    showSuccess={showSuccess}
                    actions={
                      uiState === 'error' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 px-3 text-xs transition-all duration-300 ${isRetrying ? 'scale-95 opacity-70' : ''}`}
                          onClick={handleRetry}
                          disabled={isLoading || isRetrying}
                        >
                          <RefreshCw
                            className={`h-3 w-3 mr-1.5 transition-transform duration-300 ${isRetrying ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                          />
                          {t('diagnosticsRetry')}
                        </Button>
                      ) : undefined
                    }
                  />
                )}

                {/* Mode Status */}
                {isLoading ? (
                  <StatusCardSkeleton titleWidth="w-12" subtitleWidth="w-28" labelWidth="w-16" />
                ) : (
                  <StatusCard
                    icon={modeStatus.icon}
                    iconColor={modeStatus.color}
                    bgColor={modeStatus.bgColor}
                    title={t('diagnosticsMode')}
                    subtitle={modeStatus.sublabel}
                    label={modeStatus.label}
                    labelColor={modeStatus.color}
                  />
                )}
              </CardContent>
            </Card>

            {/* Readiness Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('diagnostics.readiness', 'Readiness Checks')}
                </CardTitle>
                <CardDescription>
                  {t('diagnostics.readinessDesc', 'Service availability and configuration status')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isLoading && <ReadinessPanel />}
              </CardContent>
            </Card>

            {/* Latency Trend Chart */}
            <LatencyTrendChart />

            {/* Connection History */}
            <ConnectionHistoryLog />

            {/* Version & Actions */}
            <Card>
              <CardContent className="pt-6">
                <DiagnosticsFooter
                  isLoading={isLoading}
                  copied={copied}
                  onRefresh={refetch}
                  onCopy={copyStatus}
                />
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t('diagnostics.version', 'Version')}</span>
                    <span className="font-mono">{buildInfo.version}</span>
                  </div>
                  {buildInfo.build && (
                    <div className="flex justify-between mt-1">
                      <span>{t('diagnostics.build', 'Build')}</span>
                      <span className="font-mono">{buildInfo.build}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Translation & Network Stats Section */}
          <div className="space-y-6">
            {/* Network Statistics Panel */}
            <NetworkStatsPanel />
            
            <TranslationStatusDashboard />
            <BrowserAnomalyCard />
            <BrowserPolicyCard anomalies={anomalies} signals={signals} />
            <PaymentIntentPreview />
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
