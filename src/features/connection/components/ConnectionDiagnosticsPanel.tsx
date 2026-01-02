/**
 * ConnectionDiagnosticsPanel Component
 * 
 * Comprehensive diagnostics panel showing health breakdown,
 * history timeline, and network stats.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  calculateConnectionHealth, 
  getHealthColorClass, 
  getHealthBgClass,
  getConnectionQuality,
  getQualityColorClass,
} from "../utils";
import type { ConnectionHistoryEntry } from "../hooks/useConnectionHistory";

interface ConnectionDiagnosticsPanelProps {
  /** Current latency in ms */
  latency?: number;
  /** Connection history entries */
  history: ConnectionHistoryEntry[];
  /** Current success rate */
  successRate: number;
  /** Whether currently online */
  isOnline: boolean;
  /** Time offline in seconds */
  offlineDuration?: number;
  /** Callback to clear history */
  onClearHistory?: () => void;
  /** Callback to refresh/retry */
  onRefresh?: () => void;
  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
}

export function ConnectionDiagnosticsPanel({
  latency,
  history,
  successRate,
  isOnline,
  offlineDuration = 0,
  onClearHistory,
  onRefresh,
  isRefreshing = false,
}: ConnectionDiagnosticsPanelProps) {
  const { t } = useTranslation();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const health = calculateConnectionHealth(latency, history);
  const qualityGrade = getConnectionQuality(latency);
  const healthColorClass = getHealthColorClass(health.grade);
  const healthBgClass = getHealthBgClass(health.grade);
  const qualityColorClass = getQualityColorClass(qualityGrade);
  
  // Calculate averages from history
  const successfulEntries = history.filter(e => e.success);
  const avgLatency = successfulEntries.length > 0
    ? Math.round(successfulEntries.reduce((sum, e) => sum + e.latency, 0) / successfulEntries.length)
    : undefined;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${healthColorClass}`} />
            <CardTitle className="text-base">
              {t("health.title", "Connection Health")}
            </CardTitle>
          </div>
          
          {/* Online/Offline Status */}
          <Badge 
            variant="outline" 
            className={isOnline 
              ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" 
              : "bg-destructive/20 text-destructive border-destructive/30"
            }
          >
            {isOnline ? (
              <><Wifi className="h-3 w-3 mr-1" />{t("diagnosticsOnline", "Online")}</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" />{t("diagnosticsOffline", "Offline")}</>
            )}
          </Badge>
        </div>
        <CardDescription>
          {t("health.basedOn", "Based on {{count}} recent attempts", { count: health.sampleSize })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className={`rounded-lg p-4 ${healthBgClass}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/80">
              {t("health.overall", "Overall Health")}
            </span>
            <span className={`text-2xl font-bold ${healthColorClass}`}>
              {health.score}
            </span>
          </div>
          <Progress value={health.score} className="h-2" />
          <div className="flex justify-between mt-2">
            <Badge variant="outline" className={`${healthColorClass} border-current/30`}>
              {t(`health.${health.grade}`, health.grade)}
            </Badge>
            {offlineDuration > 0 && !isOnline && (
              <span className="text-xs text-muted-foreground">
                {t("offline", "Offline")} {offlineDuration}s
              </span>
            )}
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Latency */}
          <div className="rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              {t("health.latency", "Latency")}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${qualityColorClass}`}>
                {latency !== undefined ? `${latency}ms` : "—"}
              </span>
              {latency !== undefined && (
                latency < 1000 
                  ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                  : <TrendingDown className="h-4 w-4 text-amber-500" />
              )}
            </div>
            {avgLatency !== undefined && (
              <div className="text-xs text-muted-foreground mt-1">
                Avg: {avgLatency}ms
              </div>
            )}
          </div>
          
          {/* Success Rate */}
          <div className="rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3 w-3" />
              {t("health.successRate", "Success Rate")}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${
                successRate >= 80 ? "text-emerald-500" 
                : successRate >= 50 ? "text-amber-500" 
                : "text-destructive"
              }`}>
                {successRate}%
              </span>
              {successRate >= 80 
                ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                : <TrendingDown className="h-4 w-4 text-amber-500" />
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {successfulEntries.length}/{history.length} {t("connectionSuccess", "successful")}
            </div>
          </div>
        </div>
        
        {/* History Timeline */}
        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between px-3 h-9 text-sm"
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("connectionHistory", "Connection History")}
                <Badge variant="secondary" className="ml-1">
                  {history.length}
                </Badge>
              </span>
              {isHistoryOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <ScrollArea className="h-40 mt-2 rounded-lg border border-border/50">
              {history.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
                  {t("noConnectionEvents", "No connection events yet")}
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {history.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {entry.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className="truncate max-w-[120px] font-mono">
                          {entry.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{entry.latency}ms</span>
                        <span>
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Actions */}
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {t("diagnosticsRefresh", "Refresh")}
            </Button>
          )}
          {onClearHistory && history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t("clear", "Clear")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}
