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

// Inline Privxx mark for button (smaller version)
const PrivxxMark = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 40 32" 
    fill="none" 
    className={className}
    aria-hidden="true"
  >
    <path d="M4 4L20 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M20 4L4 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M36 4L20 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Styled Privxx brand for button
const PrivxxBrand = ({ className }: { className?: string }) => (
  <span className={`inline-flex items-baseline font-bold ${className}`}>
    <span>Privx</span>
    <PrivxxMark className="w-[0.7em] h-[0.55em] -translate-y-[0.05em]" />
  </span>
);

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
      <div className="absolute -inset-1 bg-primary/8 blur-2xl rounded-3xl pointer-events-none opacity-60" />
      
      <div className="relative w-full p-8 bg-card rounded-2xl border border-border shadow-2xl shadow-black/40 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("urlPlaceholder")}
            disabled={connectionState === "connecting"}
            className="w-full h-14 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-xl text-base px-4"
          />
          
          <Button
            type="submit"
            disabled={!url.trim() || connectionState === "connecting"}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
          >
            {connectionState === "connecting" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Connecting through <PrivxxBrand /></span>
              </span>
            ) : (
              <span className="flex items-center gap-0">
                <span>Connect through&nbsp;&nbsp;</span>
                <PrivxxBrand />
              </span>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-2 pt-1">
          <span className={`text-sm font-medium ${
            connectionState === "connected" 
              ? "text-status-connected" 
              : connectionState === "connecting"
              ? "text-status-connecting"
              : "text-muted-foreground"
          }`}>
            {connectionState === "connecting" ? "" : getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionCard;
