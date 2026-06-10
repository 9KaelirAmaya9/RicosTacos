import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-illustration.webp";

const exploreLinks = [
  { to: "/mexican-restaurant-brooklyn", label: "Mexican Restaurant Brooklyn" },
  { to: "/birria", label: "Birria Tacos Brooklyn" },
  { to: "/tacos-brooklyn", label: "Street Tacos Brooklyn" },
  { to: "/catering-brooklyn", label: "Catering Brooklyn" },
  { to: "/menu", label: "Full Menu" },
  { to: "/order", label: "Order Online" },
  { to: "/location", label: "Hours & Location" },
  { to: "/catering", label: "Catering Info" },
];

export const SiteFooter = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-muted/30 py-8 sm:py-12 border-t border-border" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Ricos Tacos Brooklyn restaurant logo" className="h-12 w-12 sm:h-16 sm:w-16" loading="lazy" width="64" height="64" />
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#E31E24] mb-1">Ricos Tacos</h3>
                <div className="h-2 flex">
                  {['#E31E24','#FF1493','#92278F','#0071BC','#57B947','#FDB913','#F68D2E','#000000','#00BCD4','#E31E24','#FF1493','#92278F','#0071BC','#57B947','#FDB913','#F68D2E','#000000','#E31E24','#FF1493','#92278F','#92278F'].map((c, i) => (
                    <div key={i} className="flex-1 min-w-0" style={{ backgroundColor: c }} />
                  ))}
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
              <a href="tel:7186334816" className="block hover:text-primary transition-colors">Tel: (718) 633-4816</a>
              <a href="tel:9173700430" className="block hover:text-primary transition-colors">Cell: (917) 370-0430</a>
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

        {/* Internal links row */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Explore Ricos Tacos</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {exploreLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
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
              <Link to="/auth?redirect=/admin" className="py-2 px-1 text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
              <span className="text-muted-foreground/50">|</span>
              <Link to="/kitchen-login" className="py-2 px-1 text-muted-foreground hover:text-foreground transition-colors">
                Kitchen Staff
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
