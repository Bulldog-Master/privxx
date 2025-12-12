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
    <div className="min-h-screen flex flex-col bg-background">
      <PrivxxHeader />
      
      <main className="flex-1 flex flex-col items-center pt-16 sm:pt-24 px-4 sm:px-6 gap-8">
        
        <PrivxxHero />
        
        <ConnectionCard 
          onConnect={handleConnect}
          connectionState={connectionState}
          onStateChange={setConnectionState}
        />
        
        <ContentArea url={connectedUrl} latency={latency} />
      </main>

      <footer className="text-center py-4 px-4 text-xs text-muted-foreground">
        {t("simulationNotice")}
      </footer>
    </div>
  );
};

export default Index;
