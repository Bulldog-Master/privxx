/**
 * ConnectionHistoryPanel
 * 
 * Displays recent connection attempts with status and latency.
 */

import { useState } from "react";
import { History, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConnectionHistory, type ConnectionHistoryEntry } from "../hooks/useConnectionHistory";
import { getConnectionQuality, type ConnectionQuality } from "../utils/connectionQuality";
import { Button } from "@/components/ui/button";

const qualityColors: Record<ConnectionQuality, string> = {
  excellent: "text-emerald-400",
  good: "text-green-400",
  fair: "text-yellow-400",
  poor: "text-red-400",
  unknown: "text-muted-foreground",
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function HistoryEntry({ entry }: { entry: ConnectionHistoryEntry }) {
  const { t } = useTranslation();
  const quality = getConnectionQuality(entry.latency);
  
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-background/5 rounded-lg">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {entry.success ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
        )}
        <span className="text-sm text-foreground/80 truncate">
          {entry.url}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        {entry.latency !== undefined && (
          <span className={`text-xs font-mono ${qualityColors[quality]}`}>
            {entry.latency}ms
          </span>
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(entry.timestamp)}
        </span>
      </div>
    </div>
  );
}

export function ConnectionHistoryPanel() {
  const { t } = useTranslation();
  const { history, clearHistory } = useConnectionHistory();
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  const recentHistory = isExpanded ? history : history.slice(0, 3);

  return (
    <div className="w-full max-w-md">
      <div className="bg-background/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-background/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground/80">
              {t("connection.history.title", "Recent Connections")}
            </span>
            <span className="text-xs text-muted-foreground">
              ({history.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* History list */}
        <div className="px-3 pb-3 space-y-1">
          {recentHistory.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} />
          ))}
        </div>

        {/* Footer actions */}
        {isExpanded && history.length > 0 && (
          <div className="px-3 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {t("connection.history.clear", "Clear History")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectionHistoryPanel;
