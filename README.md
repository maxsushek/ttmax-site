# TTMAX

Production Next.js 15 storefront for table-tennis equipment. UK + RU locales, Supabase-ready leads pipeline, prepared for Google Ads + Meta Ads + GTM.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript strict
- Tailwind CSS · Server Components first
- Supabase (SSR client) · Zod validation
- Custom lightweight i18n (UK default, RU alternative) — no heavy dependency

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your IDs
npm run dev                  # → http://localhost:3000 → redirects to /uk
```

### Scripts

```bash
npm run dev        # local dev
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run format     # Prettier write
```

## Environment variables

Everything is optional in development — code is no-op when keys are missing. Required for production: `NEXT_PUBLIC_SITE_URL`, Supabase keys (for lead capture), at least one of the analytics IDs.

```
NEXT_PUBLIC_SITE_URL                       # https://ttmax.ua
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY                  # server-only — used by /api/leads
NEXT_PUBLIC_GTM_ID                         # optional, e.g. GTM-XXXX
NEXT_PUBLIC_GA_ID                          # optional
NEXT_PUBLIC_GOOGLE_ADS_ID                  # AW-XXXX
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL    # XXXX (fires on lead + purchase)
NEXT_PUBLIC_META_PIXEL_ID                  # 15-digit pixel ID
```

## Project structure

```
src/
├── app/
│   ├── [locale]/             # all routes locale-namespaced
│   │   ├── layout.tsx        # Header + Footer + CartProvider + Analytics
│   │   └── page.tsx          # home (composes sections)
│   ├── api/leads/route.ts    # POST /api/leads — Zod + Supabase
│   ├── layout.tsx            # root (next/font, html lang)
│   ├── globals.css
│   ├── robots.ts
│   ├── sitemap.ts
│   └── not-found.tsx
├── components/
│   ├── ui/                   # Button, Section, Container, Logo, Input
│   ├── layout/               # Header, MobileMenu, Footer, LocaleSwitcher
│   ├── sections/             # Hero, Categories, Products, Brands, FAQ, …
│   ├── cart/                 # CartProvider, CartButton, CartDrawer
│   ├── checkout/             # CheckoutForm (3-step)
│   ├── forms/                # LeadForm
│   └── analytics/            # AnalyticsProvider (scripts loader)
├── config/                   # site.ts, navigation.ts
├── data/                     # products, brands, categories
├── i18n/
│   ├── config.ts
│   ├── index.ts              # getMessages, t()
│   └── messages/{uk,ru}.ts
├── lib/
│   ├── analytics/            # events.ts (entry point), gtm, meta-pixel, google-ads, attribution
│   ├── seo/                  # metadata builder, JSON-LD helpers
│   └── supabase/             # client.ts, server.ts, types.ts
├── types/index.ts
├── utils/                    # cn, format, validators
└── middleware.ts             # locale routing + x-locale header + UTM passthrough
```

## i18n

- Default locale: `uk` (Ukrainian). Second: `ru` (Russian).
- All routes live under `/[locale]/...`. `/` redirects to the detected locale (cookie → Accept-Language → default).
- Locale persists in `NEXT_LOCALE` cookie.
- Add a locale by extending `src/i18n/config.ts` and creating `messages/<lang>.ts`.

## Supabase

Apply the migration in `supabase/migrations/0001_leads.sql` (paste into SQL Editor or `supabase db push`). The `/api/leads` route uses the service role to bypass RLS for inserts; anon access is revoked.

To regenerate TypeScript types from your schema:
```
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

## Analytics

Single entry point: `trackEvent({ name, params })` from `src/lib/analytics/events.ts`. It fans out to dataLayer (GTM/GA4), Meta Pixel (with event-name mapping), and Google Ads conversion firing. No-ops gracefully when IDs are absent.

UTM + click IDs (`gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`) are captured by `captureAttribution()` on mount and persisted in `localStorage`. They are sent with lead submissions.

### Events fired today

- `cta_click` — every CTA button has `data-cta` + `data-location`
- `lead_form_start`, `lead_form_submit`, `conversion`
- `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase`
- `faq_open`, `phone_click`

### Wiring conversion tracking

1. Create a conversion action in Google Ads → copy the label → `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`.
2. In GTM, listen for the dataLayer event names above (or use them directly via GA4).
3. For Meta CAPI (server-side), add a route handler that mirrors `/api/leads` and POSTs to the Conversions API using `META_CAPI_ACCESS_TOKEN`.

## SEO

- Per-locale metadata + `alternates.languages` (hreflang).
- `sitemap.xml` and `robots.txt` auto-generated.
- JSON-LD: `Organization`, `WebSite` (in `[locale]/layout`); `FAQPage` (on home).
- Semantic HTML throughout (`<header>`, `<main>`, `<nav>`, `<section>`, `<aside>`).

## Performance notes

- All non-interactive sections are Server Components (Hero, Categories, Products grid, Brands, Marquee, TrustBar).
- Client islands: header scroll state, mobile menu, cart, FAQ accordion, forms.
- `next/font` (Barlow + Barlow Condensed, cyrillic subset) — no external font CDN.
- CSS-only animations everywhere — no animation library.
- `prefers-reduced-motion` honored globally.
- Analytics scripts loaded with `strategy="afterInteractive"`.

## CRO / what's prepared but needs real data

- Reviews, case studies, real product photos — currently placeholders (emojis).
- Phone number, social URLs, address in `src/config/site.ts` — replace before launch.
- Stats numbers in Hero (`products.length * 250`, etc.) — derive from real catalog.
- `/terms` and `/privacy` pages — referenced from checkout/footer, need creating.

## What's NOT included (intentionally)

- Catalog pages (`/catalog/[category]`, `/brands/[brand]`, product detail) — scaffold ready, business decision needed on data source (Supabase products vs static).
- Authentication — Supabase Auth available on demand.
- Admin / dashboards.
- Meta CAPI server route — see analytics section.
- Thank-you page — current implementation uses in-modal success state; for richer attribution add `/[locale]/thanks`.

## Browser support

Modern evergreen browsers. Safari ≥ 14, Chrome/Edge/Firefox latest two majors.
