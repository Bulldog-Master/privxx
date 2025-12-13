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
      {/* Subtle card glow */}
      <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-3xl pointer-events-none opacity-60" />
      
      <div className="relative w-full p-8 bg-card/90 backdrop-blur-xl rounded-2xl border border-foreground/10 shadow-xl shadow-black/20 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/60" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              disabled={connectionState === "connecting"}
              className="w-full h-14 bg-[hsl(172_30%_18%)] hover:bg-[hsl(172_30%_20%)] border-none text-foreground placeholder:text-foreground/50 rounded-xl text-base pl-12 pr-4 font-mono"
            />
          </div>
          
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

        <div className="flex items-center justify-center gap-2 pt-1">
          <span className={`text-sm font-medium ${
            connectionState === "connected" 
              ? "text-emerald-400" 
              : connectionState === "connecting"
              ? "text-amber-400"
              : "text-foreground/70"
          }`}>
            {connectionState === "connecting" ? "" : getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionCard;
