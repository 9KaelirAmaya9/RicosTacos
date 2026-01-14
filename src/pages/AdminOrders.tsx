import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Printer, RefreshCw, Wifi, WifiOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { printReceipt } from "@/utils/printReceipt";
import { cn } from "@/lib/utils";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useAudioAlerts } from "@/hooks/useAudioAlerts";
import type { Order, OrderStatus } from "@/hooks/useOrders";

const statusColors: Record<string, string> = {
  pending: 'bg-serape-yellow text-foreground',
  preparing: 'bg-serape-blue text-white',
  ready: 'bg-serape-green text-white',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive text-white',
  paid: 'bg-serape-green text-white',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Audio alerts for new orders
  const { audioEnabled, setAudioEnabled, playNewOrderAlert, initAudioContext } = useAudioAlerts();
  const previousOrderCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      const ordersData = (data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : [],
      })) as Order[];
      
      // Play sound alert if order count increased (new order detected)
      if (!isFirstLoadRef.current && ordersData.length > previousOrderCountRef.current) {
        playNewOrderAlert();
        toast.success("🔔 New order received!", {
          duration: 3000,
        });
      }
      previousOrderCountRef.current = ordersData.length;
      isFirstLoadRef.current = false;
      
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("admin-orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel).catch(console.error); };
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(term) ||
        o.customer_name.toLowerCase().includes(term) ||
        o.customer_phone.includes(term)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }
    return result;
  }, [orders, searchTerm, statusFilter]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update");
      fetchOrders();
    }
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Order Tracking</h1>
            <p className="text-muted-foreground">{filteredOrders.length} orders</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                initAudioContext();
                setAudioEnabled(!audioEnabled);
                toast.success(audioEnabled ? "🔇 Audio alerts disabled" : "🔊 Audio alerts enabled");
              }}
              title={audioEnabled ? "Disable audio alerts" : "Enable audio alerts"}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs',
              isOnline ? 'bg-serape-green/10 text-serape-green' : 'bg-destructive/10 text-destructive'
            )}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? 'Live' : 'Offline'}
            </div>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
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
          <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
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
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                      </TableCell>
                      <TableCell><Badge variant={order.order_type === "delivery" ? "default" : "secondary"}>{order.order_type}</Badge></TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                          <SelectTrigger className="w-[120px]">
                            <Badge className={cn('text-xs', statusColors[order.status])}>{order.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => printReceipt({
                          orderNumber: order.order_number, customerName: order.customer_name, orderType: order.order_type,
                          items: order.items, subtotal: order.subtotal, tax: order.tax, total: order.total, createdAt: order.created_at
                        })}><Printer className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredOrders.length === 0 && <div className="text-center py-8 text-muted-foreground">No orders found</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
