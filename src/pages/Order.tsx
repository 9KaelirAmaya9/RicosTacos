import { Navigation } from "@/components/Navigation";
import { ConfettiBackground } from "@/components/ConfettiBackground";
import { menuItems, menuCategories } from "@/data/menuData";
import { getMenuItemName, getMenuItemDescription } from "@/data/menuTranslations";
import { getCategoryTranslation } from "@/data/translations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlavorSelectionDialog } from "@/components/FlavorSelectionDialog";
import { MenuItemModal } from "@/components/MenuItemModal";
import { Plus, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Order = () => {
  const { t, language } = useLanguage();
  const { orderType, setOrderType, addToCart } = useCart();
  const [flavorDialogOpen, setFlavorDialogOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ id: string; name: string; price: number; image?: string } | null>(null);
  const [menuItemModalOpen, setMenuItemModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);

  // Get all unique top categories
  const allTopCategories = Array.from(new Set(menuItems.map(item => item.topCategory)));
  
  // State for selected categories (all checked by default)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(allTopCategories));
  
  // State for collapsed category groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleAddToCart = (item: { id: string; name: string; price: number; image?: string }) => {
    // Check if this is the fried chicken wings (k7)
    if (item.id === "k7") {
      setPendingItem(item);
      setFlavorDialogOpen(true);
    } else {
      addToCart(item);
    }
  };

  const handleFlavorSelect = (flavor: string) => {
    if (pendingItem) {
      const flavorLabel = flavor === "mango-habanero" ? "Mango Habanero" 
                        : flavor === "buffalo" ? "Buffalo" 
                        : "BBQ";
      addToCart({
        ...pendingItem,
        name: `${pendingItem.name} (${flavorLabel})`
      });
      setPendingItem(null);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  // Group items by topCategory and subcategory, filtering by selected categories
  const groupedItems = menuItems
    .filter(item => selectedCategories.has(item.topCategory))
    .reduce((acc, item) => {
      if (!acc[item.topCategory]) {
        acc[item.topCategory] = {};
      }
      if (!acc[item.topCategory][item.subcategory]) {
        acc[item.topCategory][item.subcategory] = [];
      }
      acc[item.topCategory][item.subcategory].push(item);
      return acc;
    }, {} as Record<string, Record<string, typeof menuItems>>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative">
      <Navigation />
      
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            {t("order.title")} <span className="text-primary">{t("order.titleHighlight")}</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
            {t("order.subtitle")}
          </p>

          {/* Order Type Selection */}
          <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "pickup" | "delivery")} className="max-w-md mx-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pickup">{t("order.pickup")}</TabsTrigger>
              <TabsTrigger value="delivery">{t("order.delivery")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 3-Column Layout: Filter | Menu Grid | Spacer */}
        <div className="flex gap-4 px-4">
          {/* Left Filter Sidebar - Sticky & Scrollable */}
          <aside 
            className="sticky top-20 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg hidden lg:block overflow-y-auto z-10"
            style={{ 
              width: 'calc(10% + 2rem)', 
              minWidth: '200px',
              maxHeight: 'calc(100vh - 6rem)'
            }}
          >
            <h3 className="font-semibold text-lg mb-4 text-center border-b border-border pb-2">
              {t("order.filterBy")}
            </h3>
            
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
                          .filter(item => item.topCategory === category)
                          .reduce((acc, item) => {
                            if (!acc.includes(item.subcategory)) {
                              acc.push(item.subcategory);
                            }
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

          {/* Center Menu Grid */}
          <main className="flex-1 mx-auto w-full lg:max-w-[calc(80%-4rem)]">
            <div className="space-y-16">
              {Object.entries(groupedItems).map(([topCategory, subcategories]) => (
                <div key={topCategory}>
                  {/* Top Category Header with Centered Stripe */}
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

                  {/* Subcategories */}
                  <div className="space-y-12">
                    {Object.entries(subcategories).map(([subcategory, items]) => {
                      const SubcategorySection = () => {
                        const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
                        
                        return (
                          <div key={subcategory} ref={ref}>
                            {/* Subcategory Header with Centered Stripe */}
                            <div className={cn(
                              "mb-6 text-center transition-all duration-700",
                              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                            )}>
                              <h3 className="font-serif text-2xl md:text-3xl font-semibold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent mb-2">
                                {subcategory}
                              </h3>
                              <div className="h-0.5 w-24 mx-auto rounded-full bg-gradient-to-r from-serape-orange via-serape-yellow to-serape-green"></div>
                            </div>

                            {/* Items Grid - 5 columns on desktop/tablet, 1 on mobile */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 justify-items-center">
                              {items.map((item, index) => {
                                const ItemCard = () => {
                                  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation({ 
                                    threshold: 0.1,
                                    rootMargin: "-50px"
                                  });
                                  
                                  const handleCardClick = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedMenuItem({
                                      id: item.id,
                                      name: getMenuItemName(item.id, language, item.name),
                                      description: item.description ? getMenuItemDescription(item.id, language, item.description) : undefined,
                                      price: item.price,
                                      image: item.image,
                                      bestSeller: item.bestSeller,
                                      subcategory: item.subcategory
                                    });
                                    setMenuItemModalOpen(true);
                                  };
                                  
                                  return (
                                     <div
                                      ref={cardRef}
                                      className={cn(
                                        "w-full max-w-xs transition-all duration-500 cursor-pointer",
                                        cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                      )}
                                      style={{ transitionDelay: `${index * 50}ms` }}
                                      onClick={handleCardClick}
                                    >
                                      <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 group flex flex-col border-2 border-transparent hover:border-primary/10 bg-card h-full pointer-events-auto">
                                        {item.image && (
                                          <div className="relative h-40 md:h-36 overflow-hidden flex-shrink-0">
                                            <img 
                                              src={item.image} 
                                              alt={item.name}
                                              loading="lazy"
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-serape-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            {/* AI Generated watermark */}
                                            <div className="absolute bottom-2 right-2 text-[8px] text-white/30 font-mono tracking-tight backdrop-blur-[2px] px-1.5 py-0.5 rounded bg-black/10">
                                              AI
                                            </div>
                                            {item.bestSeller && (
                                              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-serape-yellow to-serape-orange text-white shadow-glow gap-1 border-0">
                                                <Star className="h-3 w-3 fill-current" />
                                                Best
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                        <div className="p-4 flex flex-col flex-1 bg-card">
                                          {/* Name First */}
                                          <h3 className="font-serif text-base md:text-lg font-semibold line-clamp-2 mb-2">
                                            {getMenuItemName(item.id, language, item.name)}
                                            {item.bestSeller && !item.image && (
                                              <Badge className="ml-2 gap-1 bg-gradient-to-r from-serape-yellow to-serape-orange text-white border-0 text-xs">
                                                <Star className="h-3 w-3 fill-current" />
                                                Best
                                              </Badge>
                                            )}
                                          </h3>
                                          
                                          {/* Description Second */}
                                          {item.description && (
                                            <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
                                              {getMenuItemDescription(item.id, language, item.description)}
                                            </p>
                                          )}
                                          
                                          {/* Price Right Above Cart */}
                                          <div className="mt-auto space-y-2">
                                            <div className="text-center">
                                              <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent">
                                                ${item.price.toFixed(2)}
                                              </span>
                                            </div>
                                            
                                            <Button 
                                              size="sm" 
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('Add to cart clicked:', item.id, item.name);
                                                handleAddToCart({ 
                                                  id: item.id, 
                                                  name: getMenuItemName(item.id, language, item.name), 
                                                  price: item.price,
                                                  image: item.image 
                                                });
                                              }}
                                              className="w-full gap-2 relative z-10"
                                              type="button"
                                            >
                                              <Plus className="h-4 w-4" />
                                              {t("order.addToCart")}
                                            </Button>
                                          </div>
                                        </div>
                                      </Card>
                                    </div>
                                  );
                                };
                                
                                return <ItemCard key={item.id} />;
                              })}
                            </div>
                          </div>
                        );
                      };
                      
                      return <SubcategorySection key={subcategory} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Right Spacer - Same width as filter */}
          <div 
            className="hidden lg:block shrink-0"
            style={{ width: 'calc(10% + 2rem)', minWidth: '200px' }}
          />
        </div>
      </div>

      <FlavorSelectionDialog 
        open={flavorDialogOpen}
        onOpenChange={setFlavorDialogOpen}
        onSelectFlavor={handleFlavorSelect}
        itemName={pendingItem?.name || ""}
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
  );
};

export default Order;
