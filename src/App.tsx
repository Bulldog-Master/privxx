import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { RtlProvider } from "@/components/shared";
import { AppErrorBoundary } from "@/components/shared";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { IdentityProvider } from "@/features/identity";
import { DiagnosticsDrawerProvider } from "@/features/diagnostics";
import { BackendStatusProvider } from "@/contexts/BackendStatusContext";
import { SkipToContent } from "@/components/shared";
import { InstallPrompt, PwaUpdatePrompt } from "@/components/pwa";
import { StaleBuildWarning } from "@/components/shared/StaleBuildWarning";
import { TranslationPlaceholderToast } from "@/components/diagnostics/TranslationPlaceholderToast";
import { EmailVerificationPending, ProtectedRoute, SessionTimeoutWarning, UnlockExpiryDialog, DeviceDetectionManager } from "@/components/session";
import { SecurityAlertProvider } from "@/components/security";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load secondary pages for better initial bundle size
const Privacy = lazy(() => import("./pages/Privacy"));
const ReleaseNotes = lazy(() => import("./pages/ReleaseNotes"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Security = lazy(() => import("./pages/Security"));
const Health = lazy(() => import("./pages/Health"));
const BackendStatus = lazy(() => import("./pages/BackendStatus"));
const ComponentDocs = lazy(() => import("./pages/ComponentDocs"));
const Diagnostics = lazy(() => import("./pages/Diagnostics"));
const About = lazy(() => import("./pages/About"));

const queryClient = new QueryClient();

// Minimal loading fallback for route transitions
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(215_25%_20%)] via-[hsl(215_25%_27%)] to-[hsl(172_25%_22%)]">
    {/* Logo */}
    <div className="flex items-center gap-2 mb-8 animate-pulse">
      <span className="text-4xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
        Priv
      </span>
      <span className="text-4xl font-bold text-primary">xx</span>
    </div>
    
    {/* Spinner */}
    <div className="w-10 h-10 border-[3px] border-white/10 border-t-primary rounded-full animate-spin" />
    
    {/* Loading text */}
    <p className="mt-6 text-white/60 text-sm tracking-wide">Loading...</p>
  </div>
);

// Wrapper component to check email verification
function EmailVerificationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isEmailVerified, isLoading } = useAuth();
  
  // Show loading while checking auth state
  if (isLoading) {
    return <PageLoader />;
  }
  
  // If authenticated but email not verified, show verification pending
  if (isAuthenticated && !isEmailVerified) {
    return <EmailVerificationPending />;
  }
  
  return <>{children}</>;
}

// Session timeout manager component
function SessionTimeoutManager() {
  const { user, isAuthenticated } = useAuth();
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);

  // Fetch user's timeout preference
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchTimeout = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("session_timeout_minutes")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.session_timeout_minutes) {
        setTimeoutMinutes(data.session_timeout_minutes);
      }
    };

    fetchTimeout();
  }, [isAuthenticated, user]);

  const { showWarning, secondsRemaining, extendSession, logoutNow } = useSessionTimeout({
    timeoutMs: timeoutMinutes * 60 * 1000,
    warningMs: 60 * 1000, // 1 minute warning
  });

  return (
    <SessionTimeoutWarning
      open={showWarning}
      secondsRemaining={secondsRemaining}
      onExtend={extendSession}
      onLogout={logoutNow}
    />
  );
}

// Inner app component that uses auth context
function AppRoutes() {
  return (
      <EmailVerificationGuard>
        <TooltipProvider>
          <RtlProvider>
            <Toaster />
            <Sonner />
            <StaleBuildWarning />
            <PwaUpdatePrompt />
            <TranslationPlaceholderToast />
            <SessionTimeoutManager />
            <UnlockExpiryDialog />
            <DeviceDetectionManager />
            <BrowserRouter>
              <SkipToContent />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={
                <Suspense fallback={<PageLoader />}>
                  <Auth />
                </Suspense>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/security" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Security />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/health" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Health />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/backend-status" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <BackendStatus />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/privacy" element={
                <Suspense fallback={<PageLoader />}>
                  <Privacy />
                </Suspense>
              } />
              <Route path="/whats-new" element={
                <Suspense fallback={<PageLoader />}>
                  <ReleaseNotes />
                </Suspense>
              } />
              <Route path="/terms" element={
                <Suspense fallback={<PageLoader />}>
                  <Terms />
                </Suspense>
              } />
              <Route path="/docs" element={
                <Suspense fallback={<PageLoader />}>
                  <ComponentDocs />
                </Suspense>
              } />
              <Route path="/diagnostics" element={
                <Suspense fallback={<PageLoader />}>
                  <Diagnostics />
                </Suspense>
              } />
              <Route path="/about" element={
                <Suspense fallback={<PageLoader />}>
                  <About />
                </Suspense>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <InstallPrompt />
          </BrowserRouter>
        </RtlProvider>
      </TooltipProvider>
    </EmailVerificationGuard>
  );
}

// Trigger fade-out of initial HTML loader when React mounts
if (typeof window !== 'undefined' && typeof (window as unknown as { hideInitialLoader?: () => void }).hideInitialLoader === 'function') {
  (window as unknown as { hideInitialLoader: () => void }).hideInitialLoader();
}

const App = () => (
  <AppErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <IdentityProvider>
              <BackendStatusProvider>
                <DiagnosticsDrawerProvider>
                  <SecurityAlertProvider>
                    <AppRoutes />
                  </SecurityAlertProvider>
                </DiagnosticsDrawerProvider>
              </BackendStatusProvider>
            </IdentityProvider>
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </AppErrorBoundary>
);

export default App;
