import { lazy, Suspense } from "react";
import { PrivxxHeader, PrivxxHeroWithUrl } from "@/components/brand";
import { MessagesPanel } from "@/features/messages";
import { PageBackground } from "@/components/layout/PageBackground";
import { BridgeConnectivityWarning } from "@/components/connection";
import { SecurityScoreIndicator } from "@/components/settings/SecurityScoreIndicator";
import { PasskeyOnboardingPrompt } from "@/features/auth/components";
import { useAuth } from "@/contexts/AuthContext";
import MinimalFooter from "@/components/shared/MinimalFooter";

// Lazy load the diagnostics drawer - only loaded when user interacts
const DiagnosticsDrawer = lazy(() => import("@/components/diagnostics/DiagnosticsDrawer"));

const Index = () => {
  const { user } = useAuth();

  return (
    <PageBackground>
      {/* Small teal sphere - left side (Index-specific) */}
      <div
        className="absolute top-[40%] -left-8 w-40 h-40 rounded-full opacity-80 z-0"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(172 70% 55%) 0%, hsl(172 50% 40%) 50%, hsl(172 40% 30%) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Subtle atmospheric dot - above logo area */}
      <div
        className="absolute top-24 left-1/2 -translate-x-[120px] w-8 h-8 rounded-full opacity-40 z-0"
        style={{
          background: "radial-gradient(circle, hsl(172 60% 50%) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <PrivxxHeader />

        <main
          id="main-content"
          className="flex-1 flex flex-col items-center pt-44 sm:pt-52 px-4 sm:px-6 gap-5 pb-20"
          tabIndex={-1}
        >
          {/* Bridge connectivity warning - shows when bridge unreachable */}
          <div className="w-full max-w-md">
            <BridgeConnectivityWarning minFailures={2} />
          </div>

          <PrivxxHeroWithUrl />


          {/* Passkey onboarding prompt - shows to users without passkeys */}
          {user && (
            <div className="w-full max-w-md">
              <PasskeyOnboardingPrompt ignoreDismissed />
            </div>
          )}

          {/* Security Score - only show when logged in */}
          {user && (
            <div className="w-full max-w-md flex justify-center">
              <div className="px-6 py-4 rounded-lg border bg-card/80 backdrop-blur-sm">
                <SecurityScoreIndicator size="sm" showLabel />
              </div>
            </div>
          )}

          {/* Messaging panel with inbox + compose */}
          <div className="w-full max-w-md rounded-lg border bg-card/80 backdrop-blur-sm overflow-hidden">
            <MessagesPanel />
          </div>
        </main>

        <footer className="pb-6">
          <MinimalFooter />
        </footer>

        {/* Fixed StatusPill + Diagnostics Drawer */}
        <Suspense fallback={null}>
          <DiagnosticsDrawer />
        </Suspense>

      </div>
    </PageBackground>
  );
};

export default Index;
