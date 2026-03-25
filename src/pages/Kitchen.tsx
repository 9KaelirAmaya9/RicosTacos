import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Package, ChefHat, Printer, BellOff, MapPin, StickyNote } from "lucide-react";
import { printReceipt } from "@/utils/printReceipt";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useOrderAlarm } from "@/hooks/useOrderAlarm";

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

const Kitchen = () => {
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { startAlarm, stopAlarm } = useOrderAlarm();
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const alarmMinimumUntilRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);

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
      (o) => o.status === "pending" || o.status === "paid" || o.status === "confirmed"
    );

    if (hasUnacceptedOrders) {
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
    const ordersPromise = supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing", "paid", "confirmed"])
      .order("created_at", { ascending: true });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Kitchen orders request timed out")), 7000)
    );

    const { data, error } = await Promise.race([
      ordersPromise,
      timeoutPromise,
    ]) as Awaited<typeof ordersPromise>;

    if (error) {
      toast.error("Failed to fetch orders");
      console.error(error);
    } else {
      const nextOrders = (data || []) as unknown as Order[];
      const nextIds = new Set(nextOrders.map((order) => order.id));
      const newUnacceptedOrders = nextOrders.filter(
        (order) =>
          !knownOrderIdsRef.current.has(order.id) &&
          (order.status === "pending" || order.status === "paid")
      );

      if (newUnacceptedOrders.length > 0) {
        alarmMinimumUntilRef.current = Math.max(
          alarmMinimumUntilRef.current,
          Date.now() + 10000
        );
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
      setOrders(nextOrders);
      syncAlarmState(nextOrders);

      // Invalidate the admin-metrics React Query cache so the admin dashboard
      // reflects the latest orders immediately when kitchen fetches new data.
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    }
    setLoading(false);
  }, [startAlarm, syncAlarmState, queryClient]);

  const updateStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      setOrders((prevOrders) => {
        const updated = prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        );
        return updated.filter(
          (order) =>
            order.status === "pending" ||
            order.status === "preparing" ||
            order.status === "paid" ||
            order.status === "confirmed"
        );
      });

      try {
        const { error } = await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", orderId);

        if (error) throw error;
        toast.success("Order status updated");
        if (
          newStatus !== "pending" &&
          newStatus !== "preparing" &&
          newStatus !== "paid" &&
          newStatus !== "confirmed"
        ) {
          fetchOrders();
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
        fetchOrders();
      }
    },
    [fetchOrders]
  );

  const handleStopAlarm = useCallback(() => {
    alarmMinimumUntilRef.current = 0;
    clearStopTimeout();
    stopAlarm();
    toast.info("Alarm silenced");
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

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!audioEnabled) {
        try {
          const AudioCtx = (
            window.AudioContext || (window as any).webkitAudioContext
          ) as typeof AudioContext;
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") await ctx.resume();
          await ctx.close();
          setAudioEnabled(true);
        } catch (error) {
          console.warn("⚠️ Audio initialization failed:", error);
        }
      }
    };

    const handleInteraction = () => void initAudio();
    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [audioEnabled]);

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

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `status=in.(pending,preparing,paid,confirmed)`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      clearStopTimeout();
      stopAlarm();
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [clearStopTimeout, fetchOrders, stopAlarm]);

  const getStatusColor = (status: string) => {
    if (status === "paid" || status === "confirmed") return "bg-green-600";
    if (status === "pending") return "bg-yellow-500";
    return "bg-blue-500"; // preparing
  };

  const getStatusLabel = (status: string) => {
    if (status === "paid" || status === "confirmed") return "PAID — New";
    if (status === "pending") return "PENDING";
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

  const hasActiveAlarm = orders.some(
    (o) => o.status === "pending" || o.status === "paid" || o.status === "confirmed"
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
              {/* Stop alarm button — only visible when alarm is active */}
              {hasActiveAlarm && audioEnabled && (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleStopAlarm}
                  className="gap-2 text-base h-12"
                >
                  <BellOff className="h-5 w-5" />
                  Silence Alarm
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
        {!audioEnabled && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="text-3xl">🔊</div>
              <div>
                <h3 className="font-semibold text-base">Audio Alerts Disabled</h3>
                <p className="text-sm text-muted-foreground">
                  Tap anywhere on the page to enable order notification sounds
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
                className="border-4 hover:shadow-2xl transition-shadow flex flex-col"
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
                    {order.status === "pending" && (
                      <Button
                        onClick={() => updateStatus(order.id, "preparing")}
                        className="w-full text-2xl md:text-3xl font-semibold h-16 md:h-20"
                      >
                        Start Preparing
                      </Button>
                    )}
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
