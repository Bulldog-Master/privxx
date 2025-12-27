import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RtlProvider from "@/components/RtlProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { SkipToContent } from "@/components/SkipToContent";
import InstallPrompt from "@/components/InstallPrompt";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load secondary pages for better initial bundle size
const Privacy = lazy(() => import("./pages/Privacy"));
const ReleaseNotes = lazy(() => import("./pages/ReleaseNotes"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

// Minimal loading fallback for route transitions
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[hsl(215_25%_27%)]">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IdentityProvider>
          <TooltipProvider>
            <RtlProvider>
              <Toaster />
              <Sonner />
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
                    <Suspense fallback={<PageLoader />}>
                      <Settings />
                    </Suspense>
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
        </IdentityProvider>
      </AuthProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
