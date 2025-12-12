import { useState } from "react";
import PrivxxHeader from "@/components/PrivxxHeader";
import ConnectionCard, { ConnectionState } from "@/components/ConnectionCard";
import ContentArea from "@/components/ContentArea";

const Index = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [connectedUrl, setConnectedUrl] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const handleConnect = (url: string, simulatedLatency: number) => {
    setConnectedUrl(url);
    setLatency(simulatedLatency);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PrivxxHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <ConnectionCard 
          onConnect={handleConnect}
          connectionState={connectionState}
          onStateChange={setConnectionState}
        />
        
        <ContentArea url={connectedUrl} latency={latency} />
      </main>

      <footer className="text-center py-4 px-6 text-xs text-muted-foreground">
        This is a simulated prototype of Privxx. Real cMixx integration will be added in a later phase.
      </footer>
    </div>
  );
};

export default Index;
