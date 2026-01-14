import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Volume2,
  VolumeX
} from "lucide-react";
import { useAudioAlerts } from "@/hooks/useAudioAlerts";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { 
  TodayOrdersMetric, 
  TodayRevenueMetric, 
  PendingOrdersMetric, 
  TotalOrdersMetric 
} from "@/components/admin/MetricCard";
import { QuickActionsGrid } from "@/components/admin/QuickActionsGrid";
import { RecentOrdersList } from "@/components/admin/OrderRow";
import type { Order } from "@/hooks/useOrders";

const Admin = () => {
  const navigate = useNavigate();
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  // Audio alerts for new orders
  const { audioEnabled, setAudioEnabled, playNewOrderAlert, initAudioContext } = useAudioAlerts();
  const previousOrderCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || "");
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        if (roles) {
          setUserRoles(roles.map(r => r.role));
        }
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [todayOrdersResult, allOrdersResult, pendingOrdersResult, recentOrdersResult] = await Promise.all([
        supabase.from("orders").select("id, total, created_at").gte("created_at", todayISO),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10)
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
      
      const recentData = (recentOrdersResult.data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : [],
      })) as Order[];
      setRecentOrders(recentData);
      
      // Play sound alert if total orders increased (new order detected)
      const currentTotal = allOrdersResult.count || 0;
      if (!isFirstLoadRef.current && currentTotal > previousOrderCountRef.current) {
        playNewOrderAlert();
        toast.success("🔔 New order received!", {
          duration: 3000,
        });
      }
      previousOrderCountRef.current = currentTotal;
      isFirstLoadRef.current = false;
      
      setError(null);
    } catch (error: any) {
      console.error("Failed to load metrics:", error);
      setError(error?.message || "Failed to load metrics");
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    loadMetrics();

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadMetrics())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadMetrics, checkAuthStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">Loading Admin Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's your overview</p>
          </div>
          <div className="flex gap-2 items-center">
            <LanguageSwitch />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                initAudioContext();
                setAudioEnabled(!audioEnabled);
                toast.success(audioEnabled ? "🔇 Audio alerts disabled" : "🔊 Audio alerts enabled");
              }}
              title={audioEnabled ? "Disable audio alerts" : "Enable audio alerts"}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={loadMetrics}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Auth Status */}
        <Alert className="border-serape-blue/30 bg-serape-blue/5">
          <Shield className="h-4 w-4 text-serape-blue" />
          <AlertDescription className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-serape-green" />
              <span className="text-sm font-medium">Authenticated:</span>
              <Badge variant="secondary" className="font-mono text-xs">{userEmail}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-serape-purple" />
              <span className="text-sm font-medium">Roles:</span>
              {userRoles.map(role => (
                <Badge key={role} variant="default" className="text-xs">{role}</Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button onClick={loadMetrics} variant="outline" size="sm">Retry</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TodayOrdersMetric value={todayOrders} isLive />
          <TodayRevenueMetric value={todayRevenue} isLive />
          <PendingOrdersMetric value={pendingOrders} isLive />
          <TotalOrdersMetric value={totalOrders} />
        </div>

        {/* Quick Actions */}
        <QuickActionsGrid />

        {/* Recent Orders */}
        <RecentOrdersList orders={recentOrders} maxItems={10} />
      </div>
    </div>
  );
};

export default Admin;
