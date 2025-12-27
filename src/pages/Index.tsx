import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import PrivxxHeader from "@/components/PrivxxHeader";
import PrivxxHeroWithUrl from "@/components/PrivxxHeroWithUrl";
import { MessagesPanel } from "@/features/messages";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { useTranslations } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Lazy load the diagnostics drawer - only loaded when user interacts
const DiagnosticsDrawer = lazy(() => import("@/components/DiagnosticsDrawer"));

const Index = () => {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[hsl(215_25%_27%)]">
        {/* Large teal blob - top right */}
        <div 
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-90"
          style={{ 
            background: 'radial-gradient(circle, hsl(172 60% 45%) 0%, hsl(172 50% 35%) 70%, transparent 100%)' 
          }}
        />
        
        {/* Small teal sphere - left side */}
        <div 
          className="absolute top-[40%] -left-8 w-40 h-40 rounded-full opacity-80"
          style={{ 
            background: 'radial-gradient(circle at 30% 30%, hsl(172 70% 55%) 0%, hsl(172 50% 40%) 50%, hsl(172 40% 30%) 100%)' 
          }}
        />
        
        {/* Subtle atmospheric dot - above logo area */}
        <div 
          className="absolute top-24 left-1/2 -translate-x-[120px] w-8 h-8 rounded-full opacity-40"
          style={{ 
            background: 'radial-gradient(circle, hsl(172 60% 50%) 0%, transparent 70%)' 
          }}
        />
        
        {/* Colorful gradient glow at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-64 opacity-60"
          style={{ 
            background: 'linear-gradient(90deg, hsl(340 70% 50%) 0%, hsl(45 80% 55%) 50%, hsl(172 60% 45%) 100%)',
            filter: 'blur(80px)'
          }}
        />
        
        {/* Content layer */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <PrivxxHeader />
          
          <main id="main-content" className="flex-1 flex flex-col items-center pt-20 sm:pt-24 px-4 sm:px-6 gap-5 pb-8" tabIndex={-1}>
            <PrivxxHeroWithUrl />
            
            
            {/* Messaging panel with inbox + compose */}
            <div className="w-full max-w-md rounded-lg border bg-card/80 backdrop-blur-sm overflow-hidden">
              <MessagesPanel />
            </div>
          </main>

          <footer className="flex flex-col items-center gap-2 py-4 px-4">
            <div className="flex items-center gap-3">
              <ConnectionBadge />
              <Suspense fallback={<div className="h-8 w-16" />}>
                <DiagnosticsDrawer />
              </Suspense>
            </div>
            <div className="flex items-center gap-3 text-xs text-foreground/40">
              <span>{t("demoModeNotice")}</span>
              <span className="text-foreground/20">·</span>
              <Link to="/privacy" className="hover:text-foreground/60 transition-colors">
                {t("privacyPolicyLink")}
              </Link>
              <span className="text-foreground/20">·</span>
              <Link to="/terms" className="hover:text-foreground/60 transition-colors">
                {t("termsTitle")}
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/whats-new" className="hover:text-foreground/60 transition-colors">
                    <Sparkles className="h-3.5 w-3.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("whatsNew")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </footer>
      </div>
    </div>
  );
};

export default Index;
