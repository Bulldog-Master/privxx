import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RtlProvider from "@/components/RtlProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { SkipToContent } from "@/components/SkipToContent";
import InstallPrompt from "@/components/InstallPrompt";
import { EmailVerificationPending } from "@/components/EmailVerificationPending";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load secondary pages for better initial bundle size
const Privacy = lazy(() => import("./pages/Privacy"));
const ReleaseNotes = lazy(() => import("./pages/ReleaseNotes"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));

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
  const { showWarning, secondsRemaining, extendSession, logoutNow } = useSessionTimeout({
    timeoutMs: 15 * 60 * 1000, // 15 minutes
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
          <SessionTimeoutManager />
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IdentityProvider>
          <AppRoutes />
        </IdentityProvider>
      </AuthProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
