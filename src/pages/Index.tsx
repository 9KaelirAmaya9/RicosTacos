import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { FloatingIngredients } from "@/components/FloatingIngredients";
import { FloatingShapes } from "@/components/FloatingShapes";
import { PapelPicado } from "@/components/PapelPicado";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef } from "react";
import heroImage from "@/assets/hero-tacos.jpg";
import interiorImage from "@/assets/puebla-traditional.jpg";
import logo from "@/assets/logo-illustration.png";

const Index = () => {
  const { t } = useLanguage();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-animate");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <>
    <SEO
      title="Ricos Tacos Brooklyn - Authentic Mexican Street Tacos | Order Online"
      description="Authentic Mexican street tacos in Sunset Park, Brooklyn NY. Order al pastor, birria, carnitas & more for pickup or delivery. 505 51st Street. (718) 633-4816."
      canonicalPath="/"
    />
    <div className="min-h-screen">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <SerapeStripe />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" aria-label="Hero">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Authentic Mexican street tacos with fresh cilantro, onions, and lime on traditional corn tortillas at Ricos Tacos Brooklyn"
            className="w-full h-full object-cover"
            fetchPriority="high"
            width="1920"
            height="1080"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>
        
          <div className="relative z-10 container mx-auto px-4 text-center">
            <FloatingIngredients />
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 text-white text-balance leading-tight drop-shadow-2xl animate-fade-in">
              {t("home.hero.title1")}
              <br />
              <span className="bg-gradient-to-r from-serape-red via-serape-pink to-serape-orange bg-clip-text text-transparent drop-shadow-lg">{t("home.hero.title2")}</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto mb-8 sm:mb-12 font-light drop-shadow-lg px-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center px-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Link to="/order" className="w-full sm:w-auto">
                <Button variant="pulse" size="lg" className="text-base font-semibold w-full sm:min-w-[200px] pulse-glow-btn">
                  {t("home.hero.orderNow")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/menu" className="w-full sm:w-auto">
                <Button variant="glow" size="lg" className="text-base font-medium w-full sm:min-w-[200px]">
                  {t("home.hero.viewMenu")}
                </Button>
              </Link>
            </div>
          </div>
      </section>

      {/* About Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 texture-warm relative overflow-hidden" aria-labelledby="about-heading">
        <FloatingShapes />
        {/* Decorative corner accents with flowing border */}
        <div className="absolute top-0 left-0 w-24 h-24 rounded-br-full overflow-hidden" aria-hidden="true">
          <div className="w-full h-full serape-border-flow opacity-20"></div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full overflow-hidden" aria-hidden="true">
          <div className="w-full h-full serape-border-flow opacity-20"></div>
        </div>
        
        <PapelPicado />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <article className="space-y-4 sm:space-y-6 animate-on-scroll">
              <h2 id="about-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                {t("home.about.title1")}
                <br />
                <span className="bg-gradient-to-r from-serape-purple via-serape-blue to-serape-green bg-clip-text text-transparent">{t("home.about.title2")}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                {t("home.about.p1")}
              </p>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                {t("home.about.p2")}
              </p>
              <Link to="/menu" aria-label="Explore our authentic Mexican menu">
                <Button size="lg" variant="glow" className="mt-4 sm:mt-6 w-full sm:w-auto">
                  {t("home.about.exploreMenu")}
                </Button>
              </Link>
            </article>
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-elegant group animate-on-scroll">
              <div className="absolute inset-0 serape-border-flow opacity-0 group-hover:opacity-30 transition-opacity duration-500 z-10 pointer-events-none"></div>
              <img 
                src={interiorImage} 
                alt="Traditional Puebla-style Mexican restaurant interior with authentic decor at Ricos Tacos Brooklyn" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                width="800"
                height="500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-card pattern-tile relative overflow-hidden" aria-labelledby="features-heading">
        <FloatingShapes />
        {/* Decorative corner accents with flowing border */}
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-tr-full overflow-hidden" aria-hidden="true">
          <div className="w-full h-full serape-border-flow opacity-20"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-36 h-36 rounded-tl-full overflow-hidden" aria-hidden="true">
          <div className="w-full h-full serape-border-flow opacity-20"></div>
        </div>
        
        {/* Mexican folk art accents */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-pulse">⚡</div>
        <div className="absolute top-20 right-20 text-4xl opacity-20 animate-pulse" style={{ animationDelay: "0.5s" }}>✨</div>
        <div className="absolute bottom-20 left-1/4 text-4xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }}>🌟</div>
        
        <PapelPicado />
        
        <div className="container mx-auto px-4">
          <header className="text-center mb-12 sm:mb-16 animate-on-scroll">
            <h2 id="features-heading" className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              {t("home.why.title")} <span className="bg-gradient-to-r from-serape-red via-serape-yellow to-serape-green bg-clip-text text-transparent">{t("home.why.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
              {t("home.why.subtitle")}
            </p>
          </header>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <article className="animate-on-scroll bg-background p-6 sm:p-8 rounded-xl shadow-card hover:shadow-elegant transition-all duration-300 border border-border hover:border-transparent hover:bg-gradient-to-br hover:from-serape-red/10 hover:via-serape-pink/10 hover:to-serape-purple/10 relative group overflow-hidden">
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-serape-red group-hover:via-serape-pink group-hover:to-serape-purple rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '2px' }} aria-hidden="true"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-gradient-to-br group-hover:from-serape-red/20 group-hover:via-serape-pink/20 group-hover:to-serape-purple/20 transition-colors" aria-hidden="true">
                  <span className="text-3xl">🌮</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors">{t("home.feature1.title")}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {t("home.feature1.desc")}
                </p>
              </div>
            </article>

            <article className="animate-on-scroll bg-background p-6 sm:p-8 rounded-xl shadow-card hover:shadow-elegant transition-all duration-300 border border-border hover:border-transparent hover:bg-gradient-to-br hover:from-serape-blue/10 hover:via-serape-green/10 hover:to-serape-yellow/10 relative group overflow-hidden" style={{ animationDelay: "0.1s" }}>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-serape-blue group-hover:via-serape-green group-hover:to-serape-yellow rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '2px' }} aria-hidden="true"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-gradient-to-br group-hover:from-serape-blue/20 group-hover:via-serape-green/20 group-hover:to-serape-yellow/20 transition-colors" aria-hidden="true">
                  <span className="text-3xl">🚗</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors">{t("home.feature2.title")}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {t("home.feature2.desc")}
                </p>
              </div>
            </article>

            <article className="animate-on-scroll bg-background p-6 sm:p-8 rounded-xl shadow-card hover:shadow-elegant transition-all duration-300 border border-border hover:border-transparent hover:bg-gradient-to-br hover:from-serape-yellow/10 hover:via-serape-orange/10 hover:to-serape-cyan/10 relative group overflow-hidden sm:col-span-2 md:col-span-1" style={{ animationDelay: "0.2s" }}>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-serape-yellow group-hover:via-serape-orange group-hover:to-serape-cyan rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '2px' }} aria-hidden="true"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-gradient-to-br group-hover:from-serape-yellow/20 group-hover:via-serape-orange/20 group-hover:to-serape-cyan/20 transition-colors" aria-hidden="true">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors">{t("home.feature3.title")}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {t("home.feature3.desc")}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-br from-primary via-rico-red-dark to-primary text-primary-foreground relative overflow-hidden">
        <FloatingShapes />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4IDE5Ljk0IDAgMzYgMTYuMDYgMzYgMzYgMC05Ljk0LTguMDYtMTgtMTgtMTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="container mx-auto px-4 text-center relative z-10 animate-on-scroll">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 drop-shadow-lg">
            {t("home.cta.title")}
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 text-white/95 max-w-2xl mx-auto drop-shadow-md px-4">
            {t("home.cta.subtitle")}
          </p>
          <Link to="/order">
            <Button size="lg" className="bg-white text-foreground hover:bg-white/90 text-base font-semibold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all w-full sm:w-auto sm:min-w-[200px]">
              {t("home.cta.startOrder")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-8 sm:py-12 border-t border-border" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Ricos Tacos Brooklyn restaurant logo" className="h-12 w-12 sm:h-16 sm:w-16" loading="lazy" width="64" height="64" />
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#E31E24] mb-1">Ricos Tacos</h3>
                  {/* Colorful stripe pattern */}
                  <div className="h-2 flex">
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
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                {t("home.footer.tagline1")}
                <br />
                {t("home.footer.tagline2")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("home.footer.contact")}</h4>
              <p className="text-muted-foreground space-y-1 sm:space-y-2 text-sm sm:text-base">
                <span className="block">505 51st Street</span>
                <span className="block">Brooklyn, NY 11220</span>
                <span className="block">Tel: (718) 633-4816</span>
                <span className="block">Cell: (917) 370-0430</span>
              </p>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t("home.footer.hours")}</h4>
              <p className="text-muted-foreground space-y-1 sm:space-y-2 text-sm sm:text-base">
                <span className="block">{t("home.footer.openDays")}</span>
                <span className="block">{t("common.days")}</span>
                <span className="block">{t("common.hours")}</span>
              </p>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
            {/* Social links */}
            <div className="flex justify-center gap-6 mb-4">
              <a
                href="https://www.yelp.com/biz/ricos-tacos-brooklyn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.16 12.73l-3.5 1.09a1.26 1.26 0 01-1.56-1.1 1.24 1.24 0 01.93-1.3l3.5-1.09a1.26 1.26 0 011.56 1.1 1.24 1.24 0 01-.93 1.3zM17.5 7.2l-2.94 2.15a1.25 1.25 0 01-1.76-.28 1.23 1.23 0 01.22-1.73L15.96 5.2a1.25 1.25 0 011.76.28 1.23 1.23 0 01-.22 1.72zm.63 8.55l-2.94-2.15a1.23 1.23 0 01-.22-1.72 1.25 1.25 0 011.76-.28l2.94 2.15a1.23 1.23 0 01.22 1.72 1.25 1.25 0 01-1.76.28zM11.5 3.5V7a1.25 1.25 0 01-2.5 0V3.5a1.25 1.25 0 012.5 0zm-1.25 7.5a1.25 1.25 0 00-1.25 1.25v8.25a1.25 1.25 0 002.5 0V12.25A1.25 1.25 0 0010.25 11z"/></svg>
                Yelp
              </a>
              <a
                href="https://www.facebook.com/pages/Ricos-Tacos/526770730695547"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                Facebook
              </a>
              <a
                href="https://search.google.com/local/writereview?placeid=ChIJ83ydO7RawokRnSEKeICgR1M"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Leave a Review
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-muted-foreground text-xs sm:text-sm">
                &copy; {new Date().getFullYear()} Ricos Tacos. {t("home.footer.copyright")}
              </p>
              <div className="flex gap-4 text-xs">
                <Link to="/auth?redirect=/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Admin
                </Link>
                <span className="text-muted-foreground/50">|</span>
                <Link to="/kitchen-login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Kitchen Staff
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <SerapeStripe />
    </div>
    </>
  );
};

export default Index;
