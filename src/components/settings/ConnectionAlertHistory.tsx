/**
 * Connection Alert History Component
 * 
 * Displays historical connection quality alerts for debugging.
 * Includes share functionality for support.
 */

import { useTranslation } from "react-i18next";
import { History, Trash2, Download, AlertTriangle, CheckCircle, XCircle, Clock, Share2, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConnectionAlertPreferences, ConnectionAlertHistoryEntry } from "@/hooks/useConnectionAlertPreferences";
import { toast } from "@/hooks/useToast";
import { format } from "date-fns";

const alertTypeConfig: Record<ConnectionAlertHistoryEntry['type'], {
  icon: typeof AlertTriangle;
  color: string;
  labelKey: string;
}> = {
  latency_warning: { icon: Clock, color: 'text-amber-500', labelKey: 'connectionAlerts.history.latencyWarning' },
  latency_critical: { icon: AlertTriangle, color: 'text-red-500', labelKey: 'connectionAlerts.history.latencyCritical' },
  latency_recovered: { icon: CheckCircle, color: 'text-emerald-500', labelKey: 'connectionAlerts.history.latencyRecovered' },
  connection_lost: { icon: XCircle, color: 'text-red-500', labelKey: 'connectionAlerts.history.connectionLost' },
  connection_degraded: { icon: AlertTriangle, color: 'text-amber-500', labelKey: 'connectionAlerts.history.connectionDegraded' },
  connection_restored: { icon: CheckCircle, color: 'text-emerald-500', labelKey: 'connectionAlerts.history.connectionRestored' },
};

export function ConnectionAlertHistory() {
  const { t } = useTranslation("ui");
  const { history, clearHistory, getHistoryForExport } = useConnectionAlertPreferences();

  const handleClearHistory = () => {
    clearHistory();
    toast({
      title: t("connectionAlerts.history.cleared", "History cleared"),
      description: t("connectionAlerts.history.clearedDesc", "All alert history has been removed"),
    });
  };

  const handleExportHistory = () => {
    const data = JSON.stringify(getHistoryForExport(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privxx-alert-history-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: t("connectionAlerts.history.exported", "History exported"),
      description: t("connectionAlerts.history.exportedDesc", "Alert history saved as JSON file"),
    });
  };

  const handleShareViaEmail = () => {
    const exportData = getHistoryForExport();
    const summary = history.slice(0, 10).map(entry => {
      const date = format(new Date(entry.timestamp), 'MMM d, HH:mm:ss');
      const latency = entry.latency ? ` (${entry.latency}ms)` : '';
      return `- ${date}: ${entry.type.replace(/_/g, ' ')}${latency}`;
    }).join('\n');
    
    const body = encodeURIComponent(
      `Privxx Connection Alert History\n` +
      `================================\n\n` +
      `Exported: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n` +
      `Total Alerts: ${history.length}\n\n` +
      `Recent Alerts (last 10):\n${summary}\n\n` +
      `Thresholds:\n` +
      `- Latency Warning: ${exportData.thresholds.latencyWarning}ms\n` +
      `- Latency Critical: ${exportData.thresholds.latencyCritical}ms\n` +
      `- Degraded Duration: ${exportData.thresholds.degradedDuration / 1000}s\n\n` +
      `For full history, please request the JSON export.`
    );
    
    const subject = encodeURIComponent('Privxx Connection Alert History');
    window.open(`mailto:support@privxx.app?subject=${subject}&body=${body}`, '_blank');
    
    toast({
      title: t("connectionAlerts.history.emailOpened", "Email opened"),
      description: t("connectionAlerts.history.emailOpenedDesc", "Complete your support request in your email app"),
    });
  };

  const handleShareNative = async () => {
    const exportData = getHistoryForExport();
    const text = `Privxx Alert History - ${history.length} alerts recorded. ` +
      `Latest: ${history[0]?.type.replace(/_/g, ' ') || 'none'}`;
    
    if (navigator.share) {
      try {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const file = new File([blob], `privxx-alerts-${format(new Date(), 'yyyy-MM-dd')}.json`, { type: 'application/json' });
        
        await navigator.share({
          title: 'Privxx Alert History',
          text,
          files: [file],
        });
        
        toast({
          title: t("connectionAlerts.history.shared", "History shared"),
          description: t("connectionAlerts.history.sharedDesc", "Alert history shared successfully"),
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // Fallback to copy
          await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
          toast({
            title: t("connectionAlerts.history.copied", "Copied to clipboard"),
            description: t("connectionAlerts.history.copiedDesc", "Alert history copied for sharing"),
          });
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      toast({
        title: t("connectionAlerts.history.copied", "Copied to clipboard"),
        description: t("connectionAlerts.history.copiedDesc", "Alert history copied for sharing"),
      });
    }
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <History className="h-5 w-5" />
              {t("connectionAlerts.history.title", "Alert History")}
            </CardTitle>
            <CardDescription className="text-primary/70">
              {t("connectionAlerts.history.description", "Recent connection quality alerts for debugging")}
            </CardDescription>
          </div>
          {history.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {history.length} {t("connectionAlerts.history.entries", "entries")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8 text-primary/50">
            <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("connectionAlerts.history.empty", "No alerts recorded yet")}</p>
            <p className="text-xs mt-1">{t("connectionAlerts.history.emptyDesc", "Alerts will appear here when connection issues occur")}</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {history.map((entry) => {
                  const config = alertTypeConfig[entry.type];
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
                    >
                      <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-primary truncate">
                            {t(config.labelKey, entry.type.replace(/_/g, ' '))}
                          </p>
                          {entry.latency && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {entry.latency}ms
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-primary/50 mt-0.5">
                          {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportHistory}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                {t("connectionAlerts.history.export", "Export")}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Share2 className="h-4 w-4" />
                    {t("connectionAlerts.history.share", "Share")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={handleShareViaEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    {t("connectionAlerts.history.shareEmail", "Email to Support")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareNative}>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t("connectionAlerts.history.shareNative", "Share via...")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearHistory}
                className="flex-1 gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {t("connectionAlerts.history.clear", "Clear")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
