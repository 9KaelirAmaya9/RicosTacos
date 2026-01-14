import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ArrowRight, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import SecurePaymentModal from "@/components/checkout/SecurePaymentModal";
import { CheckoutAuthOptions } from "@/components/checkout/CheckoutAuthOptions";
import { validateDeliveryAddress, type DeliveryValidationResult } from "@/utils/deliveryValidation";
import { validateDeliveryAddressGoogle, type GoogleMapsValidationResult } from "@/utils/googleMapsValidation";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";

const Cart = () => {
  const { t } = useLanguage();
  const { cart, orderType, setOrderType, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutPublishableKey, setCheckoutPublishableKey] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; description?: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ place_id: string; formatted_address: string } | null>(null);

  useEffect(() => {
    // Pre-fill email if user is authenticated
    if (user?.email) {
      setCustomerInfo(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  useEffect(() => {

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
  }, [searchParams, clearCart, navigate]);

  const handlePlaceOrder = async () => {
    const processStartTime = Date.now();
    const processStartTimestamp = new Date().toISOString();
    
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║          CHECKOUT PROCESS STARTED                              ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log("⏰ Start Timestamp:", processStartTimestamp);
    console.log("📊 Initial State:", {
      cartLength: cart.length,
      isProcessing: isProcessing,
      orderType: orderType,
      hasAppliedCoupon: !!appliedCoupon,
    });
    console.log("👤 Customer Information:", {
      name: customerInfo.name,
      phone: customerInfo.phone,
      email: customerInfo.email,
      hasAddress: !!customerInfo.address,
      hasNotes: !!customerInfo.notes,
    });
    
    if (cart.length === 0) {
      console.error("Cart is empty!");
      toast.error(t("order.cartEmpty"));
      return;
    }

    if (isProcessing) {
      console.warn("Already processing, ignoring duplicate call");
      return;
    }

    // Input validation schema - name, phone, and email are REQUIRED
    const orderSchema = z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
      phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number is too long"),
      email: z.string().trim().email("Please enter a valid email address").max(255, "Email is too long"),
      address: z.string().trim().max(500, "Address is too long").optional().or(z.literal("")),
      notes: z.string().trim().max(1000, "Notes are too long").optional().or(z.literal("")),
    });
    
    // Validate customer information
    console.log("Validating customer info:", customerInfo);
    const validation = orderSchema.safeParse(customerInfo);
    
    if (!validation.success) {
      console.error("Validation failed:", validation.error.errors);
      const firstError = validation.error.errors[0];
      toast.error(firstError.message, {
        duration: 5000,
      });
      // Scroll to the form to show the error
      document.getElementById('name')?.focus();
      return;
    }
    
    console.log("Validation passed:", validation.data);

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
      setCustomerInfo({ ...customerInfo, address: selectedPlace.formatted_address });
    }

    // Validate delivery zone with Google Maps (non-blocking for guest checkout)
    // Make delivery validation completely non-blocking - never return early
    if (orderType === "delivery") {
      // Use Google Maps validation if place_id is available, otherwise fallback to text validation
      if (selectedPlace?.place_id) {
        if (import.meta.env.DEV) {
          console.log("🔍 Cart: Validating delivery address with Google Maps");
        }
        
        // Run validation in background - don't await, just fire and forget
        validateDeliveryAddressGoogle(
          selectedPlace.place_id,
          selectedPlace.formatted_address
        ).then((deliveryValidation) => {
          if (import.meta.env.DEV) {
            console.log("✅ Cart: Delivery validation completed");
          }
          
          // Only show error if explicitly invalid (not timeout)
          if (deliveryValidation && !deliveryValidation.isValid && 
              !deliveryValidation.message?.includes("timeout") &&
              !deliveryValidation.message?.includes("taking longer than expected")) {
            if (deliveryValidation.suggestPickup) {
              toast.error(deliveryValidation.message || "We apologize, but delivery isn't available to this location. Pickup is always available!", {
                duration: 6000,
                action: {
                  label: "Switch to Pickup",
                  onClick: () => setOrderType("pickup")
                }
              });
            }
          } else if (deliveryValidation && deliveryValidation.isValid) {
            // Show success message if validation passed
            if (deliveryValidation.estimatedMinutes) {
              toast.success(deliveryValidation.message || `Estimated delivery: ${deliveryValidation.estimatedMinutes} min`, {
                duration: 4000
              });
            }
          }
        }).catch((deliveryError: any) => {
          console.warn("⚠️ Delivery validation failed (non-blocking):", deliveryError);
          // Don't show error - just log it, checkout continues
        });
      } else if (customerInfo.address.trim()) {
        // Fallback validation - also non-blocking
        validateDeliveryAddress(customerInfo.address).then((deliveryValidation) => {
          if (deliveryValidation && !deliveryValidation.isValid && deliveryValidation.suggestPickup) {
            toast.error(deliveryValidation.message || "We apologize, but delivery isn't available to this location. Pickup is always available!", {
              duration: 6000,
              action: {
                label: "Switch to Pickup",
                onClick: () => setOrderType("pickup")
              }
            });
          }
        }).catch((error) => {
          console.warn("⚠️ Fallback validation failed (non-blocking):", error);
        });
      }
      // If no address selected, still proceed - don't block checkout
    } else {
      console.log("Pickup order - skipping delivery validation");
    }

    setIsProcessing(true);
    const overallStartTime = Date.now();

    try {
      console.log("\n┌─────────────────────────────────────────────────────────────┐");
      console.log("│ STEP 1: CALCULATING TOTALS                                  │");
      console.log("└─────────────────────────────────────────────────────────────┘");
      const step1Start = Date.now();
      
      const subtotal = cartTotal;
      const discountAmount = appliedCoupon?.discount_amount || 0;
      const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
      const tax = subtotalAfterDiscount * 0.08875; // NYC sales tax: 8.875%
      const deliveryFee = orderType === "delivery" ? 5.00 : 0; // $5 delivery fee
      const total = subtotalAfterDiscount + tax + deliveryFee;
      
      console.log("💰 Calculated Totals:", {
        subtotal: `$${subtotal.toFixed(2)}`,
        discount: `$${discountAmount.toFixed(2)}`,
        subtotalAfterDiscount: `$${subtotalAfterDiscount.toFixed(2)}`,
        tax: `$${tax.toFixed(2)}`,
        deliveryFee: `$${deliveryFee.toFixed(2)}`,
        total: `$${total.toFixed(2)}`,
      });
      console.log(`⏱️  Step 1 Duration: ${Date.now() - step1Start}ms`);

      // Get current user if authenticated
      console.log("\n┌─────────────────────────────────────────────────────────────┐");
      console.log("│ STEP 2: GETTING SESSION (NON-BLOCKING)                     │");
      console.log("└─────────────────────────────────────────────────────────────┘");
      const sessionStartTime = Date.now();
      let session: any = null;
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((resolve) => setTimeout(() => resolve({ data: { session: null }, error: null }), 2000)),
        ]) as any;
        if (sessionResult?.error) {
          console.warn("⚠️  Session error (non-critical):", sessionResult.error);
        }
        session = sessionResult?.data?.session ?? null;
        console.log("🔐 Session Retrieved:", {
          isAuthenticated: !!session,
          userId: session?.user?.id || 'guest',
          userEmail: session?.user?.email || 'none',
        });
      } catch (e) {
        console.warn("⚠️  Session retrieval failed (non-critical):", e);
      } finally {
        console.log(`⏱️  Step 2 Duration: ${Date.now() - sessionStartTime}ms`);
      }
      
      // Generate order number on client to avoid needing SELECT permissions
      const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      console.log("\n┌─────────────────────────────────────────────────────────────┐");
      console.log("│ STEP 3: CREATING ORDER                                      │");
      console.log("└─────────────────────────────────────────────────────────────┘");
      console.log("📝 Order Configuration:", {
        orderNumber: orderNumber,
        userType: session?.user?.id ? "authenticated" : "guest",
        userId: session?.user?.id || null,
        customerName: validation.data.name,
        customerEmail: validation.data.email,
        customerPhone: validation.data.phone,
        orderType: orderType,
        deliveryAddress: orderType === "delivery" ? finalDeliveryAddress : null,
        itemsCount: cart.length,
        subtotal: `$${subtotal.toFixed(2)}`,
        tax: `$${tax.toFixed(2)}`,
        total: `$${total.toFixed(2)}`,
        hasNotes: !!validation.data.notes,
      });
      
      // Add timeout to order creation to prevent hanging
      // Database inserts are typically fast (0.5-2s), but we allow 10s for slow networks and connection issues
      console.log("💾 Inserting order into database...");
      const orderStartTime = Date.now();
      
      // Add a heartbeat to track progress
      const orderHeartbeat = setInterval(() => {
        const elapsed = Date.now() - orderStartTime;
        console.log(`⏳ Order creation in progress... (${elapsed}ms elapsed)`);
      }, 2000);
      
      // Prepare order data
      const orderDataToInsert = {
        order_number: orderNumber,
        user_id: session?.user?.id || null,
        customer_name: validation.data.name,
        customer_email: validation.data.email || null,
        customer_phone: validation.data.phone,
        order_type: orderType,
        delivery_address: orderType === "delivery" ? finalDeliveryAddress : null,
        items: cart as any,
        subtotal,
        tax,
        total: total, // Include delivery fee in total
        notes: validation.data.notes || null,
        status: "pending",
      };
      
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log("💾 Order data prepared:", {
          order_number: orderDataToInsert.order_number,
          items_count: cart.length,
          total: orderDataToInsert.total,
          order_type: orderDataToInsert.order_type
        });
      }
      
      // Create insert promise with explicit error handling
      const orderInsertPromise = (async () => {
        try {
          if (isDev) console.log("🔄 Starting database insert...");
          
          const result = await supabase
            .from("orders")
            .insert([orderDataToInsert]);
          
          if (isDev) {
            console.log("📦 Insert completed:", {
              hasError: !!result.error,
              errorCode: result.error?.code
            });
          }
          
          return result;
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
          const elapsed = Date.now() - orderStartTime;
          clearInterval(orderHeartbeat);
          reject(new Error(`Order creation timed out after 10 seconds (elapsed: ${elapsed}ms). Please check your connection and try again.`));
        }, 10000) // 10 seconds should be plenty for simple insert
      );

      const result = await Promise.race([
        orderInsertPromise,
        orderTimeoutPromise
      ]) as any;

      clearInterval(orderHeartbeat);
      
      // Extract data and error from result
      const orderData = result?.data;
      const orderError = result?.error;
      
      if (orderError) {
        const elapsed = Date.now() - orderStartTime;
        console.error("❌ Order creation error:", orderError);
        console.error("❌ Error type:", typeof orderError);
        console.error("❌ Error message:", orderError?.message);
        console.error("❌ Error code:", orderError?.code);
        console.error("❌ Error details:", orderError?.details);
        console.error("❌ Error hint:", orderError?.hint);
        console.error(`❌ Order creation took ${elapsed}ms before failing`);
        
        // Provide more specific error message
        let errorMessage = "Failed to create order. Please try again.";
        
        if (orderError?.code === '23505') {
          errorMessage = "An order with this number already exists. Please try again.";
        } else if (orderError?.code === '23503') {
          errorMessage = "Invalid order data. Please check your information and try again.";
        } else if (orderError?.code === '42501') {
          errorMessage = "Permission denied. Please contact support.";
        } else if (orderError?.message) {
          errorMessage = `Failed to create order: ${orderError.message}`;
        } else if (typeof orderError === 'string') {
          errorMessage = `Failed to create order: ${orderError}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const orderElapsed = Date.now() - orderStartTime;
      console.log(`✅ Order created successfully!`);
      console.log("📦 Order Details:", {
        orderNumber: orderNumber,
        creationTime: `${orderElapsed}ms`,
        status: "pending",
      });
      console.log(`⏱️  Step 3 Duration: ${orderElapsed}ms`);
      console.log(`⏱️  Total elapsed: ${Date.now() - overallStartTime}ms`);

      // Send push notification to kitchen staff and admins (non-blocking)
      // Only send if user is authenticated (notification function requires auth)
      console.log("\n📲 Sending push notification...");
      if (user?.id) {
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              title: 'New Order Received!',
              body: `Order #${orderNumber} - ${cart.length} items - $${total.toFixed(2)}`,
              data: {
                orderId: orderNumber,
                orderNumber: orderNumber,
                url: '/kitchen'
              },
              targetRoles: ['admin', 'kitchen']
            }
          });
          console.log("✅ Push notification sent successfully");
        } catch (notifError) {
          console.warn('⚠️  Failed to send push notification (non-critical):', notifError);
          // Don't fail the order if notification fails
        }
      } else {
        console.log("ℹ️  Skipping push notification for guest order");
      }

      // Use user?.id for subsequent operations
      const authenticatedUserId = user?.id || null;

      // Create PaymentIntent for secure modal checkout
      // Map cart items to the format expected by the payment function
      const paymentItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      console.log("\n┌─────────────────────────────────────────────────────────────┐");
      console.log("│ STEP 4: CREATING PAYMENT INTENT                             │");
      console.log("└─────────────────────────────────────────────────────────────┘");
      console.log("💳 Payment Configuration:", {
        orderNumber: orderNumber,
        itemsCount: paymentItems.length,
        orderType: orderType,
        totalAmount: `$${total.toFixed(2)}`,
        hasCoupon: !!appliedCoupon,
        discountAmount: `$${discountAmount.toFixed(2)}`,
      });
      console.log("📋 Payment Items:", paymentItems.map(item => ({
        name: item.name,
        price: `$${item.price.toFixed(2)}`,
        quantity: item.quantity,
        subtotal: `$${(item.price * item.quantity).toFixed(2)}`,
      })));
      
      // Add timeout to payment intent creation to prevent hanging
      // Stripe API + edge function typically takes 1-4s, but we allow 15s for cold starts, slow networks, and Stripe API delays
      console.log("🔄 Invoking payment intent creation...");
      const paymentStartTime = Date.now();
      const paymentIntentPromise = supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            items: paymentItems,
            orderType,
            customerInfo: validation.data,
            orderNumber,
            couponCode: appliedCoupon?.code || null,
            discountAmount: discountAmount,
          }
        }
      );

      // Add a heartbeat to track progress
      const paymentHeartbeat = setInterval(() => {
        const elapsed = Date.now() - paymentStartTime;
        console.log(`⏳ Payment intent creation in progress... (${elapsed}ms elapsed)`);
      }, 2000);

      const paymentTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          const elapsed = Date.now() - paymentStartTime;
          clearInterval(paymentHeartbeat);
          reject(new Error(`Payment intent creation timed out after 15 seconds (elapsed: ${elapsed}ms)`));
        }, 15000)
      );

      const { data: piData, error: piError } = await Promise.race([
        paymentIntentPromise,
        paymentTimeoutPromise
      ]) as any;

      clearInterval(paymentHeartbeat);
      
      if (piError) {
        const elapsed = Date.now() - paymentStartTime;
        console.error("❌ Payment intent error:", {
          error: piError,
          message: piError.message,
          errorCode: piError.error,
          elapsed: `${elapsed}ms`,
          fullError: JSON.stringify(piError, null, 2)
        });
        // Show the actual error message if available
        const errorMessage = piError.message || piError.error || "Failed to create payment intent";
        throw new Error(`Payment error: ${errorMessage}`);
      }

      const paymentElapsed = Date.now() - paymentStartTime;
      console.log(`✅ Payment intent created successfully!`);
      console.log("🔑 Payment Intent Data:", {
        hasClientSecret: !!piData?.clientSecret,
        hasPublishableKey: !!piData?.publishableKey,
        clientSecretPrefix: piData?.clientSecret ? piData.clientSecret.substring(0, 15) + "..." : "none",
      });
      console.log(`⏱️  Step 4 Duration: ${paymentElapsed}ms`);

      if (piData?.clientSecret && piData?.publishableKey) {
        const totalProcessTime = Date.now() - overallStartTime;
        const processEndTimestamp = new Date().toISOString();
        
        console.log("\n╔════════════════════════════════════════════════════════════════╗");
        console.log("║       CHECKOUT PROCESS COMPLETED SUCCESSFULLY                  ║");
        console.log("╚════════════════════════════════════════════════════════════════╝");
        console.log("⏰ End Timestamp:", processEndTimestamp);
        console.log("⏱️  TOTAL RUNTIME:", `${totalProcessTime}ms (${(totalProcessTime / 1000).toFixed(2)}s)`);
        console.log("\n📊 Performance Summary:");
        console.log("├─ Step 1 (Totals):         ~instant");
        console.log("├─ Step 2 (Session):        " + (Date.now() - sessionStartTime) + "ms");
        console.log("├─ Step 3 (Order Creation): " + orderElapsed + "ms");
        console.log("└─ Step 4 (Payment Intent): " + paymentElapsed + "ms");
        console.log("\n🎯 Next Action: Opening payment modal for order:", orderNumber);
        console.log("═══════════════════════════════════════════════════════════════════\n");
        
        setCurrentOrderNumber(orderNumber);
        setCheckoutClientSecret(piData.clientSecret as string);
        setCheckoutPublishableKey(piData.publishableKey as string);
        setShowCheckout(true);
        setIsProcessing(false);
        return;
      } else {
        console.error("❌ Payment intent response missing data:", piData);
        throw new Error('Payment service returned invalid data. Please try again.');
      }


    } catch (error: any) {
      const totalProcessTime = Date.now() - overallStartTime;
      const processEndTimestamp = new Date().toISOString();
      
      console.error("\n╔════════════════════════════════════════════════════════════════╗");
      console.error("║             CHECKOUT PROCESS FAILED                            ║");
      console.error("╚════════════════════════════════════════════════════════════════╝");
      console.error("⏰ End Timestamp:", processEndTimestamp);
      console.error("⏱️  TOTAL RUNTIME:", `${totalProcessTime}ms (${(totalProcessTime / 1000).toFixed(2)}s)`);
      console.error("\n❌ Error Details:");
      console.error("├─ Type:", typeof error);
      console.error("├─ Name:", error?.name);
      console.error("├─ Message:", error?.message);
      console.error("├─ Code:", error?.code);
      console.error("└─ Stack:", error?.stack);
      console.error("\n📋 Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error("═══════════════════════════════════════════════════════════════════\n");
      
      // Show the actual error message to help debug
      let errorMessage = "Failed to process order. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check if it's a timeout error and provide more helpful message
      if (errorMessage.includes("timed out")) {
        if (errorMessage.includes("Order creation")) {
          errorMessage = "Order creation is taking longer than expected. Please check your connection and try again.";
        } else if (errorMessage.includes("Payment intent")) {
          errorMessage = "Payment processing is taking longer than expected. Please check your connection and try again.";
        } else {
          errorMessage = "Request timed out. Please check your internet connection and try again.";
        }
      }
      
      toast.error(errorMessage, {
        duration: 8000,
        description: "Check the browser console (F12) for more details",
      });
    } finally {
      // Always reset processing state, even if there was an error
      const finalProcessTime = Date.now() - overallStartTime;
      console.log("\n🔄 Cleanup Phase:");
      console.log("├─ Resetting processing state");
      console.log("└─ Final processing time: " + finalProcessTime + "ms");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />
      
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-8 sm:mb-12 text-center">
              {t("cart.title")} <span className="text-primary">{t("cart.titleHighlight")}</span>
            </h1>

            {cart.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-20" />
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
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-2xl font-semibold">
                        {t("order.yourOrder")} ({cartCount} items)
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearCart}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
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
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Link to="/order">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>

                {/* Checkout Form */}
                <div className="lg:col-span-1">
                  <Card className="p-4 sm:p-6 lg:sticky lg:top-32">
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Checkout</h2>

                    <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "pickup" | "delivery")} className="mb-6">
                      <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value="pickup" className="text-base">{t("order.pickup")}</TabsTrigger>
                        <TabsTrigger value="delivery" className="text-base">{t("order.delivery")}</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-5 mb-6">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          placeholder="Your full name"
                          required
                          className={`h-12 text-base ${customerInfo.name.length > 0 && customerInfo.name.length < 2 ? "border-destructive" : ""}`}
                        />
                        {customerInfo.name.length > 0 && customerInfo.name.length < 2 && (
                          <p className="text-xs text-destructive mt-1">Name must be at least 2 characters</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          required
                          className={`h-12 text-base ${customerInfo.phone.length > 0 && customerInfo.phone.length < 10 ? "border-destructive" : ""}`}
                        />
                        {customerInfo.phone.length > 0 && customerInfo.phone.length < 10 && (
                          <p className="text-xs text-destructive mt-1">Phone must be at least 10 digits</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                          className={`h-12 text-base ${customerInfo.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim()) ? "border-destructive" : ""}`}
                        />
                        {customerInfo.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim()) && (
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
                              
                              // Validate delivery address immediately when selected
                              console.log("🔍 Cart: Validating delivery address immediately on selection");
                              validateDeliveryAddressGoogle(
                                place.place_id,
                                place.formatted_address
                              ).then((deliveryValidation) => {
                                console.log("✅ Cart: Delivery validation completed on selection");
                                
                                if (deliveryValidation && !deliveryValidation.isValid && 
                                    !deliveryValidation.message?.includes("timeout")) {
                                  if (deliveryValidation.suggestPickup) {
                                    toast.error(deliveryValidation.message || "Delivery not available to this location. Pickup is always available!", {
                                      duration: 6000,
                                      action: {
                                        label: "Switch to Pickup",
                                        onClick: () => setOrderType("pickup")
                                      }
                                    });
                                  }
                                } else if (deliveryValidation && deliveryValidation.isValid) {
                                  if (deliveryValidation.estimatedMinutes) {
                                    toast.success(`✅ Delivery available - Estimated: ${deliveryValidation.estimatedMinutes} min`, {
                                      duration: 4000
                                    });
                                  }
                                }
                              }).catch((error) => {
                                console.warn("⚠️ Delivery validation failed (non-blocking):", error);
                                // Don't show error for validation timeouts during selection
                              });
                            }}
                            placeholder="Start typing your address..."
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 We deliver within 20 minutes. Validation runs when you select an address from the suggestions.
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
                              onClick={async () => {
                                if (!couponCode.trim()) return;
                                setIsValidatingCoupon(true);
                                try {
                                  const subtotal = cartTotal;
                                  const tax = subtotal * 0.08875;
                                  const deliveryFee = orderType === "delivery" ? 5.00 : 0;
                                  const orderAmount = subtotal + tax + deliveryFee;

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
                              }}
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

                      <div className="space-y-2 py-4 border-t border-border">
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
                          <span>${((cartTotal - (appliedCoupon?.discount_amount || 0)) * 0.08875).toFixed(2)}</span>
                        </div>
                        {orderType === "delivery" && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            <span>$5.00</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t border-border">
                          <span>{t("order.total")}</span>
                          <span className="text-primary">
                            ${((cartTotal - (appliedCoupon?.discount_amount || 0)) * 1.08875 + (orderType === "delivery" ? 5.00 : 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-14 text-lg font-semibold" 
                        size="lg"
                        onClick={() => {
                          // Quick validation before checkout
                          if (!customerInfo.name.trim() || customerInfo.name.trim().length < 2) {
                            toast.error("Please enter your name (at least 2 characters)");
                            document.getElementById('name')?.focus();
                            return;
                          }
                          if (!customerInfo.phone.trim() || customerInfo.phone.trim().length < 10) {
                            toast.error("Please enter a valid phone number (at least 10 digits)");
                            document.getElementById('phone')?.focus();
                            return;
                          }
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!customerInfo.email.trim() || !emailRegex.test(customerInfo.email.trim())) {
                            toast.error("Please enter a valid email address");
                            document.getElementById('email')?.focus();
                            return;
                          }
                          // For delivery, check both customerInfo.address and selectedPlace
                          if (orderType === "delivery" && !customerInfo.address.trim() && !selectedPlace?.formatted_address) {
                            toast.error("Please enter or select a delivery address");
                            document.getElementById('delivery-address')?.focus();
                            return;
                          }
                          // Proceed directly to checkout as guest
                          handlePlaceOrder();
                        }}
                        disabled={cart.length === 0 || isProcessing}
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        {isProcessing ? "Processing..." : "Proceed to Checkout"}
                      </Button>

                      {checkoutClientSecret && checkoutPublishableKey && currentOrderNumber && (
                        <SecurePaymentModal
                          open={showCheckout}
                          onOpenChange={setShowCheckout}
                          clientSecret={checkoutClientSecret}
                          publishableKey={checkoutPublishableKey}
                          orderNumber={currentOrderNumber}
                          customerInfo={customerInfo}
                          orderType={orderType}
                          cartTotal={cartTotal}
                          cart={cart}
                          onSuccess={() => {
                            try {
                              clearCart();
                              setCustomerInfo({ name: "", phone: "", email: "", address: "", notes: "" });
                              setAppliedCoupon(null);
                              setCouponCode("");
                              setShowCheckout(false);
                              setCheckoutClientSecret(null);
                              setCheckoutPublishableKey(null);
                              
                              // Navigate to success page with error handling
                              if (currentOrderNumber) {
                                navigate(`/order-success?order_number=${encodeURIComponent(currentOrderNumber)}`);
                              } else {
                                // Fallback if order number is missing
                                console.warn('Order number missing, redirecting to success page without order number');
                                navigate('/order-success');
                              }
                            } catch (error) {
                              console.error('Error in onSuccess callback:', error);
                              // Fallback navigation if navigate fails
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
