import { menuItems } from "@/data/menuData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// Category translations
const categoryTranslations: Record<string, string> = {
  "Desayunos Mexicanos": "Mexican Breakfasts",
  "Tacos": "Tacos",
  "Taquitos": "Small Tacos",
  "Tostadas": "Tostadas",
  "Tortas": "Mexican Sandwiches",
  "Burritos": "Burritos",
  "Sopas": "Soups",
  "Platillos": "Main Dishes",
  "Antojitos Mexicanos": "Mexican Snacks",
  "Kids Menu": "Kids Menu",
  "Side Orders": "Side Orders",
  "Fines de Semana": "Weekend Specials",
  "Quesadillas": "Quesadillas",
  "Bebidas": "Drinks",
  "Postres": "Desserts",
};

export default function MenuCatalog() {
  const { language } = useLanguage();
  
  const handlePrint = () => {
    window.print();
  };

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="min-h-screen bg-background">
      {/* Print button - hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Catalog content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12 border-b-4 border-primary pb-8">
          <h1 className="text-5xl font-bold text-primary mb-4">
            Ricos Tacos Poblanos
          </h1>
          <p className="text-2xl text-muted-foreground">
            {language === "es" ? "Menú Completo" : "Complete Menu"}
          </p>
        </div>

        {/* Menu items by category */}
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} className="mb-16 break-inside-avoid">
            {/* Category header */}
            <h2 className="text-3xl font-bold text-primary mb-8 pb-2 border-b-2 border-primary/30">
              {language === "es" ? category : categoryTranslations[category] || category}
            </h2>

            {/* Items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-border rounded-lg break-inside-avoid"
                >
                  {/* Item image */}
                  {item.image && (
                    <div className="flex-shrink-0 w-32 h-32 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.description}
                      </p>
                    )}

                    {item.bestSeller && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
                        {language === "es" ? "Más Vendido" : "Best Seller"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t-2 border-primary/30">
          <p className="text-lg text-muted-foreground">
            {language === "es" 
              ? "Gracias por elegirnos • Todos los precios están sujetos a cambios"
              : "Thank you for choosing us • All prices subject to change"}
          </p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
