import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { buildInfo } from "@/lib/buildInfo";
import { PrivxxHeader, PrivxxHeroWithUrl } from "@/components/brand";
import { MessagesPanel } from "@/features/messages";
import { ConnectionBadge } from "@/components/connection";
import { PageBackground } from "@/components/layout/PageBackground";
import { TranslationCoverageBadge, BackendStatusBadges, HealthIndicatorDot } from "@/components/diagnostics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Lazy load the diagnostics drawer - only loaded when user interacts
const DiagnosticsDrawer = lazy(() => import("@/components/diagnostics/DiagnosticsDrawer"));

const Index = () => {
  const { t } = useTranslation();

  return (
    <PageBackground>
      {/* Small teal sphere - left side (Index-specific) */}
      <div 
        className="absolute top-[40%] -left-8 w-40 h-40 rounded-full opacity-80 z-0"
        style={{ 
          background: 'radial-gradient(circle at 30% 30%, hsl(172 70% 55%) 0%, hsl(172 50% 40%) 50%, hsl(172 40% 30%) 100%)' 
        }}
        aria-hidden="true"
      />
      
      {/* Subtle atmospheric dot - above logo area */}
      <div 
        className="absolute top-24 left-1/2 -translate-x-[120px] w-8 h-8 rounded-full opacity-40 z-0"
        style={{ 
          background: 'radial-gradient(circle, hsl(172 60% 50%) 0%, transparent 70%)' 
        }}
        aria-hidden="true"
      />
        
      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <PrivxxHeader />
        
        <main id="main-content" className="flex-1 flex flex-col items-center pt-44 sm:pt-52 px-4 sm:px-6 gap-5 pb-8" tabIndex={-1}>
          <PrivxxHeroWithUrl />
          
          {/* Messaging panel with inbox + compose */}
          <div className="w-full max-w-md rounded-lg border bg-card/80 backdrop-blur-sm overflow-hidden">
            <MessagesPanel />
          </div>
        </main>

        <footer className="flex flex-col items-center gap-3 py-4 px-4">
          {/* Backend Status Badges */}
          <BackendStatusBadges />
          
          <div className="flex items-center gap-3">
            <ConnectionBadge />
            <Suspense fallback={<div className="h-8 w-16" />}>
              <DiagnosticsDrawer />
            </Suspense>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-primary/70">
            <span className="flex items-center gap-1.5 text-primary/40">
              <HealthIndicatorDot />
              v{buildInfo.version}
            </span>
            <span className="text-primary/40">·</span>
            <span>{t("demoModeNotice")}</span>
            <span className="text-primary/40">·</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              {t("privacyPolicyLink")}
            </Link>
            <span className="text-primary/40">·</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              {t("termsTitle")}
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/whats-new" className="hover:text-primary transition-colors">
                  <Sparkles className="h-3.5 w-3.5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("whatsNew")}</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-primary/40">·</span>
            <TranslationCoverageBadge />
          </div>
        </footer>
      </div>
    </PageBackground>
  );
};

export default Index;
