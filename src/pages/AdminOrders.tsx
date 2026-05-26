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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Printer, RefreshCw, ArrowLeft, AlertCircle, Download, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { printReceipt } from "@/utils/printReceipt";
import { captureException } from "@/utils/sentry";
import { useOrderAlarm } from "@/hooks/useOrderAlarm";
import type { Order } from "@/types/orders";

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

type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month';

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-green-600",
  confirmed: "bg-green-600",
  preparing: "bg-blue-500",
  ready: "bg-green-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const [orders, setOrders] = useState<Order[]>(() =>
    queryClient.getQueryData<Order[]>(["admin-orders"])?.length
      ? queryClient.getQueryData<Order[]>(["admin-orders"])!
      : readAdminCache()
  );
  const [loading, setLoading] = useState<boolean>(() => {
    const hasCache =
      (queryClient.getQueryData<Order[]>(["admin-orders"]) ?? []).length > 0 ||
      readAdminCache().length > 0;
    return !hasCache;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(() =>
    sessionStorage.getItem("rt_admin_orders_filter") ?? "all"
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [fetchError, setFetchError] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { startAlarm, stopAlarm, unlockAudio } = useOrderAlarm();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const alarmMinimumUntilRef = useRef<number>(0);
  const stopTimeoutRef = useRef<number | null>(null);
  const snoozedUntilRef = useRef<number>(0);

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

  const fetchInProgressRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hardStop = window.setTimeout(() => setLoading(false), 8000);
    return () => window.clearTimeout(hardStop);
  }, []);

  const clearStopTimeout = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const syncAlarmState = useCallback((nextOrders: Order[]) => {
    const hasUnaccepted = nextOrders.some(o => o.status === "paid" || o.status === "confirmed");
    if (hasUnaccepted) {
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
      const accessToken = sessionRef.current?.access_token;
      if (!accessToken) return;

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
        if (response.status === 401) { navigate("/signin", { replace: true }); return; }
        throw new Error(`HTTP ${response.status}`);
      }

      const ordersData: Order[] = await response.json();
      const nextIds = new Set(ordersData.map(o => o.id));
      const newUnaccepted = ordersData.filter(
        o => !knownOrderIdsRef.current.has(o.id) && o.status === "paid"
      );
      if (newUnaccepted.length > 0) {
        alarmMinimumUntilRef.current = Math.max(alarmMinimumUntilRef.current, Date.now() + 10000);
        snoozedUntilRef.current = 0;
        void startAlarm();
        toast.info(`🔔 ${newUnaccepted.length} new order${newUnaccepted.length > 1 ? "s" : ""} received`);
      }
      knownOrderIdsRef.current = nextIds;
      setOrders(ordersData);
      writeAdminCache(ordersData);
      queryClient.setQueryData(["admin-orders"], ordersData);
      syncAlarmState(ordersData);
      setFetchError(false);
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { context: 'admin_fetch_orders' });
      setFetchError(true);
    } finally {
      fetchInProgressRef.current = false;
      setLoading(false);
    }
  }, [startAlarm, syncAlarmState, queryClient, navigate]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') fetchOrders();
      })
      .subscribe();
    const pollInterval = window.setInterval(fetchOrders, 5 * 1000);
    return () => {
      clearStopTimeout();
      stopAlarm();
      window.clearInterval(pollInterval);
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [clearStopTimeout, fetchOrders, stopAlarm]);

  // ── Filtered orders ───────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let filtered = orders;

    switch (dateFilter) {
      case 'today':     filtered = filtered.filter(o => o.created_at.startsWith(todayStr)); break;
      case 'yesterday': filtered = filtered.filter(o => o.created_at.startsWith(yesterdayStr)); break;
      case 'week':      filtered = filtered.filter(o => new Date(o.created_at) >= weekAgo); break;
      case 'month':     filtered = filtered.filter(o => new Date(o.created_at) >= monthAgo); break;
    }

    if (searchTerm) {
      filtered = filtered.filter(o =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_phone.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter]);

  // ── CSV export ────────────────────────────────────────────────────────────────
  const exportToCSV = useCallback(() => {
    const headers = ['Order #', 'Date', 'Customer', 'Phone', 'Email', 'Type', 'Items', 'Subtotal', 'Tax', 'Total', 'Status', 'Address', 'Notes'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
      o.customer_name,
      o.customer_phone,
      o.customer_email || '',
      o.order_type,
      Array.isArray(o.items) ? o.items.map(i => `${i.quantity}x ${i.name}`).join('; ') : '',
      Number(o.subtotal).toFixed(2),
      Number(o.tax).toFixed(2),
      Number(o.total).toFixed(2),
      o.status,
      o.delivery_address || '',
      o.notes || '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ricos-tacos-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredOrders.length} orders to CSV`);
  }, [filteredOrders]);

  // ── Status update ─────────────────────────────────────────────────────────────
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      setOrders(prev => {
        const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o);
        syncAlarmState(updated);
        return updated;
      });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as Order['status'] } : null);
      }
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      toast.success("Order status updated");
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), { context: 'admin_update_order_status' });
      toast.error("Failed to update order status");
      fetchOrders();
    }
  }, [fetchOrders, syncAlarmState, selectedOrder]);

  // ── Revenue summary for filtered view ────────────────────────────────────────
  const filteredRevenue = useMemo(() =>
    filteredOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
      .reduce((sum, o) => sum + Number(o.total || 0), 0),
    [filteredOrders]
  );

  const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold">Order Tracking</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {filteredOrders.length} orders · ${filteredRevenue.toFixed(2)} revenue
                {loading && <span className="ml-2 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> refreshing…</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {audioEnabled
                ? <span className="text-xs text-green-600 dark:text-green-400">🔔 Sound active</span>
                : <span className="text-xs text-muted-foreground">🔕 Click anywhere to enable sound</span>
              }
              <Button onClick={exportToCSV} variant="outline" size="sm" disabled={filteredOrders.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={fetchOrders} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Date quick filters */}
            <div className="flex gap-2 flex-wrap">
              {DATE_FILTER_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={dateFilter === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {/* Search + status */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, name, or phone…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={v => { setStatusFilter(v); sessionStorage.setItem("rt_admin_orders_filter", v); }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
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

        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load orders — showing last known data.</span>
              <Button size="sm" variant="outline" onClick={fetchOrders} className="ml-4 shrink-0">
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Orders table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Orders ({filteredOrders.length === orders.length
                ? orders.length
                : `${filteredOrders.length} of ${orders.length}`})
            </CardTitle>
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
                    <TableHead className="sticky right-0 bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    const itemSummary = items.length === 0 ? '—'
                      : items.length <= 2
                        ? items.map(i => `${i.quantity}× ${i.name}`).join(', ')
                        : `${items[0].quantity}× ${items[0].name} +${items.length - 1} more`;

                    return (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <TableCell className="font-medium font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(order.created_at), "MMM dd, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{order.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.order_type === "delivery" ? "default" : "secondary"}>
                            {order.order_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={items.map(i => `${i.quantity}× ${i.name}`).join(', ')}>
                          {itemSummary}
                        </TableCell>
                        <TableCell className="font-semibold">${Number(order.total).toFixed(2)}</TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Select
                            value={order.status}
                            onValueChange={value => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-[130px]" onClick={e => e.stopPropagation()}>
                              <SelectValue>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white ${STATUS_COLORS[order.status] ?? 'bg-gray-500'}`}>
                                  {order.status}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(STATUS_COLORS).map(s => (
                                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              printReceipt({
                                orderNumber: order.order_number,
                                customerName: order.customer_name,
                                orderType: order.order_type,
                                items: Array.isArray(order.items) ? order.items : [],
                                subtotal: Number(order.subtotal),
                                tax: Number(order.tax),
                                total: Number(order.total),
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No orders match the current filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Order Detail Drawer ──────────────────────────────────────────────── */}
      <Sheet open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="pr-6">
                <SheetTitle className="font-mono text-lg">#{selectedOrder.order_number}</SheetTitle>
                <SheetDescription>
                  {format(new Date(selectedOrder.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={v => updateOrderStatus(selectedOrder.id, v)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white ${STATUS_COLORS[selectedOrder.status] ?? 'bg-gray-500'}`}>
                          {selectedOrder.status}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATUS_COLORS).map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Customer */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-muted-foreground">{selectedOrder.customer_phone}</p>
                    {selectedOrder.customer_email && (
                      <p className="text-muted-foreground">{selectedOrder.customer_email}</p>
                    )}
                  </div>
                </div>

                {/* Order type / address */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Type</p>
                  <div className="flex items-start gap-2 text-sm">
                    <Badge variant={selectedOrder.order_type === 'delivery' ? 'default' : 'secondary'} className="mt-0.5">
                      {selectedOrder.order_type}
                    </Badge>
                    {selectedOrder.delivery_address && (
                      <span className="text-muted-foreground">{selectedOrder.delivery_address}</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
                  <div className="space-y-2">
                    {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          <span className="font-semibold text-muted-foreground mr-2">{item.quantity}×</span>
                          {item.name}
                        </span>
                        <span className="font-medium">${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8.875%)</span>
                    <span>${Number(selectedOrder.tax).toFixed(2)}</span>
                  </div>
                  {selectedOrder.order_type === 'delivery' && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span>${(Number(selectedOrder.total) - Number(selectedOrder.subtotal) - Number(selectedOrder.tax)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t">
                    <span>Total</span>
                    <span>${Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Special Instructions</p>
                      <p className="text-sm bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-900">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                {/* Actions */}
                <Separator />
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    printReceipt({
                      orderNumber: selectedOrder.order_number,
                      customerName: selectedOrder.customer_name,
                      orderType: selectedOrder.order_type,
                      items: Array.isArray(selectedOrder.items) ? selectedOrder.items : [],
                      subtotal: Number(selectedOrder.subtotal),
                      tax: Number(selectedOrder.tax),
                      total: Number(selectedOrder.total),
                      createdAt: selectedOrder.created_at,
                      deliveryAddress: selectedOrder.delivery_address || undefined,
                      notes: selectedOrder.notes || undefined,
                    });
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
