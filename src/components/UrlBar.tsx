import { useState, FormEvent } from "react";
import { Globe, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UrlBarProps {
  onNavigate: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const UrlBar = ({ onNavigate, isLoading, disabled }: UrlBarProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim() && !disabled) {
      // Add https:// if no protocol specified
      let processedUrl = url.trim();
      if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
        processedUrl = "https://" + processedUrl;
      }
      onNavigate(processedUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
          
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a secure URL..."
            disabled={disabled}
            className="pl-12 pr-4 h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          
          <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none glow-primary-subtle" />
        </div>
        
        <Button
          type="submit"
          disabled={!url.trim() || disabled || isLoading}
          className="h-14 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Connecting</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Connect</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

export default UrlBar;
