import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  DollarSign, 
  ShoppingBag, 
  Clock,
  TrendingUp,
  ClipboardList,
  Users,
  Settings,
  Package,
  KeyRound,
  AlertCircle,
  CheckCircle,
  Shield,
  Loader2,
  Trash2
} from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "roles" | "passwords" | "kitchen" | "settings">("orders");
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "error">("checking");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || "");
        setAuthStatus("authenticated");
        
        // Fetch user roles
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        
        if (roles) {
          setUserRoles(roles.map(r => r.role));
        }
      } else {
        setAuthStatus("error");
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      setAuthStatus("error");
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Optimize: Fetch only what we need with separate queries for better performance
      const [todayOrdersResult, allOrdersResult, pendingOrdersResult, recentOrdersResult] = await Promise.all([
        // Today's orders and revenue
        supabase
          .from("orders")
          .select("id, total, created_at")
          .gte("created_at", todayISO)
          .order("created_at", { ascending: false }),
        // Total orders count (lightweight)
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true }),
        // Pending orders count
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        // Recent orders
        supabase
          .from("orders")
          .select("id, order_number, customer_name, customer_phone, status, total, created_at, order_type")
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      if (todayOrdersResult.error) throw todayOrdersResult.error;
      if (allOrdersResult.error) throw allOrdersResult.error;
      if (pendingOrdersResult.error) throw pendingOrdersResult.error;
      if (recentOrdersResult.error) throw recentOrdersResult.error;

      const ordersToday = todayOrdersResult.data || [];
      setTodayOrders(ordersToday.length);
      setTodayRevenue(ordersToday.reduce((sum, order) => sum + Number(order.total || 0), 0));
      setPendingOrders(pendingOrdersResult.count || 0);
      setTotalOrders(allOrdersResult.count || 0);
      setRecentOrders(recentOrdersResult.data || []);
      setError(null);
    } catch (error: any) {
      console.error("Failed to load metrics:", error);
      const errorMessage = error?.message || "Failed to load metrics";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    loadMetrics();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMetrics, checkAuthStatus]);

  const handleDeleteAllOrders = useCallback(async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all orders
      
      if (error) throw error;
      
      toast.success("All orders deleted successfully!");
      setShowDeleteDialog(false);
      // Refresh metrics
      await loadMetrics();
    } catch (error: any) {
      console.error("Failed to delete orders:", error);
      toast.error(error?.message || "Failed to delete orders");
    } finally {
      setIsDeleting(false);
    }
  }, [loadMetrics]);

  const metrics = useMemo(() => [
    {
      title: "Today's Orders",
      value: todayOrders,
      icon: ShoppingBag,
      description: "Orders placed today",
      color: "text-blue-600"
    },
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total earnings today",
      color: "text-green-600"
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
      description: "Awaiting confirmation",
      color: "text-orange-600"
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: TrendingUp,
      description: "All time orders",
      color: "text-purple-600"
    }
  ], [todayOrders, todayRevenue, pendingOrders, totalOrders]);

  const quickActions = useMemo(() => [
    {
      key: "orders" as const,
      title: "View All Orders",
      description: "Manage and track orders",
      icon: ClipboardList,
      onClick: () => setActiveTab("orders"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      key: "roles" as const,
      title: "Manage Roles",
      description: "User permissions",
      icon: Users,
      onClick: () => setActiveTab("roles"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      key: "passwords" as const,
      title: "Password Resets",
      description: "User password support",
      icon: KeyRound,
      onClick: () => setActiveTab("passwords"),
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      key: "kitchen" as const,
      title: "Kitchen Display",
      description: "View kitchen orders",
      icon: Package,
      onClick: () => setActiveTab("kitchen"),
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      key: "settings" as const,
      title: "Settings",
      description: "Configure system",
      icon: Settings,
      onClick: () => setActiveTab("settings"),
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {isLoading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Loading dashboard data…</AlertDescription>
          </Alert>
        )}

        {/* Header with Auth Status */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Welcome back! Here's your overview</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
          
          {/* Auth & Role Status Indicator */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Authenticated:</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {userEmail || "Loading..."}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Roles:</span>
                {userRoles.length > 0 ? (
                  <div className="flex gap-1">
                    {userRoles.map(role => (
                      <Badge key={role} variant="default" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Loading roles...
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Access granted</span>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Error Alert with Better Visibility */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium">Failed to load dashboard metrics</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <Button onClick={loadMetrics} variant="outline" size="sm" className="ml-4">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Grid with Loading States */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-opacity-10 ${metric.color}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
              {/* Pulse animation for real-time feel */}
              <div className="absolute top-0 right-0 w-2 h-2 m-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
              disabled={totalOrders === 0}
            >
              <Trash2 className="h-4 w-4" />
              Delete All Orders
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card 
                key={action.title}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${activeTab === action.key ? "ring-2 ring-primary" : ""}`}
                onClick={action.onClick}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Tab Content Panels */}
        {activeTab === "orders" && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => navigate("/admin/orders")}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {order.order_number}
                          </span>
                          <Badge
                            variant={
                              order.status === 'pending' ? 'default' :
                              order.status === 'preparing' ? 'secondary' :
                              order.status === 'ready' ? 'default' :
                              order.status === 'completed' ? 'outline' :
                              'destructive'
                            }
                            className={`text-xs font-medium ${
                              order.status === 'pending' ? 'bg-orange-500' :
                              order.status === 'preparing' ? 'bg-blue-500' :
                              order.status === 'ready' ? 'bg-green-500' :
                              order.status === 'completed' ? '' :
                              'bg-red-500'
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {order.order_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_phone}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.order_type} • {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">${Number(order.total).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Button onClick={() => navigate("/admin/orders")} variant="outline">
                  Open Full Orders View
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "roles" && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Roles</CardTitle>
              <CardDescription>Open role management panel</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/admin/roles")}>Open Role Management</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "passwords" && (
          <Card>
            <CardHeader>
              <CardTitle>Password Resets</CardTitle>
              <CardDescription>Open password reset support panel</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/admin/passwords")}>Open Password Management</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "kitchen" && (
          <Card>
            <CardHeader>
              <CardTitle>Kitchen Display</CardTitle>
              <CardDescription>Open live kitchen order board</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/kitchen")}>Open Kitchen Display</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Open profile and account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/profile")}>Open Settings</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete All Orders Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete All Orders?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium">
                This will permanently delete ALL {totalOrders} orders from the database.
              </p>
              <p>This action cannot be undone. Are you absolutely sure?</p>
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This will remove all order history, including today's revenue data.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllOrders}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Yes, Delete All Orders
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
