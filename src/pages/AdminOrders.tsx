import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Printer, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { printReceipt } from "@/utils/printReceipt";
import { useOrderAlarm } from "@/hooks/useOrderAlarm";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

// ── localStorage cache helpers ────────────────────────────────────────────────
const LS_ADMIN = "rt_admin_orders";
const LS_TTL = 5 * 60 * 1000;

function readAdminCache(): Order[] {
  try {
    const raw = localStorage.getItem(LS_ADMIN);
    if (!raw) return [];
    const { data, ts } = JSON.parse(raw);
    if (Array.isArray(data) && Date.now() - ts < LS_TTL) return data as Order[];
  } catch {}
  return [];
}

function writeAdminCache(orders: Order[]) {
  try { localStorage.setItem(LS_ADMIN, JSON.stringify({ data: orders, ts: Date.now() })); } catch {}
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Seed priority: React Query in-memory cache → localStorage → empty
  const [orders, setOrders] = useState<Order[]>(() =>
    queryClient.getQueryData<Order[]>(["admin-orders"])?.length
      ? queryClient.getQueryData<Order[]>(["admin-orders"])!
      : readAdminCache()
  );
  // Only show loading spinner if we have no data at all
  const [loading, setLoading] = useState<boolean>(() => {
    const hasCache =
      (queryClient.getQueryData<Order[]>(["admin-orders"]) ?? []).length > 0 ||
      readAdminCache().length > 0;
    return !hasCache;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { startAlarm, stopAlarm, unlockAudio } = useOrderAlarm();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const alarmMinimumUntilRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);
  const snoozedUntilRef = useRef<number>(0);

  // Unlock AudioContext on first user interaction — identical to Kitchen.tsx.
  // Without this, startAlarm() calls are silently swallowed by the browser.
  useEffect(() => {
    if (audioEnabled) return;
    const handleInteraction = async () => {
      const ok = await unlockAudio();
      setAudioEnabled(ok);
    };
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [audioEnabled, unlockAudio]);
  // Prevent concurrent fetches stacking up with 5s poll + long timeout
  const fetchInProgressRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hardStop = window.setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => window.clearTimeout(hardStop);
  }, []);

  const clearStopTimeout = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const syncAlarmState = useCallback((nextOrders: Order[]) => {
    const hasUnacceptedOrders = nextOrders.some((o) => o.status === "pending" || o.status === "paid" || o.status === "confirmed");

    if (hasUnacceptedOrders) {
      if (Date.now() < snoozedUntilRef.current) return;
      clearStopTimeout();
      void startAlarm();
      return;
    }

    const remaining = alarmMinimumUntilRef.current - Date.now();
    if (remaining > 0) {
      clearStopTimeout();
      stopTimeoutRef.current = window.setTimeout(() => {
        stopAlarm();
        stopTimeoutRef.current = null;
      }, remaining);
      return;
    }

    clearStopTimeout();
    stopAlarm();
  }, [clearStopTimeout, startAlarm, stopAlarm]);

  const fetchOrders = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    try {
      // Raw fetch bypasses the GoTrueClient lock — same fix as AuthContext + Cart.tsx
      const accessToken = sessionRef.current?.access_token;
      if (!accessToken) {
        console.warn('[AdminOrders] No session token yet — will retry on next poll');
        return;
      }

      console.log('[AdminOrders] fetchOrders: starting query...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=1000`,
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

      const ordersData: Order[] = await response.json();
      console.log('[AdminOrders] fetchOrders result — count:', ordersData.length);
      const nextIds = new Set(ordersData.map((order) => order.id));
      const newUnacceptedOrders = ordersData.filter(
        (order) => !knownOrderIdsRef.current.has(order.id) && (order.status === "pending" || order.status === "paid")
      );

      if (newUnacceptedOrders.length > 0) {
        alarmMinimumUntilRef.current = Math.max(alarmMinimumUntilRef.current, Date.now() + 10000);
        snoozedUntilRef.current = 0; // new order overrides any manual snooze
        void startAlarm();
        toast.info(`🔔 ${newUnacceptedOrders.length} new order${newUnacceptedOrders.length > 1 ? "s" : ""} received`);
      }

      knownOrderIdsRef.current = nextIds;
      setOrders(ordersData);
      // Persist to localStorage (survives hard refresh) and React Query cache (survives navigation)
      writeAdminCache(ordersData);
      queryClient.setQueryData(["admin-orders"], ordersData);
      syncAlarmState(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      // Do NOT clear orders — keep showing last known data on transient errors
    } finally {
      fetchInProgressRef.current = false;
      setLoading(false);
    }
  }, [startAlarm, syncAlarmState, queryClient]);

  useEffect(() => {
    fetchOrders();

    // ── Real-time subscription ────────────────────────────────────────────────
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            fetchOrders();
          }
        }
      )
      .subscribe();

    // ── Polling fallback — every 5s ───────────────────────────────────────────
    // Safety net if WebSocket drops silently (mobile/PWA screen lock).
    const pollInterval = window.setInterval(() => {
      fetchOrders();
    }, 5 * 1000);

    return () => {
      clearStopTimeout();
      stopAlarm();
      window.clearInterval(pollInterval);
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [clearStopTimeout, fetchOrders, stopAlarm]);

  // Derived — no state needed; updates instantly when orders/filters change
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_phone.includes(searchTerm)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }
    return filtered;
  }, [searchTerm, statusFilter, orders]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      // Optimistically update local state first
      setOrders(prevOrders => {
        const updated = prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        );
        syncAlarmState(updated);
        return updated;
      });
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order status updated");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
      // Refetch on error to ensure consistency
      fetchOrders();
    }
  }, [fetchOrders, syncAlarmState]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "paid":
      case "confirmed":
        return "bg-green-600";
      case "preparing":
        return "bg-blue-500";
      case "ready":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Refreshing orders...
          </div>
        )}

        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Order Tracking</h1>
            <div className="flex items-center gap-2">
              {audioEnabled ? (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  🔔 Sound active
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  🔕 Click anywhere to enable sound
                </span>
              )}
              <Button onClick={fetchOrders} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{format(new Date(order.created_at), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.order_type === "delivery" ? "default" : "secondary"}>
                          {order.order_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(order.items) ? order.items.length : 0} items
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(order.status)} text-white`}>
                                {order.status}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const items = Array.isArray(order.items)
                              ? order.items as Array<{ name: string; quantity: number; price: number }>
                              : [];
                            printReceipt({
                              orderNumber: order.order_number,
                              customerName: order.customer_name,
                              orderType: order.order_type,
                              items: items,
                              subtotal: order.subtotal,
                              tax: order.tax,
                              total: order.total,
                              createdAt: order.created_at,
                              deliveryAddress: order.delivery_address || undefined,
                              notes: order.notes || undefined,
                            });
                          }}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
