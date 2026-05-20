import { useEffect, useState, useRef } from "react";
import { SEO } from "@/components/SEO";
import { useSearchParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Home, Phone, Mail, MapPin, Loader2, Star, Circle, ChefHat, Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import type { OrderDetails } from "@/types/orders";

const MAX_RETRIES = 12;
const RETRY_DELAY_MS = 2000;

// Status pipeline — maps DB status to a display step index (0-based).
// 'pending' is step 0 (payment processing), 'paid'/'confirmed' = step 1, etc.
const STATUS_STEPS = [
  { key: "pending",   label: "Order Placed",    icon: Circle,      description: "Payment processing…" },
  { key: "paid",      label: "Confirmed",        icon: CheckCircle2, description: "Kitchen received your order" },
  { key: "preparing", label: "Being Prepared",   icon: ChefHat,     description: "Our kitchen is on it" },
  { key: "ready",     label: "Ready",            icon: Package,     description: "" },  // description set dynamically
  { key: "completed", label: "Done",             icon: CheckCircle2, description: "Enjoy your meal!" },
];

// 'confirmed' maps to the same step as 'paid'
function statusToStep(status: string): number {
  if (status === "confirmed") return 1;
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

const DELIVERY_READY_DESC = "Out for delivery";
const PICKUP_READY_DESC   = "Ready for pickup — come on in!";

const OrderSuccess = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const orderNumber = searchParams.get("order_number");

  // ── Initial fetch with retry loop (webhook lands 1-10s after redirect) ───────
  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }

    let cancelled = false;
    const poll = async (attempt: number): Promise<OrderDetails | null> => {
      if (cancelled) return null;
      setRetryAttempt(attempt);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.rpc as any)("get_order_by_number", {
          p_order_number: orderNumber,
        });
        if (Array.isArray(data) && data[0]) return data[0] as OrderDetails;
      } catch {}
      if (attempt < MAX_RETRIES && !cancelled) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        return poll(attempt + 1);
      }
      return null;
    };

    poll(0).then((data) => {
      if (cancelled) return;
      setOrderDetails(data);
      if (data?.status) setCurrentStatus(data.status);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [orderNumber]);

  // ── Real-time subscription — updates status stepper live ─────────────────────
  // Subscribes once orderNumber is known. Uses postgres_changes on the orders
  // table filtered by order_number so only this order's updates reach the client.
  // Falls back gracefully if the connection drops — the UI shows last known state.
  useEffect(() => {
    if (!orderNumber) return;

    const channel = supabase
      .channel(`order-tracker-${orderNumber}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string }).status;
          if (newStatus) setCurrentStatus(newStatus);
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [orderNumber]);

  // ── Google Ads conversion ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderDetails) return;
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-16961291835/purchase",
        value: orderDetails.total,
        currency: "USD",
        transaction_id: orderDetails.order_number,
      });
    }
  }, [orderDetails]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const stepIndex = statusToStep(currentStatus);
  const isDelivery = orderDetails?.order_type === "delivery";
  const isCompleted = currentStatus === "completed";
  const isReady = currentStatus === "ready";

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navigation />
        <div className="pt-24 sm:pt-28 md:pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">
              {retryAttempt > 0
                ? `Confirming your order… (${retryAttempt}/${MAX_RETRIES})`
                : "Loading order details…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found / webhook not yet fired ────────────────────────────────────────
  if (!orderNumber || !orderDetails) {
    return (
      <>
        <SEO title="Order Confirmed | Ricos Tacos Brooklyn" description="Your order has been placed." canonicalPath="/order-success" noindex={true} />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
          <Navigation />
          <div className="pt-24 sm:pt-28 md:pt-32 pb-16">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <h1 className="font-serif text-4xl font-bold mb-4">Payment Received</h1>
              <p className="text-xl text-muted-foreground mb-2">Your order is being confirmed</p>
              <p className="text-muted-foreground mb-4">
                Your card was charged and your order is on its way to our kitchen. You'll receive a confirmation email shortly.
              </p>
              <p className="text-muted-foreground mb-4">
                Questions? Call us at{" "}
                <a href="tel:7186334816" className="font-medium underline">(718) 633-4816</a>
              </p>
              {orderNumber && (
                <p className="text-sm text-muted-foreground mb-8 font-mono">Order: {orderNumber}</p>
              )}
              <Link to="/"><Button size="lg" className="gap-2"><Home className="h-5 w-5" />Back to Home</Button></Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Ready description depends on order type ────────────────────────────────
  const steps = STATUS_STEPS.map((s) => {
    if (s.key === "ready") {
      return { ...s, description: isDelivery ? DELIVERY_READY_DESC : PICKUP_READY_DESC };
    }
    return s;
  });

  return (
    <>
      <SEO title="Order Confirmed | Ricos Tacos Brooklyn" description="Your order has been placed." canonicalPath="/order-success" noindex={true} />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navigation />
        <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">

              {/* ── Success Header ───────────────────────────────────────── */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
                  ¡Gracias! <span className="text-primary">Order Confirmed</span>
                </h1>
                <p className="text-xl text-muted-foreground">Your payment was successful</p>
              </div>

              {/* ── Order number ─────────────────────────────────────────── */}
              <Card className="p-5 sm:p-8 mb-8 text-center bg-primary/5 border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                <p className="font-mono text-3xl font-bold text-primary break-all">{orderDetails.order_number}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  {isDelivery ? "🚗 Delivery Order" : "🏪 Pickup Order"}
                </p>
              </Card>

              {/* ── Live Status Tracker ──────────────────────────────────── */}
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-semibold">Live Order Status</h2>
                  <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Updating live
                  </span>
                </div>

                {/* Step list */}
                <div className="space-y-0">
                  {steps.map((step, i) => {
                    // Skip 'completed' for now unless the order is actually done
                    if (step.key === "completed" && !isCompleted) return null;

                    const done    = i < stepIndex;
                    const active  = i === stepIndex;
                    const pending = i > stepIndex;
                    const Icon    = step.icon;

                    return (
                      <div key={step.key} className="flex gap-4">
                        {/* Connector line + icon column */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex items-center justify-center w-9 h-9 rounded-full border-2 shrink-0 transition-colors duration-500 ${
                              done    ? "bg-green-600 border-green-600 text-white"
                            : active  ? "bg-primary border-primary text-primary-foreground"
                            : "bg-muted border-border text-muted-foreground"
                            }`}
                          >
                            {active && !isCompleted
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Icon className="h-4 w-4" />
                            }
                          </div>
                          {i < steps.filter((s) => s.key !== "completed" || isCompleted).length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[2rem] mt-1 mb-1 transition-colors duration-500 ${done ? "bg-green-600" : "bg-border"}`} />
                          )}
                        </div>

                        {/* Label + description */}
                        <div className={`pb-6 pt-1.5 transition-opacity duration-300 ${pending ? "opacity-40" : "opacity-100"}`}>
                          <p className={`font-semibold text-sm leading-tight ${active ? "text-primary" : done ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
                            {step.label}
                            {active && !isCompleted && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground animate-pulse">● now</span>
                            )}
                          </p>
                          {step.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ready / completed callout */}
                {(isReady || isCompleted) && (
                  <div className={`mt-2 rounded-lg px-4 py-3 text-sm font-medium ${
                    isDelivery
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                      : "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                  }`}>
                    {isDelivery
                      ? "🛵 Your order is on its way — the driver is en route."
                      : "✅ Your order is ready! Come pick it up at the counter."}
                  </div>
                )}
              </Card>

              {/* ── Customer Information ─────────────────────────────────── */}
              <Card className="p-6 mb-8">
                <h2 className="font-serif text-2xl font-semibold mb-6">Customer Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="text-muted-foreground">Name:</div>
                    <div className="font-medium">{orderDetails.customer_name}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="font-medium">{orderDetails.customer_phone}</div>
                  </div>
                  {orderDetails.customer_email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="font-medium">{orderDetails.customer_email}</div>
                    </div>
                  )}
                  {orderDetails.delivery_address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="font-medium">{orderDetails.delivery_address}</div>
                    </div>
                  )}
                  {orderDetails.notes && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Special Instructions:</p>
                      <p className="text-sm">{orderDetails.notes}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* ── Order Items ──────────────────────────────────────────── */}
              <Card className="p-6 mb-8">
                <h2 className="font-serif text-2xl font-semibold mb-6">Order Details</h2>
                <div className="space-y-4 mb-6">
                  {orderDetails.items.map((item, index: number) => (
                    <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold line-clamp-2">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${orderDetails.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${orderDetails.tax.toFixed(2)}</span>
                  </div>
                  {isDelivery && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>${(orderDetails.total - orderDetails.subtotal - orderDetails.tax).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                    <span>Total Paid</span>
                    <span className="text-primary">${orderDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              {/* ── Google Review CTA ────────────────────────────────────── */}
              <a
                href="https://search.google.com/local/writereview?placeid=ChIJ83ydO7RawokRnSEKeICgR1M"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full mb-4"
              >
                <Button variant="outline" size="lg" className="w-full gap-2 text-sm border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  Leave us a Google review!
                </Button>
              </a>

              {/* ── Action Buttons ───────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full gap-2">
                    <Home className="h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/order" className="flex-1">
                  <Button size="lg" className="w-full gap-2">Order Again</Button>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
