import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useIdentity } from "@/contexts/IdentityContext";
import { Loader2, Shield } from "lucide-react";
import { LockedState } from "@/components/shared";

type ConnectionState = "idle" | "connecting" | "connected";

export function BrowserPanel() {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();

  const [url, setUrl] = useState("https://");
  const [state, setState] = useState<ConnectionState>("idle");
  const [latency, setLatency] = useState<number | null>(null);

  const canConnect = useMemo(() => {
    return isUnlocked && url.trim().length > 8 && state === "idle";
  }, [isUnlocked, url, state]);

  const onConnect = async () => {
    if (!canConnect) return;
    setState("connecting");
    setLatency(null);

    // Simulate mixnet routing delay (2-3s) per spec
    const delay = 2000 + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, delay));

    // Simulated latency (500-2500ms) per spec
    const simulatedLatency = Math.round(500 + Math.random() * 2000);
    setLatency(simulatedLatency);
    setState("connected");
  };

  const onDisconnect = () => {
    setState("idle");
    setLatency(null);
  };

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
          disabled={state !== "idle"}
        />
        <div className="text-xs text-primary/60">
          {t("browserHint", "Enter a URL to route through the Privxx tunnel (Preview).")}
        </div>
      </div>

      {state === "idle" && (
        <Button 
          className="min-h-[44px] w-full" 
          disabled={!canConnect} 
          onClick={onConnect}
        >
          <Shield className="mr-2 h-4 w-4" />
          {t("connectThroughPrivxx", "Connect through Privxx")}
        </Button>
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
                {t("statusConnected", "Connected (simulated)")}
              </span>
            </div>
            <div className="text-xs text-primary/60">
              {t("requestedUrl", "Requested URL")}: <span className="font-mono">{url}</span>
            </div>
            {latency && (
              <div className="text-xs text-primary/60">
                {t("simulatedLatency", "Simulated latency")}: <span className="font-mono">{latency} ms</span>
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

      <div className="rounded-lg border border-primary/20 p-3 space-y-1">
        <div className="text-sm font-semibold text-primary/90">{t("browserDemoTitle", "Tunnel Demo")}</div>
        <div className="text-sm text-primary/60">
          {t("browserDemoNote", "This is a preview of the Privxx tunnel flow. Real cMixx routing will be enabled in a future release.")}
        </div>
      </div>
    </div>
  );
}

export default BrowserPanel;
