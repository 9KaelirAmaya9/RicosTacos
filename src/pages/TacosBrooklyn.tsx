import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import alPastor from "@/assets/menu/al-pastor.jpg";
import birriaTaco from "@/assets/menu/birria-taco.jpg";
import carnitasTaco from "@/assets/menu/carnitas-taco.jpg";
import suaderoTaco from "@/assets/menu/suadero-taco.jpg";
import cochinita from "@/assets/menu/cochinita-pibil.jpg";
import carneAsadaTaco from "@/assets/menu/carne-asada-taco.jpg";

const tacosSchema = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  "name": "Ricos Tacos",
  "description": "Authentic Mexican street tacos in Sunset Park, Brooklyn. Al pastor, birria, carnitas, suadero, and more — handmade corn tortillas, fresh cilantro and onion. Order online for pickup or delivery.",
  "url": "https://losricostacos.com/tacos-brooklyn",
  "telephone": "+19173700430",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "505 51st Street",
    "addressLocality": "Brooklyn",
    "addressRegion": "NY",
    "postalCode": "11220",
    "addressCountry": "US"
  },
  "openingHours": "Mo-Su 09:00-02:00",
  "servesCuisine": "Mexican",
  "priceRange": "$",
  "hasMenuItem": [
    {
      "@type": "MenuItem",
      "name": "Al Pastor Taco",
      "description": "Marinated pork with pineapple on a handmade corn tortilla with cilantro and onion",
      "offers": { "@type": "Offer", "price": "3.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Birria Taco",
      "description": "Slow-braised beef in rich chile broth with consomé for dipping",
      "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Carnitas Taco",
      "description": "Crispy-edged slow-fried pork on a handmade corn tortilla",
      "offers": { "@type": "Offer", "price": "3.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Suadero Taco",
      "description": "Tender beef brisket slow-cooked until it falls apart",
      "offers": { "@type": "Offer", "price": "3.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Cochinita Pibil Taco",
      "description": "Slow-roasted pork marinated in citrus and achiote",
      "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Carne Asada Taco",
      "description": "Flame-grilled steak with smoky char and bold flavor",
      "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" }
    }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where can I get tacos in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn serves authentic Mexican street tacos daily from 9 AM to 2 AM. Street tacos start at $3. Order in person, online for pickup, or get delivery."
      }
    },
    {
      "@type": "Question",
      "name": "What are the best tacos in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ricos Tacos in Sunset Park is widely regarded as one of Brooklyn's best taco spots. We serve 20+ taco varieties including al pastor, birria, carnitas, suadero, cochinita pibil, carne asada, and more — all on handmade corn tortillas with fresh cilantro, onion, and house-made salsa."
      }
    },
    {
      "@type": "Question",
      "name": "How much do tacos cost at Ricos Tacos Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Street tacos (al pastor, carnitas, suadero, and others) are $3 each. Specialty tacos (birria, cochinita pibil, carne asada, tacos árabes) are $5 each."
      }
    },
    {
      "@type": "Question",
      "name": "What kinds of tacos does Ricos Tacos serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We serve over 20 taco varieties: al pastor, birria (with consomé), carnitas, suadero, cochinita pibil, carne asada, lengua, cabeza, tripa, buche, enchilada, longaniza, cecina, picadillo, tacos árabes, barbacoa, and fish (chillo). All on handmade corn tortillas."
      }
    },
    {
      "@type": "Question",
      "name": "Can I order tacos online in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — order tacos online at losricostacos.com/order for pickup or delivery in the Sunset Park area. Available every day, 9 AM to 2 AM."
      }
    }
  ]
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
    { "@type": "ListItem", "position": 2, "name": "Tacos Brooklyn", "item": "https://losricostacos.com/tacos-brooklyn" }
  ]
};

const menuItems = [
  {
    name: "Al Pastor",
    price: "$3",
    description: "Marinated pork slow-cooked on a vertical spit with pineapple. Cilantro, onion, lime — the taco that built a culture.",
    image: alPastor,
    alt: "Al pastor taco at Ricos Tacos Sunset Park Brooklyn"
  },
  {
    name: "Birria",
    price: "$5",
    description: "Slow-braised beef in rich guajillo chile broth. Dipped in consomé before griddling — crispy edges, deep red color.",
    image: birriaTaco,
    alt: "Birria taco with consomé at Ricos Tacos Brooklyn"
  },
  {
    name: "Carnitas",
    price: "$3",
    description: "Pork slow-fried in its own fat until the edges crisp. Melt-in-your-mouth center, golden crunch on the outside.",
    image: carnitasTaco,
    alt: "Carnitas taco at Ricos Tacos Brooklyn"
  },
  {
    name: "Suadero",
    price: "$3",
    description: "Beef brisket braised low and slow until it falls apart. One of Mexico City's most beloved street taco meats.",
    image: suaderoTaco,
    alt: "Suadero taco at Ricos Tacos Sunset Park Brooklyn"
  },
  {
    name: "Cochinita Pibil",
    price: "$5",
    description: "Yucatecan-style pork marinated in citrus and achiote, then slow-roasted until impossibly tender and fragrant.",
    image: cochinita,
    alt: "Cochinita pibil taco at Ricos Tacos Brooklyn"
  },
  {
    name: "Carne Asada",
    price: "$5",
    description: "Flame-grilled steak with a smoky char and bold seasoning. Cut to order, piled onto a fresh corn tortilla.",
    image: carneAsadaTaco,
    alt: "Carne asada taco at Ricos Tacos Brooklyn"
  },
];

const faqs = [
  {
    q: "What kinds of tacos do you serve?",
    a: "Over 20 varieties. Street tacos ($3): al pastor, carnitas, suadero, enchilada, longaniza, buche, bistec, cueritos, pollo, cecina. Specialty tacos ($5): birria, cochinita pibil, carne asada, tacos árabes, barbacoa, and fish (chillo). All on handmade corn tortillas with cilantro, onion, and salsa."
  },
  {
    q: "Where are you in Brooklyn?",
    a: "505 51st Street in Sunset Park — between 5th and 6th Avenue, a few blocks from the R/N trains at 53rd Street. Open daily 9 AM to 2 AM."
  },
  {
    q: "How much are tacos?",
    a: "Street tacos are $3 each. Specialty tacos (birria, cochinita pibil, carne asada, tacos árabes) are $5 each. No minimums."
  },
  {
    q: "Do you offer delivery?",
    a: "Yes. Order at losricostacos.com/order or call (917) 370-0430. We deliver within a 20-minute drive of Sunset Park. $5 delivery fee, $10 minimum. Open daily 9 AM – 2 AM."
  },
  {
    q: "Are the tortillas handmade?",
    a: "Yes. Every corn tortilla is pressed and cooked fresh in-house. No pre-made shells — the tortilla is part of the taco, not just a wrapper."
  },
];

const TacosBrooklyn = () => {
  return (
    <>
      <SEO
        title="Tacos Brooklyn — Authentic Mexican Street Tacos at Ricos Tacos, Sunset Park"
        description="Brooklyn's best street tacos from $3. Al pastor, birria, carnitas, suadero, carne asada & 20+ more. Handmade tortillas, open daily 9AM–2AM. Order online for pickup or delivery in Sunset Park."
        canonicalPath="/tacos-brooklyn"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(tacosSchema)}</script>
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
              <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">Sunset Park · Brooklyn</p>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-tight">
                Tacos <span className="text-primary">Brooklyn</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Over 20 varieties. Handmade corn tortillas. Street tacos from $3.
                Made the way they're made in Mexico — every day at 505 51st Street.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/order">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    Order Tacos Online
                  </Button>
                </Link>
                <Link to="/menu">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                    Full Menu
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative rounded-2xl overflow-hidden mb-16 max-w-4xl mx-auto aspect-[16/7]">
              <img
                src={alPastor}
                alt="Authentic al pastor tacos at Ricos Tacos in Sunset Park Brooklyn"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="font-serif text-2xl font-bold">Al Pastor · $3</p>
                <p className="text-white/80 text-sm">505 51st St, Sunset Park, Brooklyn</p>
              </div>
            </div>

            {/* What makes ours different */}
            <div className="max-w-3xl mx-auto mb-16 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-5">
                Real <span className="text-primary">Street Tacos</span> — Not a Compromise
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Every taco starts with a corn tortilla pressed and cooked in-house. The meats are prepared the
                traditional way — al pastor on a vertical spit, carnitas slow-fried in their own fat,
                birria braised overnight in guajillo and ancho chiles.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Toppings are simple on purpose: fresh cilantro, white onion, a wedge of lime, and house-made salsa.
                That's the street taco — nothing hidden, nothing fake, everything in balance.
                We've been doing it this way in Sunset Park since day one.
              </p>
            </div>

            {/* Price callout */}
            <div className="max-w-2xl mx-auto mb-16 grid sm:grid-cols-2 gap-4 text-center">
              <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
                <p className="text-4xl font-bold text-primary mb-1">$3</p>
                <p className="font-semibold text-lg mb-2">Street Tacos</p>
                <p className="text-sm text-muted-foreground">Al pastor, carnitas, suadero, enchilada, longaniza, buche, bistec, and more</p>
              </div>
              <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
                <p className="text-4xl font-bold text-primary mb-1">$5</p>
                <p className="font-semibold text-lg mb-2">Specialty Tacos</p>
                <p className="text-sm text-muted-foreground">Birria, cochinita pibil, carne asada, tacos árabes, barbacoa, fish (chillo)</p>
              </div>
            </div>

            {/* Menu grid */}
            <div className="max-w-5xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Taco <span className="text-primary">Menu</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
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
                        <span className="text-primary font-bold text-lg">{item.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order CTA */}
            <Card className="p-8 mb-16 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground text-center max-w-2xl mx-auto border-0 shadow-elegant">
              <h2 className="font-serif text-3xl font-bold mb-2">Ready to Order?</h2>
              <p className="mb-6 opacity-90">
                Online for pickup or delivery · Open daily 9 AM – 2 AM<br />
                505 51st Street, Sunset Park, Brooklyn
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/order">
                  <Button size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold w-full sm:w-auto">
                    Order Online
                  </Button>
                </Link>
                <a href="tel:9173700430">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                    (917) 370-0430
                  </Button>
                </a>
              </div>
            </Card>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Tacos Brooklyn <span className="text-primary">FAQ</span>
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
        <SerapeStripe />
      </div>
    </>
  );
};

export default TacosBrooklyn;
