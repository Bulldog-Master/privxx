/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication. Redirects to /auth if not authenticated.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(215_25%_27%)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
