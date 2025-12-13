import { useState } from "react";
import PrivxxHeader from "@/components/PrivxxHeader";
import PrivxxHero from "@/components/PrivxxHero";
import ConnectionCard, { ConnectionState } from "@/components/ConnectionCard";
import ContentArea from "@/components/ContentArea";
import { useTranslations } from "@/lib/i18n";
import heroBackground from "@/assets/hero-background-bright.jpg";

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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Hero background image - bright and airy */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Soft brand-tinted overlay - airy, not foggy */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(230,245,250,0.25) 50%, rgba(200,235,240,0.20) 100%)' 
        }}
      />
      
      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
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

        <footer className="text-center py-4 px-4 text-xs text-slate-600">
          {t("simulationNotice")}
        </footer>
      </div>
    </div>
  );
};

export default Index;
