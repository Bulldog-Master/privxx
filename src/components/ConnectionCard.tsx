import { useState, FormEvent } from "react";
import { Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import PrivxxLogo from "@/components/PrivxxLogo";

export type ConnectionState = "idle" | "connecting" | "connected";

interface ConnectionCardProps {
  onConnect: (url: string, latency: number) => void;
  connectionState: ConnectionState;
  onStateChange: (state: ConnectionState) => void;
}

const ConnectionCard = ({ onConnect, connectionState, onStateChange }: ConnectionCardProps) => {
  const [url, setUrl] = useState("");
  const { t } = useTranslations();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || connectionState === "connecting") return;

    onStateChange("connecting");

    // Randomized delay between 2-3 seconds
    const delay = 2000 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Generate simulated latency between 500-2500ms
    const latency = Math.floor(500 + Math.random() * 2000);

    onStateChange("connected");
    
    // Process URL
    let processedUrl = url.trim();
    if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
      processedUrl = "https://" + processedUrl;
    }
    
    onConnect(processedUrl, latency);
  };

  const getStatusText = () => {
    switch (connectionState) {
      case "idle":
        return t("idle");
      case "connecting":
        return t("connecting");
      case "connected":
        return t("connected");
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Glassmorphic card */}
      <div className="relative w-full p-6 bg-[hsl(172_30%_25%/0.6)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input with globe icon */}
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              disabled={connectionState === "connecting"}
              className="w-full h-14 bg-[hsl(172_25%_18%)] hover:bg-[hsl(172_25%_20%)] border-none text-foreground placeholder:text-foreground/40 rounded-xl text-base pl-12 pr-4 font-mono"
            />
          </div>
          
          {/* Connect Button */}
          <Button
            type="submit"
            disabled={!url.trim() || connectionState === "connecting"}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
          >
            {connectionState === "connecting" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="flex items-center">Connecting through&nbsp;&nbsp;<PrivxxLogo size="sm" variant="inherit" /></span>
              </span>
            ) : (
              <span className="flex items-center gap-0">
                <span>Connect through&nbsp;&nbsp;</span>
                <PrivxxLogo size="sm" variant="inherit" />
              </span>
            )}
          </Button>
        </form>

        {/* Status bar with gradient background */}
        <div 
          className="relative h-12 rounded-xl overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(90deg, hsl(340 50% 40% / 0.6) 0%, hsl(45 60% 45% / 0.6) 50%, hsl(172 50% 35% / 0.6) 100%)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              connectionState === "connected" 
                ? "bg-emerald-400" 
                : connectionState === "connecting"
                ? "bg-amber-400 animate-pulse"
                : "bg-foreground/50"
            }`} />
            <span className="text-sm font-medium text-foreground/90">
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionCard;