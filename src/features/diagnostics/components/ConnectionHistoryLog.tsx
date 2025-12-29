import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConnectionEvent {
  id: string;
  timestamp: Date;
  endpoint: string;
  status: "success" | "error" | "pending";
  message?: string;
  responseTime?: number;
}

const MAX_EVENTS = 50;

const ConnectionHistoryLog = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<ConnectionEvent[]>([]);

  const addEvent = useCallback((event: Omit<ConnectionEvent, "id">) => {
    setEvents((prev) => {
      const newEvent = { ...event, id: crypto.randomUUID() };
      const updated = [newEvent, ...prev].slice(0, MAX_EVENTS);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEvents([]);
  }, []);

  // Subscribe to query cache updates to log connection events
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event.query.queryKey[0]?.toString().startsWith("bridge-")) return;

      const endpoint = event.query.queryKey[0].toString().replace("bridge-", "/");
      
      if (event.type === "updated") {
        const state = event.query.state;
        
        if (state.status === "success") {
          addEvent({
            timestamp: new Date(),
            endpoint,
            status: "success",
            message: t("connectionSuccess", "Connected successfully"),
          });
        } else if (state.status === "error") {
          addEvent({
            timestamp: new Date(),
            endpoint,
            status: "error",
            message: state.error instanceof Error ? state.error.message : t("connectionFailed"),
          });
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient, addEvent, t]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return t("justNow", "Just now");
    if (diffSecs < 3600) return t("minutesAgo", "{{count}}m ago", { count: Math.floor(diffSecs / 60) });
    return t("hoursAgo", "{{count}}h ago", { count: Math.floor(diffSecs / 3600) });
  };

  const getStatusIcon = (status: ConnectionEvent["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "error":
        return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case "pending":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  const getStatusColor = (status: ConnectionEvent["status"]) => {
    switch (status) {
      case "success":
        return "border-l-emerald-500";
      case "error":
        return "border-l-destructive";
      case "pending":
        return "border-l-amber-500";
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{t("connectionHistory", "Connection History")}</CardTitle>
              <CardDescription className="text-xs">
                {t("connectionHistoryDesc", "Recent bridge connection attempts")}
              </CardDescription>
            </div>
          </div>
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t("clear", "Clear")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>{t("noConnectionEvents", "No connection events yet")}</p>
            <p className="text-xs mt-1">{t("eventsWillAppear", "Events will appear as the bridge is queried")}</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-1.5">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-2 p-2 rounded-md bg-muted/30 border-l-2 ${getStatusColor(event.status)}`}
                >
                  <div className="mt-0.5">{getStatusIcon(event.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-medium truncate">
                        {event.endpoint}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.message}
                    </p>
                    {event.responseTime && event.status === "success" && (
                      <p className="text-[10px] text-muted-foreground/70">
                        {event.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {events.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("totalEvents", "{{count}} events", { count: events.length })}
            </span>
            <span>
              {t("lastEvent", "Last")}: {formatTime(events[0].timestamp)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionHistoryLog;
