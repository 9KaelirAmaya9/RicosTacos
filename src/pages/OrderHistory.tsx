import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Calendar, DollarSign, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/types/orders";

const OrderHistory = () => {
  const { session, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  const loadOrders = useCallback(async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load order history");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      toast.error("Please sign in to view your order history");
      navigate("/signin");
      return;
    }
    loadOrders();

    // Poll every 30s — keeps status up-to-date (e.g. pending → ready)
    const interval = window.setInterval(loadOrders, 30 * 1000);
    return () => window.clearInterval(interval);
  }, [authLoading, session, navigate, loadOrders]);

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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navigation />
      
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
              Order <span className="text-primary">History</span>
            </h1>
            <p className="text-muted-foreground">
              View all your past orders
            </p>
          </div>

          {orders.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-20" />
              <h2 className="font-serif text-3xl font-semibold mb-4">
                No Orders Yet
              </h2>
              <p className="text-muted-foreground">
                You haven't placed any orders yet. Start ordering to see your history here!
              </p>
              <Link to="/order">
                <Button variant="outline" className="mt-4 gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Browse the Menu
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5 flex-shrink-0" />
                          {order.order_number}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                          <span className="capitalize">{order.order_type}</span>
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} flex-shrink-0`}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Items:</h4>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm flex justify-between">
                            <span className="min-w-0 truncate flex-1 mr-2">{item.quantity}x {item.name}</span>
                            <span className="text-muted-foreground flex-shrink-0">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="font-semibold flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Total:
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ${Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
