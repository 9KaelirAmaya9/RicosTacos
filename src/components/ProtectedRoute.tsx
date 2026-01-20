import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "kitchen";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authCheckInProgress = false;

    const checkAuthAndRole = async () => {
      // Prevent concurrent checks
      if (authCheckInProgress) {
        console.log("Auth check already in progress, skipping");
        return;
      }

      authCheckInProgress = true;
      const startTime = Date.now();

      try {
        const { data: { session }, error } = await supabase.auth.getSession();


        if (!mounted) return;

        console.log(`Session check took ${Date.now() - startTime}ms`);

        if (error) {
          console.error("Auth check error:", error);
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
          authCheckInProgress = false;
          return;
        }

        if (!session) {
          console.log("No session found");
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
          authCheckInProgress = false;
          return;
        }

        console.log("Session found for user:", session.user.id);
        setIsAuthenticated(true);

        // If no role required, we're done
        if (!requiredRole) {
          setHasRole(true);
          setIsLoading(false);
          authCheckInProgress = false;
          return;
        }

        // Check role with optimized query
        const roleCheckStart = Date.now();
        let userHasRole = false;

        try {
          // Single optimized query with timeout
          const rolePromise = supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .limit(5);

          const roleTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Role check timeout")), 3000)
          );

          const { data: roles, error: roleError } = await Promise.race([
            rolePromise,
            roleTimeoutPromise
          ]) as any;

          console.log(`Role check took ${Date.now() - roleCheckStart}ms`);

          if (roleError) {
            console.error("Role query error:", roleError);
            userHasRole = false;
          } else if (roles && roles.length > 0) {
            // Check if user has the required role (or admin can access kitchen)
            userHasRole = roles.some(
              (r) => r.role === requiredRole || (requiredRole === 'kitchen' && r.role === 'admin')
            );
            console.log(`User has roles: [${roles.map(r => r.role).join(', ')}], Required: ${requiredRole}, Access: ${userHasRole}`);
          } else {
            console.log("No roles found for user");
            // Try bootstrap for admin only if no roles exist
            if (requiredRole === 'admin') {
              try {
                console.log("Attempting admin bootstrap...");
                const { data: granted, error: bootstrapError } = await supabase.rpc('bootstrap_admin');

                if (bootstrapError) {
                  console.error("Bootstrap error:", bootstrapError);
                } else if (granted === true) {
                  console.log("Admin role bootstrapped successfully");
                  userHasRole = true;
                } else {
                  console.log("Bootstrap denied - admin already exists");
                }
              } catch (e) {
                console.error('Bootstrap admin exception:', e);
              }
            }
          }
        } catch (e: any) {
          console.error("Role check exception:", e.message || e);
          userHasRole = false;
        }

        if (mounted) {
          setHasRole(userHasRole);
          setIsLoading(false);
        }
      } catch (e: any) {
        console.error("Auth/Role check error:", e.message || e);
        if (mounted) {
          // If we timed out or errored, we might want to fail safe or just show access denied
          // For now, let's assume if it fails, they aren't authenticated/authorized to be safe
          // But if it was just a timeout, maybe we should let them try again? 
          // For now, fail closed.
          setIsAuthenticated(false);
          setHasRole(false);
          setIsLoading(false);
        }
      } finally {
        authCheckInProgress = false;
      }
    };

    // Initial check
    checkAuthAndRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log("Auth state changed:", event);

      // Debounce rapid auth changes
      setTimeout(() => {
        if (mounted) {
          checkAuthAndRole();
        }
      }, 100);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  if (requiredRole && !hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
