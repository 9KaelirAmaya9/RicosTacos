/**
 * ProtectedRoute — uses shared AuthContext (Fix 5).
 * No longer makes its own getSession() / user_roles queries.
 * Reads from the single AuthContext instance, which handles
 * Fix 1 (getUser), Fix 2 (refresh), Fix 3 (5s timeout), Fix 4 (cache).
 */
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, rolesLoading, hasRole } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Safety net: if AuthContext initial loading is stuck past 10s, treat as unauthenticated
  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setTimedOut(true), 10000);
    return () => window.clearTimeout(t);
  }, [loading]);

  // Initial auth check — we don't know yet if the user is logged in
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`}
        replace
      />
    );
  }

  // User is authenticated — fetching role permissions (short network call)
  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Verifying access…</span>
      </div>
    );
  }

  if (requiredRole) {
    // Admin can access kitchen too
    const allowed =
      hasRole(requiredRole) ||
      (requiredRole === "kitchen" && hasRole("admin"));

    if (!allowed) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
