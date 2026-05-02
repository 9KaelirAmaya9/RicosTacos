import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShoppingCart, ArrowRight, Plus, Minus, Trash2, CreditCard, Loader2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import SecurePaymentModal from "@/components/checkout/SecurePaymentModal";
import { validateDeliveryAddress } from "@/utils/deliveryValidation";
import { validateDeliveryAddressGoogle } from "@/utils/googleMapsValidation";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";
import { TAX_RATE, DELIVERY_FEE, MIN_ORDER } from "@/config/pricing";
import { captureException } from "@/utils/sentry";

const CUSTOMER_INFO_KEY = 'ricos-tacos-customer-info';
const PENDING_CHECKOUT_KEY = 'ricos-tacos-pending-checkout';

// ─── Shared totals helper ────────────────────────────────────────────────────
// Single source of truth for all price calculations used in the UI summary,
// coupon validation, and the order-creation / payment-intent steps.
const calculateTotals = (
  cartTotal: number,
  discountAmount: number,
  currentOrderType: string
) => {
  const subtotalAfterDiscount = Math.max(0, cartTotal - discountAmount);
  const tax = subtotalAfterDiscount * TAX_RATE; // NYC sales tax: 8.875%
  const deliveryFee = currentOrderType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotalAfterDiscount + tax + deliveryFee;
  return { subtotalAfterDiscount, tax, deliveryFee, total };
};

const Cart = () => {
  const { t } = useLanguage();
  const { cart, orderType, setOrderType, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount, cartLoadError, reloadCart } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutPublishableKey, setCheckoutPublishableKey] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [checkoutAmounts, setCheckoutAmounts] = useState<{ subtotal: number; tax: number; deliveryFee: number; total: number } | null>(null);
  // Persists across retries within the same checkout flow so the edge function
  // can use it as a stable idempotency key. Cleared on successful payment so
  // subsequent orders in the same session get a fresh key.
  const checkoutSessionIdRef = useRef<string | null>(null);
  const hasWarmedUpRef = useRef(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; description?: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ place_id: string; formatted_address: string } | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);
  const [sessionExpiredError, setSessionExpiredError] = useState(false);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  useEffect(() => {
    // Check auth status - store the user object so checkout never needs to call any auth API
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user?.email) {
        setCustomerInfo(prev => ({ ...prev, email: session.user!.email! }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user?.email) {
        setCustomerInfo(prev => ({ ...prev, email: session.user!.email! }));
      }
    });

    const success = searchParams.get("success");
    const orderNumber = searchParams.get("order_number");

    if (success === "true" && orderNumber) {
      // Order status is already updated by SecurePaymentModal or webhook
      // Just show success and redirect
      toast.success(`Payment successful! Order #${orderNumber} is confirmed.`);
      clearCart();
      // Clean up URL parameters and redirect to success page
      window.history.replaceState({}, '', '/cart');
      navigate(`/order-success?order_number=${encodeURIComponent(orderNumber)}`);
    } else if (searchParams.get("canceled") === "true") {
      toast.error("Payment was canceled. Your cart items are still here.");
      window.history.replaceState({}, '', '/cart');
    }

    return () => subscription.unsubscribe();
  }, [searchParams, clearCart, navigate]);

  // Pre-warm the edge function as soon as the cart has items so Deno cold-start
  // time doesn't add latency when the user clicks "Proceed to Checkout".
  useEffect(() => {
    if (cart.length > 0 && !hasWarmedUpRef.current) {
      hasWarmedUpRef.current = true;
      // Send a HEAD request to wake the Deno worker; HEAD is safe and won't
      // cause CORS issues the way OPTIONS does on some edge function configs.
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (url) fetch(`${url}/functions/v1/create-payment-intent`, { method: 'HEAD' }).catch(() => {});
    }
  }, [cart.length]);

  // Restore persisted customer info and resume any interrupted checkout on mount.
  useEffect(() => {
    // Restore customer info from last session
    try {
      const saved = localStorage.getItem(CUSTOMER_INFO_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomerInfo(prev => ({
          name: parsed.name || prev.name,
          phone: parsed.phone || prev.phone,
          email: prev.email || parsed.email, // authenticated email takes priority
          address: parsed.address || prev.address,
          notes: parsed.notes || prev.notes,
        }));
      }
    } catch {}

    // Resume a pending checkout (e.g. modal closed mid-payment)
    try {
      const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.expiresAt > Date.now() && p.clientSecret && p.orderNumber) {
          checkoutSessionIdRef.current = p.checkoutSessionId;
          setCurrentOrderNumber(p.orderNumber);
          setCheckoutAmounts(p.amounts);
          setCheckoutClientSecret(p.clientSecret);
          setCheckoutPublishableKey(p.publishableKey);
          toast.info('You have an incomplete payment.', {
            duration: 10000,
            action: { label: 'Resume Payment', onClick: () => setShowCheckout(true) },
          });
        } else {
          localStorage.removeItem(PENDING_CHECKOUT_KEY);
        }
      }
    } catch {
      localStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist customer info so the form survives a page refresh
  useEffect(() => {
    if (customerInfo.name || customerInfo.phone || customerInfo.email) {
      localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(customerInfo));
    }
  }, [customerInfo]);

  // ─── Coupon handler (extracted from inline JSX) ──────────────────────────
  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const discountAmount = appliedCoupon?.discount_amount || 0;
      const { total: orderAmount } = calculateTotals(cartTotal, discountAmount, orderType);

      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim(), orderAmount }
      });

      if (error || !data?.valid) {
        toast.error(data?.error || 'Invalid coupon code');
        return;
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discount_amount: data.coupon.discount_amount,
        description: data.coupon.description,
      });
      toast.success(`Coupon "${data.coupon.code}" applied! ${data.coupon.description || ''}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  }, [couponCode, cartTotal, orderType, appliedCoupon]);

  const handlePlaceOrder = useCallback(async () => {
    const isDev = import.meta.env.DEV;

    if (isDev) {
      console.log("╔════════════════════════════════════════════════════════════════╗");
      console.log("║          CHECKOUT PROCESS STARTED                              ║");
      console.log("╚════════════════════════════════════════════════════════════════╝");
      console.log("⏰ Start Timestamp:", new Date().toISOString());
      console.log("📊 Initial State:", {
        cartLength: cart.length,
        isProcessing,
        orderType,
        hasAppliedCoupon: !!appliedCoupon,
      });
      console.log("👤 Customer Information:", {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        hasAddress: !!customerInfo.address,
        hasNotes: !!customerInfo.notes,
      });
    }

    // Reset error states at the start of each attempt
    setPaymentTimedOut(false);
    setSessionExpiredError(false);
    setDeliveryError(null);

    if (cart.length === 0) {
      if (isDev) console.error("Cart is empty!");
      toast.error(t("order.cartEmpty"));
      return;
    }

    if (cartTotal < MIN_ORDER) {
      toast.error(`Minimum order is $${MIN_ORDER.toFixed(2)}. Add $${(MIN_ORDER - cartTotal).toFixed(2)} more to continue.`, { duration: 5000 });
      return;
    }

    if (isProcessing) {
      if (isDev) console.warn("Already processing, ignoring duplicate call");
      return;
    }

    // Lock immediately — before any async work — so a second tap while the first
    // is still in-flight is rejected by the guard above. Previously this was set
    // later in the flow, allowing a fast double-tap to create two payment intents.
    setIsProcessing(true);

    // Generate a stable session ID for this checkout flow once, on first attempt.
    // Retries (e.g. after a timeout) reuse the same ID so the edge function's
    // idempotency key is identical and Stripe returns the existing payment intent
    // rather than creating a duplicate.
    if (!checkoutSessionIdRef.current) {
      checkoutSessionIdRef.current = crypto.randomUUID();
    }
    const checkoutSessionId = checkoutSessionIdRef.current;

    // Input validation schema - name, phone, and email are REQUIRED
    const orderSchema = z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
      phone: z.string().trim().max(20, "Phone number is too long").refine(v => v.replace(/\D/g, '').length >= 10, { message: "Please enter a valid phone number (at least 10 digits)" }),
      email: z.string().trim().email("Please enter a valid email address").max(255, "Email is too long"),
      address: z.string().trim().max(500, "Address is too long").optional().or(z.literal("")),
      notes: z.string().trim().max(1000, "Notes are too long").optional().or(z.literal("")),
    });

    if (isDev) console.log("Validating customer info:", customerInfo);
    const validation = orderSchema.safeParse(customerInfo);

    if (!validation.success) {
      if (isDev) console.error("Validation failed:", validation.error.errors);
      const firstError = validation.error.errors[0];
      toast.error(firstError.message, { duration: 5000 });
      document.getElementById('name')?.focus();
      return;
    }

    if (isDev) console.log("Validation passed:", validation.data);

    // For delivery, check both customerInfo.address and selectedPlace.formatted_address
    if (orderType === "delivery" && !customerInfo.address.trim() && !selectedPlace?.formatted_address) {
      toast.error("Please provide a delivery address");
      return;
    }

    // Determine final delivery address - use selectedPlace if available, otherwise customerInfo.address
    const finalDeliveryAddress = orderType === "delivery"
      ? (selectedPlace?.formatted_address || customerInfo.address || "")
      : "";

    // If delivery and we have selectedPlace but no address in customerInfo, update state for UI
    if (orderType === "delivery" && selectedPlace?.formatted_address && !customerInfo.address.trim()) {
      setCustomerInfo(prev => ({ ...prev, address: selectedPlace.formatted_address }));
    }

    // Validate delivery zone — BLOCKING. Any result other than explicit isValid:true is rejected.
    // No bypass for timeouts or service errors — an unverifiable address is an unacceptable address.
    if (orderType === "delivery") {
      let deliveryBlocked = false;

      if (selectedPlace?.place_id) {
        if (isDev) console.log("🔍 Cart: Validating delivery address with Google Maps (blocking)");
        toast.loading("Checking delivery zone…", { id: "delivery-check" });

        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("TIMEOUT")), 15000)
          );
          const dv = await Promise.race([
            validateDeliveryAddressGoogle(selectedPlace.place_id, selectedPlace.formatted_address),
            timeoutPromise,
          ]);
          toast.dismiss("delivery-check");

          if (!dv.isValid) {
            toast.error(dv.message || "Sorry, we can't deliver to that address. Please switch to pickup.", {
              duration: 8000,
              action: { label: "Switch to Pickup", onClick: () => setOrderType("pickup") },
            });
            deliveryBlocked = true;
          } else {
            toast.success(`✓ Delivery zone confirmed — estimated ${dv.estimatedMinutes} min`, { duration: 4000 });
          }
        } catch (err: any) {
          toast.dismiss("delivery-check");
          if (err?.message === "TIMEOUT") {
            console.warn("⚠️ Delivery validation timed out after 15s");
            toast.error("Address validation timed out. Please try again or call us at (718) 633-4816.", {
              duration: 10000,
            });
            setDeliveryError("Address check timed out. Please try again or switch to pickup.");
            deliveryBlocked = true;
            setIsProcessing(false);
            return;
          }
          console.warn("⚠️ Delivery validation error (blocking for safety):", err);
          toast.error("We couldn't verify your delivery address. Please try again or switch to pickup.", {
            duration: 8000,
            action: { label: "Switch to Pickup", onClick: () => setOrderType("pickup") },
          });
          deliveryBlocked = true;
        }
      } else if (customerInfo.address.trim()) {
        toast.loading("Checking delivery zone…", { id: "delivery-check" });
        try {
          const dv = await validateDeliveryAddress(customerInfo.address);
          toast.dismiss("delivery-check");

          if (!dv.isValid) {
            toast.error(dv.message || "Sorry, we can't deliver to that address. Please switch to pickup.", {
              duration: 8000,
              action: { label: "Switch to Pickup", onClick: () => setOrderType("pickup") },
            });
            deliveryBlocked = true;
          }
        } catch (err: any) {
          toast.dismiss("delivery-check");
          console.warn("⚠️ Fallback delivery validation error (blocking for safety):", err);
          toast.error("We couldn't verify your delivery address. Please try again or switch to pickup.", {
            duration: 8000,
            action: { label: "Switch to Pickup", onClick: () => setOrderType("pickup") },
          });
          deliveryBlocked = true;
        }
      }

      if (deliveryBlocked) return;
    } else {
      if (isDev) console.log("Pickup order - skipping delivery validation");
    }

    // Declared OUTSIDE try so it's accessible in catch/finally
    const overallStartTime = Date.now();

    try {
      if (isDev) {
        console.log("\n┌─────────────────────────────────────────────────────────────┐");
        console.log("│ STEP 1: CALCULATING TOTALS                                  │");
        console.log("└─────────────────────────────────────────────────────────────┘");
      }

      const discountAmount = appliedCoupon?.discount_amount || 0;
      const { subtotalAfterDiscount, tax, deliveryFee, total } = calculateTotals(cartTotal, discountAmount, orderType);

      if (isDev) {
        console.log("💰 Calculated Totals:", {
          subtotal: `$${cartTotal.toFixed(2)}`,
          discount: `$${discountAmount.toFixed(2)}`,
          subtotalAfterDiscount: `$${subtotalAfterDiscount.toFixed(2)}`,
          tax: `$${tax.toFixed(2)}`,
          deliveryFee: `$${deliveryFee.toFixed(2)}`,
          total: `$${total.toFixed(2)}`,
        });
      }

      // STEP 2: Use the user already stored in state from onAuthStateChange.
      // We NEVER call getSession() or getUser() here because both make network
      // calls to Supabase auth when a session exists, and those calls hang
      // indefinitely under the fetchWithTimeout wrapper in client.ts.
      // The currentUser state is always up-to-date from onAuthStateChange.
      const session = currentUser ? { user: currentUser } : null;
      if (isDev) {
        console.log("🔐 User from state:", {
          isAuthenticated: !!currentUser,
          userId: currentUser?.id || 'guest',
          userEmail: currentUser?.email || 'none',
        });
      }

      // STEP 3: Create payment intent FIRST before writing anything to the DB.
      // Previously the order was inserted before the payment intent was created,
      // which left orphaned unpaid orders whenever the edge function timed out
      // (cold start + Stripe API call regularly exceeded the old 15s limit).
      // By creating the payment intent first, a timeout here leaves nothing in
      // the DB — no orphan, no cleanup needed, user can simply retry.
      if (isDev) {
        console.log("\n┌─────────────────────────────────────────────────────────────┐");
        console.log("│ STEP 3: CREATING PAYMENT INTENT                             │");
        console.log("└─────────────────────────────────────────────────────────────┘");
      }

      const paymentItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      if (isDev) {
        console.log("💳 Payment Configuration:", {
          itemsCount: paymentItems.length,
          orderType,
          totalAmount: `$${total.toFixed(2)}`,
          hasCoupon: !!appliedCoupon,
          discountAmount: `$${discountAmount.toFixed(2)}`,
        });
        console.log("🔄 Invoking payment intent creation...");
      }

      const paymentStartTime = Date.now();

      // Use raw fetch() to call the edge function — bypasses GoTrue/JWT refresh entirely.
      // supabaseAnon.functions.invoke() still calls auth.getSession() internally which
      // hangs 45s when the Supabase auth server is slow. Raw fetch has no such dependency.
      const paymentIntentPromise = (async () => {
        const _SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '').trim();
        const _SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
        try {
          const response = await fetch(`${_SUPABASE_URL}/functions/v1/create-payment-intent`, {
            method: 'POST',
            headers: {
              'apikey': _SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: paymentItems,
              orderType,
              customerInfo: validation.data,
              couponCode: appliedCoupon?.code || null,
              discountAmount,
              checkoutSessionId,
            }),
          });
          const json = await response.json();
          if (!response.ok) {
            return { data: null, error: { message: json?.error || `HTTP ${response.status}`, context: json } };
          }
          return { data: json, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err?.message || 'Network error calling payment service' } };
        }
      })();

      const paymentHeartbeat = isDev ? setInterval(() => {
        console.log(`⏳ Payment intent creation in progress... (${Date.now() - paymentStartTime}ms elapsed)`);
      }, 2000) : null;

      // 45s timeout — cold start (up to 10s) + Stripe API (1-5s) fits well within this.
      const paymentTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          if (paymentHeartbeat) clearInterval(paymentHeartbeat);
          reject(new Error(`Payment intent creation timed out after 45 seconds (elapsed: ${Date.now() - paymentStartTime}ms)`));
        }, 45000)
      );

      const { data: piData, error: piError } = await Promise.race([
        paymentIntentPromise,
        paymentTimeoutPromise
      ]) as any;

      if (paymentHeartbeat) clearInterval(paymentHeartbeat);

      if (piError) {
        const edgeFnError = (piError as any).context?.error || (piError as any).context?.message || JSON.stringify((piError as any).context);
        if (isDev) {
          console.error("❌ Payment intent error:", {
            message: piError.message,
            context: (piError as any).context,
            edgeFnError,
            elapsed: `${Date.now() - paymentStartTime}ms`,
          });
        }

        // Stripe idempotency conflict: the checkoutSessionId was used with different
        // parameters in a previous attempt (e.g. during the old→new code transition).
        // Reset the session ID so the next attempt generates a fresh Stripe PI.
        const errMsg = edgeFnError || piError.message || '';
        if (errMsg.includes('idempotent') || errMsg.includes('same parameters')) {
          checkoutSessionIdRef.current = null;
          localStorage.removeItem(PENDING_CHECKOUT_KEY);
          const idempotencyErr = new Error('A previous checkout attempt conflicted. Please try again — a fresh payment session has been started.');
          captureException(idempotencyErr, {
            context: 'payment_intent_creation',
            orderType: orderType,
            cartTotal: cartTotal,
          });
          throw idempotencyErr;
        }

        const piErr = new Error(`Payment error: ${edgeFnError || piError.message || piError.error || "Failed to create payment intent"}`);
        captureException(piErr, {
          context: 'payment_intent_creation',
          orderType: orderType,
          cartTotal: cartTotal,
        });
        throw piErr;
      }

      if (!piData?.clientSecret || !piData?.publishableKey || !piData?.orderNumber) {
        if (isDev) console.error("❌ Payment intent response missing data:", piData);
        throw new Error('Payment service returned invalid data. Please try again.');
      }

      // Use server-generated order number (collision-proof via crypto.randomUUID)
      const orderNumber = piData.orderNumber as string;
      // Use server-calculated amounts as the single source of truth — these are
      // the exact values charged to Stripe, so DB and display match the charge.
      const serverAmounts = piData.amounts as { subtotal: number; tax: number; deliveryFee: number; total: number };

      const paymentElapsed = Date.now() - paymentStartTime;
      if (isDev) console.log(`✅ Payment intent created successfully! (${paymentElapsed}ms) Order: ${orderNumber}`);

      // STEP 4: Now write the order to the DB. Payment intent already exists in
      // Stripe, so if this insert fails the user sees an error and can retry —
      // the existing payment intent will be reused via idempotency.
      if (isDev) {
        console.log("\n┌─────────────────────────────────────────────────────────────┐");
        console.log("│ STEP 4: CREATING ORDER                                      │");
        console.log("└─────────────────────────────────────────────────────────────┘");
        console.log("📝 Order Configuration:", {
          orderNumber,
          userType: session?.user?.id ? "authenticated" : "guest",
          userId: session?.user?.id || null,
          customerName: validation.data.name,
          customerEmail: validation.data.email,
          customerPhone: validation.data.phone,
          orderType,
          deliveryAddress: orderType === "delivery" ? finalDeliveryAddress : null,
          itemsCount: cart.length,
          subtotal: `$${cartTotal.toFixed(2)}`,
          tax: `$${tax.toFixed(2)}`,
          total: `$${total.toFixed(2)}`,
          hasNotes: !!validation.data.notes,
        });
        console.log("💾 Inserting order into database...");
      }

      const orderStartTime = Date.now();

      const orderHeartbeat = isDev ? setInterval(() => {
        console.log(`⏳ Order creation in progress... (${Date.now() - orderStartTime}ms elapsed)`);
      }, 2000) : null;

      // Prepare order data
      const orderDataToInsert = {
        order_number: orderNumber,
        stripe_payment_intent_id: piData.paymentIntentId || null,
        user_id: session?.user?.id || null,
        customer_name: validation.data.name,
        customer_email: validation.data.email || null,
        customer_phone: validation.data.phone,
        order_type: orderType,
        delivery_address: orderType === "delivery" ? finalDeliveryAddress : null,
        items: cart as any,
        subtotal: serverAmounts.subtotal,
        tax: serverAmounts.tax,
        total: serverAmounts.total,
        notes: validation.data.notes || null,
        status: "pending",
        // Preserve coupon data so admin reports and receipts show the correct discount
        coupon_code: appliedCoupon?.code || null,
        discount_amount: appliedCoupon?.discount_amount || null,
      };

      if (isDev) {
        console.log("💾 Order data prepared:", {
          order_number: orderDataToInsert.order_number,
          items_count: cart.length,
          total: orderDataToInsert.total,
          order_type: orderDataToInsert.order_type
        });
      }

      // Create insert promise using a raw fetch() call directly to the Supabase REST API.
      //
      // We do NOT use the main supabase client here because when a user is authenticated,
      // the Supabase JS client tries to refresh the JWT before making any DB call.
      // If the auth server is slow or unreachable, this refresh hangs indefinitely,
      // blocking the INSERT. The order never reaches the database.
      //
      // A raw fetch() bypasses the GoTrueClient entirely — no JWT refresh, no auth state,
      // no second GoTrueClient instance. The anon key is used directly, which is allowed
      // by the RLS INSERT policy on the orders table. The user_id is passed explicitly.
      const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '').trim();
      const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

      const orderInsertPromise = (async () => {
        try {
          if (isDev) console.log("🔄 Starting database insert (raw fetch, no JWT refresh)...");

          const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(orderDataToInsert),
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            if (isDev) console.error("❌ Insert HTTP error:", response.status, errBody);
            return {
              data: null,
              error: {
                message: errBody?.message || errBody?.error || `HTTP ${response.status}`,
                code: errBody?.code || String(response.status),
                httpStatus: response.status,
                details: errBody,
              }
            };
          }

          const data = await response.json();
          const inserted = Array.isArray(data) ? data[0] : data;
          if (isDev) console.log("📦 Insert completed successfully");
          return { data: inserted, error: null };
        } catch (insertError: any) {
          if (isDev) {
            console.error("❌ Insert exception:", {
              message: insertError?.message,
              name: insertError?.name
            });
          }
          return {
            data: null,
            error: {
              message: insertError?.message || "Database insert failed",
              details: insertError
            }
          };
        }
      })();

      const orderTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          if (orderHeartbeat) clearInterval(orderHeartbeat);
          reject(new Error(`Order creation timed out after 30 seconds (elapsed: ${Date.now() - orderStartTime}ms). Please check your connection and try again.`));
        }, 30000)
      );

      const result = await Promise.race([orderInsertPromise, orderTimeoutPromise]) as any;
      if (orderHeartbeat) clearInterval(orderHeartbeat);

      const orderError = result?.error;

      if (orderError) {
        const elapsed = Date.now() - orderStartTime;
        if (isDev) {
          console.error("❌ Order creation error:", orderError);
          console.error("❌ Error message:", orderError?.message);
          console.error("❌ Error code:", orderError?.code);
          console.error(`❌ Order creation took ${elapsed}ms before failing`);
        }

        // 23505 = unique_violation on stripe_payment_intent_id.
        // This means the order was already created in a previous attempt that
        // succeeded DB-side but failed network-side before the client saw the
        // response. The same payment intent is still valid (Stripe idempotency
        // key ensures we got back the same clientSecret). Recover silently by
        // fetching the existing order and opening the payment modal.
        if (orderError?.code === '23505') {
          if (isDev) console.log("ℹ️ Duplicate PI detected — fetching existing order to resume");
          try {
            const existingResp = await fetch(
              `${SUPABASE_URL}/rest/v1/orders?stripe_payment_intent_id=eq.${encodeURIComponent(piData.paymentIntentId)}&select=order_number&limit=1`,
              {
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
              }
            );
            if (existingResp.ok) {
              const rows = await existingResp.json();
              const existingOrderNumber = rows?.[0]?.order_number;
              if (existingOrderNumber) {
                if (isDev) console.log("✅ Resuming existing order:", existingOrderNumber);
                setCurrentOrderNumber(existingOrderNumber);
                setCheckoutAmounts(serverAmounts);
                setCheckoutClientSecret(piData.clientSecret as string);
                setCheckoutPublishableKey(piData.publishableKey as string);
                setShowCheckout(true);
                setIsProcessing(false);
                return;
              }
            }
          } catch (resumeErr) {
            if (isDev) console.warn("Could not fetch existing order — falling through to error", resumeErr);
          }
          // Could not recover — tell user and let them retry fresh
          throw new Error("Your session was already started. Please try again.");
        }

        let errorMessage = "Failed to create order. Please try again.";
        if (orderError?.code === '23503') {
          errorMessage = "Invalid order data. Please check your information and try again.";
        } else if (
          orderError?.code === '42501' ||
          orderError?.code === '401' ||
          orderError?.code === '403' ||
          orderError?.httpStatus === 401 ||
          orderError?.httpStatus === 403
        ) {
          setSessionExpiredError(true);
          setIsProcessing(false);
          return;
        } else if (orderError?.message) {
          errorMessage = `Failed to create order: ${orderError.message}`;
        } else if (typeof orderError === 'string') {
          errorMessage = `Failed to create order: ${orderError}`;
        }

        const orderErr = new Error(errorMessage);
        captureException(orderErr, {
          context: 'order_creation',
          orderType: orderType,
          cartTotal: cartTotal,
        });
        throw orderErr;
      }

      const orderElapsed = Date.now() - orderStartTime;
      if (isDev) {
        console.log(`✅ Order created successfully! (${orderElapsed}ms)`);
        console.log("\n╔════════════════════════════════════════════════════════════════╗");
        console.log("║       CHECKOUT PROCESS COMPLETED SUCCESSFULLY                  ║");
        console.log("╚════════════════════════════════════════════════════════════════╝");
        console.log("⏱️  TOTAL RUNTIME:", `${Date.now() - overallStartTime}ms`);
        console.log("├─ Step 3 (Payment Intent): " + paymentElapsed + "ms");
        console.log("└─ Step 4 (Order Creation): " + orderElapsed + "ms");
        console.log("🎯 Next Action: Opening payment modal for order:", orderNumber);
      }

      setCurrentOrderNumber(orderNumber);
      setCheckoutAmounts(serverAmounts);
      setCheckoutClientSecret(piData.clientSecret as string);
      setCheckoutPublishableKey(piData.publishableKey as string);
      // Persist so the user can resume if the modal closes unexpectedly
      localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({
        clientSecret: piData.clientSecret,
        publishableKey: piData.publishableKey,
        orderNumber,
        checkoutSessionId,
        amounts: serverAmounts,
        expiresAt: Date.now() + 23 * 60 * 60 * 1000, // Stripe PI expires in 24h
      }));
      setShowCheckout(true);
      setIsProcessing(false);
      return;

    } catch (error: any) {
      if (isDev) {
        console.error("\n╔════════════════════════════════════════════════════════════════╗");
        console.error("║             CHECKOUT PROCESS FAILED                            ║");
        console.error("╚════════════════════════════════════════════════════════════════╝");
        console.error("⏱️  TOTAL RUNTIME:", `${Date.now() - overallStartTime}ms`);
        console.error("❌ Error:", error?.message);
      }

      let errorMessage = "Failed to process order. Please try again.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      if (errorMessage.includes("timed out")) {
        if (errorMessage.includes("Order creation")) {
          errorMessage = "Order creation is taking longer than expected. Please check your connection and try again.";
        } else if (errorMessage.includes("Payment intent")) {
          captureException(error instanceof Error ? error : new Error(String(error)), {
            context: 'payment_timeout',
            orderType: orderType,
            cartTotal: cartTotal,
          });
          setPaymentTimedOut(true);
          setIsProcessing(false);
          return;
        } else {
          errorMessage = "Request timed out. Please check your internet connection and try again.";
        }
      }

      toast.error(errorMessage, {
        duration: 8000,
        description: isDev ? "Check the browser console (F12) for more details" : undefined,
      });
    } finally {
      // Always reset processing state, even if there was an error
      if (isDev) {
        console.log("\n🔄 Cleanup: resetting processing state. Final time:", `${Date.now() - overallStartTime}ms`);
      }
      setIsProcessing(false);
    }
  }, [cart, customerInfo, orderType, appliedCoupon, currentUser, selectedPlace, navigate, clearCart, t, cartTotal, isProcessing]);

  // Derived totals for the order summary UI — uses the same helper as handlePlaceOrder
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const { tax: uiTax, deliveryFee: uiDeliveryFee, total: uiTotal } = calculateTotals(cartTotal, discountAmount, orderType);

  return (
    <>
    <SEO
      title="Your Cart | Ricos Tacos Brooklyn"
      description="Review your order and checkout."
      canonicalPath="/cart"
      noindex={true}
    />
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />

      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-8 sm:mb-12 text-center">
              {t("cart.title")} <span className="text-primary">{t("cart.titleHighlight")}</span>
            </h1>

            {cart.length === 0 ? (
              cartLoadError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    We couldn't load your cart. Check your connection and{" "}
                    <button onClick={reloadCart} className="underline font-medium">try again</button>.
                  </AlertDescription>
                </Alert>
              ) : (
              <Card className="p-12 text-center">
                <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-primary/10" />
                  <ShoppingCart className="h-12 w-12 text-primary/40 relative z-10" />
                </div>
                <h2 className="font-serif text-3xl font-semibold mb-4">
                  {t("cart.empty")}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t("cart.emptyDesc")}
                </p>
                <Link to="/order">
                  <Button size="lg" className="gap-2">
                    {t("cart.browseMenu")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </Card>
              )
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Checkout Form — rendered first in DOM for mobile (appears on top on small screens) */}
                <div className="lg:col-span-1 lg:order-last order-first">
                  <Card className="p-4 sm:p-6 lg:sticky lg:top-32">
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Checkout</h2>

                    <Tabs value={orderType} onValueChange={(v) => { setOrderType(v as "pickup" | "delivery"); setDeliveryError(null); }} className="mb-6">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pickup">{t("order.pickup")}</TabsTrigger>
                        <TabsTrigger value="delivery">{t("order.delivery")}</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-4 mb-6">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                          placeholder="Your full name"
                          required
                          autoComplete="name"
                          className={touched.name && customerInfo.name.length < 2 ? "border-destructive" : ""}
                        />
                        {touched.name && customerInfo.name.length < 2 && (
                          <p className="text-xs text-destructive mt-1">Name must be at least 2 characters</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                          placeholder="(555) 123-4567"
                          required
                          autoComplete="tel"
                          inputMode="tel"
                          className={touched.phone && customerInfo.phone.length < 10 ? "border-destructive" : ""}
                        />
                        {touched.phone && customerInfo.phone.length < 10 && (
                          <p className="text-xs text-destructive mt-1">Phone must be at least 10 digits</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                          placeholder="your@email.com (for order confirmation)"
                          required
                          autoComplete="email"
                          inputMode="email"
                          className={touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim()) ? "border-destructive" : ""}
                        />
                        {touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim()) && (
                          <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
                        )}
                      </div>

                      {orderType === "delivery" && (
                        <div>
                          <GooglePlacesAutocomplete
                            id="address"
                            label="Delivery Address"
                            value={customerInfo.address}
                            onChange={(address, place) => {
                              setCustomerInfo({ ...customerInfo, address });
                              setDeliveryError(null);
                              if (place) {
                                setSelectedPlace({
                                  place_id: place.place_id,
                                  formatted_address: place.formatted_address
                                });
                              } else {
                                setSelectedPlace(null);
                              }
                            }}
                            onPlaceSelect={(place) => {
                              setSelectedPlace({
                                place_id: place.place_id,
                                formatted_address: place.formatted_address
                              });
                              setCustomerInfo({ ...customerInfo, address: place.formatted_address });
                            }}
                            placeholder="Start typing your address..."
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            We deliver within a 20-minute drive from our restaurant. Select an address from the suggestions for accurate delivery validation.
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="notes">Special Instructions</Label>
                        <Textarea
                          id="notes"
                          value={customerInfo.notes}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                          placeholder="Any special requests..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Coupon Code Input */}
                      <div className="space-y-2">
                        <Label htmlFor="coupon">Promo Code (Optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="coupon"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            disabled={!!appliedCoupon || isValidatingCoupon}
                            className="flex-1"
                          />
                          {appliedCoupon ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponCode("");
                              }}
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleApplyCoupon}
                              disabled={isValidatingCoupon || !couponCode.trim()}
                            >
                              {isValidatingCoupon ? "..." : "Apply"}
                            </Button>
                          )}
                        </div>
                        {appliedCoupon && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            ✓ {appliedCoupon.code} applied: -${appliedCoupon.discount_amount.toFixed(2)}
                            {appliedCoupon.description && ` (${appliedCoupon.description})`}
                          </p>
                        )}
                      </div>

                      {/* Order Summary — aria-live so screen readers announce total changes */}
                      <div
                        className="space-y-2 py-4 border-t border-border"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                            <span>Discount ({appliedCoupon.code})</span>
                            <span>-${appliedCoupon.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Tax (NYC 8.875%)</span>
                          <span>${uiTax.toFixed(2)}</span>
                        </div>
                        {orderType === "delivery" && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            <span>${uiDeliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t border-border">
                          <span>{t("order.total")}</span>
                          <span className="text-primary">${uiTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={cart.length === 0 || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin pointer-events-none" />
                            <span className="pointer-events-none">Preparing your order…</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4 pointer-events-none" />
                            <span className="pointer-events-none">Proceed to Checkout</span>
                          </>
                        )}
                      </Button>

                      {deliveryError && (
                        <p className="text-sm text-destructive mt-2">{deliveryError}</p>
                      )}

                      {paymentTimedOut && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertDescription>
                            Payment is taking longer than expected. Your card has not been charged.{" "}
                            <button
                              onClick={() => { setPaymentTimedOut(false); handlePlaceOrder(); }}
                              className="underline font-medium"
                            >
                              Try again
                            </button>
                            {" "}or call us at{" "}
                            <a href="tel:7186334816" className="underline">(718) 633-4816</a>.
                          </AlertDescription>
                        </Alert>
                      )}

                      {sessionExpiredError && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertDescription>
                            Your session expired. Please{" "}
                            <a href="/signin" className="underline font-medium">sign in again</a>
                            {" "}— your cart is saved.
                          </AlertDescription>
                        </Alert>
                      )}

                      {checkoutClientSecret && checkoutPublishableKey && currentOrderNumber && checkoutAmounts && (
                        <SecurePaymentModal
                          open={showCheckout}
                          onOpenChange={setShowCheckout}
                          clientSecret={checkoutClientSecret}
                          publishableKey={checkoutPublishableKey}
                          orderNumber={currentOrderNumber}
                          customerInfo={customerInfo}
                          orderType={orderType}
                          amounts={checkoutAmounts}
                          cart={cart}
                          onSuccess={() => {
                            try {
                              clearCart();
                              checkoutSessionIdRef.current = null;
                              localStorage.removeItem(PENDING_CHECKOUT_KEY);
                              localStorage.removeItem(CUSTOMER_INFO_KEY);
                              setCustomerInfo({ name: "", phone: "", email: "", address: "", notes: "" });
                              setAppliedCoupon(null);
                              setCouponCode("");
                              setShowCheckout(false);
                              setCheckoutClientSecret(null);
                              setCheckoutPublishableKey(null);
                              setCheckoutAmounts(null);

                              if (currentOrderNumber) {
                                navigate(`/order-success?order_number=${encodeURIComponent(currentOrderNumber)}`);
                              } else {
                                console.warn('Order number missing, redirecting to success page without order number');
                                navigate('/order-success');
                              }
                            } catch (error) {
                              console.error('Error in onSuccess callback:', error);
                              if (currentOrderNumber) {
                                window.location.href = `/order-success?order_number=${encodeURIComponent(currentOrderNumber)}`;
                              } else {
                                window.location.href = '/order-success';
                              }
                            }
                          }}
                        />
                      )}

                      <p className="text-xs text-center text-muted-foreground">
                        {orderType === "delivery" ? t("order.deliveryNote") : t("order.pickupNote")}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Cart Items */}
                <div className="lg:col-span-2 lg:order-first order-last space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-2xl font-semibold">
                        {t("order.yourOrder")} ({cartCount} items)
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setClearAllOpen(true)}
                        aria-label="Clear all items from cart"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2 pointer-events-none" />
                        <span className="pointer-events-none">Clear All</span>
                      </Button>
                      <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear your entire cart?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove all {cart.length} item{cart.length !== 1 ? "s" : ""}. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => { clearCart(); setAppliedCoupon(null); setCouponCode(""); setClearAllOpen(false); }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Clear Cart
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <ul className="space-y-4">
                      {cart.map((item) => (
                        <li key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                          {/* Item image with fallback placeholder */}
                          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center${item.image ? ' hidden' : ''}`} aria-hidden="true">
                              <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${item.price.toFixed(2)} each
                            </p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              Subtotal: ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label={`Remove ${item.name} from cart`}
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4 pointer-events-none" />
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-11 w-11"
                                aria-label={`Decrease quantity of ${item.name}`}
                                disabled={item.quantity === 1}
                                onClick={() => {
                                  updateQuantity(item.id, -1);
                                  const announcer = document.getElementById('sr-announcer');
                                  if (announcer) announcer.textContent = `${item.name} quantity updated to ${item.quantity - 1}`;
                                }}
                              >
                                <Minus className="h-3 w-3 pointer-events-none" />
                              </Button>
                              <span className="w-8 text-center font-medium" aria-live="polite">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-11 w-11"
                                aria-label={`Increase quantity of ${item.name}`}
                                onClick={() => {
                                  updateQuantity(item.id, 1);
                                  const announcer = document.getElementById('sr-announcer');
                                  if (announcer) announcer.textContent = `${item.name} quantity updated to ${item.quantity + 1}`;
                                }}
                              >
                                <Plus className="h-3 w-3 pointer-events-none" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Link to="/order">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowRight className="h-4 w-4 rotate-180 pointer-events-none" />
                      <span className="pointer-events-none">Continue Shopping</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Cart;
