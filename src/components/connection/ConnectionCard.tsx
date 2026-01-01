import { useState, FormEvent } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { PrivxxLogo } from "@/components/brand";
import { useConnection, type ConnectionState } from "@/features/connection";
import { useToast } from "@/hooks/useToast";

// Re-export for backward compatibility
export type { ConnectionState } from "@/features/connection";

interface ConnectionCardProps {
  onConnect: (url: string, latency: number) => void;
  connectionState?: ConnectionState;
  onStateChange?: (state: ConnectionState) => void;
}

const ConnectionCard = ({ onConnect, connectionState: externalState, onStateChange }: ConnectionCardProps) => {
  const [url, setUrl] = useState("");
  const { t } = useTranslation();
  const { toast } = useToast();

  // Use the new event-driven connection hook
  const { state: internalState, connectTo, isConnecting } = useConnection({
    onConnect: (result) => {
      // Notify parent of successful connection with real latency
      onConnect(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`, result.latency);
      onStateChange?.("connected");
    },
    onError: (result) => {
      // Show user-friendly error toast
      toast({
        title: t("connectionFailed", "Connection failed"),
        description: result.errorMessage || t("tryAgainLater", "Please try again later"),
        variant: "destructive",
      });
      onStateChange?.("idle");
    },
    onStateChange: (newState) => {
      onStateChange?.(newState);
    },
  });

  // Use external state if provided (backward compatibility), otherwise use internal
  const connectionState = externalState ?? internalState;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isConnecting) return;

    // Use the connection service (handles demo/live mode internally)
    await connectTo(url.trim());
  };

  const getStatusText = () => {
    switch (connectionState) {
      case "idle":
        return { main: t("statusIdle"), sub: t("statusIdleSubtext") };
      case "connecting":
        return { main: t("statusConnecting"), sub: t("statusConnectingSubtext") };
      case "connected":
        return { main: t("statusSecure"), sub: t("statusSecureSubtext") };
    }
  };

  const status = getStatusText();

  return (
    <div className="relative w-full max-w-md">
      {/* Glassmorphic card */}
      <div className="relative w-full p-6 bg-[hsl(172_30%_25%/0.6)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input with globe icon */}
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" aria-hidden="true" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              disabled={connectionState === "connecting"}
              className="w-full h-14 border border-white/20 text-foreground placeholder:text-foreground/40 rounded-xl text-base pl-12 pr-4 font-mono"
              style={{
                background: 'linear-gradient(90deg, hsl(340 50% 40% / 0.6) 0%, hsl(45 60% 45% / 0.6) 50%, hsl(172 50% 35% / 0.6) 100%)'
              }}
              aria-label={t("urlPlaceholder")}
            />
          </div>
          
          {/* Connect Button - matching idle gradient */}
          <Button
            type="submit"
            disabled={!url.trim() || connectionState === "connecting"}
            className="w-full h-14 border border-white/20 hover:brightness-110 text-foreground font-semibold text-base rounded-xl shadow-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(90deg, hsl(340 50% 40% / 0.6) 0%, hsl(45 60% 45% / 0.6) 50%, hsl(172 50% 35% / 0.6) 100%)'
            }}
          >
            {connectionState === "connecting" ? (
              <span className="flex items-center">
                {t("buttonConnecting")}&nbsp;<PrivxxLogo size="sm" variant="inherit" brightenMark />
              </span>
            ) : connectionState === "connected" ? (
              <span>{t("buttonConnected")}</span>
            ) : (
              <span className="flex items-center">
                {t("buttonConnect")}&nbsp;<PrivxxLogo size="sm" variant="inherit" brightenMark />
              </span>
            )}
          </Button>
        </form>

        {/* Status bar with gradient background */}
        <div 
          className={`relative h-12 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-500 ${
            connectionState === "connecting" ? "animate-pulse" : ""
          }`}
          style={{
            background: connectionState === "connecting" 
              ? 'linear-gradient(90deg, hsl(172 50% 35% / 0.8) 0%, hsl(190 60% 45% / 0.8) 50%, hsl(172 50% 35% / 0.8) 100%)'
              : 'linear-gradient(90deg, hsl(340 50% 40% / 0.6) 0%, hsl(45 60% 45% / 0.6) 50%, hsl(172 50% 35% / 0.6) 100%)'
          }}
          role="status"
          aria-live="polite"
          aria-label={`${status.main}: ${status.sub}`}
        >
          <div className="flex items-center gap-3">
            <span 
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                connectionState === "connected" 
                  ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" 
                  : connectionState === "connecting"
                  ? "bg-primary animate-pulse"
                  : "bg-foreground/40"
              }`}
              aria-hidden="true"
            />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-foreground/90">
                {status.main}
              </span>
              <span className="text-xs text-foreground/60">
                {status.sub}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionCard;