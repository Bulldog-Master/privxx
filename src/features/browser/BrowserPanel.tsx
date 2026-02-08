import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useIdentity } from "@/features/identity";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { LockedState } from "@/components/shared";
import { bridgeClient } from "@/api/bridge";
import { toast } from "sonner";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

export function BrowserPanel() {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();

  const [url, setUrl] = useState("https://");
  const [state, setState] = useState<ConnectionState>("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();

  const canConnect = useMemo(() => {
    return isUnlocked && url.trim().length > 8 && (state === "idle" || state === "error");
  }, [isUnlocked, url, state]);

  const onConnect = useCallback(async () => {
    if (!canConnect) return;
    setState("connecting");
    setLatency(null);
    setError(undefined);

    const startTime = performance.now();

    try {
      const ack = await bridgeClient.connect(url.trim());

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);

      if (ack.ack) {
        setState("connected");
        toast.success(t("tunnelConnected", "Tunnel established"));
      } else {
        setState("error");
        const msg = ack.errorCode || "Connection rejected";
        setError(msg);
        toast.error(msg);
      }
    } catch (e: unknown) {
      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);

      const msg = e instanceof Error ? e.message : "Connection failed";
      // Detect missing endpoint (bridge hasn't wired /connect yet)
      const is404 = msg.includes("404") || msg.includes("Not Found");
      const isNetworkFail = msg.includes("Load failed") || msg.includes("Fetch failed") || msg.includes("Network");

      if (is404 || isNetworkFail) {
        setError(t("tunnelNotAvailable", "Tunnel endpoint not available yet"));
      } else {
        setError(msg);
      }
      setState("error");
      toast.error(t("tunnelFailed", "Tunnel connection failed"));
    }
  }, [canConnect, url, t]);

  const onDisconnect = useCallback(async () => {
    try {
      await bridgeClient.disconnect();
      toast.success(t("tunnelDisconnected", "Tunnel closed"));
    } catch {
      // Best-effort disconnect
    } finally {
      setState("idle");
      setLatency(null);
      setError(undefined);
    }
  }, [t]);

  if (!isUnlocked) {
    return <LockedState hintKey="unlockToAccessBrowser" />;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-primary/80">{t("browserUrl", "Destination URL")}</label>
        <input
          className="w-full rounded-md border-2 border-primary/60 bg-background px-3 py-2 min-h-[44px] text-primary placeholder:text-primary/50"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={state === "connecting" || state === "connected"}
        />
        <div className="text-xs text-primary/60">
          {t("browserHint", "Enter a URL to route through the Privxx tunnel.")}
        </div>
      </div>

      {(state === "idle" || state === "error") && (
        <>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button 
            className="min-h-[44px] w-full" 
            disabled={!canConnect} 
            onClick={onConnect}
          >
            <Shield className="mr-2 h-4 w-4" />
            {t("connectThroughPrivxx", "Connect through Privxx")}
          </Button>
        </>
      )}

      {state === "connecting" && (
        <div className="rounded-lg border border-primary/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-primary/90">{t("statusConnecting", "Connecting through Privxx…")}</span>
          </div>
          <div className="text-xs text-primary/60 space-y-1">
            <div>{t("tunnelStep1", "Initializing cMixx tunnel...")}</div>
            <div>{t("tunnelStep2", "Negotiating PQ keys...")}</div>
            <div>{t("tunnelStep3", "Routing through mixnet...")}</div>
          </div>
        </div>
      )}

      {state === "connected" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t("statusConnected", "Connected")}
              </span>
            </div>
            <div className="text-xs text-primary/60">
              {t("requestedUrl", "Requested URL")}: <span className="font-mono">{url}</span>
            </div>
            {latency !== null && (
              <div className="text-xs text-primary/60">
                {t("tunnelLatency", "Tunnel latency")}: <span className="font-mono">{latency} ms</span>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-primary/20 p-3 space-y-1">
            <div className="text-sm font-medium text-primary/90">{t("browserPreviewTitle", "Content Preview")}</div>
            <div className="text-sm text-primary/60">
              {t("browserPreviewNote", "Proxied content will appear here in a future version.")}
            </div>
          </div>

          <Button 
            variant="outline" 
            className="min-h-[44px] w-full" 
            onClick={onDisconnect}
          >
            {t("disconnect", "Disconnect")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default BrowserPanel;
