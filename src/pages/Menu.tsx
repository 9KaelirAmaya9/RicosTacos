import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { ConfettiBackground } from "@/components/ConfettiBackground";
import { menuItems, menuCategories } from "@/data/menuData";
import { getMenuItemName, getMenuItemDescription } from "@/data/menuTranslations";
import { getCategoryTranslation } from "@/data/translations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlavorSelectionDialog } from "@/components/FlavorSelectionDialog";
import { Plus, Filter } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Menu = () => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const [flavorDialogOpen, setFlavorDialogOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ id: string; name: string; price: number; image?: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleAddToCart = useCallback((item: { id: string; name: string; price: number; image?: string }) => {
    const translatedItem = {
      id: item.id,
      name: getMenuItemName(item.id, language, item.name),
      price: item.price,
      image: item.image,
    };

    // Check if this is the fried chicken wings (k7)
    if (item.id === "k7") {
      setPendingItem(translatedItem);
      setFlavorDialogOpen(true);
    } else {
      addToCart(translatedItem);
    }
  }, [language, addToCart]);

  const handleFlavorSelect = useCallback((flavor: string) => {
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
  }, [pendingItem, addToCart]);

  // Memoize filtered categories for performance
  const filteredCategories = useMemo(() => {
    return menuCategories.filter(
      category => selectedCategory === "all" || category === selectedCategory
    );
  }, [selectedCategory]);

  // Memoize category items mapping
  const categoryItemsMap = useMemo(() => {
    type MenuItemType = typeof menuItems[number];
    const map = new Map<string, MenuItemType[]>();
    menuCategories.forEach(category => {
      const items = menuItems.filter(item => item.category === category);
      if (items.length > 0) {
        map.set(category, items);
      }
    });
    return map;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 festive-pattern relative">
      <ConfettiBackground />
      <SerapeStripe />
      <Navigation />
      
      <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
              {t("menu.title")} <span className="text-primary">{t("menu.titleHighlight")}</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t("menu.subtitle")}
            </p>
          </div>

          {/* Category Filter */}
          <div className="sticky top-20 sm:top-24 z-30 bg-background/95 backdrop-blur-sm py-4 mb-8 -mx-4 px-4 border-y border-border shadow-sm">
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 bg-card border-2 border-border hover:border-primary/50 transition-colors">
                  <SelectValue placeholder={t("menu.filterPlaceholder") || "Filter by category"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">{t("menu.allCategories") || "All Categories"}</SelectItem>
                  {menuCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryTranslation(language, category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Menu by Category */}
          <div className="space-y-20">
            {filteredCategories.map((category) => {
              const categoryItems = categoryItemsMap.get(category);
              
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <section key={category} id={category.toLowerCase().replace(/\s+/g, '-')}>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8 pb-4 border-b-4 bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent" style={{ borderImage: 'var(--gradient-serape-full) 1' }}>
                    {getCategoryTranslation(language, category)}
                  </h2>
                  
                   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {categoryItems.map((item) => (
                       <Card key={item.id} className="overflow-hidden hover:shadow-elegant transition-all duration-300 group border-2 border-transparent hover:border-serape-red/30 bg-card relative before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:bg-gradient-to-br before:from-serape-cyan/5 before:via-serape-pink/5 before:to-serape-yellow/5 before:transition-opacity before:duration-500 before:pointer-events-none">
                         {item.image && (
                           <div className="relative h-48 overflow-hidden">
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
                           </div>
                         )}
                         <div className="p-6 flex flex-col h-full bg-card relative z-10">
                           <div className="flex-1">
                             <h3 className="font-serif text-xl font-semibold mb-2 group-hover:text-serape-red transition-colors duration-300">
                               {getMenuItemName(item.id, language, item.name)}
                             </h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-4">
                                {getMenuItemDescription(item.id, language, item.description)}
                              </p>
                            )}
                          </div>
                          
                           <div className="flex items-center justify-between mt-4 pt-4 border-t border-serape-red/20">
                             <span className="text-2xl font-semibold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent drop-shadow-sm">
                               ${item.price.toFixed(2)}
                             </span>
                             <Button 
                               size="sm" 
                               onClick={() => handleAddToCart(item)}
                               className="gap-2 bg-gradient-to-r from-serape-red to-serape-pink hover:from-serape-pink hover:to-serape-purple shadow-elegant"
                             >
                               <Plus className="h-4 w-4" />
                               {t("menu.add")}
                             </Button>
                           </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mt-16 p-8 bg-card rounded-xl border-2 border-border shadow-soft">
            <h3 className="font-serif text-2xl font-semibold mb-4">{t("menu.notes.title")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• {t("menu.notes.1")}</li>
              <li>• {t("menu.notes.2")}</li>
              <li>• {t("menu.notes.3")}</li>
              <li>• {t("menu.notes.4")}</li>
            </ul>
          </div>
        </div>
      </div>
      <SerapeStripe />

      <FlavorSelectionDialog 
        open={flavorDialogOpen}
        onOpenChange={setFlavorDialogOpen}
        onSelectFlavor={handleFlavorSelect}
        itemName={pendingItem?.name || ""}
      />
    </div>
  );
};

export default Menu;
