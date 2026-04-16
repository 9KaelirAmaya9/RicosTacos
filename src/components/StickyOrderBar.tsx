import { Link, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

// Pages where the sticky bar should NOT show
const HIDDEN_PATHS = ["/order", "/cart", "/checkout", "/order-success", "/kitchen", "/admin", "/admin/orders", "/admin/roles", "/admin/passwords", "/kitchen-login", "/signin", "/signup", "/auth", "/profile", "/order-history", "/dashboard"];

export const StickyOrderBar = () => {
  const location = useLocation();

  if (HIDDEN_PATHS.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient fade above bar so content doesn't hard-cut */}
      <div className="h-6 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="bg-[#E31E24] px-4 py-3 shadow-2xl">
        <Link to="/order" className="flex items-center justify-center gap-3 w-full">
          <ShoppingBag className="h-5 w-5 text-white flex-shrink-0" />
          <span className="text-white font-bold text-base tracking-wide">
            Order Now — Pickup or Delivery
          </span>
        </Link>
      </div>
    </div>
  );
};
