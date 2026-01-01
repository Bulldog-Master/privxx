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
import { IdentityProvider } from "@/features/identity";
import { SkipToContent } from "@/components/shared";
import { InstallPrompt, PwaUpdatePrompt } from "@/components/pwa";
import { TranslationPlaceholderToast } from "@/components/diagnostics/TranslationPlaceholderToast";
import { EmailVerificationPending } from "@/components/session";
import { ProtectedRoute } from "@/components/session";
import { SessionTimeoutWarning } from "@/components/session";
import { UnlockExpiryDialog } from "@/components/session";
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

const queryClient = new QueryClient();

// Minimal loading fallback for route transitions
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[hsl(215_25%_27%)]">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
            <PwaUpdatePrompt />
            <TranslationPlaceholderToast />
            <SessionTimeoutManager />
            <UnlockExpiryDialog />
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

const App = () => (
  <AppErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <IdentityProvider>
            <SecurityAlertProvider>
              <AppRoutes />
            </SecurityAlertProvider>
          </IdentityProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </AppErrorBoundary>
);

export default App;
