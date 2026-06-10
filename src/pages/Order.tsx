import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { menuItems } from "@/data/menuData";
import { getMenuItemName, getMenuItemDescription } from "@/data/menuTranslations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlavorSelectionDialog } from "@/components/FlavorSelectionDialog";
import { MeatSelectionDialog } from "@/components/MeatSelectionDialog";
import { TostadaSelectionDialog } from "@/components/TostadaSelectionDialog";
import { SmoothieSelectionDialog } from "@/components/SmoothieSelectionDialog";
import { MenuItemModal } from "@/components/MenuItemModal";
import { Plus, Minus, Star, ChevronDown, ChevronUp, Search, X, ShoppingCart } from "lucide-react";
import { useState, useMemo, useRef, useCallback, memo, useDeferredValue } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useMenuAvailability } from "@/hooks/useMenuAvailability";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ── Extracted card components ─────────────────────────────────────────────────
// Defined at module level so React gets a stable component identity across
// parent re-renders. Inline definitions create a brand-new component type on
// every render, forcing a full DOM remount and killing scroll animations.

interface MenuItemData {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  bestSeller?: boolean;
  subcategory: string;
  topCategory: string;
  hasMeatVariants?: boolean;
  hasTostadaVariants?: boolean;
  hasSmoothieVariants?: boolean;
}

interface ItemCardProps {
  item: MenuItemData;
  index: number;
  language: "en" | "es";
  addToCartLabel: string;
  quantity: number;
  onAddToCart: (item: { id: string; name: string; price: number; image?: string }) => void;
  onDecrement: (id: string) => void;
  onOpenModal: (item: {
    id: string; name: string; description?: string; price: number;
    image?: string; bestSeller?: boolean; subcategory: string;
  }) => void;
}

const ItemCard = memo(({ item, index, language, addToCartLabel, quantity, onAddToCart, onDecrement, onOpenModal }: ItemCardProps) => {
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: "-50px"
  });

  return (
    <div
      ref={cardRef}
      className={cn(
        "w-full transition-all duration-500",
        cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 group flex flex-col border-2 border-transparent hover:border-primary/10 bg-card h-full">
        {item.image && (
          <button
            type="button"
            className="relative h-40 md:h-44 overflow-hidden flex-shrink-0 w-full select-none"
            aria-label={`View details for ${getMenuItemName(item.id, language, item.name)}`}
            onClick={() => onOpenModal({
              id: item.id,
              name: getMenuItemName(item.id, language, item.name),
              description: item.description ? getMenuItemDescription(item.id, language, item.description) : undefined,
              price: item.price,
              image: item.image,
              bestSeller: item.bestSeller,
              subcategory: item.subcategory,
            })}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-serape-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute bottom-2 right-2 text-[8px] text-white/30 font-mono tracking-tight backdrop-blur-[2px] px-1.5 py-0.5 rounded bg-black/10 pointer-events-none">
              AI
            </div>
            {item.bestSeller && (
              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-serape-yellow to-serape-orange text-white shadow-glow gap-1 border-0 pointer-events-none">
                <Star className="h-3 w-3 fill-current pointer-events-none" />
                <span className="pointer-events-none">Best</span>
              </Badge>
            )}
          </button>
        )}
        <div className="p-4 flex flex-col flex-1 bg-card">
          <h3 className="font-serif text-base md:text-lg font-semibold line-clamp-2 mb-2">
            {getMenuItemName(item.id, language, item.name)}
            {item.bestSeller && !item.image && (
              <Badge className="ml-2 gap-1 bg-gradient-to-r from-serape-yellow to-serape-orange text-white border-0 text-xs">
                <Star className="h-3 w-3 fill-current" />
                Best
              </Badge>
            )}
          </h3>
          {item.description && (
            <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
              {getMenuItemDescription(item.id, language, item.description)}
            </p>
          )}
          {(item.hasMeatVariants || item.hasTostadaVariants || item.hasSmoothieVariants) && (
            <p className="text-xs text-primary font-medium mb-2">
              {item.hasSmoothieVariants
                ? (language === "es" ? "Elige sabor y tamaño →" : "Choose flavor & size →")
                : (language === "es" ? "Elige tu carne →" : "Choose your meat →")}
            </p>
          )}
          <div className="mt-auto space-y-2">
            <div className="text-center">
              <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent">
                ${item.price.toFixed(2)}
              </span>
            </div>
            {quantity > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onDecrement(item.id)}
                  className="flex-none w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Remove one"
                >
                  <Minus className="h-4 w-4 text-primary" />
                </button>
                <span className="font-bold text-base text-primary tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onAddToCart({
                    id: item.id,
                    name: getMenuItemName(item.id, language, item.name),
                    price: item.price,
                    image: item.image,
                  })}
                  className="flex-none w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Add one more"
                >
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="lg"
                className="w-full gap-2"
                onClick={() => onAddToCart({
                  id: item.id,
                  name: getMenuItemName(item.id, language, item.name),
                  price: item.price,
                  image: item.image,
                })}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <Plus className="h-4 w-4 pointer-events-none" />
                <span className="pointer-events-none">{addToCartLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

interface SubcategorySectionProps {
  subcategory: string;
  items: MenuItemData[];
  language: "en" | "es";
  addToCartLabel: string;
  cartQuantities: Map<string, number>;
  onAddToCart: ItemCardProps['onAddToCart'];
  onDecrement: ItemCardProps['onDecrement'];
  onOpenModal: ItemCardProps['onOpenModal'];
}

const SubcategorySection = memo(({ subcategory, items, language, addToCartLabel, cartQuantities, onAddToCart, onDecrement, onOpenModal }: SubcategorySectionProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={ref}>
      <div className={cn(
        "mb-6 text-center transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent mb-2">
          {subcategory}
        </h3>
        <div className="h-0.5 w-24 mx-auto rounded-full bg-gradient-to-r from-serape-orange via-serape-yellow to-serape-green" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item, index) => (
          <ItemCard
            key={item.id}
            item={item}
            index={index}
            language={language}
            addToCartLabel={addToCartLabel}
            quantity={cartQuantities.get(item.id) ?? 0}
            onAddToCart={onAddToCart}
            onDecrement={onDecrement}
            onOpenModal={onOpenModal}
          />
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const Order = () => {
  const { t, language } = useLanguage();
  const { orderType, setOrderType, addToCart, updateQuantity, cart, cartCount, cartTotal } = useCart();
  const { inactiveIds } = useMenuAvailability();

  // Flavor dialog (chicken wings)
  const [flavorDialogOpen, setFlavorDialogOpen] = useState(false);
  const [pendingFlavor, setPendingFlavor] = useState<{ id: string; name: string; price: number; image?: string } | null>(null);

  // Meat dialog (burritos)
  const [meatDialogOpen, setMeatDialogOpen] = useState(false);
  const [pendingMeat, setPendingMeat] = useState<{ id: string; name: string; price: number; image?: string } | null>(null);

  // Tostada dialog
  const [tostadaDialogOpen, setTostadaDialogOpen] = useState(false);
  const [pendingTostada, setPendingTostada] = useState<{ id: string; name: string; price: number; image?: string } | null>(null);

  // Smoothie dialog
  const [smoothieDialogOpen, setSmoothieDialogOpen] = useState(false);
  const [pendingSmoothie, setPendingSmoothie] = useState<{ id: string; name: string; price: number; image?: string } | null>(null);

  // Item detail modal
  const [menuItemModalOpen, setMenuItemModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);

  // Search — useDeferredValue lets the input stay responsive while the
  // expensive filter/render runs at lower priority (no manual debounce needed).
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchRef = useRef<HTMLInputElement>(null);

  // Category filter (desktop sidebar + mobile pills)
  const popularItems = useMemo(
    () => menuItems.filter(
      item => item.bestSeller && !item.isVariant && item.topCategory !== "Meats & Proteins" && !inactiveIds.has(item.id)
    ),
    [inactiveIds]
  );

  const cartQuantities = useMemo(
    () => new Map(cart.map(ci => [ci.id, ci.quantity])),
    [cart]
  );

  const allTopCategories = useMemo(
    () => Array.from(new Set(
      menuItems
        .filter(i => !i.isVariant && i.topCategory !== "Meats & Proteins")
        .map(item => item.topCategory)
    )),
    []
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(allTopCategories));
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) { next.delete(category); } else { next.add(category); }
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) { next.delete(group); } else { next.add(group); }
      return next;
    });
  };

  const allSelected = selectedCategories.size === allTopCategories.length;
  const toggleAll = () =>
    setSelectedCategories(allSelected ? new Set() : new Set(allTopCategories));

  // Items pipeline: strip variants → exclude 86'd items → apply category filter → apply search.
  // Uses deferredSearchQuery so typing doesn't block the input field.
  const visibleItems = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    return menuItems
      .filter(item => !item.isVariant)
      .filter(item => item.topCategory !== "Meats & Proteins")
      .filter(item => !inactiveIds.has(item.id))
      .filter(item => selectedCategories.has(item.topCategory))
      .filter(item =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
  }, [deferredSearchQuery, selectedCategories, inactiveIds]);

  // Group by topCategory → subcategory (only used when not searching)
  const groupedItems = useMemo(() => {
    if (deferredSearchQuery.trim()) return null;
    return visibleItems.reduce((acc, item) => {
      if (!acc[item.topCategory]) acc[item.topCategory] = {};
      if (!acc[item.topCategory][item.subcategory]) acc[item.topCategory][item.subcategory] = [];
      acc[item.topCategory][item.subcategory].push(item);
      return acc;
    }, {} as Record<string, Record<string, typeof visibleItems>>);
  }, [visibleItems, deferredSearchQuery]);

  const handleAddToCart = useCallback((item: { id: string; name: string; price: number; image?: string }) => {
    // Chicken wing flavors
    if (item.id === "k7") {
      setPendingFlavor(item);
      setFlavorDialogOpen(true);
      return;
    }
    const menuItem = menuItems.find(m => m.id === item.id);
    if (menuItem?.hasMeatVariants) {
      setPendingMeat(item);
      setMeatDialogOpen(true);
      return;
    }
    if (menuItem?.hasTostadaVariants) {
      setPendingTostada(item);
      setTostadaDialogOpen(true);
      return;
    }
    if (menuItem?.hasSmoothieVariants) {
      setPendingSmoothie(item);
      setSmoothieDialogOpen(true);
      return;
    }
    addToCart(item);
  }, [addToCart]);

  const handleDecrement = useCallback((id: string) => {
    updateQuantity(id, -1);
  }, [updateQuantity]);

  const handleFlavorSelect = (flavor: string) => {
    if (!pendingFlavor) return;
    const label = flavor === "mango-habanero" ? "Mango Habanero"
                : flavor === "buffalo" ? "Buffalo"
                : "BBQ";
    addToCart({ ...pendingFlavor, name: `${pendingFlavor.name} (${label})` });
    setPendingFlavor(null);
  };

  const handleMeatSelect = (meat: string) => {
    if (!pendingMeat) return;
    addToCart({ ...pendingMeat, name: `${pendingMeat.name} (${meat})` });
    setPendingMeat(null);
  };

  const handleTostadaMeatSelect = (meat: string) => {
    if (!pendingTostada) return;
    addToCart({ ...pendingTostada, name: `${pendingTostada.name} (${meat})` });
    setPendingTostada(null);
  };

  const handleSmoothieSelect = (flavor: string, size: string, price: number) => {
    if (!pendingSmoothie) return;
    addToCart({ ...pendingSmoothie, name: `Licuado ${flavor} — ${size}`, price });
    setPendingSmoothie(null);
  };

  return (
    <>
    <SEO
      title="Order Online - Pickup & Delivery | Ricos Tacos Brooklyn"
      description="Order authentic Mexican street tacos online for pickup or delivery. Al pastor, birria, carnitas & more. Fast pickup from 505 51st Street, Sunset Park, Brooklyn NY."
      canonicalPath="/order"
    />
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative">
      <Navigation />

      <div id="main-content" className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">

        {/* ── Header: title + pickup/delivery card ── */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            {t("order.title")} <span className="text-primary">{t("order.titleHighlight")}</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
            {t("order.subtitle")}
          </p>

          <div className="max-w-sm mx-auto rounded-xl border-2 border-primary/20 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 text-center">
              How are you getting it?
            </p>
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "pickup" | "delivery")}>
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="pickup" className="text-base font-semibold">{t("order.pickup")}</TabsTrigger>
                <TabsTrigger value="delivery" className="text-base font-semibold">{t("order.delivery")}</TabsTrigger>
              </TabsList>
            </Tabs>
            {orderType === "delivery" && (
              <p className="mt-3 text-xs text-center text-muted-foreground leading-relaxed">
                $5.00 delivery fee · $10.00 minimum · within 20-min drive of Sunset Park
              </p>
            )}
          </div>
        </div>

        {/* ── Popular Items strip ── */}
        {popularItems.length > 0 && !deferredSearchQuery.trim() && (
          <div className="px-4 mb-6">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 text-center">
                Popular Items
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                {popularItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddToCart({ id: item.id, name: item.name, price: item.price, image: item.image })}
                    className="snap-start shrink-0 w-32 sm:w-36 bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 text-left group"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {item.image && (
                      <div className="h-20 sm:h-24 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-semibold line-clamp-1 mb-0.5">{getMenuItemName(item.id, language, item.name)}</p>
                      <p className="text-xs text-primary font-bold">${item.price.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">+ Add</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Search bar (all breakpoints) ── */}
        <div className="px-4 mb-4">
          <div className="relative max-w-xl mx-auto">
            <label htmlFor="menu-search" className="sr-only">Search menu items</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="menu-search"
              ref={searchRef}
              type="search"
              placeholder="Search tacos, burritos, drinks…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile category pills — tap to scroll to section (hidden on lg+) ── */}
        {!deferredSearchQuery.trim() && (
          <div className="lg:hidden px-4 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
              {allTopCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    const el = document.getElementById(`section-${cat.replace(/\s+/g, "-")}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors whitespace-nowrap"
                  style={{ touchAction: 'manipulation' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Sidebar + main grid ── */}
        <div className="px-4 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6 xl:grid-cols-[240px_1fr]">

          {/* Desktop sidebar */}
          <aside
            className="sticky top-20 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg hidden lg:block overflow-y-auto z-10"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            <h3 className="font-semibold text-lg mb-4 text-center border-b border-border pb-2">
              {t("order.filterBy")}
            </h3>

            {/* All toggle */}
            <div className="flex items-center gap-2 p-2 mb-1 hover:bg-accent rounded-md transition-colors cursor-pointer" onClick={toggleAll}>
              <Checkbox
                id="cat-all"
                checked={allSelected}
                onCheckedChange={toggleAll}
                className="shrink-0"
              />
              <label htmlFor="cat-all" className="flex-1 text-sm font-medium cursor-pointer">
                All Categories
              </label>
            </div>

            <div className="space-y-1">
              {allTopCategories.map((category) => {
                const isCollapsed = collapsedGroups.has(category);
                return (
                  <Collapsible
                    key={category}
                    open={!isCollapsed}
                    onOpenChange={() => toggleGroup(category)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.has(category)}
                          onCheckedChange={() => toggleCategory(category)}
                          className="shrink-0"
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="flex-1 text-sm font-medium cursor-pointer"
                        >
                          {category}
                        </label>
                        <CollapsibleTrigger asChild>
                          <button className="p-1 hover:bg-accent-foreground/10 rounded">
                            {isCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="pl-8 space-y-1">
                        {menuItems
                          .filter(item => !item.isVariant && item.topCategory === category)
                          .reduce((acc, item) => {
                            if (!acc.includes(item.subcategory)) acc.push(item.subcategory);
                            return acc;
                          }, [] as string[])
                          .map(subcategory => (
                            <div key={subcategory} className="text-xs text-muted-foreground py-1">
                              {subcategory}
                            </div>
                          ))
                        }
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <main className="w-full min-w-0">

            {/* Search results: flat grid */}
            {deferredSearchQuery.trim() ? (
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  {visibleItems.length === 0
                    ? `No results for "${searchQuery}"`
                    : `${visibleItems.length} result${visibleItems.length !== 1 ? "s" : ""} for "${searchQuery}"`}
                </p>
                {visibleItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {visibleItems.map((item, index) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        language={language}
                        addToCartLabel={t("order.addToCart")}
                        quantity={cartQuantities.get(item.id) ?? 0}
                        onAddToCart={handleAddToCart}
                        onDecrement={handleDecrement}
                        onOpenModal={(modalItem) => {
                          setSelectedMenuItem(modalItem);
                          setMenuItemModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Normal grouped view */
              <div className="space-y-16">
                {groupedItems && Object.entries(groupedItems).map(([topCategory, subcategories]) => (
                  <div key={topCategory} id={`section-${topCategory.replace(/\s+/g, "-")}`}>
                    <div className="mb-8 text-center">
                      <h2 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent mb-3">
                        {topCategory}
                      </h2>
                      <div className="h-1.5 w-32 mx-auto rounded-full overflow-hidden flex">
                        <div className="flex-1 bg-serape-cyan"></div>
                        <div className="flex-1 bg-serape-red"></div>
                        <div className="flex-1 bg-serape-pink"></div>
                        <div className="flex-1 bg-serape-purple"></div>
                        <div className="flex-1 bg-serape-blue"></div>
                        <div className="flex-1 bg-serape-green"></div>
                        <div className="flex-1 bg-serape-yellow"></div>
                        <div className="flex-1 bg-serape-orange"></div>
                      </div>
                    </div>

                    <div className="space-y-12">
                      {Object.entries(subcategories).map(([subcategory, items]) => (
                        <SubcategorySection
                          key={subcategory}
                          subcategory={subcategory}
                          items={items}
                          language={language}
                          addToCartLabel={t("order.addToCart")}
                          cartQuantities={cartQuantities}
                          onAddToCart={handleAddToCart}
                          onDecrement={handleDecrement}
                          onOpenModal={(modalItem) => {
                            setSelectedMenuItem(modalItem);
                            setMenuItemModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Sticky mini-cart bar ── appears once the user adds their first item */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
          <Link
            to="/cart"
            className="pointer-events-auto flex items-center justify-between max-w-lg mx-auto bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 shadow-2xl hover:bg-primary/90 transition-colors animate-fade-in"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              </div>
              <span className="font-semibold text-sm">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">${cartTotal.toFixed(2)}</span>
              <span className="text-sm opacity-90">→ View Cart</span>
            </div>
          </Link>
        </div>
      )}

      <FlavorSelectionDialog
        open={flavorDialogOpen}
        onOpenChange={setFlavorDialogOpen}
        onSelectFlavor={handleFlavorSelect}
        itemName={pendingFlavor?.name || ""}
      />

      <MeatSelectionDialog
        open={meatDialogOpen}
        onOpenChange={setMeatDialogOpen}
        onSelectMeat={handleMeatSelect}
        itemName={pendingMeat?.name || "Burrito"}
      />

      <TostadaSelectionDialog
        open={tostadaDialogOpen}
        onOpenChange={setTostadaDialogOpen}
        onSelectMeat={handleTostadaMeatSelect}
      />

      <SmoothieSelectionDialog
        open={smoothieDialogOpen}
        onOpenChange={setSmoothieDialogOpen}
        onSelect={handleSmoothieSelect}
      />

      {selectedMenuItem && (
        <MenuItemModal
          open={menuItemModalOpen}
          onOpenChange={setMenuItemModalOpen}
          item={selectedMenuItem}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
    </>
  );
};

export default Order;
