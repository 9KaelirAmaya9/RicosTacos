import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { ConfettiBackground } from "@/components/ConfettiBackground";
import { OrderLink } from "@/components/OrderLink";
import { menuItems, menuCategories, type MenuItem } from "@/data/menuData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Filter, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMenuAvailability } from "@/hooks/useMenuAvailability";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** "Español / English" → texto en el idioma activo (y el otro como secundario). */
const splitBilingual = (text: string, language: "en" | "es") => {
  const idx = text.indexOf(" / ");
  if (idx < 0) return { primary: text, secondary: undefined };
  const es = text.slice(0, idx).trim();
  const en = text.slice(idx + 3).trim();
  return language === "es" ? { primary: es, secondary: en } : { primary: en, secondary: es };
};

const formatPrice = (n: number) => `$${n.toFixed(2)}`;

const MenuCard = ({ item, language, t }: { item: MenuItem; language: "en" | "es"; t: (k: string) => string }) => {
  const name = splitBilingual(item.name, language);
  const description = item.description ? splitBilingual(item.description, language).primary : undefined;

  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 group border-2 border-transparent hover:border-serape-red/30 bg-card flex flex-col">
      {item.image ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={item.image}
            alt={`${name.primary} at Ricos Tacos Brooklyn`}
            loading="lazy"
            width="400"
            height="300"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-serape-yellow/20 via-serape-pink/10 to-serape-red/20">
          <span className="font-serif text-2xl font-semibold text-foreground/70 px-6 text-center">{name.primary}</span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-serif text-xl font-semibold group-hover:text-serape-red transition-colors duration-300">
          {name.primary}
        </h3>
        {name.secondary && <p className="text-xs text-muted-foreground mb-2">{name.secondary}</p>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}

        {item.groups.length > 0 && (
          <details className="group/opts text-sm mb-4">
            <summary className="cursor-pointer list-none flex items-center gap-1 font-medium text-serape-red select-none">
              {t("menu.options")}
              <ChevronDown className="h-4 w-4 transition-transform group-open/opts:rotate-180" />
            </summary>
            <div className="mt-3 space-y-3">
              {item.groups.map((g) => (
                <div key={g.name}>
                  <p className="font-semibold text-foreground">
                    {splitBilingual(g.name, language).primary}{" "}
                    <span className="font-normal text-xs text-muted-foreground">
                      ({g.required ? t("menu.required") : t("menu.optional")}
                      {g.max > 1 ? ` · max ${g.max}` : ""})
                    </span>
                  </p>
                  <ul className="mt-1 grid grid-cols-1 gap-0.5 text-muted-foreground">
                    {g.options.map((o) => (
                      <li key={o.name} className="flex justify-between gap-3">
                        <span>{splitBilingual(o.name, language).primary}</span>
                        {o.price > 0 && <span className="whitespace-nowrap">+{formatPrice(o.price)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="mt-auto flex flex-wrap gap-2 items-center justify-between pt-4 border-t border-serape-red/20">
          <span className="text-2xl font-semibold bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent">
            {formatPrice(item.price)}
          </span>
          <OrderLink>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-serape-red to-serape-pink hover:from-serape-pink hover:to-serape-purple shadow-elegant">
              <ShoppingBag className="h-4 w-4" />
              {t("menu.order")}
            </Button>
          </OrderLink>
        </div>
      </div>
    </Card>
  );
};

const Menu = () => {
  const { t, language } = useLanguage();
  const { inactiveIds } = useMenuAvailability();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Datos estructurados para resultados enriquecidos de Google
  const menuSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Ricos Tacos Full Menu",
    "url": "https://losricostacos.com/menu",
    "hasMenuSection": menuCategories.map(category => ({
      "@type": "MenuSection",
      "name": category,
      "hasMenuItem": menuItems
        .filter(item => item.category === category)
        .map(item => ({
          "@type": "MenuItem",
          "name": item.name,
          ...(item.description ? { "description": item.description } : {}),
          "offers": {
            "@type": "Offer",
            "price": item.price.toFixed(2),
            "priceCurrency": "USD",
          },
        })),
    })).filter(section => section.hasMenuItem.length > 0),
  }), []);

  const filteredCategories = useMemo(
    () => menuCategories.filter(category => selectedCategory === "all" || category === selectedCategory),
    [selectedCategory],
  );

  // Excluye los platos marcados como agotados (86) por cocina/admin
  const categoryItemsMap = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    menuCategories.forEach(category => {
      const items = menuItems.filter(item => item.category === category && !inactiveIds.has(item.id));
      if (items.length > 0) map.set(category, items);
    });
    return map;
  }, [inactiveIds]);

  return (
    <>
    <SEO
      title="Full Menu - Tacos, Tortas & More | Ricos Tacos Brooklyn"
      description="Browse our full menu of authentic Mexican tacos, tortas, quesadillas, platillos, seafood and soups. Order online at Ricos Tacos in Sunset Park, Brooklyn."
      canonicalPath="/menu"
    />
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(menuSchema)}</script>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
          { "@type": "ListItem", "position": 2, "name": "Menu", "item": "https://losricostacos.com/menu" }
        ]
      })}</script>
    </Helmet>
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 festive-pattern relative">
      <ConfettiBackground />
      <SerapeStripe />
      <Navigation />

      <div id="main-content" className="pt-24 sm:pt-28 md:pt-32 pb-20 md:pb-0">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
              {t("menu.title")} <span className="text-primary">{t("menu.titleHighlight")}</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 mb-6">
              {t("menu.subtitle")}
            </p>
            <OrderLink>
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t("nav.orderOnline")}
              </Button>
            </OrderLink>
          </div>

          <div className="sticky top-20 sm:top-24 z-30 bg-background/95 backdrop-blur-sm py-4 mb-8 -mx-4 px-4 border-y border-border shadow-sm">
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 bg-card border-2 border-border hover:border-primary/50 transition-colors">
                  <SelectValue placeholder={t("menu.allCategories")} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">{t("menu.allCategories")}</SelectItem>
                  {menuCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {splitBilingual(category, language).primary}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-20">
            {filteredCategories.map((category) => {
              const categoryItems = categoryItemsMap.get(category);
              if (!categoryItems) return null;

              return (
                <section key={category} id={category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8 pb-4 border-b-4 bg-gradient-to-r from-serape-red via-serape-pink to-serape-purple bg-clip-text text-transparent" style={{ borderImage: "var(--gradient-serape-full) 1" }}>
                    {splitBilingual(category, language).primary}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {categoryItems.map((item) => (
                      <MenuCard key={item.id} item={item} language={language} t={t} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-16 p-5 sm:p-8 bg-card rounded-xl border-2 border-border shadow-soft">
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
    </div>
    </>
  );
};

export default Menu;
