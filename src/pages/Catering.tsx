import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Phone, UtensilsCrossed, Users, Star } from "lucide-react";

const cateringSchema = {
  "@context": "https://schema.org",
  "@type": "FoodService",
  "name": "Ricos Tacos Catering",
  "description": "Authentic Mexican catering for events throughout Brooklyn and NYC. Traditional Puebla recipes including birria, mole, carnitas, barbacoa, chiles rellenos & more. Contact Josefina at (917) 370-0430.",
  "url": "https://losricostacos.com/catering",
  "telephone": "+19173700430",
  "areaServed": {
    "@type": "City",
    "name": "Brooklyn, NY"
  },
  "provider": {
    "@type": "Restaurant",
    "name": "Ricos Tacos",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "505 51st Street",
      "addressLocality": "Brooklyn",
      "addressRegion": "NY",
      "postalCode": "11220",
      "addressCountry": "US"
    }
  }
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://losricostacos.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Catering",
      "item": "https://losricostacos.com/catering"
    }
  ]
};

const dishes = [
  "Rica Birria", "Chiles Rellenos", "Flautas (Fried Tacos)", "Mole Poblano",
  "Carnitas", "Barbacoa", "Mixiotes", "Pollo Enchilado",
  "Pico de Gallo", "Guacamole con Chips", "Arroz Mexicano", "Frijoles",
  "Ensalada", "Salsa Fresca", "Tacos al Pastor", "Tamales"
];

const Catering = () => {
  return (
    <>
      <SEO
        title="Catering Brooklyn - Authentic Mexican Food for Events | Ricos Tacos"
        description="Authentic Mexican catering for weddings, quinceañeras, corporate events & parties throughout Brooklyn. Birria, mole, carnitas, barbacoa & more from Puebla. Call (917) 370-0430."
        canonicalPath="/catering"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(cateringSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <SerapeStripe />
        <Navigation />

        <div className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
          <div className="container mx-auto px-4">

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
                Catering <span className="text-primary">Brooklyn</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Authentic Puebla-style Mexican food for your event — made fresh, served with pride. From intimate gatherings to large celebrations.
              </p>
            </div>

            {/* CTA Card */}
            <Card className="p-8 mb-12 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground text-center max-w-2xl mx-auto border-0 shadow-elegant">
              <h2 className="font-serif text-3xl font-bold mb-2">Ready to Book?</h2>
              <p className="mb-2 opacity-90">Contact us to discuss your event</p>
              <p className="font-semibold text-lg mb-1">Ask for Josefina</p>
              <a
                href="tel:9173700430"
                className="text-3xl font-serif font-bold hover:opacity-80 transition-opacity block mb-6"
              >
                (917) 370-0430
              </a>
              <a href="tel:9173700430">
                <Button size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold gap-2 w-full sm:w-auto">
                  <Phone className="h-5 w-5" />
                  Call to Book Catering
                </Button>
              </a>
            </Card>

            {/* Why Ricos */}
            <div className="grid sm:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
              <Card className="p-6 text-center">
                <UtensilsCrossed className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-serif text-lg font-semibold mb-2">Authentic Puebla Recipes</h3>
                <p className="text-sm text-muted-foreground">Traditional dishes made from scratch — the same recipes we've served Sunset Park since day one.</p>
              </Card>
              <Card className="p-6 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-serif text-lg font-semibold mb-2">Any Size Event</h3>
                <p className="text-sm text-muted-foreground">Family gatherings, quinceañeras, weddings, corporate lunches, block parties — we scale for any headcount.</p>
              </Card>
              <Card className="p-6 text-center">
                <Star className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-serif text-lg font-semibold mb-2">Trusted in Brooklyn</h3>
                <p className="text-sm text-muted-foreground">Sunset Park's neighborhood taqueria. From Puebla. For Brooklyn. The food speaks for itself.</p>
              </Card>
            </div>

            {/* Menu */}
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Catering <span className="text-primary">Menu</span>
              </h2>
              <Card className="p-8">
                <p className="text-muted-foreground text-center mb-8">
                  All dishes prepared fresh with traditional recipes. Custom menus available — just ask.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {dishes.map((dish) => (
                    <div key={dish} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="text-primary font-bold">✓</span>
                      <span className="font-medium">{dish}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center mt-6">
                  + Much more available. Call to discuss your custom menu.
                </p>
              </Card>
            </div>

            {/* Events */}
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Events We <span className="text-primary">Cater</span>
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Quinceañeras", "Weddings & Receptions", "Corporate Lunches",
                  "Birthday Parties", "Block Parties", "Family Reunions",
                  "Church Events", "School Events", "Holiday Parties"
                ].map((event) => (
                  <div key={event} className="bg-card border border-border rounded-lg px-4 py-3 text-center font-medium">
                    {event}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center max-w-xl mx-auto">
              <h2 className="font-serif text-2xl font-bold mb-4">Get a Quote</h2>
              <p className="text-muted-foreground mb-6">
                Tell us about your event — date, headcount, and any preferences — and we'll put together the perfect menu for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:9173700430">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    <Phone className="h-5 w-5" />
                    (917) 370-0430
                  </Button>
                </a>
                <Link to="/menu">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Full Menu
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Or visit us at 505 51st Street, Brooklyn NY 11220
              </p>
            </div>

          </div>
        </div>
        <SerapeStripe />
      </div>
    </>
  );
};

export default Catering;
