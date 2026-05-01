import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { useOrderAlarm } from "@/hooks/useOrderAlarm";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  KeyRound,
  AlertCircle,
  CheckCircle,
  Shield,
  Loader2,
  Trash2,
  ChefHat,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminMetrics {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  recentOrders: any[];
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

// ── Component ─────────────────────────────────────────────────────────────────
const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Auth from shared context — resolves instantly, no extra fetch
  const { user, session, roles: userRoles } = useAuth();
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const userEmail = user?.email || "";

  // ── Alarm — fires when unaccepted orders exist, same as Kitchen/AdminOrders ──
  const { startAlarm, stopAlarm, unlockAudio } = useOrderAlarm();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // Unlock AudioContext on first interaction so alarm can play async
  useEffect(() => {
    if (audioEnabled) return;
    const unlock = async () => { const ok = await unlockAudio(); setAudioEnabled(ok); };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, [audioEnabled, unlockAudio]);

  // ── Component-scoped fetchAdminMetrics — raw fetch() bypasses GoTrueClient lock
  const fetchAdminMetrics = useCallback(async (): Promise<AdminMetrics> => {
    const accessToken = sessionRef.current?.access_token;
    if (!accessToken) {
      console.warn('[Admin] fetchAdminMetrics: no session token yet');
      throw new Error('No session token');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    console.log('[Admin] fetchAdminMetrics: starting query...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=id,total,created_at,status,order_number,customer_name,customer_phone,order_type&order=created_at.desc&limit=200`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${body}`);
    }

    const allOrders: any[] = await response.json();
    console.log('[Admin] fetchAdminMetrics result — count:', allOrders.length);

    const ordersToday = allOrders.filter(o => o.created_at >= todayISO);
    const pendingOrders = allOrders.filter(o => ["pending", "paid", "confirmed"].includes(o.status));
    const recentOrders = allOrders.slice(0, 10);

    return {
      todayOrders: ordersToday.length,
      todayRevenue: ordersToday.reduce((sum, o) => sum + Number(o.total || 0), 0),
      pendingOrders: pendingOrders.length,
      totalOrders: allOrders.length,
      recentOrders,
    };
  }, []);

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── React Query — caches metrics across navigations AND tab close/reopen ──
  //
  // How this works with PersistQueryClientProvider (App.tsx):
  //   1. On first load: no cache → isLoading=true → fetch runs → data appears.
  //   2. Navigate away and back: cache hit (staleTime=0 means stale, but data
  //      is shown immediately while background refetch runs).
  //   3. Close tab / PWA / browser → reopen: PersistQueryClientProvider
  //      hydrates from localStorage BEFORE this component renders, so `metrics`
  //      is already populated — orders appear instantly, no blank state.
  //   4. Background refetch fires immediately (staleTime=0) to get fresh data.
  //   5. Real-time subscription below fires invalidateQueries on any DB change.
  //   6. refetchInterval: 60s — safety net if real-time WebSocket drops.
  //
  // isLoading is only true on the very first load (no cache at all).
  // While a background refetch runs, `metrics` still holds the previous data.
  const {
    data: metrics,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<AdminMetrics>({
    queryKey: ["admin-metrics"],
    queryFn: fetchAdminMetrics,
    enabled: !!session,           // don't run until auth is ready
    // staleTime: 0 inherited from global default — always refetch in background
    // gcTime: 24h inherited from global default — keep in memory all day
    refetchOnWindowFocus: true,   // refresh when admin switches back to the tab
    refetchOnMount: true,         // always refetch on mount (shows cached data first)
    refetchInterval: 5 * 1000,    // poll every 5s — catches orders if WebSocket drops
    retry: 3,                     // retry up to 3 times on timeout
    retryDelay: 2000,             // wait 2s between retries
  });

  // ── Real-time subscription — invalidates cache on any order change ─────────
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        // Invalidate so React Query refetches in the background
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // ── Service Worker push listener — refresh on push-triggered new orders ────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_ORDER_PUSH') {
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [queryClient]);

  // ── Delete all orders ──────────────────────────────────────────────────────
  const handleDeleteAllOrders = useCallback(async () => {
    const accessToken = sessionRef.current?.access_token;
    if (!accessToken) {
      toast.error("Not authenticated — please refresh and try again.");
      return;
    }
    setIsDeleting(true);
    try {
      // Raw fetch bypasses GoTrueClient lock; neq filter satisfies RLS requirement
      // for a WHERE clause (Supabase requires at least one filter on DELETE).
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?id=neq.00000000-0000-0000-0000-000000000000`,
        {
          method: "DELETE",
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        }
      );
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${body}`);
      }
      // Content-Range: */N tells us how many rows were deleted
      const contentRange = response.headers.get('Content-Range') || '';
      console.log('[Admin] DELETE orders response:', response.status, 'Content-Range:', contentRange);
      const deleted = parseInt(contentRange.replace('*/', ''), 10);
      if (!isNaN(deleted) && deleted === 0) {
        throw new Error('No orders were deleted — you may not have admin permissions. Check console for details.');
      }
      toast.success(`Deleted ${isNaN(deleted) ? 'all' : deleted} orders successfully!`);
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    } catch (err: any) {
      console.error("Failed to delete orders:", err);
      toast.error(err?.message || "Failed to delete orders");
    } finally {
      setIsDeleting(false);
    }
  }, [queryClient]);

  // ── Alarm trigger — fires when metrics load/update with unaccepted orders ───
  useEffect(() => {
    if (!metrics) return;
    const unaccepted = metrics.recentOrders.filter(
      (o: any) => o.status === 'pending' || o.status === 'paid' || o.status === 'confirmed'
    );
    const newOnes = unaccepted.filter((o: any) => !knownOrderIdsRef.current.has(o.id));

    if (newOnes.length > 0) {
      void startAlarm();
    } else if (unaccepted.length === 0) {
      stopAlarm();
    }

    // Update known set from full recent list so next render can diff correctly
    knownOrderIdsRef.current = new Set(metrics.recentOrders.map((o: any) => o.id));
  }, [metrics, startAlarm, stopAlarm]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const todayOrders = metrics?.todayOrders ?? 0;
  const todayRevenue = metrics?.todayRevenue ?? 0;
  const pendingOrders = metrics?.pendingOrders ?? 0;
  const totalOrders = metrics?.totalOrders ?? 0;
  const recentOrders = metrics?.recentOrders ?? [];

  const metricCards = useMemo(() => [
    {
      title: "Today's Orders",
      value: todayOrders,
      icon: ShoppingBag,
      description: "Orders placed today",
      color: "text-blue-600",
    },
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total earnings today",
      color: "text-green-600",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Clock,
      description: "Awaiting processing",
      color: "text-orange-600",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: TrendingUp,
      description: "All time orders",
      color: "text-purple-600",
    },
  ], [todayOrders, todayRevenue, pendingOrders, totalOrders]);

  const quickActions = useMemo(() => [
    {
      title: "All Orders",
      description: "Full order management & tracking",
      icon: ClipboardList,
      onClick: () => navigate("/admin/orders"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Kitchen Display",
      description: "Live kitchen order board",
      icon: ChefHat,
      onClick: () => navigate("/kitchen"),
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      title: "Manage Roles",
      description: "User permissions & access",
      icon: Users,
      onClick: () => navigate("/admin/roles"),
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Password Resets",
      description: "User password support",
      icon: KeyRound,
      onClick: () => navigate("/admin/passwords"),
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      title: "Settings",
      description: "Account & profile settings",
      icon: Settings,
      onClick: () => navigate("/profile"),
      color: "bg-gray-500 hover:bg-gray-600",
    },
  ], [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">

        {/* Header */}
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

          {/* Auth Status Badge */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Authenticated:</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {userEmail || "—"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Roles:</span>
                {userRoles.length > 0 ? (
                  <div className="flex gap-1">
                    {userRoles.map((role) => (
                      <Badge key={role} variant="default" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    none
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

        {/* Loading — only shown on very first load (no cached data yet) */}
        {isLoading && !metrics && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Loading dashboard data…</AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium">Failed to load dashboard metrics</p>
                <p className="text-sm mt-1">{(error as Error).message}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="ml-4">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => (
            <Card key={metric.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-opacity-10 ${metric.color}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
              <div className="absolute top-0 right-0 w-2 h-2 m-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={action.onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && action.onClick()}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 transition-colors`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-xs">{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest orders — updates in real-time
                {isFetching && metrics && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> refreshing…
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={() => navigate("/admin/orders")} variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => navigate("/admin/orders")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm truncate">
                          {order.order_number}
                        </span>
                        <Badge
                          className={`text-xs font-medium shrink-0 ${
                            order.status === "pending" ? "bg-orange-500 text-white" :
                            order.status === "paid" ? "bg-green-600 text-white" :
                            order.status === "confirmed" ? "bg-blue-500 text-white" :
                            order.status === "preparing" ? "bg-blue-400 text-white" :
                            order.status === "ready" ? "bg-green-500 text-white" :
                            order.status === "completed" ? "bg-gray-400 text-white" :
                            "bg-red-500 text-white"
                          }`}
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {order.order_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {order.customer_name} • {order.customer_phone}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="font-semibold text-foreground">${Number(order.total).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
