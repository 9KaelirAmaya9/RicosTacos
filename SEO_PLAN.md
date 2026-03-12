# losricostacos.com — Full SEO Plan
**Target:** Ricos Tacos, 505 51st Street, Sunset Park, Brooklyn NY 11220
**Date:** March 2026
**Contributors:** Growth Hacker · Content Creator · Social Media Strategist · Data Analytics Reporter

---

## Agent 1 — Growth Hacker: SEO Audit & Prioritized Action Plan

### Technical Audit Findings

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | No `sitemap.xml` present | 🔴 Critical | **Fixed** — `/public/sitemap.xml` created |
| 2 | `robots.txt` missing `Sitemap:` directive | 🔴 Critical | **Fixed** — directive added |
| 3 | Admin/kitchen routes exposed to crawlers | 🔴 Critical | **Fixed** — `Disallow:` rules added |
| 4 | Thin Restaurant schema (no menu items, no FAQ) | 🔴 Critical | **Fixed** — rich schema added |
| 5 | Title tag missing "birria" and "Sunset Park" | 🟠 High | **Fixed** — title updated |
| 6 | Meta description missing "catering" keyword | 🟠 High | **Fixed** — description updated |
| 7 | PWA manifest description is generic, no location | 🟠 High | **Fixed** — manifest updated |
| 8 | No FAQ schema (missed rich-result eligibility) | 🟠 High | **Fixed** — FAQ schema added |
| 9 | OG tags missing `og:site_name` | 🟡 Medium | **Fixed** — tag added |
| 10 | No per-page canonical tags (SPA renders all under `/`) | 🟡 Medium | Requires react-helmet-async — see below |
| 11 | Core Web Vitals: hero image lacks `fetchpriority="high"` | 🟡 Medium | **Already present** — confirmed |
| 12 | No Google Analytics / Search Console connected | 🟡 Medium | See Analytics Agent section |
| 13 | No `<link rel="preload">` for hero image | 🟡 Medium | See remediation below |
| 14 | Missing `hreflang` for bilingual ES/EN content | 🟡 Medium | Added to sitemap.xml |

### Prioritized Action Plan

**Phase 1 — Technical Quick Wins (Done in this PR)**
- [x] `sitemap.xml` with all 5 public routes
- [x] `robots.txt` Sitemap directive + block admin routes
- [x] Title / description / OG copy with target keywords
- [x] Rich Restaurant schema: MenuSection, birria/al pastor/carnitas items, catering offer
- [x] FAQ schema (5 Q&As covering location, birria, delivery, catering, hours)
- [x] BreadcrumbList schema seed
- [x] PWA manifest location-aware description

**Phase 2 — Per-Page SEO (Next sprint)**
- [ ] Install `react-helmet-async` and set unique `<title>`, `<meta name="description">`, and `<link rel="canonical">` per page:
  - `/order` → "Order Street Tacos Online | Ricos Tacos Sunset Park Brooklyn"
  - `/menu` → "Menu | Birria, Al Pastor & More | Ricos Tacos Brooklyn"
  - `/location` → "Find Us | 505 51st St, Sunset Park Brooklyn | Ricos Tacos"
- [ ] Add `<link rel="preload" as="image" href="/hero-tacos.jpg">` in `<head>` for LCP improvement
- [ ] Compress hero image to WebP (target < 120 KB)

**Phase 3 — Authority & Local Signals (Ongoing)**
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Claim/optimize Google Business Profile (see Social Media Agent)
- [ ] Build content targeting `birria sunset park`, `Mexican catering Brooklyn` (see Content Agent)

### Target Keywords

| Keyword | Intent | Priority |
|---------|--------|----------|
| street tacos brooklyn | Informational / Local | P1 |
| birria sunset park | Local navigational | P1 |
| birria tacos brooklyn | Local transactional | P1 |
| mexican catering brooklyn | Commercial | P1 |
| tacos near me (Brooklyn) | Local transactional | P2 |
| al pastor tacos brooklyn | Local transactional | P2 |
| sunset park restaurant | Local discovery | P2 |
| mexican food delivery brooklyn | Transactional | P3 |

---

## Agent 2 — Content Creator: Copy Rewrites, Metadata & Content Calendar

### Page-Level Copy Recommendations

#### Homepage (`/`)
**Current H1 pattern:** "Ricos Tacos Brooklyn" (generic)
**Recommended H1:** "Authentic Street Tacos & Birria in Sunset Park, Brooklyn"
**Hero subtitle rewrite:**
> Hand-pressed corn tortillas, slow-braised birria, and al pastor straight off the trompo — made fresh every day at 505 51st Street.

#### Order page (`/order`)
- Add intro sentence above the menu grid: *"Order authentic Mexican street tacos for pickup or delivery in Brooklyn. Birria, al pastor, carnitas — fresh every day."*
- Ensure "birria" appears as a heading within the Birria section (not just item title text) for on-page keyword weight.

#### Menu catalog (`/menu`)
- Add a short lede paragraph: *"Explore our full menu of traditional Mexican street food. Each taco is made on hand-pressed corn tortillas with recipes from Puebla, Mexico."*
- Add "Catering" as a visible menu section or callout linking to contact.

#### Location page (`/location`)
- Headline: "Find Ricos Tacos in Sunset Park, Brooklyn"
- Body copy should include: neighborhood name (Sunset Park), cross streets, parking notes, subway directions.
- This page is high-value for the GBP → website authority signal.

### Recommended Meta Tags Per Page (for react-helmet-async)

| Page | Title | Description |
|------|-------|-------------|
| `/` | Ricos Tacos Brooklyn – Street Tacos & Birria \| Sunset Park | Brooklyn's best authentic Mexican street tacos in Sunset Park. Birria, al pastor, carnitas. Order online. Mexican catering available. |
| `/order` | Order Street Tacos Online – Ricos Tacos Brooklyn | Order authentic birria tacos, al pastor & more for pickup or delivery in Brooklyn. Fresh every day. |
| `/menu` | Menu – Birria, Al Pastor & Carnitas \| Ricos Tacos Brooklyn | Browse our full Mexican street food menu. Hand-pressed corn tortillas, traditional Puebla recipes. Sunset Park, Brooklyn. |
| `/location` | Location – 505 51st Street, Sunset Park Brooklyn \| Ricos Tacos | Find Ricos Tacos at 505 51st Street in Sunset Park, Brooklyn. Hours, directions, and parking info. |

### Content Calendar — Blog / SEO Articles

> **Note:** This is a React SPA. To support a blog, add a `/blog` route with static MDX or connect a headless CMS (Contentful, Sanity).
> Alternatively, publish on Google Business Profile posts, Substack, or Medium and link back to the site.

| Month | Topic | Target Keyword | Format |
|-------|-------|----------------|--------|
| April 2026 | "What Is Birria? The History Behind Brooklyn's Hottest Taco" | birria sunset park | Blog / GBP post |
| May 2026 | "Where to Find Authentic Al Pastor Tacos in Brooklyn" | al pastor tacos brooklyn | Blog / local guide |
| June 2026 | "Mexican Catering in Brooklyn: What to Expect from Ricos Tacos" | mexican catering brooklyn | Blog / landing page |
| July 2026 | "Sunset Park Food Guide: Best Mexican Restaurants" | sunset park restaurant | Guest post / local press |
| August 2026 | "The Ricos Tacos Story: From Puebla to Brooklyn" | street tacos brooklyn | Brand story / PR pitch |
| September 2026 | "How to Order Tacos for a Party: Catering FAQ" | mexican catering brooklyn | FAQ landing page |

---

## Agent 3 — Social Media Strategist: Backlink, UGC & Outreach Strategy

### Google Business Profile (GBP) Optimization

**Immediate Actions:**
1. **Claim & verify** the GBP listing at `google.com/business` if not done.
2. **Primary category:** Mexican Restaurant
   **Secondary categories:** Taco Restaurant, Catering Food and Drink Supplier
3. **Business description** (750 chars):
   > Ricos Tacos serves authentic Mexican street food in the heart of Sunset Park, Brooklyn. We're known for our slow-braised birria tacos, hand-pressed corn tortillas, and traditional recipes passed down from Puebla, Mexico. Order al pastor, carnitas, quesadillas, and more for pickup or delivery — or ask about our Brooklyn catering services for events and parties. Open 7 days, 11 AM–10 PM. 505 51st Street, Brooklyn NY 11220. (718) 633-4816.
4. **Add menu link:** `https://losricostacos.com/menu`
5. **Enable online ordering link:** `https://losricostacos.com/order`
6. **Upload 10+ photos:** inside the restaurant, tacos in progress, team, packaging.
7. **Post weekly** to GBP: feature a taco, announce specials, repost UGC.

### Local Citation Building

Submit NAP (Name, Address, Phone) to these directories in this order:

| Directory | Priority | Notes |
|-----------|----------|-------|
| Google Business Profile | P1 | Done first — authority source |
| Yelp | P1 | NYC food scene critical |
| TripAdvisor | P1 | Tourist discovery |
| Foursquare | P2 | Data syndicates to Apple Maps & others |
| OpenTable / Resy | P2 | Even without reservations — improves NAP coverage |
| Zomato | P2 | Active NYC foodie community |
| Patch.com (Brooklyn) | P3 | Local news / community |
| The Infatuation | P3 | Pitch for NYC guide inclusion |
| Eater NY | P3 | Pitch editorial feature |

**NAP consistency check:** Ensure "Ricos Tacos" (not "Los Ricos Tacos") is used consistently everywhere, OR pick one canonical name and update all listings.

### UGC & Review Generation

**Review ask scripts:**

*In-person (receipt insert or verbal):*
> "Loved your tacos? Leave us a Google review — it really helps a small Brooklyn spot like ours! Just search 'Ricos Tacos Brooklyn' on Google. Takes 30 seconds. ¡Gracias!"

*Post-order email/SMS (add to order confirmation flow):*
> "Thanks for ordering from Ricos Tacos! If you enjoyed your meal, a quick Google review would mean the world to us: [Google review link]. See you next time! 🌮"

*Instagram caption template:*
> "This is your sign to get birria tacos in Sunset Park 🌮🔥 Come find us at 505 51st Street, Brooklyn. Order online at losricostacos.com. Tag us in your taco pics! #RicosTacos #BrooklynTacos #BirriaNewYork #SunsetPark"

### Influencer & Creator Outreach

**Target micro-influencers (5K–50K followers) in:**
- Brooklyn foodie Instagram: search `#BrooklynFood`, `#BrooklynTacos`, `#NYCTacos`
- NYC TikTok food creators: search `#NYCFoodTikTok`, `#BirriaNewYork`
- Local Latino community pages on FB/IG

**Outreach DM template:**
> "Hey [Name]! I'm from Ricos Tacos — we make authentic birria and street tacos in Sunset Park, Brooklyn. We'd love to have you in for a complimentary tasting and create some content together. We think your followers would love our birria consomé. Interested? 🌮"

### Reddit / Local Community Strategy

- **r/Brooklyn** — post "Hidden gem alert: been coming to this Sunset Park taco spot for years" (authentic, not spammy)
- **r/FoodNYC** — photo post of birria tacos with address in comments
- **Nextdoor (Sunset Park)** — announce deals, weekly specials
- **NYC Food Facebook groups** — share menu updates, tag neighborhood

### Link Building Targets

| Tactic | Target Site | Value |
|--------|-------------|-------|
| "Best Birria NYC" round-up pitch | Eater NY, Time Out NY, Gothamist | High DA backlinks |
| "Sunset Park Food Guide" pitch | Brooklyn Magazine, BrooklynVegan.com | Local authority |
| Catering vendor page | EventBrite Brooklyn, Peerspace | Commercial keyword backlink |
| Neighborhood association listing | Sunset Park BID / Community Board | Local citation |
| Spanish-language media | El Diario, Mundo Hispanico NY | Bilingual audience + links |

---

## Agent 4 — Data Analytics Reporter: GA4, Search Console & KPI Framework

### Google Analytics 4 Setup

**Install GA4:**
1. Create a GA4 property at `analytics.google.com` for `losricostacos.com`
2. Add the measurement script to `index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```
3. Replace `G-XXXXXXXXXX` with your actual measurement ID (stored in `.env` as `VITE_GA4_MEASUREMENT_ID`).

> **Security note:** GA4 Measurement IDs are public-facing and safe to embed. Do NOT use the GA4 API Secret in client-side code.

**Custom Events to Track:**

| Event Name | Trigger | GA4 Parameter |
|------------|---------|---------------|
| `view_menu` | User visits `/menu` or `/order` | `page_location` |
| `add_to_cart` | Item added to cart (hook into CartContext) | `item_name`, `item_category`, `value` |
| `begin_checkout` | Checkout modal opens | `value`, `order_type` |
| `purchase` | Order success page (`/order-success`) | `order_number`, `value`, `items` |
| `contact_click` | Phone number or address clicked | `method` |
| `order_type_select` | Pickup vs Delivery toggle | `order_type` |

**Implementation:** Add `gtag('event', ...)` calls in the relevant React components (CartContext, Cart.tsx, OrderSuccess.tsx).

### Google Search Console Setup

1. Go to `search.google.com/search-console`
2. Add property → URL prefix: `https://losricostacos.com`
3. Verify via HTML file or DNS TXT record
4. **Submit sitemap:** Sitemaps → Add `https://losricostacos.com/sitemap.xml`
5. Request indexing for: `/`, `/menu`, `/order`, `/location`

### Core KPIs & Monthly Dashboard

**Dashboard:** Create a Looker Studio report pulling from GA4 + Search Console.

| KPI | Target (Month 3) | Target (Month 6) | Source |
|-----|-----------------|-----------------|--------|
| Organic sessions | 500/month | 1,500/month | GA4 |
| Clicks from GSC | 200/month | 800/month | Search Console |
| Average position for "street tacos brooklyn" | < 20 | < 10 | Search Console |
| Average position for "birria sunset park" | < 15 | < 5 | Search Console |
| Online orders from organic traffic | 10/month | 40/month | GA4 (purchase events) |
| Google Business Profile views | 500/month | 2,000/month | GBP Insights |
| GBP website clicks | 50/month | 200/month | GBP Insights |
| Reviews (Google) | 50 total | 150 total | GBP |
| Average star rating | ≥ 4.4 | ≥ 4.5 | GBP |

### Monthly SEO Validation Process

**Week 1 of each month:**
- [ ] Check Search Console for crawl errors, index coverage issues
- [ ] Review top 10 queries — are target keywords appearing?
- [ ] Check Core Web Vitals report in GSC (LCP, INP, CLS)

**Week 2:**
- [ ] Review GA4 organic channel sessions vs prior month
- [ ] Check `purchase` event conversions from organic
- [ ] Audit GBP for new reviews — respond to all within 48h

**Week 3:**
- [ ] Run a backlink check (Ahrefs free / Moz Link Explorer)
- [ ] Check citation consistency across directories
- [ ] Post 1 new piece of content (blog, GBP post, or social)

**Week 4:**
- [ ] Update content calendar for next month
- [ ] Check competitor rankings for target keywords
- [ ] Report: sessions, clicks, conversions, GBP stats → send to owner

### Alert Setup (GA4)

Set GA4 Intelligence Alerts for:
- Organic sessions drop > 20% week-over-week
- 0 `purchase` events in any 7-day window
- Bounce rate > 80% on `/order` page

---

## Consolidated Implementation Timeline

| Sprint | Actions | Owner |
|--------|---------|-------|
| **Week 1 (done)** | sitemap.xml, robots.txt, schema markup, title/meta/OG fixes | Growth Hacker |
| **Week 2** | GBP claim + optimize, submit sitemap to GSC, GA4 install | Analytics Reporter |
| **Week 3** | Citation building (Yelp, TripAdvisor, Foursquare), review ask scripts on receipts | Social Media Strategist |
| **Week 4** | react-helmet-async per-page titles, hero image WebP conversion, preload hint | Content Creator |
| **Month 2** | First blog post ("What is Birria?"), influencer outreach (3 creators), Reddit/Nextdoor posts | Social Media Strategist + Content Creator |
| **Month 3** | Second blog post (catering landing page), first link-building outreach to Eater/Gothamist | Content Creator + Growth Hacker |
| **Ongoing** | Weekly GBP post, monthly analytics review, review responses | Analytics Reporter |

---

## Files Changed in This PR

| File | Change |
|------|--------|
| `public/sitemap.xml` | **Created** — all 5 public routes, hreflang for EN/ES |
| `public/robots.txt` | **Updated** — added Sitemap directive, blocked admin/kitchen routes |
| `public/manifest.json` | **Updated** — location-aware PWA name and description |
| `index.html` | **Updated** — title, meta description, keywords, OG tags, rich Restaurant + FAQ + BreadcrumbList schema |

---

*Plan prepared by Growth Hacker · Content Creator · Social Media Strategist · Data Analytics Reporter*
*All technical fixes have been applied to the codebase. Remaining items require access to Google accounts and CMS/blog infrastructure.*
