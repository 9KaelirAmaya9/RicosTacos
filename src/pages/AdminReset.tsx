import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, Home } from "lucide-react";
import { toast } from "sonner";

const AdminReset = () => {
  const { user, loading, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  // Check if user is admin
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/signin");
      return;
    }

    // Fetch current order count
    fetchOrderCount();
  }, [user, loading, isAdmin, navigate]);

  const fetchOrderCount = async () => {
    try {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      setOrderCount(count || 0);
      console.log(`📊 Current order count: ${count}`);
    } catch (error) {
      console.error("Error fetching count:", error);
      toast.error("Failed to fetch order count");
    }
  };

  const handleResetOrders = async () => {
    if (!deleteConfirmed) {
      setDeleteConfirmed(true);
      return;
    }

    setIsDeleting(true);
    try {
      console.log("🔄 Starting deletion of all orders...");
      console.log(`📊 Deleting ${orderCount} orders`);

      // Delete all orders using authenticated admin session
      const { error, count } = await supabase
        .from("orders")
        .delete()
        .gte("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        console.error("❌ Delete error:", error);
        throw error;
      }

      console.log(`✅ Deleted ${count || orderCount} orders`);
      setDeletedCount(orderCount);

      // Verify deletion
      const { count: newCount, error: verifyError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      if (verifyError) throw verifyError;

      console.log(`📊 Verification - orders remaining: ${newCount}`);

      if (newCount === 0) {
        toast.success(`✅ Successfully deleted ${orderCount} orders!`);
      } else {
        toast.warning(`⚠️ Deletion may have failed. ${newCount} orders remaining.`);
      }

      setDeleteConfirmed(false);
      setOrderCount(newCount || 0);
    } catch (error: any) {
      console.error("❌ Reset failed:", error);
      toast.error(`Failed to reset orders: ${error.message}`);
      setDeleteConfirmed(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background pattern-tile flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-2">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be an admin to reset orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pattern-tile">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
            <Home className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset Orders
            </CardTitle>
            <CardDescription>
              Permanently delete ALL orders from the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Current Status:</strong> {orderCount === null ? "Loading..." : `${orderCount} orders in database`}
              </AlertDescription>
            </Alert>

            {/* Warning */}
            <Alert className="border-destructive/20 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Warning:</strong> This action is PERMANENT and cannot be undone. All order data will be deleted immediately.
              </AlertDescription>
            </Alert>

            {/* Deletion Result */}
            {deletedCount !== null && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>✅ Success!</strong> Deleted {deletedCount} orders. Database is now clean.
                </AlertDescription>
              </Alert>
            )}

            {/* Confirmation UI */}
            {!deleteConfirmed ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to DELETE ALL {orderCount} orders.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleResetOrders}
                  disabled={isDeleting || orderCount === null || orderCount === 0}
                  className="w-full"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : orderCount === 0 ? (
                    "No orders to delete"
                  ) : (
                    `Delete All ${orderCount} Orders`
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <p className="font-semibold text-destructive">
                  ⚠️ Are you absolutely sure? This will delete {orderCount} orders permanently.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmed(false)}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleResetOrders}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, Delete All Orders"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          <p>
            <strong>What happens:</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>All {orderCount} orders will be permanently deleted</li>
            <li>This action uses your authenticated admin session</li>
            <li>Changes are immediate and cannot be undone</li>
            <li>After deletion, the dashboard will show 0 orders</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminReset;
