import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Logout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        toast.success("Signed out successfully");
        navigate("/");
      } catch (error: any) {
        toast.error(error.message || "Failed to sign out");
        navigate("/");
      }
    };

    handleLogout();
  }, [navigate, signOut]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
};

export default Logout;
