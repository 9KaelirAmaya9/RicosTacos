import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import alPastor from "@/assets/menu/al-pastor.jpg";
import birriaTaco from "@/assets/menu/birria-taco.jpg";
import birriaConsomme from "@/assets/menu/birria-consomme.jpg";
import tortaBirria from "@/assets/menu/torta-birria.jpg";
import pozole from "@/assets/menu/pozole.jpg";
import nachos from "@/assets/menu/nachos.jpg";
import fajitas from "@/assets/menu/fajitas.jpg";

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": ["Restaurant", "LocalBusiness"],
  "name": "Ricos Tacos",
  "description": "Authentic Mexican restaurant in Sunset Park, Brooklyn. Street tacos from $3, birria, tortas, burritos, soups, and full platillos. Recipes from Puebla, made fresh daily.",
  "url": "https://losricostacos.com/mexican-restaurant-brooklyn",
  "telephone": "+17186334816",
  "servesCuisine": ["Mexican", "Street Food", "Tacos"],
  "priceRange": "$",
  "openingHours": "Mo-Su 09:00-02:00",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "505 51st Street",
    "addressLocality": "Brooklyn",
    "addressRegion": "NY",
    "postalCode": "11220",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "40.6526",
    "longitude": "-74.0137"
  },
  "hasMap": "https://maps.google.com/?q=505+51st+Street+Brooklyn+NY+11220",
  "potentialAction": {
    "@type": "OrderAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://losricostacos.com/order",
      "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
    }
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best Mexican restaurant in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn is widely recognized as one of Brooklyn's best authentic Mexican restaurants. We serve over 100 dishes — street tacos from $3, birria, tortas, burritos, soups, and full platillos — using traditional recipes from Puebla, Mexico. Open daily 9 AM to 2 AM."
      }
    },
    {
      "@type": "Question",
      "name": "Where is Ricos Tacos located in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ricos Tacos is located at 505 51st Street in Sunset Park, Brooklyn, NY 11220 — a few blocks from the R/N subway trains at 53rd Street. We're open 7 days a week from 9 AM to 2 AM."
      }
    },
    {
      "@type": "Question",
      "name": "What kind of food does Ricos Tacos serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We serve authentic Mexican food from Puebla: street tacos ($3), specialty tacos ($5), tostadas, tortas, burritos, quesadillas, pozole, birria, fajitas, mole, enchiladas, chilaquiles, and full platillos. Over 100 items, all made fresh daily."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer delivery in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Order at losricostacos.com/order for pickup or delivery within 20 minutes of Sunset Park. Available daily 9 AM to 2 AM. You can also call (718) 633-4816."
      }
    },
    {
      "@type": "Question",
      "name": "What are Ricos Tacos hours?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We're open 7 days a week, 9 AM to 2 AM. Kitchen stays open until 2 AM every night including weekends."
      }
    }
  ]
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
    { "@type": "ListItem", "position": 2, "name": "Mexican Restaurant Brooklyn", "item": "https://losricostacos.com/mexican-restaurant-brooklyn" }
  ]
};

const highlights = [
  {
    name: "Al Pastor Taco",
    price: "$3",
    description: "Marinated pork slow-cooked on a vertical spit with pineapple — the taco that put Mexico City street food on the map.",
    image: alPastor,
    alt: "Al pastor taco at Ricos Tacos Mexican restaurant Brooklyn"
  },
  {
    name: "Birria Tacos",
    price: "$5",
    description: "Slow-braised beef in guajillo chile broth, dipped before griddling. Served with consomé for dipping.",
    image: birriaTaco,
    alt: "Birria tacos at Ricos Tacos Brooklyn Mexican restaurant"
  },
  {
    name: "Birria Consomé",
    price: "$13.99",
    description: "A full bowl of rich red chile beef broth with tender braised meat. Drink it, dip into it, pour it over everything.",
    image: birriaConsomme,
    alt: "Birria consomé soup at Ricos Tacos Brooklyn"
  },
  {
    name: "Torta de Birria",
    price: "$12",
    description: "Toasted telera roll packed with birria beef, beans, avocado, and all the fixings.",
    image: tortaBirria,
    alt: "Torta de birria Mexican sandwich at Ricos Tacos Brooklyn"
  },
  {
    name: "Pozole",
    price: "from $8",
    description: "Hearty hominy soup with tender pork in rich red chile broth. A full meal in a bowl.",
    image: pozole,
    alt: "Pozole soup at Ricos Tacos Mexican restaurant Sunset Park Brooklyn"
  },
  {
    name: "Fajitas",
    price: "$25",
    description: "Sizzling plate of grilled meat, peppers, and onions with rice, beans, guacamole, and fresh tortillas.",
    image: fajitas,
    alt: "Fajitas plate at Ricos Tacos Mexican restaurant Brooklyn"
  },
];

const faqs = [
  {
    q: "What makes Ricos Tacos different from other Mexican restaurants in Brooklyn?",
    a: "We cook from Puebla recipes — nothing pre-made, nothing generic. The al pastor turns on a trompo. Birria braises overnight. Tortillas are pressed in-house. The menu covers 100+ dishes from street tacos to full platillos, so there's always something new. And we're open until 2 AM, every night."
  },
  {
    q: "What's on the menu beyond tacos?",
    a: "A lot. Tortas (Mexican sandwiches on toasted telera rolls), burritos, quesadillas, tostadas, pozole, birria consomé, enchiladas, chilaquiles, mole poblano, fajitas, arrachera, molcajete, full platillos with rice and beans — and a full breakfast menu with huevos rancheros, chilaquiles, and more."
  },
  {
    q: "How do I get to Ricos Tacos from Manhattan?",
    a: "Take the R or N train to 53rd Street in Sunset Park — we're at 505 51st Street, about 3 blocks away. From Manhattan it's 20–25 minutes on the R train from Times Square."
  },
  {
    q: "Do you take reservations?",
    a: "We don't take reservations — walk-ins only. We turn tables quickly and there's usually room. For large groups or events, call ahead at (718) 633-4816."
  },
  {
    q: "Do you do catering?",
    a: "Yes. We cater weddings, quinceañeras, corporate events, and private parties throughout Brooklyn. Call (917) 370-0430 or visit losricostacos.com/catering to get a quote."
  },
];

const MexicanRestaurantBrooklyn = () => {
  return (
    <>
      <SEO
        title="Mexican Restaurant Brooklyn — Ricos Tacos, Authentic Puebla Cuisine"
        description="Brooklyn's best authentic Mexican restaurant in Sunset Park. Street tacos from $3, birria, tortas, pozole, fajitas & 100+ dishes from Puebla. Open daily 9AM–2AM at 505 51st St. Order online."
        canonicalPath="/mexican-restaurant-brooklyn"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(restaurantSchema)}</script>
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
              <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">Sunset Park · Brooklyn · Open Until 2 AM</p>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-tight">
                Mexican Restaurant <span className="text-primary">Brooklyn</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                100+ dishes from Puebla, Mexico. Street tacos from $3. Birria, tortas, pozole,
                fajitas, and more — made fresh every day at 505 51st Street, Sunset Park.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/order">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    Order Online
                  </Button>
                </Link>
                <Link to="/menu">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                    View Full Menu
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative rounded-2xl overflow-hidden mb-16 max-w-4xl mx-auto aspect-[16/7]">
              <img
                src={nachos}
                alt="Authentic Mexican food at Ricos Tacos restaurant in Sunset Park Brooklyn"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="font-serif text-2xl font-bold">Authentic Puebla Cuisine</p>
                <p className="text-white/80 text-sm">505 51st St, Sunset Park, Brooklyn · Open 9 AM – 2 AM</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="max-w-3xl mx-auto mb-16 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { stat: "100+", label: "Menu Items" },
                { stat: "$3", label: "Street Tacos" },
                { stat: "9AM–2AM", label: "Every Day" },
                { stat: "1 Train", label: "From Manhattan" },
              ].map(({ stat, label }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{stat}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* About section */}
            <div className="max-w-3xl mx-auto mb-16 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-5">
                From <span className="text-primary">Puebla</span> to Sunset Park
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Ricos Tacos started with a trompo and a family recipe. Al pastor has been rotating
                here since the beginning — slow-marinated pork stacked high, shaved to order,
                served on a fresh corn tortilla with pineapple and cilantro.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                The menu grew from there. Birria braised overnight in guajillo and ancho chile broth.
                Pozole made from scratch. Enchiladas in mole poblano that takes all day to build.
                Over 100 dishes, all made in-house, all from the same place: Puebla, Mexico.
              </p>
            </div>

            {/* Highlights grid */}
            <div className="max-w-5xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                What to <span className="text-primary">Order</span>
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
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-serif font-bold text-lg">{item.name}</h3>
                        <span className="text-primary font-bold">{item.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/menu">
                  <Button variant="outline" size="lg">
                    See All 100+ Items →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order CTA */}
            <Card className="p-8 mb-16 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground text-center max-w-2xl mx-auto border-0 shadow-elegant">
              <h2 className="font-serif text-3xl font-bold mb-2">Order for Pickup or Delivery</h2>
              <p className="mb-6 opacity-90">
                Online ordering available · Open daily 9 AM – 2 AM<br />
                505 51st Street, Sunset Park, Brooklyn NY 11220
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/order">
                  <Button size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold w-full sm:w-auto">
                    Order Online
                  </Button>
                </Link>
                <a href="tel:7186334816">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    (718) 633-4816
                  </Button>
                </a>
              </div>
            </Card>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Frequently Asked <span className="text-primary">Questions</span>
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <Card key={faq.q} className="p-6">
                    <h3 className="font-semibold text-base mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </div>
        <SiteFooter />
        <SerapeStripe />
      </div>
    </>
  );
};

export default MexicanRestaurantBrooklyn;
