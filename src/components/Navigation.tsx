import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import logoGreen from "@/assets/logo-header-green.png";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./ui/navigation-menu";

// Serape stripe pattern — matches the sign's colorful border
const SerapeStripe = ({ className = "" }: { className?: string }) => (
  <div className={`flex w-full overflow-hidden ${className}`} aria-hidden="true">
    {[
      '#E31E24','#FF1493','#92278F','#0071BC','#57B947',
      '#FDB913','#F68D2E','#000000','#00BCD4','#E31E24',
      '#FF1493','#92278F','#0071BC','#57B947','#FDB913',
      '#F68D2E','#000000','#00BCD4','#E31E24','#FF1493',
      '#92278F','#0071BC','#57B947','#FDB913','#F68D2E',
    ].map((color, i) => (
      <div key={i} className="flex-1 min-w-0" style={{ backgroundColor: color }} />
    ))}
  </div>
);

export const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useLanguage();
  const { cartCount } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/menu", label: t("nav.fullMenu") },
    { to: "/order", label: t("nav.orderOnline") },
    { to: "/location", label: t("nav.location") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      {/* Top serape stripe */}
      <SerapeStripe className="h-1.5" />

      <div className="container mx-auto px-3 sm:px-4">
        {/* Fix: h-16 mobile, h-20 desktop — h-18 is not a default Tailwind class */}
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-3 group flex-shrink-0"
            aria-label="Ricos Tacos — Home"
          >
            {/* Sign photo thumbnail */}
            <div
              className="relative flex-shrink-0 rounded-lg overflow-hidden shadow-md border-2 border-[#E31E24] bg-[#8BC34A] transition-transform duration-300 origin-left group-hover:scale-105"
              style={{ height: 'clamp(2.75rem, 5vw, 4rem)', width: 'clamp(2.75rem, 5vw, 4rem)' }}
            >
              <img
                src={logoGreen}
                alt="Ricos Tacos sign"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Text lockup — lime green bg panel like the sign */}
            <div
              className="flex flex-col justify-center rounded-md px-2 py-1"
              style={{
                gap: '2px',
                background: '#8BC34A',
                border: '2px solid #E31E24',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            >
              {/* Subtitle — italic script like the sign's "Piaxtla es México Deli" */}
              <span
                style={{
                  fontFamily: "'Lobster Two', 'Dancing Script', 'Pacifico', cursive",
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 'clamp(8px, 1.7vw, 11px)',
                  color: '#c0392b',
                  lineHeight: 1,
                  display: 'block',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 0 rgba(255,255,255,0.4)',
                }}
              >
                Piaxtla es México Deli
              </span>

              {/* "Ricos Tacos" SVG — big chunky block letters like the sign */}
              <svg
                viewBox="0 0 230 48"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Ricos Tacos"
                style={{
                  width: 'clamp(145px, 29vw, 215px)',
                  height: 'auto',
                  display: 'block',
                  overflow: 'visible',
                  marginLeft: '-2px',
                }}
              >
                <defs>
                  <filter id="signShadow" x="-5%" y="-5%" width="120%" height="140%">
                    <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="#7a0000" floodOpacity="1" />
                  </filter>
                </defs>
                {/* White outline — very thick, rounded like the sign */}
                <text
                  x="4" y="40"
                  textAnchor="start"
                  fontFamily="'Chewy', 'Lilita One', 'Titan One', cursive"
                  fontSize="42"
                  fontWeight="400"
                  fill="none"
                  stroke="white"
                  strokeWidth="10"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  Ricos Tacos
                </text>
                {/* Red fill */}
                <text
                  x="4" y="40"
                  textAnchor="start"
                  fontFamily="'Chewy', 'Lilita One', 'Titan One', cursive"
                  fontSize="42"
                  fontWeight="400"
                  fill="#E31E24"
                  filter="url(#signShadow)"
                >
                  Ricos Tacos
                </text>
              </svg>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map(({ to, label }) => (
                  <NavigationMenuItem key={to}>
                    <NavigationMenuLink asChild>
                      <Link
                        to={to}
                        className={`relative px-3 lg:px-4 py-2 text-sm font-medium transition-colors duration-200
                          ${isActive(to) ? "text-[#E31E24]" : "text-foreground hover:text-[#E31E24]"}
                          after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full
                          after:bg-gradient-to-r after:from-[#E31E24] after:via-[#FF1493] after:to-[#FDB913]
                          after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300`}
                      >
                        {label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <LanguageSwitch />

            {isAuthenticated ? (
              <Link to="/profile">
                <Button variant="outline" size="icon" aria-label="Profile">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/signin">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            )}

            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative" aria-label={`Cart (${cartCount} items)`}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#E31E24] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* ── Mobile: cart badge + hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/cart" aria-label={`Cart (${cartCount} items)`}>
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#E31E24] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            <button
              className="p-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen
                ? <X className="h-6 w-6" />
                : <Menu className="h-6 w-6" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-md">
          <SerapeStripe className="h-1" />

          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-1 mb-4">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center px-3 py-3.5 rounded-lg text-base font-medium transition-colors
                    ${isActive(to)
                      ? "bg-[#E31E24]/10 text-[#E31E24]"
                      : "text-foreground hover:bg-muted hover:text-[#E31E24]"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3 py-3.5 rounded-lg text-base font-medium transition-colors
                    ${isActive("/profile") ? "bg-[#E31E24]/10 text-[#E31E24]" : "text-foreground hover:bg-muted"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className={`flex items-center px-3 py-3.5 rounded-lg text-base font-medium transition-colors
                    ${isActive("/signin") ? "bg-[#E31E24]/10 text-[#E31E24]" : "text-foreground hover:bg-muted"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </nav>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Language</span>
              <LanguageSwitch />
            </div>
          </div>

          <SerapeStripe className="h-1" />
        </div>
      )}

      {/* Bottom serape stripe */}
      <SerapeStripe className="h-1" />
    </nav>
  );
};
