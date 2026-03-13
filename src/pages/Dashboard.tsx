/**
 * Dashboard — uses shared AuthContext (Fix 1–5).
 *
 * Fix 3: Hard stop reduced to 5s (handled in AuthContext).
 *        Shows a retry card instead of silently redirecting when auth times out.
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, ClipboardList, UserCircle, LogOut, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const isDev = import.meta.env.DEV;
  const navigate = useNavigate();
  const { user, roles, loading, error, signOut, refetchRoles } = useAuth();

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Fix 3: Timeout/error — show retry card instead of silent redirect ────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-amber-400/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Session Check Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => refetchRoles()}
              variant="default"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/signin", { replace: true })}
              variant="outline"
              className="w-full"
            >
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Not authenticated ────────────────────────────────────────────────────────
  if (!user && !isDev) {
    navigate("/signin", { replace: true });
    return null;
  }

  const hasAdminRole = roles.includes("admin") || isDev;
  const hasKitchenRole = roles.includes("kitchen") || isDev;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

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
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
              onClick={() => navigate("/admin")}
            >
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
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-accent"
              onClick={() => navigate("/kitchen")}
            >
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
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary"
            onClick={() => navigate("/profile")}
          >
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
              <CardContent>
                <Button variant="outline" onClick={() => refetchRoles()} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Permissions
                </Button>
              </CardContent>
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
