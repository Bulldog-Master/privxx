import { useState } from "react";
import PrivxxHeader from "@/components/PrivxxHeader";
import UrlBar from "@/components/UrlBar";
import ConnectionStatus, { ConnectionState } from "@/components/ConnectionStatus";
import ContentFrame from "@/components/ContentFrame";
import { toast } from "sonner";

const Index = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [currentUrl, setCurrentUrl] = useState<string>();

  const handleNavigate = async (url: string) => {
    setCurrentUrl(url);
    setConnectionState("connecting");
    
    // Simulate connection process (replace with actual cMixx integration later)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.2;
    
    if (success) {
      setConnectionState("connected");
      toast.success("Secure connection established", {
        description: "Your traffic is now routed through Privxx mixnet",
      });
    } else {
      setConnectionState("error");
      toast.error("Connection failed", {
        description: "Unable to establish secure tunnel",
      });
    }
  };

  const handleSettingsClick = () => {
    toast.info("Settings", {
      description: "Settings panel coming soon",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PrivxxHeader onSettingsClick={handleSettingsClick} />
      
      <main className="flex-1 flex flex-col items-center gap-6 p-6 md:p-8">
        {/* URL Bar Section */}
        <div className="w-full max-w-4xl flex flex-col items-center gap-4 animate-slide-up">
          <UrlBar 
            onNavigate={handleNavigate}
            isLoading={connectionState === "connecting"}
            disabled={connectionState === "connecting"}
          />
          
          <ConnectionStatus 
            state={connectionState}
          />
        </div>
        
        {/* Content Area */}
        <div className="w-full max-w-4xl flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <ContentFrame 
            connectionState={connectionState}
            currentUrl={currentUrl}
          />
        </div>
        
        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground font-mono space-y-1">
          <p>Secured by cMixx quantum-resistant encryption</p>
          <p className="text-muted-foreground/50">No logs • No tracking • No metadata leakage</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
