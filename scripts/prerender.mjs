/**
 * Post-build prerender script — injects per-route SEO metadata into the Vite
 * dist output without needing a headless browser.
 *
 * For each public route: reads dist/index.html, swaps in the correct title,
 * description, canonical URL, OG/Twitter tags, and page-specific JSON-LD
 * schemas, then writes to dist/<route>/index.html so Vercel serves the right
 * head on every URL before JavaScript executes.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SITE = 'https://losricostacos.com';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// ── Route manifest ────────────────────────────────────────────────────────────
const routes = [
  {
    path: '/',
    title: 'Ricos Tacos Brooklyn - Authentic Mexican Street Tacos | Order Online',
    description: "Sunset Park Brooklyn's neighborhood taqueria — authentic Puebla recipes since day one. Al pastor, birria, carnitas, barbacoa, lengua & more. Order online for pickup or delivery. Open 9 AM–2 AM daily. 505 51st St.",
  },
  {
    path: '/menu',
    title: 'Full Menu - Tacos, Tortas & More | Ricos Tacos Brooklyn',
    description: 'Browse our full menu of authentic Mexican street tacos, tortas, quesadillas, burritos, soups, and platillos. Order online at Ricos Tacos in Sunset Park, Brooklyn. Open 9 AM–2 AM.',
  },
  {
    path: '/order',
    title: 'Order Online - Pickup & Delivery | Ricos Tacos Brooklyn',
    description: 'Order authentic Mexican street tacos online for pickup or delivery. Al pastor, birria, carnitas & more. Fast pickup from 505 51st Street, Sunset Park, Brooklyn NY.',
  },
  {
    path: '/location',
    title: 'Hours & Location - 505 51st St, Sunset Park Brooklyn | Ricos Tacos',
    description: 'Visit Ricos Tacos at 505 51st Street, Brooklyn NY 11220 in Sunset Park. Open 7 days a week 9 AM–2 AM. Pickup and delivery available. Call (718) 633-4816.',
  },
  {
    path: '/catering',
    title: 'Catering Brooklyn - Authentic Mexican Food for Events | Ricos Tacos',
    description: "Authentic Mexican catering for weddings, quinceañeras, corporate events & parties throughout Brooklyn. Birria, mole, carnitas, barbacoa & more. Call (917) 370-0430.",
  },
  {
    path: '/birria',
    title: 'Birria Tacos Brooklyn — Authentic Birria at Ricos Tacos, Sunset Park',
    description: "Brooklyn's best birria tacos. Slow-braised beef, handmade tortillas, rich consomé for dipping. $5 tacos, open daily 9AM–2AM. Order online for pickup or delivery in Sunset Park.",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "FoodEstablishment",
        "name": "Ricos Tacos",
        "description": "Authentic birria tacos in Sunset Park, Brooklyn. Slow-braised beef in rich chile broth, served with consomé for dipping. Order online for pickup or delivery.",
        "url": "https://losricostacos.com/birria",
        "telephone": "+19173700430",
        "address": { "@type": "PostalAddress", "streetAddress": "505 51st Street", "addressLocality": "Brooklyn", "addressRegion": "NY", "postalCode": "11220", "addressCountry": "US" },
        "hasMenuItem": [
          { "@type": "MenuItem", "name": "Birria Taco", "description": "Rich, slow-braised beef in savory chile broth on a handmade corn tortilla with cilantro, onion, and lime", "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Birria Tostada", "description": "Rich braised beef on a crispy tortilla with fresh toppings", "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Birria Torta", "description": "Rich braised beef on a toasted telera roll with all the fixings", "offers": { "@type": "Offer", "price": "12.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Birria Burrito", "description": "Rich braised beef with rice, beans, and melted cheese in a warm flour tortilla", "offers": { "@type": "Offer", "price": "16.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Birria de Res (Consomé)", "description": "Rich beef consommé with tender meat, for dipping", "offers": { "@type": "Offer", "price": "13.99", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Birria Platillo", "description": "Traditional slow-braised beef in rich chile broth with handmade tortillas", "offers": { "@type": "Offer", "price": "13.99", "priceCurrency": "USD" } }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Where can I get birria tacos in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn serves authentic birria tacos daily from 9 AM to 2 AM. Order online for pickup or delivery." } },
          { "@type": "Question", "name": "What is birria?", "acceptedAnswer": { "@type": "Answer", "text": "Birria is a traditional Mexican dish from Jalisco — slow-braised beef in a rich red chile broth made from guajillo, ancho, and árbol chiles. The consomé is served on the side for dipping." } },
          { "@type": "Question", "name": "How much do birria tacos cost at Ricos Tacos?", "acceptedAnswer": { "@type": "Answer", "text": "Birria tacos are $5 each. Birria tostadas $5, torta $12, burrito $16, consomé $13.99, platillo $13.99." } },
          { "@type": "Question", "name": "Can I order birria online in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — order at losricostacos.com/order for pickup or delivery in the Sunset Park area. Available daily 9 AM to 2 AM." } }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
          { "@type": "ListItem", "position": 2, "name": "Birria Tacos Brooklyn", "item": "https://losricostacos.com/birria" }
        ]
      }
    ],
  },
  {
    path: '/catering-brooklyn',
    title: 'Catering Brooklyn — Authentic Mexican Food for Events | Ricos Tacos',
    description: "Mexican catering in Brooklyn for weddings, quinceañeras, corporate events & parties. Birria, mole, carnitas, fajitas & more from Puebla. Call Josefina at (917) 370-0430. Serving all of Brooklyn.",
    schemas: [
      {
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
        "address": { "@type": "PostalAddress", "streetAddress": "505 51st Street", "addressLocality": "Brooklyn", "addressRegion": "NY", "postalCode": "11220", "addressCountry": "US" }
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Do you do catering in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Ricos Tacos caters events throughout Brooklyn and greater NYC. We handle weddings, quinceañeras, corporate events, birthday parties, and private gatherings of any size. Call (917) 370-0430 to speak with Josefina." } },
          { "@type": "Question", "name": "What kind of food do you serve for catering?", "acceptedAnswer": { "@type": "Answer", "text": "We serve authentic Puebla-style Mexican food: birria, mole poblano, carnitas, barbacoa, chiles rellenos, fajitas, tamales, tacos al pastor, pozole, and more. Custom menus available." } },
          { "@type": "Question", "name": "How far in advance should I book catering?", "acceptedAnswer": { "@type": "Answer", "text": "For large events like weddings and quinceañeras, we recommend booking at least 2–4 weeks in advance. For smaller gatherings, a week's notice is often enough. Call (917) 370-0430 to check availability." } },
          { "@type": "Question", "name": "Do you cater quinceañeras in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — quinceañeras are one of our most popular catering events. Traditional dishes like mole, birria, carnitas, and tamales are always a hit. Call (917) 370-0430." } },
          { "@type": "Question", "name": "How do I get a catering quote?", "acceptedAnswer": { "@type": "Answer", "text": "Call or text (917) 370-0430 and ask for Josefina. Tell us your event date, estimated headcount, and any dish preferences, and we'll put together a custom quote." } }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
          { "@type": "ListItem", "position": 2, "name": "Catering Brooklyn", "item": "https://losricostacos.com/catering-brooklyn" }
        ]
      }
    ],
  },
  {
    path: '/mexican-restaurant-brooklyn',
    title: 'Mexican Restaurant Brooklyn — Ricos Tacos, Authentic Puebla Cuisine',
    description: "Brooklyn's best authentic Mexican restaurant in Sunset Park. Street tacos from $3, birria, tortas, pozole, fajitas & 100+ dishes from Puebla. Open daily 9AM–2AM at 505 51st St. Order online.",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": ["Restaurant", "LocalBusiness"],
        "name": "Ricos Tacos",
        "description": "Authentic Mexican restaurant in Sunset Park, Brooklyn. Street tacos from $3, birria, tortas, burritos, soups, and full platillos. Recipes from Puebla, made fresh daily.",
        "url": "https://losricostacos.com/mexican-restaurant-brooklyn",
        "telephone": "+17186334816",
        "servesCuisine": ["Mexican", "Street Food", "Tacos"],
        "priceRange": "$",
        "openingHours": "Mo-Su 09:00-02:00",
        "address": { "@type": "PostalAddress", "streetAddress": "505 51st Street", "addressLocality": "Brooklyn", "addressRegion": "NY", "postalCode": "11220", "addressCountry": "US" },
        "geo": { "@type": "GeoCoordinates", "latitude": "40.6526", "longitude": "-74.0137" },
        "hasMap": "https://maps.google.com/?q=505+51st+Street+Brooklyn+NY+11220",
        "potentialAction": { "@type": "OrderAction", "target": { "@type": "EntryPoint", "urlTemplate": "https://losricostacos.com/order", "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] } }
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is the best Mexican restaurant in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn is widely recognized as one of Brooklyn's best authentic Mexican restaurants. We serve over 100 dishes — street tacos from $3, birria, tortas, burritos, soups, and full platillos — using traditional recipes from Puebla, Mexico. Open daily 9 AM to 2 AM." } },
          { "@type": "Question", "name": "Where is Ricos Tacos located in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Ricos Tacos is located at 505 51st Street in Sunset Park, Brooklyn, NY 11220 — a few blocks from the R/N subway trains at 53rd Street. We're open 7 days a week from 9 AM to 2 AM." } },
          { "@type": "Question", "name": "What kind of food does Ricos Tacos serve?", "acceptedAnswer": { "@type": "Answer", "text": "We serve authentic Mexican food from Puebla: street tacos ($3), specialty tacos ($5), tostadas, tortas, burritos, quesadillas, pozole, birria, fajitas, mole, enchiladas, chilaquiles, and full platillos. Over 100 items, all made fresh daily." } },
          { "@type": "Question", "name": "Do you offer delivery in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Order at losricostacos.com/order for pickup or delivery within 20 minutes of Sunset Park. Available daily 9 AM to 2 AM. You can also call (718) 633-4816." } },
          { "@type": "Question", "name": "What are Ricos Tacos hours?", "acceptedAnswer": { "@type": "Answer", "text": "We're open 7 days a week, 9 AM to 2 AM. Kitchen stays open until 2 AM every night including weekends." } }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
          { "@type": "ListItem", "position": 2, "name": "Mexican Restaurant Brooklyn", "item": "https://losricostacos.com/mexican-restaurant-brooklyn" }
        ]
      }
    ],
  },
  {
    path: '/tacos-brooklyn',
    title: 'Tacos Brooklyn — Authentic Mexican Street Tacos at Ricos Tacos, Sunset Park',
    description: "Brooklyn's best street tacos from $3. Al pastor, birria, carnitas, suadero, carne asada & 20+ more. Handmade tortillas, open daily 9AM–2AM. Order online for pickup or delivery in Sunset Park.",
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "FoodEstablishment",
        "name": "Ricos Tacos",
        "description": "Authentic Mexican street tacos in Sunset Park, Brooklyn. Al pastor, birria, carnitas, suadero, and 20+ varieties on handmade corn tortillas.",
        "url": "https://losricostacos.com/tacos-brooklyn",
        "telephone": "+19173700430",
        "servesCuisine": "Mexican",
        "priceRange": "$",
        "openingHours": "Mo-Su 09:00-02:00",
        "address": { "@type": "PostalAddress", "streetAddress": "505 51st Street", "addressLocality": "Brooklyn", "addressRegion": "NY", "postalCode": "11220", "addressCountry": "US" },
        "hasMenuItem": [
          { "@type": "MenuItem", "name": "Al Pastor Taco", "description": "Marinated pork with pineapple on a handmade corn tortilla", "offers": { "@type": "Offer", "price": "3.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Birria Taco", "description": "Slow-braised beef in rich chile broth with consomé for dipping", "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Carnitas Taco", "description": "Crispy-edged slow-fried pork on a handmade corn tortilla", "offers": { "@type": "Offer", "price": "3.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Suadero Taco", "description": "Tender beef brisket slow-cooked until it falls apart", "offers": { "@type": "Offer", "price": "3.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Cochinita Pibil Taco", "description": "Slow-roasted pork marinated in citrus and achiote", "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" } },
          { "@type": "MenuItem", "name": "Carne Asada Taco", "description": "Flame-grilled steak with smoky char and bold flavor", "offers": { "@type": "Offer", "price": "5.00", "priceCurrency": "USD" } }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Where can I get tacos in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn serves authentic Mexican street tacos daily from 9 AM to 2 AM. Street tacos start at $3." } },
          { "@type": "Question", "name": "What are the best tacos in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Ricos Tacos in Sunset Park serves 20+ taco varieties including al pastor, birria, carnitas, suadero, cochinita pibil, carne asada, and more — all on handmade corn tortillas with fresh cilantro, onion, and house-made salsa." } },
          { "@type": "Question", "name": "How much do tacos cost at Ricos Tacos Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Street tacos (al pastor, carnitas, suadero, and others) are $3 each. Specialty tacos (birria, cochinita pibil, carne asada, tacos árabes) are $5 each." } },
          { "@type": "Question", "name": "Can I order tacos online in Brooklyn?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — order tacos online at losricostacos.com/order for pickup or delivery in the Sunset Park area. Available every day, 9 AM to 2 AM." } }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://losricostacos.com" },
          { "@type": "ListItem", "position": 2, "name": "Tacos Brooklyn", "item": "https://losricostacos.com/tacos-brooklyn" }
        ]
      }
    ],
  },
];

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildHtml(tpl, route) {
  let html = tpl;
  const url = `${SITE}${route.path}`;
  const t = esc(route.title);
  const d = esc(route.description);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/,  `$1${d}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/,   `$1${url}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${t}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${d}$2`);
  html = html.replace(/(<meta name="twitter:url" content=")[^"]*(")/,   `$1${url}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${t}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${d}$2`);

  const inject = [
    `<link rel="canonical" href="${url}">`,
    ...(route.schemas || []).map(
      s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`
    ),
  ].join('');

  html = html.replace('</head>', `${inject}</head>`);
  return html;
}

// ── Write per-route HTML ──────────────────────────────────────────────────────
const template = readFileSync(join(DIST, 'index.html'), 'utf-8');
let count = 0;

for (const route of routes) {
  const html = buildHtml(template, route);
  const dir = route.path === '/' ? DIST : join(DIST, route.path.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`  ✓ ${route.path}`);
  count++;
}

console.log(`\nPrerendered ${count} routes.`);
