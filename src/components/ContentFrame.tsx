import { Globe, ShieldCheck } from "lucide-react";
import { ConnectionState } from "./ConnectionStatus";

interface ContentFrameProps {
  connectionState: ConnectionState;
  currentUrl?: string;
}

const ContentFrame = ({ connectionState, currentUrl }: ContentFrameProps) => {
  const renderContent = () => {
    switch (connectionState) {
      case "idle":
        return (
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
            <div className="relative">
              <ShieldCheck className="h-20 w-20 text-primary/60" />
              <div className="absolute inset-0 blur-2xl bg-primary/20 -z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Privacy-First Browsing
              </h2>
              <p className="text-muted-foreground max-w-md">
                Enter a URL above to browse securely through the Privxx mixnet. 
                Your traffic will be routed through quantum-resistant encrypted channels.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {["End-to-End Encrypted", "Quantum-Resistant", "Zero Metadata"].map((feature) => (
                <span 
                  key={feature}
                  className="px-3 py-1.5 bg-secondary/50 rounded-full text-xs font-mono text-muted-foreground border border-border"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        );
      
      case "connecting":
        return (
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
            <div className="relative">
              {/* Animated rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
              </div>
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-secondary border border-primary/50">
                <Globe className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground animate-connecting">
                Establishing Secure Tunnel
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                {currentUrl}
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-4 text-left">
              {[
                { step: "Initializing cMixx tunnel", done: true },
                { step: "Negotiating PQ keys", done: true },
                { step: "Routing through mixnet", done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  {item.done ? (
                    <div className="w-2 h-2 rounded-full bg-status-connected" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-status-connecting animate-pulse" />
                  )}
                  <span className={item.done ? "text-muted-foreground" : "text-status-connecting"}>
                    {item.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "connected":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full animate-fade-in">
            <div className="w-full h-full bg-secondary/30 rounded-lg border border-border flex items-center justify-center">
              <div className="text-center space-y-2">
                <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground text-sm font-mono">
                  Content frame placeholder
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {currentUrl}
                </p>
              </div>
            </div>
          </div>
        );
      
      case "error":
        return (
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center">
              <Globe className="h-8 w-8 text-status-error" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Connection Failed
              </h2>
              <p className="text-muted-foreground max-w-md">
                Unable to establish a secure connection. Please try again.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-card/30 rounded-xl border border-border min-h-[400px]">
      {renderContent()}
    </div>
  );
};

export default ContentFrame;
