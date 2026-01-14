import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, Home, Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface OrderDetails {
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  order_type: string;
  delivery_address: string | null;
  items: any;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  status: string;
  created_at: string;
}

const OrderSuccess = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const orderNumber = searchParams.get("order_number");

  // Load order data from sessionStorage (set by SecurePaymentModal)
  useEffect(() => {
    const storedOrder = sessionStorage.getItem(`order_${orderNumber}`);
    if (storedOrder) {
      try {
        const orderData = JSON.parse(storedOrder);
        setOrderDetails(orderData);
        console.log("OrderSuccess: Loaded order from session storage:", orderNumber);
      } catch (e) {
        console.warn("OrderSuccess: Failed to parse stored order:", e);
      }
    } else {
      console.log("OrderSuccess: No stored order found for:", orderNumber);
    }
  }, [orderNumber]);

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navigation />
        <div className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-serif text-4xl font-bold mb-4">Order Complete</h1>
              <p className="text-muted-foreground mb-8">Payment successful! Your order has been received.</p>
              <Link to="/">
                <Button size="lg" className="gap-2">
                  <Home className="h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no stored order, show minimal success page with order number
  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navigation />
        <div className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
                  ¡Gracias! <span className="text-primary">Order Confirmed</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Your payment was successful
                </p>
              </div>

              <Card className="p-8 mb-8 text-center bg-primary/5 border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                <p className="font-mono text-3xl font-bold text-primary">{orderNumber}</p>
              </Card>

              <Card className="p-6 mb-8 bg-muted/50">
                <h3 className="font-semibold mb-4">Order Received</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>✓ Your order has been successfully placed</p>
                  <p>✓ Our kitchen is preparing your food</p>
                  <p>✓ You will receive updates about your order</p>
                  <p className="pt-2">Need help? Call us at (718) 633-4816</p>
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full gap-2">
                    <Home className="h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/order" className="flex-1">
                  <Button size="lg" className="w-full gap-2">
                    Order Again
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />
      
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
                ¡Gracias! <span className="text-primary">Order Confirmed</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Your payment was successful
              </p>
            </div>

            {/* Order Number Card */}
            <Card className="p-8 mb-8 text-center bg-primary/5 border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Order Number</p>
              <p className="font-mono text-3xl font-bold text-primary">{orderDetails.order_number}</p>
              <p className="text-sm text-muted-foreground mt-4">
                {orderDetails.order_type === "delivery" ? "🚗 Delivery Order" : "🏪 Pickup Order"}
              </p>
            </Card>

            {/* Customer Information */}
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

            {/* Order Items */}
            <Card className="p-6 mb-8">
              <h2 className="font-serif text-2xl font-semibold mb-6">Order Details</h2>
              <div className="space-y-4 mb-6">
                {(orderDetails.items as any[]).map((item: any, index: number) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
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

              {/* Order Summary */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${orderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${orderDetails.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                  <span>Total Paid</span>
                  <span className="text-primary">${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-6 mb-8 bg-muted/50">
              <h3 className="font-semibold mb-4">What's Next?</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {orderDetails.order_type === "delivery" ? (
                  <>
                    <p>✓ Your order is being prepared by our kitchen</p>
                    <p>✓ We'll notify you when it's out for delivery</p>
                    <p>✓ Estimated delivery: 45-60 minutes</p>
                  </>
                ) : (
                  <>
                    <p>✓ Your order is being prepared by our kitchen</p>
                    <p>✓ We'll notify you when it's ready for pickup</p>
                    <p>✓ Estimated pickup time: 20-30 minutes</p>
                  </>
                )}
                <p className="pt-2">Need help? Call us at (718) 633-4816</p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/" className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <Home className="h-5 w-5" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/order" className="flex-1">
                <Button size="lg" className="w-full gap-2">
                  Order Again
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
