import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, ClipboardList, UserCircle, LogOut, Loader2 } from "lucide-react";

const Dashboard = () => {
  const isDev = import.meta.env.DEV;
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    // Force stop loading after 15 seconds max (role fetch can take up to 10s)
    const hardStop = setTimeout(() => {
      if (isMounted) {
        console.warn("Dashboard: Force stopping loading after 15s");
        setLoading(false);
      }
    }, 15000);

    const fetchRoles = async (userId: string) => {
      try {
        // Add timeout to role fetch
        const rolesPromise = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Role fetch timeout")), 10000)
        );

        const { data: roles, error: rolesError } = await Promise.race([
          rolesPromise,
          timeoutPromise
        ]) as any;

        if (!isMounted) return;

        if (rolesError) {
          console.error("Dashboard: Error fetching roles", rolesError);
          setUserRoles([]);
          return;
        }

        // Local/dev convenience: bootstrap first admin if user has no roles yet
        if ((!roles || roles.length === 0) && import.meta.env.DEV) {
          const { data: granted, error: bootstrapError } = await supabase.rpc("bootstrap_admin");

          if (!bootstrapError && granted === true) {
            const { data: refreshedRoles, error: refreshError } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", userId);

            if (!refreshError) {
              setUserRoles((refreshedRoles || []).map((r) => r.role));
              return;
            }
          }
        }

        setUserRoles((roles || []).map((r) => r.role));
      } catch (error: any) {
        console.error("Dashboard: Role fetch failed", error.message);
        setUserRoles([]);
      }
    };

    const initialize = async () => {
      try {
        // Get session — no artificial timeout; the Supabase client reads from
        // localStorage synchronously so this resolves in <10 ms in practice.
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(currentSession ?? null);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchRoles(currentSession.user.id);
        } else {
          setUserRoles([]);
        }
      } catch (error: any) {
        console.error("Dashboard initialization failed:", error.message);
        // On timeout/error, assume no session
        setSession(null);
        setUser(null);
        setUserRoles([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchRoles(newSession.user.id);
      } else {
        setUserRoles([]);
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(hardStop);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isDev) {
    // Redirect to sign-in instead of showing a dead-end card.
    // Use replace so the back button doesn't loop back here.
    navigate('/signin', { replace: true });
    return null;
  }

  const hasAdminRole = userRoles.includes("admin") || import.meta.env.DEV;
  const hasKitchenRole = userRoles.includes("kitchen") || import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-background pattern-tile">
      <div className="container mx-auto px-4 py-8">
        {isDev && (
          <div className="mb-4 rounded border border-amber-400/50 bg-amber-100/60 px-4 py-2 text-sm">
            DEV MODE: dashboard menu is enabled for local testing.
          </div>
        )}
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email || "Local Dev User"}
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {/* Admin Card */}
          {hasAdminRole && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary" onClick={() => navigate("/admin")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>
                  Manage orders, view analytics, and control user roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="default" type="button" onClick={() => navigate("/admin")}>
                  Open Admin
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Kitchen Card */}
          {hasKitchenRole && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-accent" onClick={() => navigate("/kitchen")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <ChefHat className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Kitchen Display</CardTitle>
                <CardDescription>
                  View and manage incoming orders in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="default" type="button" onClick={() => navigate("/kitchen")}>
                  Open Kitchen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Profile Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary" onClick={() => navigate("/profile")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <UserCircle className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                View your account details and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default" type="button" onClick={() => navigate("/profile")}>
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* No Roles Message */}
        {!hasAdminRole && !hasKitchenRole && (
          <div className="mt-8 text-center">
            <Card className="max-w-md mx-auto border-muted">
              <CardHeader>
                <CardTitle>No Dashboard Access</CardTitle>
                <CardDescription>
                  You don't have admin or kitchen roles assigned yet. Please contact an administrator for access.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Sign Out Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
