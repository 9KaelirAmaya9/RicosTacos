import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Package, ChefHat, Printer, BellOff, MapPin, StickyNote } from "lucide-react";
import { printReceipt } from "@/utils/printReceipt";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useOrderAlarm } from "@/hooks/useOrderAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// ── SW postMessage listener type ──────────────────────────────────────────────
interface SwMessage {
  type: string;
  payload?: unknown;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  delivery_address?: string | null;
  notes?: string | null;
  created_at: string;
}

// ── localStorage cache helpers ────────────────────────────────────────────────
const LS_KITCHEN = "rt_kitchen_orders";
const LS_TTL = 5 * 60 * 1000; // 5 min — stale after this, but still shown while re-fetching

function readKitchenCache(): Order[] {
  try {
    const raw = localStorage.getItem(LS_KITCHEN);
    if (!raw) return [];
    const { data, ts } = JSON.parse(raw);
    if (Array.isArray(data) && Date.now() - ts < LS_TTL) return data as Order[];
  } catch {}
  return [];
}

function writeKitchenCache(orders: Order[]) {
  try { localStorage.setItem(LS_KITCHEN, JSON.stringify({ data: orders, ts: Date.now() })); } catch {}
}

// Read env vars once at module level — same pattern as AuthContext.tsx
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

const Kitchen = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  // Keep session in a ref so fetchOrders always uses the latest token
  // without needing to be recreated on every token refresh
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Seed priority: React Query in-memory cache → localStorage → empty
  // This prevents blank state on both navigation-back AND hard refresh.
  const [orders, setOrders] = useState<Order[]>(() =>
    queryClient.getQueryData<Order[]>(["kitchen-orders"])?.length
      ? queryClient.getQueryData<Order[]>(["kitchen-orders"])!
      : readKitchenCache()
  );
  // Only show loading spinner if we have no data at all to display
  const [loading, setLoading] = useState<boolean>(() => {
    const hasCache =
      (queryClient.getQueryData<Order[]>(["kitchen-orders"]) ?? []).length > 0 ||
      readKitchenCache().length > 0;
    return !hasCache;
  });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const { startAlarm, stopAlarm, unlockAudio } = useOrderAlarm();
  const { autoSubscribe } = usePushNotifications();

  // Auto-subscribe to OS push notifications as soon as the session is ready.
  // If the user already granted permission, this is silent and instant.
  // If not, it no-ops — staff can still click "Enable Notifications" in the card below.
  useEffect(() => {
    if (session) void autoSubscribe();
  }, [session, autoSubscribe]);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const alarmMinimumUntilRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);
  // Manual snooze: set when user hits Silence. Cleared when a brand-new order arrives.
  const snoozedUntilRef = useRef<number>(0);
  // Prevent concurrent fetches — 5s poll + 20s timeout = up to 4 in-flight at once without this
  const fetchInProgressRef = useRef(false);
  // Queue a fetch to run immediately after the current one finishes (used by updateStatus)
  const pendingFetchRef = useRef(false);
  // Track orders removed optimistically so a stale in-flight poll can't re-add them
  const optimisticallyRemovedRef = useRef<Set<string>>(new Set());

  // Live clock — ticks every second
  useEffect(() => {
    const tick = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

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
    const hasUnacceptedOrders = nextOrders.some(
      (o) => o.status === "paid" || o.status === "confirmed"
    );

    if (hasUnacceptedOrders) {
      // Respect manual snooze — don't re-arm until snooze expires or a new order arrives
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
    // Guard: skip if a fetch is already in-flight.
    // Without this, 5s polling + 20s timeout = 4 concurrent DB connections piling up.
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    console.log('[Kitchen] fetchOrders: starting query...');
    try {
      // Use raw fetch() to bypass the GoTrueClient lock.
      // supabase.from() calls getSession() internally which waits for the lock —
      // on hard refresh this lock can be held during token refresh, causing a 20s hang.
      // Raw fetch with the token we already have from AuthContext is instant.
      const accessToken = sessionRef.current?.access_token;
      if (!accessToken) {
        console.warn('[Kitchen] No session token yet — will retry on next poll');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?select=*&status=in.(paid,confirmed,preparing)&order=created_at.asc`,
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

      const data: Order[] = await response.json();
      console.log('[Kitchen] fetchOrders result — count:', data.length);
      {
        const nextOrders = data;
        const nextIds = new Set(nextOrders.map((order) => order.id));
        const newUnacceptedOrders = nextOrders.filter(
          (order) =>
            !knownOrderIdsRef.current.has(order.id) &&
            (order.status === "paid" || order.status === "confirmed")
        );

        if (newUnacceptedOrders.length > 0) {
          alarmMinimumUntilRef.current = Math.max(
            alarmMinimumUntilRef.current,
            Date.now() + 10000
          );
          snoozedUntilRef.current = 0; // new order overrides any manual snooze
          void startAlarm();
          toast.info(
            `🔔 ${newUnacceptedOrders.length} new order${newUnacceptedOrders.length > 1 ? "s" : ""} received`
          );

          // Fire Web Push so the tablet gets alerted even when the tab is closed
          const orderWord = newUnacceptedOrders.length === 1 ? "order" : "orders";
          const names = newUnacceptedOrders.map((o) => o.customer_name).join(", ");
          supabase.functions
            .invoke("send-push-notification", {
              body: {
                title: `🌮 ${newUnacceptedOrders.length} New ${orderWord.charAt(0).toUpperCase() + orderWord.slice(1)}!`,
                body: `From: ${names}`,
                data: { url: "/kitchen" },
                targetRoles: ["kitchen", "admin"],
              },
            })
            .catch((err) =>
              console.warn("Push notification failed (non-critical):", err)
            );
        }

        knownOrderIdsRef.current = nextIds;

        // Confirm which optimistic removals the server has acknowledged (order no longer returned)
        // and clear those from our tracking set.
        for (const id of optimisticallyRemovedRef.current) {
          if (!nextIds.has(id)) optimisticallyRemovedRef.current.delete(id);
        }
        // Filter out orders we've optimistically removed but whose DB write hasn't committed yet.
        // This prevents a stale poll response from re-adding an order the user just dismissed.
        const displayOrders = nextOrders.filter(
          (o) => !optimisticallyRemovedRef.current.has(o.id)
        );

        setOrders(displayOrders);
        // Persist to localStorage (survives hard refresh) and React Query cache (survives navigation)
        writeKitchenCache(displayOrders);
        queryClient.setQueryData(["kitchen-orders"], displayOrders);
        syncAlarmState(displayOrders);

        // Invalidate the admin-metrics React Query cache so the admin dashboard
        // reflects the latest orders immediately when kitchen fetches new data.
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      }
    } catch (e: any) {
      // Catches timeout rejection and any other unexpected throws
      console.error('[Kitchen] fetchOrders EXCEPTION:', e.message);
      toast.error("Failed to fetch orders — retrying…");
      // Do NOT clear orders — keep showing last known data
    } finally {
      fetchInProgressRef.current = false;
      setLoading(false);
      setLastFetchedAt(new Date());
      // If updateStatus queued a fetch while we were in-flight, run it now.
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        void fetchOrders();
      }
    }
  }, [startAlarm, syncAlarmState, queryClient]);

  const updateStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      // Determine if this status removes the order from the kitchen display
      const kitchenVisible =
        newStatus === "preparing" ||
        newStatus === "paid" ||
        newStatus === "confirmed";

      // Optimistic update — immediately reflect the change in UI
      if (!kitchenVisible) {
        // Mark as optimistically removed so any in-flight poll doesn't re-add it
        optimisticallyRemovedRef.current.add(orderId);
      }
      const nextOrders = orders
        .map((order) => order.id === orderId ? { ...order, status: newStatus } : order)
        .filter((order) => order.status === "preparing" || order.status === "paid" || order.status === "confirmed");
      setOrders(nextOrders);
      // Write to localStorage immediately so a hard refresh during the DB write
      // doesn't resurrect the order from the stale cache.
      writeKitchenCache(nextOrders);

      try {
        const { error } = await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", orderId);

        if (error) throw error;
        toast.success("Order status updated");

        // When an order is marked ready, SMS the customer so they know
        // to come pick up (or that their delivery is on the way).
        // Fire-and-forget — never block the kitchen UI on this.
        if (newStatus === 'ready') {
          const order = orders.find((o) => o.id === orderId);
          if (order) {
            fetch(`${SUPABASE_URL}/functions/v1/notify-order-ready`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderNumber: order.order_number,
                orderType: order.order_type,
              }),
            }).catch((e) => console.warn('[Kitchen] Customer SMS failed (non-critical):', e));
          }
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
        // Undo optimistic removal — DB write failed
        optimisticallyRemovedRef.current.delete(orderId);
      } finally {
        // Always re-fetch after a status change: use pendingFetchRef if one is already in-flight
        if (fetchInProgressRef.current) {
          pendingFetchRef.current = true;
        } else {
          void fetchOrders();
        }
      }
    },
    [fetchOrders]
  );

  const handleStopAlarm = useCallback(() => {
    alarmMinimumUntilRef.current = 0;
    snoozedUntilRef.current = Date.now() + 5 * 60 * 1000; // snooze 5 min
    clearStopTimeout();
    stopAlarm();
    toast.info("Alarm silenced for 5 minutes");
  }, [clearStopTimeout, stopAlarm]);

  const handlePrintReceipt = (order: Order) => {
    try {
      printReceipt({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        orderType: order.order_type,
        items: order.items,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        deliveryAddress: order.delivery_address || undefined,
        notes: order.notes || undefined,
        createdAt: order.created_at,
      });
      toast.success("Printing receipt...");
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print receipt");
    }
  };

  // Unlock audio on first user interaction — warms up the real AudioContext
  // that useOrderAlarm uses, so the alarm plays reliably when triggered async.
  useEffect(() => {
    if (audioEnabled) return;
    const handleInteraction = async () => {
      const ok = await unlockAudio();
      setAudioEnabled(ok);
    };
    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [audioEnabled, unlockAudio]);

  // ── Listen for SW postMessage (push arrived while tab was in background) ────
  // When the service worker receives a push event, it sends a NEW_ORDER_PUSH
  // message to all open Kitchen/Admin tabs. This triggers fetchOrders() which
  // will detect the new order and start the audio alarm — even if the tab was
  // in the background and the Supabase real-time subscription was throttled.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSwMessage = (event: MessageEvent<SwMessage>) => {
      if (event.data?.type === 'NEW_ORDER_PUSH') {
        console.log('[Kitchen] SW push received — refreshing orders');
        void fetchOrders();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    };
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();

    // ── Real-time subscription ────────────────────────────────────────────────
    // NO filter here — fetchOrders() applies the correct status filter
    // server-side.  A client-side Realtime filter using the `in` operator
    // can silently drop UPDATE events when an order transitions OUT of the
    // filtered set (e.g. pending → ready skipping preparing), causing the
    // kitchen display to miss the change entirely.  Without the filter every
    // order mutation reaches the handler; fetchOrders() then returns only the
    // statuses the kitchen cares about — safe, correct, and reliable.
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            fetchOrders();
          }
        }
      )
      .subscribe();

    // ── Polling fallback — every 5s ───────────────────────────────────────────
    // If the WebSocket drops silently (common on mobile/PWA after screen lock),
    // polling catches new orders within 5 seconds and fires the alarm.
    // This is the safety net that guarantees the kitchen never misses an order.
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

  const getStatusColor = (status: string) => {
    if (status === "paid" || status === "confirmed") return "bg-green-600";
    return "bg-blue-500"; // preparing
  };

  const getStatusLabel = (status: string) => {
    if (status === "paid" || status === "confirmed") return "PAID — New";
    return "PREPARING";
  };

  const getTimeElapsed = useCallback((createdAt: string) => {
    const minutes = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / 60000
    );
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
  }, []);

  // Returns a border urgency class based on how long the order has been waiting.
  // Unaccepted (paid/pending): amber at 15 min, red at 25 min.
  // Preparing: amber at 25 min, red at 40 min.
  const getUrgencyClass = useCallback((order: Order) => {
    const ageMin = Math.floor(
      (currentTime.getTime() - new Date(order.created_at).getTime()) / 60000
    );
    if (order.status === 'paid' || order.status === 'confirmed') {
      if (ageMin >= 25) return 'border-red-500';
      if (ageMin >= 15) return 'border-amber-400';
    }
    if (order.status === 'preparing') {
      if (ageMin >= 40) return 'border-red-500';
      if (ageMin >= 25) return 'border-amber-400';
    }
    return 'border-border';
  }, [currentTime]);

  const hasActiveAlarm = orders.some(
    (o) => o.status === "paid" || o.status === "confirmed"
  );

  return (
    <div className="min-h-screen bg-background">
      {loading && (
        <div className="max-w-7xl mx-auto px-6 pt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ChefHat className="h-4 w-4 animate-pulse text-primary" />
          Loading kitchen orders...
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ChefHat className="h-10 w-10 md:h-14 md:w-14 text-primary shrink-0" />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold leading-none">
                  Kitchen Display
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mt-1">
                  {orders.length} active {orders.length === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Sound controls */}
              {!audioEnabled ? (
                <Button
                  size="lg"
                  className="gap-2 text-base h-12 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold animate-pulse"
                  onClick={async () => {
                    const ok = await unlockAudio();
                    setAudioEnabled(ok);
                    await startAlarm();
                    setTimeout(() => stopAlarm(), 2000);
                  }}
                >
                  🔔 Enable Sound
                </Button>
              ) : hasActiveAlarm ? (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleStopAlarm}
                  className="gap-2 text-base h-12"
                >
                  <BellOff className="h-5 w-5" />
                  Silence Alarm
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-sm h-9 text-muted-foreground"
                  onClick={async () => {
                    await startAlarm();
                    setTimeout(() => stopAlarm(), 2000);
                  }}
                >
                  🔔 Test Sound
                </Button>
              )}

              {/* Live clock */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Auto-refreshing</p>
                <p className="text-2xl md:text-3xl font-bold tabular-nums">
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Sound status bar — only show when audio is confirmed enabled */}
        {audioEnabled && !hasActiveAlarm && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-2 border border-green-200 dark:border-green-800">
            <span>🔔</span>
            <span className="font-medium">Sound alerts active</span>
            <span className="text-muted-foreground">— alarm will fire on every new order</span>
          </div>
        )}

        {/* Staleness indicator — warn if data is more than 2 minutes old */}
        {lastFetchedAt && (() => {
          const ageMs = currentTime.getTime() - lastFetchedAt.getTime();
          const ageMins = Math.floor(ageMs / 60000);
          if (ageMins < 2) return null;
          return (
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-4 py-2 border border-yellow-200 dark:border-yellow-800">
              <span>⚠️</span>
              <span className="font-medium">Last updated {ageMins} min ago</span>
              <span className="text-muted-foreground">— connection may be slow. Orders are still coming in.</span>
            </div>
          );
        })()}

        <NotificationSettings />

        {orders.length === 0 ? (
          <Card className="p-12 md:p-16 text-center">
            <Package className="h-20 w-20 md:h-24 md:w-24 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">No Active Orders</h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              All orders are completed or ready for pickup
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {orders.map((order) => (
              <Card
                key={order.id}
                className={`border-4 hover:shadow-2xl transition-shadow flex flex-col ${getUrgencyClass(order)} ${
                  order.status === "paid" || order.status === "confirmed"
                    ? "ring-4 ring-green-400 ring-offset-2 animate-pulse"
                    : ""
                }`}
              >
                <CardHeader
                  className={`${getStatusColor(order.status)} text-white p-5 md:p-7`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-5xl md:text-6xl font-bold mb-1">
                        {order.order_number.split("-")[2]}
                      </CardTitle>
                      <p className="text-base md:text-lg opacity-90 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {getTimeElapsed(order.created_at)} ago
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="secondary"
                        className="text-lg md:text-xl px-3 py-1 font-semibold bg-white/20"
                      >
                        {order.order_type}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-sm px-2 py-0.5 bg-white/30 font-bold uppercase tracking-wide"
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 md:p-7 flex-1 flex flex-col gap-4">
                  {/* Customer */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customer</p>
                    <p className="font-semibold text-2xl md:text-3xl break-words">
                      {order.customer_name}
                    </p>
                    {order.customer_phone && (
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="text-base text-primary underline-offset-2 hover:underline mt-1 inline-block"
                      >
                        {order.customer_phone}
                      </a>
                    )}
                  </div>

                  {/* Delivery address */}
                  {order.order_type === "delivery" && order.delivery_address && (
                    <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3">
                      <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-0.5">
                          Delivery Address
                        </p>
                        <p className="text-base font-medium break-words">
                          {order.delivery_address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-3">
                      <StickyNote className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                          Notes
                        </p>
                        <p className="text-base break-words">{order.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-wide">
                      Items
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center bg-muted/50 p-3 md:p-4 rounded-xl gap-3"
                        >
                          <span className="font-bold text-2xl md:text-3xl bg-primary text-primary-foreground rounded-full h-11 w-11 md:h-13 md:w-13 flex items-center justify-center shrink-0">
                            {item.quantity}
                          </span>
                          <span className="font-medium text-xl md:text-2xl break-words">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 mt-auto">
                    {(order.status === "paid" || order.status === "confirmed") && (
                      <Button
                        onClick={() => updateStatus(order.id, "preparing")}
                        className="w-full text-2xl md:text-3xl font-semibold h-16 md:h-20 bg-green-600 hover:bg-green-700"
                      >
                        Accept & Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        onClick={() => updateStatus(order.id, "ready")}
                        className="w-full text-2xl md:text-3xl font-semibold h-16 md:h-20"
                      >
                        Mark Ready
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handlePrintReceipt(order)}
                      className="w-full gap-3 text-xl md:text-2xl h-13 md:h-15"
                    >
                      <Printer className="h-6 w-6" />
                      Print Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Kitchen;
