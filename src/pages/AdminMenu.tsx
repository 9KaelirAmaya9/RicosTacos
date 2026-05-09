import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Search, Save, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

// Category grouping from ID prefix
function getCategoryFromId(id: string): string {
  if (/^de/.test(id)) return 'Desserts';
  if (/^d0[1-5]$/.test(id)) return 'Breakfast';
  if (/^to[7-9]$/.test(id)) return 'Breakfast';
  if (id === 'b5') return 'Breakfast';
  if (/^tq/.test(id)) return 'Taquitos';
  if (/^ts/.test(id)) return 'Tostadas';
  if (/^to/.test(id)) return 'Tortas';
  if (/^t[0-9]/.test(id)) return 'Tacos';
  if (/^m[0-9]/.test(id)) return 'Meats';
  if (id === 'burrito-combo' || /^b[0-9]/.test(id)) return 'Burritos';
  if (/^s[0-9]/.test(id)) return 'Soups';
  if (/^p[0-9]/.test(id)) return 'Platillos';
  if (/^k[0-9]/.test(id)) return 'Kids Menu';
  if (/^e[0-9]/.test(id)) return 'Extras';
  if (/^w[0-9]/.test(id)) return 'Weekend Specials';
  if (/^a[0-9]/.test(id)) return 'Appetizers';
  if (/^d[0-9]/.test(id)) return 'Drinks';
  return 'Other';
}

const CATEGORY_ORDER = [
  'Breakfast', 'Meats', 'Tacos', 'Taquitos', 'Tostadas', 'Tortas',
  'Burritos', 'Soups', 'Platillos', 'Kids Menu', 'Extras',
  'Weekend Specials', 'Appetizers', 'Drinks', 'Desserts', 'Other',
];

export default function AdminMenu() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [pendingPrices, setPendingPrices] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  // Fetch all menu items (including inactive — admin sees everything)
  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      // Use service-role bypass: fetch all rows regardless of active status
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('id, name, price, active')
        .order('id');
      if (fetchError) throw fetchError;
      setItems(data as MenuItem[]);
    } catch (e: any) {
      console.error('[AdminMenu] fetch failed:', e);
      setError(e?.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (session) fetchItems(); }, [session, fetchItems]);

  // Toggle active/inactive instantly
  const toggleActive = useCallback(async (id: string, currentActive: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, active: !currentActive } : i));
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ active: !currentActive })
      .eq('id', id);
    if (updateError) {
      toast.error(`Failed to update ${id}`);
      setItems(prev => prev.map(i => i.id === id ? { ...i, active: currentActive } : i));
    } else {
      toast.success(`${!currentActive ? 'Enabled' : 'Disabled'} — ${id}`);
    }
  }, []);

  // Save price change
  const savePrice = useCallback(async (item: MenuItem) => {
    const rawPrice = pendingPrices[item.id];
    if (rawPrice === undefined) return;

    const parsed = parseFloat(rawPrice);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Price must be a valid positive number');
      return;
    }
    const newPrice = Math.round(parsed * 100) / 100;
    if (newPrice === item.price) {
      setPendingPrices(prev => { const n = { ...prev }; delete n[item.id]; return n; });
      return;
    }

    setSavingIds(prev => new Set(prev).add(item.id));
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ price: newPrice })
      .eq('id', item.id);

    setSavingIds(prev => { const n = new Set(prev); n.delete(item.id); return n; });

    if (updateError) {
      toast.error(`Failed to save price for ${item.name}`);
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, price: newPrice } : i));
      setPendingPrices(prev => { const n = { ...prev }; delete n[item.id]; return n; });
      toast.success(`${item.name} → $${newPrice.toFixed(2)}`);
    }
  }, [pendingPrices]);

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(i => i.active).length,
    inactive: items.filter(i => !i.active).length,
  }), [items]);

  // Grouped + filtered items
  const grouped = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = !showInactiveOnly || !item.active;
      return matchesSearch && matchesFilter;
    });

    const map: Record<string, MenuItem[]> = {};
    for (const item of filtered) {
      const cat = getCategoryFromId(item.id);
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return CATEGORY_ORDER
      .filter(cat => map[cat]?.length)
      .map(cat => ({ category: cat, items: map[cat] }));
  }, [items, searchTerm, showInactiveOnly]);

  const unsavedCount = Object.keys(pendingPrices).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Menu Management</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Edit prices and toggle item availability in real-time
              </p>
            </div>
            <div className="flex gap-3 text-center shrink-0">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <p className="text-2xl font-bold text-red-700">{stats.inactive}</p>
                <p className="text-xs text-red-600">Disabled</p>
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {unsavedCount > 0 && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {unsavedCount} unsaved price change{unsavedCount > 1 ? 's' : ''} — press <strong>Save</strong> on each row to apply.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name or ID…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showInactiveOnly ? "default" : "outline"}
            onClick={() => setShowInactiveOnly(v => !v)}
            size="sm"
            className="whitespace-nowrap"
          >
            {showInactiveOnly ? "Showing Disabled Only" : "Show Disabled Only"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No items match your search</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ category, items: catItems }) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{category}</CardTitle>
                    <CardDescription>{catItems.length} item{catItems.length !== 1 ? 's' : ''}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-border">
                    {catItems.map((item, idx) => {
                      const isDirty = pendingPrices[item.id] !== undefined;
                      const isSaving = savingIds.has(item.id);
                      const displayPrice = pendingPrices[item.id] ?? item.price.toFixed(2);

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 py-3 ${!item.active ? 'opacity-50' : ''}`}
                        >
                          {/* Active toggle */}
                          <Switch
                            checked={item.active}
                            onCheckedChange={() => toggleActive(item.id, item.active)}
                            aria-label={`Toggle ${item.name}`}
                          />

                          {/* Name + ID */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${!item.active ? 'line-through text-muted-foreground' : ''}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                          </div>

                          {/* Status badge */}
                          <Badge
                            variant={item.active ? "default" : "secondary"}
                            className={`shrink-0 text-xs ${item.active ? 'bg-green-600' : 'bg-gray-400'}`}
                          >
                            {item.active ? 'Active' : 'Off'}
                          </Badge>

                          {/* Price input */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.25"
                              min="0"
                              value={displayPrice}
                              onChange={e => setPendingPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && savePrice(item)}
                              className={`w-20 text-right text-sm h-8 ${isDirty ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
                            />
                            {isDirty && (
                              <Button
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => savePrice(item)}
                                disabled={isSaving}
                              >
                                {isSaving
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Save className="h-3 w-3" />
                                }
                              </Button>
                            )}
                            {!isDirty && !isSaving && (
                              <div className="w-[52px] flex items-center justify-center">
                                <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
