import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminPasswordManagement = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      const redirectUrl = `${window.location.origin}/auth?type=recovery`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${email}`);
      setEmail(""); // Clear the input after success
    } catch (error: any) {
      console.error("Failed to send password reset:", error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Password Management</h1>
          <p className="text-muted-foreground mt-2">
            Send password reset emails to users for support purposes
          </p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Enter the user's email address to send them a password reset link. The user will receive an email with instructions to set a new password.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Send Password Reset Email</CardTitle>
            <CardDescription>
              The user will receive an email with a secure link to reset their password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendPasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Reset Email...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Password Reset Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="font-semibold min-w-[2rem]">1.</div>
              <div>Enter the email address of the user who needs a password reset</div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[2rem]">2.</div>
              <div>Click "Send Password Reset Email" button</div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[2rem]">3.</div>
              <div>The user will receive an email with a secure link to reset their password</div>
            </div>
            <div className="flex gap-3">
              <div className="font-semibold min-w-[2rem]">4.</div>
              <div>The link will redirect them to the password reset page where they can set a new password</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPasswordManagement;
