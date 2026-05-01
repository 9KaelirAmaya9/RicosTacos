import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, LogOut, Mail, Phone, MapPin, History } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Textarea } from "@/components/ui/textarea";
import { NotificationSettings } from "@/components/NotificationSettings";

const Profile = () => {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve
    if (!session) {
      navigate("/signin");
      return;
    }

    // Load profile data once session is confirmed
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data: profile, error }) => {
        if (error) {
          console.error("Error loading profile:", error);
        } else if (profile) {
          setProfileData({
            name: profile.name || "",
            phone: profile.phone || "",
            address: profile.default_delivery_address || "",
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [authLoading, session, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            name: profileData.name,
            phone: profileData.phone,
            default_delivery_address: profileData.address,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(); // uses AuthContext.signOut — clears role cache properly
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />
      
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
              Your <span className="text-primary">Profile</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your registered email address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                  Update your personal information for faster checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Default Delivery Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        placeholder="123 Main St, Apt 4B, New York, NY 10001"
                        className="pl-9"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <NotificationSettings />

            {/* Order History */}
            <Card>
              <CardContent className="pt-6">
                <Link to="/order-history">
                  <Button variant="outline" className="w-full">
                    <History className="mr-2 h-4 w-4" />
                    View Order History
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="outline" 
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
