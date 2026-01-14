import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, ClipboardList, UserCircle, LogOut, Loader2, Home, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { LanguageSwitch } from "@/components/LanguageSwitch";

const Dashboard = () => {
  const { user, loading, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const handleResetOrders = async () => {
    if (!confirm("Are you sure you want to reset all orders? This action cannot be undone.")) {
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("All orders have been reset successfully");
    } catch (error) {
      console.error("Error resetting orders:", error);
      toast.error("Failed to reset orders");
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pattern-tile flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-2">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need to sign in to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/signin')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAdminRole = roles.includes("admin");
  const hasKitchenRole = roles.includes("kitchen");

  return (
    <div className="min-h-screen bg-background pattern-tile">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Home Button & Language Switcher */}
        <div className="mb-4 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <LanguageSwitch />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
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
                <Button className="w-full" variant="default">
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
                <Button className="w-full" variant="default">
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
              <Button className="w-full" variant="default">
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

        {/* Admin Actions */}
        {hasAdminRole && (
          <div className="mt-8">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Admin Actions</CardTitle>
                <CardDescription>
                  Dangerous actions that affect the entire system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleResetOrders}
                  disabled={isResetting}
                  className="gap-2"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Reset All Orders
                    </>
                  )}
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
