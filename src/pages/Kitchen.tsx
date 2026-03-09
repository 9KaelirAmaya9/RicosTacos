import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Package, ChefHat, Printer } from "lucide-react";
import { printReceipt } from "@/utils/printReceipt";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useOrderAlarm } from "@/hooks/useOrderAlarm";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { startAlarm, stopAlarm } = useOrderAlarm();
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const alarmMinimumUntilRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);

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
    const hasUnacceptedOrders = nextOrders.some((o) => o.status === "pending" || o.status === "paid");

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
      .in("status", ["pending", "preparing", "paid"])
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
        (order) => !knownOrderIdsRef.current.has(order.id) && (order.status === "pending" || order.status === "paid")
      );

      if (newUnacceptedOrders.length > 0) {
        alarmMinimumUntilRef.current = Math.max(alarmMinimumUntilRef.current, Date.now() + 10000);
        void startAlarm();
        toast.info(`🔔 ${newUnacceptedOrders.length} new order${newUnacceptedOrders.length > 1 ? "s" : ""} received`);
      }

      knownOrderIdsRef.current = nextIds;
      setOrders(nextOrders);
      syncAlarmState(nextOrders);
    }
    setLoading(false);
  }, [startAlarm, syncAlarmState]);

  const updateStatus = useCallback(async (orderId: string, newStatus: string) => {
    // Optimistically update local state first
    setOrders(prevOrders => {
      const updated = prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      // Remove order if it's no longer in pending/preparing/paid status
      return updated.filter(order => 
        order.status === "pending" || order.status === "preparing" || order.status === "paid"
      );
    });

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      
      toast.success("Order status updated");
      // Only refetch if we need to (order moved out of view)
      if (newStatus !== "pending" && newStatus !== "preparing" && newStatus !== "paid") {
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      // Refetch on error to restore correct state
      fetchOrders();
    }
  }, [fetchOrders]);

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
      toast.success('Printing receipt...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  };

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!audioEnabled) {
        try {
          // Try to resume AudioContext on any user interaction
          const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          await ctx.close();
          setAudioEnabled(true);
          console.log('✅ Audio initialized successfully');
        } catch (error) {
          console.warn('⚠️ Audio initialization failed:', error);
        }
      }
    };

    // Try to initialize audio on any click/touch
    const handleInteraction = () => {
      void initAudio();
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [audioEnabled]);

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `status=in.(pending,preparing,paid)`,
        },
        (payload) => {
          // Only refetch on insert or update that affects our filter
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
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
    return status === "pending" ? "bg-yellow-500" : "bg-blue-500";
  };

  const getTimeElapsed = useCallback((createdAt: string) => {
    const minutes = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / 60000
    );
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
  }, []);

  return (
    <div className="min-h-screen bg-background">
        {loading && (
          <div className="max-w-7xl mx-auto px-6 pt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <ChefHat className="h-4 w-4 animate-pulse text-primary" />
            Loading kitchen orders...
          </div>
        )}

        {/* Sticky Header - Tablet Optimized */}
        <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <ChefHat className="h-12 w-12 md:h-16 md:w-16 text-primary shrink-0" />
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">Kitchen Display</h1>
                  <p className="text-xl md:text-2xl text-muted-foreground mt-2">
                    {orders.length} active {orders.length === 1 ? "order" : "orders"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base md:text-lg text-muted-foreground">Auto-refreshing</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
          {!audioEnabled && (
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🔊</div>
                  <div>
                    <h3 className="font-semibold text-lg">Audio Alerts Disabled</h3>
                    <p className="text-sm text-muted-foreground">Click anywhere on the page to enable order notification sounds</p>
                  </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="border-4 hover:shadow-2xl transition-shadow flex flex-col"
                >
                  <CardHeader className={`${getStatusColor(order.status)} text-white p-6 md:p-8`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-5xl md:text-6xl font-bold mb-2">
                          {order.order_number.split("-")[2]}
                        </CardTitle>
                        <p className="text-lg md:text-xl opacity-90 flex items-center gap-2">
                          <Clock className="h-6 w-6 md:h-7 md:w-7" />
                          {getTimeElapsed(order.created_at)} ago
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xl md:text-2xl px-4 md:px-6 py-2 md:py-3 font-semibold bg-white/20"
                      >
                        {order.order_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <p className="text-lg md:text-xl text-muted-foreground mb-2">Customer</p>
                      <p className="font-semibold text-2xl md:text-3xl break-words">{order.customer_name}</p>
                    </div>

                    <div className="mb-8 flex-1">
                      <p className="text-lg md:text-xl text-muted-foreground mb-4 font-semibold">
                        Items:
                      </p>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-muted/50 p-4 md:p-5 rounded-xl gap-3"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="font-bold text-2xl md:text-3xl bg-primary text-primary-foreground rounded-full h-12 w-12 md:h-14 md:w-14 flex items-center justify-center shrink-0">
                                {item.quantity}
                              </span>
                              <span className="font-medium text-xl md:text-2xl break-words">{item.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 mt-auto">
                      {order.status === "pending" && (
                        <Button
                          onClick={() => updateStatus(order.id, "preparing")}
                          className="w-full text-2xl md:text-3xl font-semibold h-16 md:h-20"
                        >
                          Start Preparing
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
                        className="w-full gap-3 text-xl md:text-2xl h-14 md:h-16"
                      >
                        <Printer className="h-6 w-6 md:h-7 md:w-7" />
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
