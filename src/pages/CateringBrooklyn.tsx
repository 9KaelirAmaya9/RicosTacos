import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import parrilladas from "@/assets/menu/parrilladas.jpg";
import molePoblano from "@/assets/menu/mole-poblano.jpg";
import birriaPlatillo from "@/assets/menu/birria-platillo.jpg";
import fajitas from "@/assets/menu/fajitas.jpg";
import chilesRellenos from "@/assets/menu/chiles-rellenos.jpg";
import pozole from "@/assets/menu/pozole.jpg";

const cateringSchema = {
  "@context": "https://schema.org",
  "@type": ["FoodService", "LocalBusiness"],
  "name": "Ricos Tacos Catering Brooklyn",
  "description": "Authentic Mexican catering in Brooklyn for weddings, quinceañeras, corporate events, and private parties. Traditional Puebla recipes — birria, mole, carnitas, barbacoa, chiles rellenos. Call (917) 370-0430.",
  "url": "https://losricostacos.com/catering-brooklyn",
  "telephone": "+19173700430",
  "priceRange": "$$",
  "areaServed": [
    { "@type": "City", "name": "Brooklyn, NY" },
    { "@type": "City", "name": "New York, NY" }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "505 51st Street",
    "addressLocality": "Brooklyn",
    "addressRegion": "NY",
    "postalCode": "11220",
    "addressCountry": "US"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Catering Menu",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Birria Catering" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mole Poblano Catering" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Taco Bar Catering" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Fajitas Catering" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Carnitas Catering" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Chiles Rellenos Catering" } }
    ]
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you do catering in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Ricos Tacos caters events throughout Brooklyn and greater NYC. We handle weddings, quinceañeras, corporate events, birthday parties, and private gatherings of any size. Call (917) 370-0430 to speak with Josefina."
      }
    },
    {
      "@type": "Question",
      "name": "What kind of food do you serve for catering?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We serve authentic Puebla-style Mexican food: birria, mole poblano, carnitas, barbacoa, chiles rellenos, fajitas, tamales, tacos al pastor, pozole, and more. Custom menus available — we work with you on headcount and preferences."
      }
    },
    {
      "@type": "Question",
      "name": "How far in advance should I book catering?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For large events like weddings and quinceañeras, we recommend booking at least 2–4 weeks in advance. For smaller gatherings, a week's notice is often enough. Call (917) 370-0430 to check availability."
      }
    },
    {
      "@type": "Question",
      "name": "Do you cater quinceañeras in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — quinceañeras are one of our most popular catering events. We work closely with families to create the right menu and quantities. Traditional dishes like mole, birria, carnitas, and tamales are always a hit. Call (917) 370-0430."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get a catering quote?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Call or text (917) 370-0430 and ask for Josefina. Tell us your event date, estimated headcount, and any dish preferences, and we'll put together a custom quote. You can also visit us at 505 51st Street, Sunset Park."
      }
    }
  ]
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
    { "@type": "ListItem", "position": 2, "name": "Catering Brooklyn", "item": "https://losricostacos.com/catering-brooklyn" }
  ]
};

const dishes = [
  "Rica Birria", "Mole Poblano", "Chiles Rellenos", "Carnitas",
  "Barbacoa", "Tacos al Pastor", "Fajitas", "Tamales",
  "Pozole", "Mixiotes", "Pollo Enchilado", "Flautas",
  "Arroz Mexicano", "Frijoles", "Guacamole & Chips", "Pico de Gallo",
];

const events = [
  "Quinceañeras", "Weddings & Receptions", "Corporate Lunches",
  "Birthday Parties", "Block Parties", "Family Reunions",
  "Church Events", "Holiday Parties", "Graduation Parties",
];

const highlights = [
  {
    name: "Birria",
    description: "Slow-braised beef in guajillo and ancho chile broth. A crowd centerpiece.",
    image: birriaPlatillo,
    alt: "Birria catering platter at Ricos Tacos Brooklyn",
  },
  {
    name: "Mole Poblano",
    description: "Puebla's signature dish — complex, slow-built mole over tender chicken or turkey.",
    image: molePoblano,
    alt: "Mole poblano catering at Ricos Tacos Brooklyn",
  },
  {
    name: "Fajitas",
    description: "Sizzling grilled meat with peppers, onions, rice, beans, and fresh tortillas.",
    image: fajitas,
    alt: "Fajitas catering platter Ricos Tacos Brooklyn",
  },
  {
    name: "Chiles Rellenos",
    description: "Roasted poblano peppers stuffed with cheese and meat, bathed in tomato sauce.",
    image: chilesRellenos,
    alt: "Chiles rellenos catering Brooklyn",
  },
  {
    name: "Pozole",
    description: "Hearty hominy soup with slow-cooked pork in rich red chile broth. Feeds a crowd.",
    image: pozole,
    alt: "Pozole catering Ricos Tacos Brooklyn",
  },
  {
    name: "Parrilladas",
    description: "Mixed grill spread — arrachera, chorizo, chuleta, and more on a sizzling platter.",
    image: parrilladas,
    alt: "Parrillada mixed grill catering Brooklyn",
  },
];

const CateringBrooklyn = () => {
  return (
    <>
      <SEO
        title="Catering Brooklyn — Authentic Mexican Food for Events | Ricos Tacos"
        description="Mexican catering in Brooklyn for weddings, quinceañeras, corporate events & parties. Birria, mole, carnitas, fajitas & more from Puebla. Call Josefina at (917) 370-0430. Serving all of Brooklyn."
        canonicalPath="/catering-brooklyn"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(cateringSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <SerapeStripe />
        <Navigation />

        <div id="main-content" className="pt-24 sm:pt-28 pb-16 sm:pb-20">
          <div className="container mx-auto px-4">

            {/* Hero */}
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">Brooklyn · NYC · Any Size Event</p>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-tight">
                Catering <span className="text-primary">Brooklyn</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Authentic Puebla-style Mexican food for your event. Weddings, quinceañeras,
                corporate lunches, and private parties — made fresh, served with pride.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:9173700430">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8 gap-2">
                    <Phone className="h-5 w-5" />
                    Call (917) 370-0430
                  </Button>
                </a>
                <Link to="/catering">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                    Catering Info
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative rounded-2xl overflow-hidden mb-16 max-w-4xl mx-auto aspect-[16/7]">
              <img
                src={parrilladas}
                alt="Mexican catering spread at Ricos Tacos Brooklyn — parrillada mixed grill"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="font-serif text-2xl font-bold">Fresh. Made from scratch. From Puebla.</p>
                <p className="text-white/80 text-sm">Call Josefina: (917) 370-0430</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="max-w-3xl mx-auto mb-16 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { stat: "100+", label: "Guests Served" },
                { stat: "16+", label: "Catering Dishes" },
                { stat: "Any Size", label: "Events" },
                { stat: "Brooklyn", label: "Based" },
              ].map(({ stat, label }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{stat}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Signature dishes */}
            <div className="max-w-5xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Signature <span className="text-primary">Catering Dishes</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {highlights.map((item) => (
                  <Card key={item.name} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        width="400"
                        height="300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Events We <span className="text-primary">Cater</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {events.map((event) => (
                  <div key={event} className="bg-card border border-border rounded-lg px-4 py-3 text-center font-medium text-sm sm:text-base">
                    {event}
                  </div>
                ))}
              </div>
            </div>

            {/* Full catering menu */}
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-4">
                Full Catering <span className="text-primary">Menu</span>
              </h2>
              <p className="text-center text-muted-foreground mb-8">
                All dishes prepared fresh with traditional Puebla recipes. Custom menus available — just ask.
              </p>
              <Card className="p-8">
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

            {/* CTA */}
            <Card className="p-8 mb-16 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground text-center max-w-2xl mx-auto border-0 shadow-elegant">
              <h2 className="font-serif text-3xl font-bold mb-2">Book Your Event</h2>
              <p className="mb-2 opacity-90">Call or text to get a custom quote</p>
              <p className="font-semibold text-lg mb-1">Ask for Josefina</p>
              <a
                href="tel:9173700430"
                className="text-3xl font-serif font-bold hover:opacity-80 transition-opacity block mb-6"
              >
                (917) 370-0430
              </a>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="tel:9173700430">
                  <Button size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold gap-2 w-full sm:w-auto">
                    <Phone className="h-5 w-5" />
                    Call to Book
                  </Button>
                </a>
                <Link to="/catering">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    More Info
                  </Button>
                </Link>
              </div>
              <p className="text-sm opacity-75 mt-4">505 51st Street, Sunset Park, Brooklyn NY 11220</p>
            </Card>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Frequently Asked <span className="text-primary">Questions</span>
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: "Do you do catering in Brooklyn?",
                    a: "Yes. Ricos Tacos caters events throughout Brooklyn and greater NYC. We handle weddings, quinceañeras, corporate events, birthday parties, and private gatherings of any size. Call (917) 370-0430 to speak with Josefina."
                  },
                  {
                    q: "What kind of food do you serve for catering?",
                    a: "We serve authentic Puebla-style Mexican food: birria, mole poblano, carnitas, barbacoa, chiles rellenos, fajitas, tamales, tacos al pastor, pozole, and more. Custom menus available — we work with you on headcount and preferences."
                  },
                  {
                    q: "How far in advance should I book catering?",
                    a: "For large events like weddings and quinceañeras, we recommend booking at least 2–4 weeks in advance. For smaller gatherings, a week's notice is often enough. Call (917) 370-0430 to check availability."
                  },
                  {
                    q: "Do you cater quinceañeras in Brooklyn?",
                    a: "Yes — quinceañeras are one of our most popular catering events. We work closely with families to create the right menu and quantities. Traditional dishes like mole, birria, carnitas, and tamales are always a hit."
                  },
                  {
                    q: "How do I get a catering quote?",
                    a: "Call or text (917) 370-0430 and ask for Josefina. Tell us your event date, estimated headcount, and any dish preferences, and we'll put together a custom quote."
                  }
                ].map((faq) => (
                  <Card key={faq.q} className="p-6">
                    <h3 className="font-semibold text-base mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </div>
        <SerapeStripe />
      </div>
    </>
  );
};

export default CateringBrooklyn;
