import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-illustration.png";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

export const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useLanguage();
  const { cartCount } = useCart();

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={logo} 
              alt="Ricos Tacos" 
              className="h-14 w-14 lg:h-20 lg:w-20 transition-transform group-hover:scale-105 rounded-lg"
            />
            <div className="hidden lg:flex flex-col items-start">
              <span className="font-serif text-sm font-semibold tracking-wider text-foreground/80 uppercase">
                Piaxtla es México Deli
              </span>
              <span className="font-playfair text-3xl font-black tracking-tight bg-gradient-to-r from-serape-red via-serape-pink to-serape-orange bg-clip-text text-transparent group-hover:from-serape-orange group-hover:via-serape-yellow group-hover:to-serape-red transition-all duration-500">
                Ricos Tacos
              </span>
              <div className="mt-1 w-full">
                <div className="h-2 w-full flex">
                  <div className="flex-1" style={{ backgroundColor: '#00BCD4' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#E31E24' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FF1493' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#92278F' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#0071BC' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#57B947' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FDB913' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#F68D2E' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#E31E24' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#00BCD4' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FF1493' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#92278F' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#0071BC' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#57B947' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FDB913' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#F68D2E' }}></div>
                  <div className="w-1 bg-black"></div>
                  <div className="flex-1" style={{ backgroundColor: '#E31E24' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#FF1493' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#92278F' }}></div>
                  <div className="flex-1" style={{ backgroundColor: '#00BCD4' }}></div>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/"
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/") ? "text-primary" : "text-foreground"} after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-serape-cyan after:via-serape-pink after:to-serape-yellow after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300`}
                    >
                      {t("nav.home")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/menu"
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/menu") ? "text-primary" : "text-foreground"} after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-serape-red after:via-serape-orange after:to-serape-yellow after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300`}
                    >
                      {t("nav.fullMenu")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/order"
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/order") ? "text-primary" : "text-foreground"} after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-serape-pink after:via-serape-purple after:to-serape-blue after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300`}
                    >
                      {t("nav.orderOnline")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/location"
                      className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${isActive("/location") ? "text-primary" : "text-foreground"} after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-serape-green after:via-serape-yellow after:to-serape-orange after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300`}
                    >
                      {t("nav.location")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <LanguageSwitch />

            {isAuthenticated ? (
              <Link to="/profile">
                <Button variant="outline" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}

            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className={`text-sm font-medium ${isActive("/") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/menu"
                className={`text-sm font-medium ${isActive("/menu") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.fullMenu")}
              </Link>
              <Link
                to="/order"
                className={`text-sm font-medium ${isActive("/order") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.orderOnline")}
              </Link>
              <Link
                to="/location"
                className={`text-sm font-medium ${isActive("/location") ? "text-primary" : "text-foreground"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.location")}
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className={`text-sm font-medium ${isActive("/profile") ? "text-primary" : "text-foreground"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className={`text-sm font-medium ${isActive("/signin") ? "text-primary" : "text-foreground"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
              <Link
                to="/cart"
                className="text-sm font-medium text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.cart")}
              </Link>
              <div className="pt-2">
                <LanguageSwitch />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
