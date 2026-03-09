import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShoppingBag, User } from "lucide-react";

interface CheckoutAuthOptionsProps {
  onContinueAsGuest: () => void;
  onAuthSuccess: () => void;
}

export const CheckoutAuthOptions = ({ onContinueAsGuest, onAuthSuccess }: CheckoutAuthOptionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Signed in successfully!");
      onAuthSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password length
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/cart`,
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        // Show specific error messages
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else if (error.message.includes("password")) {
          toast.error("Password is too weak. Please use a stronger password.");
        } else if (error.message.includes("email")) {
          toast.error("Invalid email address. Please check and try again.");
        } else {
          toast.error(error.message || "Failed to create account. Please try again.");
        }
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required - allow guest checkout
        toast.warning("Account created! Please check your email to confirm. You can continue as guest for now.", {
          duration: 6000,
        });
        // Continue as guest since email confirmation is pending
        onContinueAsGuest();
      } else if (data.session) {
        // No email confirmation required - user is automatically signed in
        toast.success("Account created successfully!");
        onAuthSuccess();
      } else {
        toast.error("Something went wrong. Please try again or continue as guest.");
        onContinueAsGuest();
      }
    } catch (error: any) {
      console.error("Sign up exception:", error);
      toast.error(error?.message || "Failed to create account. Please try again or continue as guest.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Complete Your Order
        </CardTitle>
        <CardDescription>
          Sign in to save your order history, or continue as a guest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="guest">Guest</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Create an account to save your order history and make future checkouts faster.
              </p>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="guest" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Continue without creating an account. You'll still receive order updates via email.
            </p>
            <Button 
              onClick={async () => {
                console.log("Continue as Guest button clicked");
                console.log("onContinueAsGuest function:", typeof onContinueAsGuest);
                setIsGuestLoading(true);
                try {
                  // CRITICAL FIX: Call the function directly, don't wrap in Promise.resolve
                  // The function itself has internal timeouts (10s order, 15s payment)
                  // No need for outer timeout wrapper - it was causing race conditions
                  console.log("Calling handlePlaceOrder...");
                  await onContinueAsGuest();
                  console.log("handlePlaceOrder completed successfully");
                } catch (err: any) {
                  console.error("Error in handlePlaceOrder:", err);
                  const errorMsg = err?.message || "Failed to process order. Check console for details.";
                  toast.error(errorMsg, {
                    duration: 6000,
                  });
                } finally {
                  // Always reset loading state
                  console.log("Resetting guest loading state");
                  setIsGuestLoading(false);
                }
              }} 
              className="w-full"
              size="lg"
              disabled={isGuestLoading}
            >
              {isGuestLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue as Guest
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
