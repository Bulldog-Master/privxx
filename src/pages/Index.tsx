import { useState } from "react";
import PrivxxHeader from "@/components/PrivxxHeader";
import PrivxxHero from "@/components/PrivxxHero";
import ConnectionCard, { ConnectionState } from "@/components/ConnectionCard";
import ContentArea from "@/components/ContentArea";
import { useTranslations } from "@/lib/i18n";

const Index = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [connectedUrl, setConnectedUrl] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const { t } = useTranslations();

  const handleConnect = (url: string, simulatedLatency: number) => {
    setConnectedUrl(url);
    setLatency(simulatedLatency);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(216,14%,15%)] to-[hsl(216,14%,11%)]">
      <PrivxxHeader />
      
      <main className="flex-1 flex flex-col items-center pt-16 sm:pt-24 px-4 sm:px-6 gap-8 relative">
        {/* Ambient center glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] bg-[hsl(216,15%,16%)] blur-[120px] opacity-50 rounded-full" />
        </div>
        
        <PrivxxHero />
        
        <ConnectionCard 
          onConnect={handleConnect}
          connectionState={connectionState}
          onStateChange={setConnectionState}
        />
        
        <ContentArea url={connectedUrl} latency={latency} />
      </main>

      <footer className="text-center py-4 px-4 text-xs text-muted-foreground/70">
        {t("simulationNotice")}
      </footer>
    </div>
  );
};

export default Index;
