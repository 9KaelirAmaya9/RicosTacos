import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ChefHat, Loader2 } from "lucide-react";

const KitchenLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect if already authenticated and has required role
  useEffect(() => {
    let mounted = true;

    const redirectIfAuthorized = async (userId: string) => {
      try {
        // Use RPC instead of direct query to avoid RLS recursion/deadlocks
        const { data: isKitchen, error: kitchenError } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'kitchen'
        });

        if (!mounted) return;

        if (isKitchen) {
          navigate("/kitchen", { replace: true });
          return;
        }

        // Also check if admin (admins can access kitchen)
        const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin'
        });

        if (!mounted) return;

        if (isAdmin) {
          navigate("/kitchen", { replace: true });
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      }
    };

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setLoading(true);
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));

          try {
            await Promise.race([
              redirectIfAuthorized(session.user.id),
              timeoutPromise
            ]);
          } catch (e) {
            console.error("Auth check timed out or failed");
          } finally {
            if (mounted) setLoading(false);
          }
        }
      } catch (e) {
        console.error("Session check failed:", e);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setLoading(true);
        checkSession();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("No session created");
      }

      toast.success("Login successful! Redirecting to kitchen...");

      // Defer navigation and let ProtectedRoute handle authorization
      setTimeout(() => {
        navigate("/kitchen", { replace: true });
      }, 300);

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <ChefHat className="h-10 w-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Kitchen Staff Login</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your credentials to access the kitchen orders system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kitchen@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 text-base"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <ChefHat className="mr-2 h-5 w-5" />
                  Sign In to Kitchen
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>For kitchen staff only. Contact admin for access.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KitchenLogin;
