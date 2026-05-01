import { ShoppingCart, X, Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";

export const FloatingCartButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { cart, updateQuantity, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCheckout = () => {
    navigate("/cart");
  };

  return (
    <div className="fixed bottom-6 sm:right-6 right-2 z-50 flex flex-col items-end gap-3 pointer-events-none w-auto">
      {/* Expanded Cart Preview */}
      <div className={cn(
        "transition-all duration-300 origin-bottom-right",
        isExpanded ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
      )}>
        <Card className="w-[min(320px,calc(100vw-2rem))] max-h-[500px] flex flex-col shadow-elegant pointer-events-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold">{t("order.yourOrder")}</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label="Close cart preview"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {cart.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t("order.emptyCart")}</p>
              <Link to="/order" onClick={() => setIsExpanded(false)}>
                <Button variant="outline" size="sm" className="mt-4 gap-2">
                  Browse Menu
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-11 w-11"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={item.quantity === 1}
                        onClick={() => {
                          updateQuantity(item.id, -1);
                          const announcer = document.getElementById('sr-announcer');
                          if (announcer) announcer.textContent = `${item.name} quantity updated to ${item.quantity - 1}`;
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-11 w-11"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => {
                          updateQuantity(item.id, 1);
                          const announcer = document.getElementById('sr-announcer');
                          if (announcer) announcer.textContent = `${item.name} quantity updated to ${item.quantity + 1}`;
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center font-semibold">
                  <span>{t("order.total")}</span>
                  <span className="text-primary text-lg">${cartTotal.toFixed(2)}</span>
                </div>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  {t("order.checkout")}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Main Cart Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        size="lg"
        aria-label={isExpanded ? "Close cart" : `Open cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
        aria-expanded={isExpanded}
        className={cn(
          "rounded-full h-16 w-16 p-0 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground relative transition-all duration-200 pointer-events-auto",
          isExpanded && "bg-primary/80"
        )}
      >
        <ShoppingCart className="h-6 w-6" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-background text-foreground border-2 border-primary rounded-full min-w-6 h-6 px-1.5 flex items-center justify-center text-xs font-bold shadow-sm">
            {cartCount}
          </span>
        )}
      </Button>
    </div>
  );
};
