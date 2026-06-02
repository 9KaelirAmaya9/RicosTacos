import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { SerapeStripe } from "@/components/SerapeStripe";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import birriaTaco from "@/assets/menu/birria-taco.jpg";
import birriaConsomme from "@/assets/menu/birria-consomme.jpg";
import birriaPlatillo from "@/assets/menu/birria-platillo.jpg";
import birriaTostada from "@/assets/menu/birria-tostada.jpg";
import tortaBirria from "@/assets/menu/torta-birria.jpg";
import burritoBirria from "@/assets/menu/burrito-birria.jpg";

const birriaSchema = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  "name": "Ricos Tacos",
  "description": "Authentic birria tacos in Sunset Park, Brooklyn. Slow-braised beef in rich chile broth, served with consomé for dipping. Order online for pickup or delivery.",
  "url": "https://losricostacos.com/birria",
  "telephone": "+19173700430",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "505 51st Street",
    "addressLocality": "Brooklyn",
    "addressRegion": "NY",
    "postalCode": "11220",
    "addressCountry": "US"
  },
  "hasMenuItem": [
    {
      "@type": "MenuItem",
      "name": "Birria Taco",
      "description": "Rich, slow-braised beef in savory chile broth on a handmade corn tortilla with cilantro, onion, and lime",
      "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Birria Tostada",
      "description": "Rich braised beef on a crispy tortilla with fresh toppings",
      "offers": { "@type": "Offer", "price": "4.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Birria Torta",
      "description": "Rich braised beef on a toasted telera roll with all the fixings",
      "offers": { "@type": "Offer", "price": "12.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Birria Burrito",
      "description": "Rich braised beef with rice, beans, and melted cheese in a warm flour tortilla",
      "offers": { "@type": "Offer", "price": "16.00", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Birria de Res (Consomé)",
      "description": "Rich beef consommé with tender meat, for dipping",
      "offers": { "@type": "Offer", "price": "13.99", "priceCurrency": "USD" }
    },
    {
      "@type": "MenuItem",
      "name": "Birria Platillo",
      "description": "Traditional slow-braised beef in rich chile broth with handmade tortillas",
      "offers": { "@type": "Offer", "price": "13.99", "priceCurrency": "USD" }
    }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where can I get birria tacos in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn serves authentic birria tacos daily from 9 AM to 2 AM. You can dine in, order online for pickup, or get delivery."
      }
    },
    {
      "@type": "Question",
      "name": "What is birria?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Birria is a traditional Mexican dish from Jalisco — slow-braised beef (or goat) in a rich red chile broth. At Ricos Tacos we make birria de res (beef), braised for hours in a blend of guajillo, ancho, and árbol chiles. The consomé (broth) is served on the side for dipping, the way it's done in Mexico."
      }
    },
    {
      "@type": "Question",
      "name": "Does Ricos Tacos serve birria consomé?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Our Birria de Res Consomé ($13.99) is a full bowl of rich beef broth with tender meat — perfect for dipping your tacos. It's also served alongside our Birria Platillo."
      }
    },
    {
      "@type": "Question",
      "name": "Can I order birria online in Brooklyn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — order birria tacos online at losricostacos.com/order for pickup or delivery in the Sunset Park area. Available daily 9 AM to 2 AM."
      }
    },
    {
      "@type": "Question",
      "name": "How much do birria tacos cost at Ricos Tacos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Birria tacos are $5 each. Birria tostadas are $4. Birria torta $12, birria burrito $16, birria consomé $13.99, and birria platillo $13.99."
      }
    }
  ]
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
    { "@type": "ListItem", "position": 2, "name": "Birria Tacos Brooklyn", "item": "https://losricostacos.com/birria" }
  ]
};

const menuItems = [
  { name: "Birria Taco", price: "$5", description: "Slow-braised beef on a handmade corn tortilla. Cilantro, onion, lime. Consomé on the side.", image: birriaTaco, alt: "Birria taco with consomé at Ricos Tacos Brooklyn" },
  { name: "Birria Tostada", price: "$4", description: "Crispy tortilla piled with braised beef, fresh toppings, and a drizzle of salsa.", image: birriaTostada, alt: "Birria tostada at Ricos Tacos Sunset Park Brooklyn" },
  { name: "Birria Torta", price: "$12", description: "Toasted telera roll stuffed with birria beef, beans, avocado, and all the fixings.", image: tortaBirria, alt: "Birria torta at Ricos Tacos Brooklyn" },
  { name: "Birria Burrito", price: "$16", description: "Birria beef, Mexican rice, black beans, and melted cheese in a warm flour tortilla.", image: burritoBirria, alt: "Birria burrito at Ricos Tacos Sunset Park" },
  { name: "Birria de Res (Consomé)", price: "$13.99", description: "A full bowl of rich red chile beef broth with tender braised meat. The real deal.", image: birriaConsomme, alt: "Birria consomé at Ricos Tacos Brooklyn" },
  { name: "Birria Platillo", price: "$13.99", description: "Full plate — slow-braised beef, handmade tortillas, rice, beans, and consomé.", image: birriaPlatillo, alt: "Birria platillo full plate at Ricos Tacos Brooklyn" },
];

const faqs = [
  {
    q: "What is birria?",
    a: "Birria is a traditional Mexican dish — slow-braised beef in a rich red chile broth made from guajillo, ancho, and árbol chiles. The meat is tender, deeply spiced, and served with the broth (consomé) on the side for dipping. We make birria de res (beef) the traditional way, braised for hours."
  },
  {
    q: "Where can I find birria tacos in Brooklyn?",
    a: "Right here. Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn — open daily 9 AM to 2 AM. Order in person, online for pickup, or get delivery to your door."
  },
  {
    q: "Do you serve birria consomé for dipping?",
    a: "Yes. Every birria order comes with consomé. We also serve it as a full bowl — Birria de Res Consomé ($13.99) — with tender meat floating in that rich red broth."
  },
  {
    q: "Can I order birria online?",
    a: "Yes — order at losricostacos.com/order for pickup or delivery. Available every day, 9 AM to 2 AM."
  },
  {
    q: "How much do birria tacos cost?",
    a: "Birria tacos are $5 each. Tostadas $4. Torta $12. Burrito $16. Consomé $13.99. Platillo $13.99."
  },
];

const Birria = () => {
  return (
    <>
      <SEO
        title="Birria Tacos Brooklyn — Authentic Birria at Ricos Tacos, Sunset Park"
        description="Brooklyn's best birria tacos. Slow-braised beef, handmade tortillas, rich consomé for dipping. $5 tacos, open daily 9AM–2AM. Order online for pickup or delivery in Sunset Park."
        canonicalPath="/birria"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(birriaSchema)}</script>
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
                Birria Tacos <span className="text-primary">Brooklyn</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Slow-braised beef in rich chile broth. Handmade tortillas. Consomé for dipping.
                The way birria was meant to be — made fresh every day at 505 51st Street.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/order">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    Order Birria Online
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
                src={birriaConsomme}
                alt="Birria tacos with consomé broth for dipping at Ricos Tacos in Sunset Park Brooklyn"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="font-serif text-2xl font-bold">Birria de Res</p>
                <p className="text-white/80 text-sm">505 51st St, Sunset Park, Brooklyn</p>
              </div>
            </div>

            {/* What is birria */}
            <div className="max-w-3xl mx-auto mb-16 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-5">
                What Makes Our <span className="text-primary">Birria</span> Different
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Birria starts the night before — beef braises slowly in a blend of guajillo, ancho, and árbol chiles,
                releasing into a broth so rich it coats the spoon. By morning, the meat pulls apart with barely a touch.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We dip the tortillas in that same broth before griddling, so every taco has that deep red color
                and slightly crispy edge. The consomé comes on the side — drink it, dip into it, or pour it over the taco.
                That's authentic Jalisco birria, made daily in Sunset Park.
              </p>
            </div>

            {/* Menu grid */}
            <div className="max-w-5xl mx-auto mb-16">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Birria <span className="text-primary">Menu</span>
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
                Birria <span className="text-primary">FAQ</span>
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

export default Birria;
