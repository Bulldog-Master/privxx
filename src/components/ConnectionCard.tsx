import { useState, FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";

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
    <div className="w-full max-w-lg p-8 bg-surface-elevated rounded-xl border border-border shadow-lg shadow-black/20 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("urlPlaceholder")}
          disabled={connectionState === "connecting"}
          className="w-full h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
        />
        
        <Button
          type="submit"
          disabled={!url.trim() || connectionState === "connecting"}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          {t("connect")}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-2 text-sm">
        {connectionState === "connecting" && (
          <Loader2 className="h-4 w-4 animate-spin text-status-connecting" />
        )}
        <span className={`font-medium ${
          connectionState === "connected" 
            ? "text-status-connected" 
            : connectionState === "connecting"
            ? "text-status-connecting"
            : "text-muted-foreground"
        }`}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default ConnectionCard;
