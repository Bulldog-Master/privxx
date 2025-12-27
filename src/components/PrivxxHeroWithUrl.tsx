import { useState } from "react";
import { useTranslation } from "react-i18next";
import PrivxxLogo from "@/components/PrivxxLogo";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

type ConnectionState = "idle" | "connecting" | "connected";

const PrivxxHeroWithUrl = () => {
  const { t } = useTranslation();
  const [url, setUrl] = useState("https://");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [latency, setLatency] = useState<number | null>(null);

  const canConnect = url.trim().length > 8 && connectionState === "idle";

  const onConnect = async () => {
    if (!canConnect) return;
    setConnectionState("connecting");
    setLatency(null);

    // Simulate cMixx tunnel connection (500-2500ms as per spec)
    const simulatedLatency = Math.floor(Math.random() * 2000) + 500;
    
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));
    
    setLatency(simulatedLatency);
    setConnectionState("connected");
  };

  const onDisconnect = () => {
    setConnectionState("idle");
    setLatency(null);
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 relative w-full max-w-md mx-auto">
      {/* Stylized Logo with custom mark */}
      <div className="hero">
        <div className="hero-ambient-dot" />
        <h1 className="flex items-baseline justify-center relative z-10">
          <PrivxxLogo size="lg" />
        </h1>
      </div>
      
      {/* Tagline */}
      <p className="text-primary/80 text-sm sm:text-base font-medium w-full text-center">
        {t("subtitle")}
      </p>

      {/* URL Input Bar */}
      <div className="w-full space-y-3">
        <div className="space-y-1">
          <input
            className="w-full rounded-lg border-2 border-primary/60 bg-background/50 backdrop-blur-sm px-4 py-3 min-h-[48px] text-base text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("urlPlaceholder") || "https://example.com"}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={connectionState !== "idle"}
          />
        </div>

        {connectionState === "idle" && (
          <Button 
            className="min-h-[48px] w-full text-base font-medium px-6" 
            disabled={!canConnect} 
            onClick={onConnect}
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{t("connectThrough") || "Connect through"}</span>
              <PrivxxLogo size="sm" brightenMark />
            </span>
          </Button>
        )}

        {connectionState === "connecting" && (
          <Button className="min-h-[48px] w-full text-base" disabled>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("tunnelConnecting") || "Routing through mixnet…"}
          </Button>
        )}

        {connectionState === "connected" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <ShieldCheck className="h-5 w-5" />
                {t("tunnelConnected") || "Tunnel Active"}
              </div>
              {latency && (
                <div className="text-sm text-muted-foreground">
                  {t("tunnelLatency") || "Latency"}: {latency}ms
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {t("tunnelTarget") || "Target"}: {url}
              </div>
            </div>
            <Button 
              variant="outline" 
              className="min-h-[44px] w-full" 
              onClick={onDisconnect}
            >
              {t("disconnect") || "Disconnect"}
            </Button>
          </div>
        )}
      </div>

      {/* Demo disclaimer */}
      <p className="text-xs text-primary/60 max-w-sm">
        {t("tunnelDemoNote") || "This is a simulated tunnel demo. Real cMixx routing will be enabled in a future update."}
      </p>
    </div>
  );
};

export default PrivxxHeroWithUrl;
