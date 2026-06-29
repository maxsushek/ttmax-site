# TTMAX — SEO та база знань проєкту

> **Живий документ.** Ведеться автоматично (Claude) — оновлюється в міру збору даних і пушиться в GitHub, щоб завжди був свіжим.
> **Останнє оновлення:** 2026-06-29 · повний план згенеровано multi-agent аудитом коду (29 агентів, 7 вимірів, 51 верифікована знахідка).
> **Сайт:** Butterfly UA by TTMAX — магазин інвентарю для настільного тенісу (ринок України)
> **Live:** https://ttmax-site-z2za.vercel.app/ua · **Репо:** https://github.com/maxsushek/ttmax-site

---

## Зміст
**Довідка:** [1. Стек](#1-технічний-стек) · [2. Підключення](#2-підключення--інтеграції) · [3. Пріоритетні товари](#3-пріоритетні-товари-money-pages) · [4. Keyword research](#4-дослідження-ключових-слів-ahrefs-ua) · [5. Безпека](#5-безпека-supabase)
**План:** [6. Стан зараз](#6-стан-зараз) · [7. P0 критичне](#7-p0--критичне-зробити-першим) · [8. P1](#8-p1--високий-пріоритет) · [9. P2 контент](#9-p2--зростання-контент-роадмап) · [10. Чеклист запуску](#10-технічний-чеклист-запуску-go-live) · [11. Вимірювання](#11-вимірювання) · [12. План по тижнях](#12-план-по-тижнях) · [13. Ключові файли](#13-ключові-файли)

---

## 1. Технічний стек

- **Next.js 15** (App Router) · React 19 · TypeScript strict · RSC + ISR (`revalidate=600`)
- **Tailwind CSS**, Server Components first
- **Supabase** (SSR) — ліди, замовлення, контент, медіа, налаштування
- **Cloudinary** — зображення (`res.cloudinary.com/dh6vuxjko`), AVIF/WebP
- **i18n** власний: `ua` (за замовч., `<html lang="uk">`) + `ru`. URL: `/ua/...`, `/ru/...`
- Адмінка `/admin` (ліди/CRM, товари, медіа, контент, налаштування)
- Аналітика: GTM / GA4 / Google Ads / Meta Pixel + Meta CAPI (всі no-op без ID)

**Масштаб каталогу:** ~10 категорій · 22 бренди (активний — Butterfly) · ~430 товарів
(накладки 43 · основи 84 · ракетки-збірки 95 · екіпірування 296). Категорія **`stoly` (столи) — 0 товарів**.

---

## 2. Підключення / інтеграції

| Сервіс | Деталі | Стан |
|---|---|---|
| **GitHub** | `maxsushek/ttmax-site`, гілка `main` | ✅ авторизація (gh) |
| **Supabase** | проєкт `TT-max` · `ttpjtpivtcxjvlzbpwoi` · eu-central-1 · PG17 | ✅ активний |
| **Vercel** | live на `ttmax-site-z2za.vercel.app` (тимч. домен) | ⚠️ не на `ttmax.ua` |
| **Cloudinary** | акаунт `dh6vuxjko`, 1061 медіа-записів | ✅ |
| **Ahrefs** | доступ є; окремого проєкту під `ttmax.ua` ще нема | ⏳ створити |

**Таблиці Supabase (public):** `leads` (18), `lead_events` (42), `admins` (1), `orders` (7), `order_items` (7), `order_events` (7), `entity_media` (1061), `site_settings` (5), `product_overrides` (4), `content_blocks` (36) + 2 backup-таблиці (див. §5).

**Env (`.env`):** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_LAUNCHED` (гейт noindex), Supabase-ключі, аналітика (GTM/GA/Ads/Meta), Telegram-сповіщення.

---

## 3. Пріоритетні товари (money-pages)

Заданий пріоритет власника. **Усі 18 товарів уже є в каталозі.** Максимум SEO-уваги: унікальний опис, schema Product з offers/наявністю/images/sku, перелінковка, фото, відгуки.

### Накладки — `/{locale}/butterfly/nakladki/{slug}`

| # | Товар | slug | Пошук (бренд-запит) |
|---|---|---|---|
| 1 | Butterfly Dignics 05 | `dignics-05` | dignics 05 ~50/міс |
| 2 | Butterfly Dignics 09C | `dignics-09c` | бренд |
| 3 | Butterfly Dignics 64 | `dignics-64` | бренд |
| 4 | Butterfly Dignics 80 | `dignics-80` | бренд |
| 5 | Butterfly Tenergy 05 | `tenergy-05` | tenergy 05 ~50/міс |
| 6 | Butterfly Tenergy 05 FX | `tenergy-05-fx` | бренд |
| 7 | Butterfly Tenergy 05 Hard | `tenergy-05-hard` | бренд |
| 8 | Butterfly Tenergy 19 | `tenergy-19` | бренд |
| 9 | Butterfly Zyre 03 | `zyre-03` | бренд |
| 10 | Butterfly Glayzer | `glayzer` | бренд |
| 11 | Butterfly Glayzer 09C | `glayzer-09c` | бренд |
| 12 | Butterfly Rozena | `rozena` | бренд |
| 13 | Butterfly Feint Long III | `feint-long-iii` | бренд (довгі шипи) |

### Основи — `/{locale}/butterfly/osnovaniya/{slug}`

| # | Товар | slug | Пошук |
|---|---|---|---|
| 14 | Butterfly Viscaria OFF | `viscaria` | viscaria — топ-основа |
| 15 | Butterfly Timo Boll ALC | `timo-boll-alc` | timo boll alc |
| 16 | Butterfly Harimoto Tomokazu ALC | `harimoto-tomokazu-alc` | бренд |
| 17 | Butterfly Apolonia ZLC | `apolonia-zlc` | бренд |
| 18 | Butterfly Timo Boll CAF | `timo-boll-caf` | бренд |

---

## 4. Дослідження ключових слів (Ahrefs, UA)

Country = UA, дані Ahrefs Keywords Explorer (2026-06-29). **Уся ніша KD ≈ 0** — низька конкуренція.

| Запит | Обсяг/міс | KD | TP | Інтент | Нотатка |
|---|---|---|---|---|---|
| тенісний стіл | **2800** | 0 | 300 | comm/trans | 🔴 столів немає |
| настільний теніс | **2100** | 1 | 500 | info | гайд/контент |
| ракетка для настольного тенниса (RU) | **2000** | 0 | 1200 | comm/trans | категорія `rakety` |
| ракетки для настільного тенісу | **1200** | 0 | 1100 | comm/trans | категорія `rakety` |
| настольный теннис (RU) | 900 | 17 | 800 | info | ai_overview |
| ракетка для настільного тенісу | 600 | 0 | 800 | comm/trans | `rakety` |
| стіл для настільного тенісу | 250 | 0 | **3000** | comm/trans | 🔴 столи |
| купити ракетку для настільного тенісу | 250 | 0 | 450 | trans | ai_overview |
| сітка для настільного тенісу | 200 | 0 | 100 | trans | `setki` |
| теннисный стол купить (RU) | 150 | 1 | 400 | trans | local_pack |
| тенісні столи | 100 | 0 | **4000** | comm/trans | 🔴 столи |
| м'ячі для настільного тенісу | 100 | 0 | 40 | trans | `myachi` |
| tenergy 05 / dignics 05 / ракетка butterfly | 30–50 | — | — | branded | товари/бренд |

**Висновки:** (1) столи = найбільший незакритий попит (~3000+/міс, TP до 4000); (2) генеричні категорійні запити дають основний трафік при KD0; (3) часті question/ai_overview SERP → FAQ/how-to виграє сніпети; (4) ринок двомовний → паритет RU/UA критичний.

---

## 5. Безпека (Supabase)

⚠️ **RLS вимкнено на 2 backup-таблицях:** `entity_media_backup_20260618`, `entity_media_bak_20260622`. Будь-хто з anon-ключем читає/змінює всі рядки.

```sql
ALTER TABLE public.entity_media_backup_20260618 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_media_bak_20260622   ENABLE ROW LEVEL SECURITY;
-- або просто DROP backup-таблиці, якщо вони не потрібні
```

---

# Повний SEO-план

## 6. Стан зараз

**Що вже зроблено добре:**
- Зрілий каталог (~430 товарів, ~10 категорій), коректна i18n-маршрутизація `/ua` + `/ru`, RSC + ISR (`revalidate=600`).
- Інфраструктура hreflang у метаданих коректна: `metadata.ts:10-14` і `catalog-metadata.ts:22-24` використовують `localeToLang` (ua→**uk**, ru→ru) + x-default — це правильно.
- JSON-LD інфраструктура готова: `productJsonLd()` уже підтримує `images`, `sku`, `Offer`/`AggregateOffer` з `availability`/`itemCondition`/`priceValidUntil` (`jsonld.ts:130-172`) — лишилось лише передати дані з місць виклику.
- `siteConfig.launched` гейтить whole-site noindex + robots disallow; контактний резолвер (`contact/get.ts`) підтримує override з admin.
- Ринок KD≈0 по всій ніші — дуже виграшно при мінімальних зусиллях.

**3 найбільші проблеми:**
1. **Уся SEO-вага накопичується на throwaway-домені** `ttmax-site-z2za.vercel.app`, а не на `ttmax.ua` (canonical/og/hreflang/sitemap/robots — усі ведуть туди). Жодного плану 301-редиректу.
2. **Найбільший попит ринку — СТОЛИ (2800/міс, KD0)** — а сайт продає 0 столів. Категорія `stoly` порожня.
3. **Каталог-сторінки втрачають rich-результати:** немає og:image, Product schema без images/sku, тонкі/шаблонні описи на 95 ракетках + 0 описів на базах і gear, відсутні гайди під інформаційні запити.

---

## 7. P0 — критичне (зробити першим)

| # | Проблема | Чому важливо | Що зробити (файл) | Impact / Effort |
|---|----------|--------------|-------------------|-----------------|
| P0-1 | **Canonical/og/hreflang/sitemap вказують на vercel.app** | Уся органіка та беклінки йдуть на тимчасовий домен; при переїзді вага НЕ передасться | Підключити `ttmax.ua` як custom domain у Vercel; `NEXT_PUBLIC_SITE_URL=https://ttmax.ua` у Vercel env (`src/config/site.ts:11`); ре-деплой; перевірити `sitemap.xml`/`robots.txt` | high / S |
| P0-2 | **Немає 301-редиректу vercel.app → ttmax.ua** | Обидва домени віддають однаковий контент → дублікати, розпорошення авторитету | Редирект у `next.config.ts` (`redirects()`) або `src/middleware.ts` за `Host`: усі `*.vercel.app` → 301 на `ttmax.ua` | high / M |
| P0-3 ✅ | ~~Sitemap hreflang = "ua" замість "uk", без x-default~~ **ЗРОБЛЕНО** | Невалідний BCP-47 → GSC ігнорує hreflang | ✅ `src/app/sitemap.ts`: ключі `uk`/`ru` через `localeToLang` + `x-default`. **URL лишився `/ua`** (змінено лише hreflang-код) | high / S |
| P0-4 | **GSC/Bing не верифіковані** | Без GSC немає діагностики індексації, не подати sitemap | Додати `ttmax.ua` у Google Search Console (DNS TXT), подати `sitemap.xml`; повторити для Bing | high / M |
| P0-5 | **Аналітика мовчки не пише / Ads label порожній** | Запуск без трекінгу; конверсії Google Ads не фіксуються (`google-ads.ts:6`) | Виставити в Vercel env усі 5 ID + conversion label; перевірити GTM Preview / GA4 / Meta Test Events | high / S |
| P0-6 | **Перевірити гейт `launched` перед публікацією** | `buildMetadata()` (`metadata.ts:42-51`) не гейтить → головна indexable навіть при launched=false | Перед go-live `NEXT_PUBLIC_SITE_LAUNCHED=true`; або пофіксити `buildMetadata()` (див. §8) | med / S |
| P0-7 ✅ | ~~Зламані /privacy і /terms~~ **ЗРОБЛЕНО** | Footer і checkout вели в 404 | ✅ Створено `src/app/[locale]/{privacy,terms}/page.tsx` + контент `src/data/legal.ts` + компонент `LegalArticle`; додано в sitemap. Двомовні, canonical+hreflang через `buildCatalogMetadata`, breadcrumb JSON-LD | high / M |
| P0-8 | **Backup-таблиці без RLS** | Дані відкриті (див. §5) | DROP або ENABLE RLS + deny-all policy | high / S |

---

## 8. P1 — високий пріоритет

**Структуровані дані (Product rich results):**
- **Product schema без зображень** — `page.tsx:246-258` не передає `images`, хоча `jsonld.ts:138` їх підтримує. Витягти: `pickAll(media,"product",slug).map(m => cldUrl(m.publicId,{w:900,h:900}))` (патерн є в `buildGallery()` `page.tsx:727`). Image — головний сигнал rich product results.
- **Product schema без SKU** — передати `sku: eroute.product.sku` у `productJsonLd()` (`page.tsx:246`).
- **Organization schema з placeholder-телефоном** — `site.ts:18` `phoneDisplay="+380 (XX) XXX-XX-XX"`. Поставити реальний (або override через `site_settings`). Адресні поля в Organization НЕ емітяться — не чіпати; `localBusinessJsonLd()` мертвий — видалити або викликати з реальними даними.
- **Порожній sameAs** — заповнити `siteConfig.social` реальними URL (Telegram/YouTube/FB), `site.ts:22-26`.
- **BreadcrumbList без @id** — додати `@id`=URL item у `jsonld.ts:83-88`.
- **Listing-сторінки без CollectionPage/ItemList** — додати `collectionJsonLd()` для category/brand/brandCategory.

**Метадані / OG:**
- **Немає og:image / twitter:image на жодній сторінці** — додати в обидва білдери (`metadata.ts:28-36`, `catalog-metadata.ts:31-39`): товари — primary product image (`pickPrimary` + `cldUrl {w:1200,h:630,crop:fill}`); головна/хаби — брендований fallback.
- **Шаблонні meta descriptions** — у `routing.ts:316-334` для product/brandCategory додати специфіку (count + minPrice + специфікації); патерн авто-доповнення вже є для category в `page.tsx:114-120`.
- **Тайтли товарів без ключів** — у `routeTitle()`: `{name} — накладка/основа/ракетка для настільного тенісу, купити в Україні | TTMAX`.
- **LocaleSwitcher: анкери `<a hrefLang="ua">`** (виявлено 2026-06-29) — перемикач мови (`src/components/layout/LocaleSwitcher.tsx`, десктоп+мобайл) ставить на посилання `hrefLang="ua"` замість `uk`. На SEO-сигнал (head `<link rel=alternate>`) НЕ впливає, але варто привести до `localeToLang[l]` для консистентності. Impact low / Effort S.

**Внутрішня перелінковка / контент-паритет:**
- **Тонкі/дубльовані описи** — 95 ракеток шаблонні, бази (84) і gear (297) без описів. Топ-15 комбо — унікальні 150-200 слів; бази — 100; gear — 80 (патерн `expert.ts`).
- **brandCategory не в навігації**, **генеричні anchor "See all"** — замінити на `${category.name[locale]}` у `Categories.tsx:91`/`Products.tsx:71`.
- **Faceted URLs без canonical** — canonical на base-path для `?bladeClass=…&level=…` (`CatalogFilters.tsx`).
- **Бренд-сторінки без описів** — 150-200 слів для Butterfly (`brands.ts`).

**CWV (швидкі):**
- CLS: `Categories.tsx:68-72` (cld 112 vs declared 56 → cld `{w:56,h:56}`); `Brands.tsx:68-72` (cld 128 vs declared 64 → `width/height={128}`). LCP: hero `<img>` без preload/priority (`Hero.tsx:109-115`) → `next/image priority` або `<link rel=preload as=image>`. Raw `<img>` без розмірів: `CatalogFilters.tsx:328`, `Logo.tsx:36`, `page.tsx:1063`.
- Консистентність гейту: `buildMetadata()` (`metadata.ts:42`) → `robots: siteConfig.launched ? {index:true,…} : {index:false,follow:true}`.
- Redirect-конвенція: `middleware.ts:44` 308 → 301; robots disallow обидва варіанти `["/api","/api/","/admin","/admin/","/_next/"]`.

---

## 9. P2 — зростання (контент-роадмап)

**Keyword → page mapping (за обсягом/потенціалом):**

| Запит | Обсяг/міс | TP | Тип сторінки | Нова чи існує |
|-------|-----------|----|--------------|---------------|
| тенісний стіл | 2800 (KD0) | 300 | Категорія `/ua/stoly` | **НОВА — запустити з товарами** |
| тенісні столи | 100 | **4000** | та сама (синонім у seoText/H1) | НОВА |
| стіл для настільного тенісу | 250 | **3000** | та сама + FAQ | НОВА |
| як вибрати стіл | ~2100 | — | Гайд `/ua/guides/yak-vybraty-stil` | **НОВА** |
| настільний теніс | 2100 (KD1) | 500 | Інфо-хаб/головна + гайд | існує (підсилити) |
| ракетка для настольного тенниса [RU] | 2000 (KD0) | 1200 | Категорія `/ru/rakety` | існує (оптимізувати title/desc) |
| ракетки для настільного тенісу | 1200 (KD0) | 1100 | Категорія `/ua/rakety` | існує |
| ракетка для настільного тенісу | 600 (KD0) | 800 | та сама | існує |
| як вибрати ракетку | ~500 | — | Гайд `/ua/guides/yak-vybraty-raketku` | **НОВА** |
| купити ракетку для настільного тенісу | 250 (KD0, ai_overview) | — | rakety + FAQ-блок | існує |
| сітка для настільного тенісу | 200 | — | `/ua/setki` | існує (розширити FAQ) |
| мʼячі для настільного тенісу | 100 | — | `/ua/myachi` | існує (FAQ) |
| ALC vs ZLC / Dignics 05 vs 09C | low, ai_overview | — | Гайд + FAQPage | частково (`expert.ts`) |
| tenergy 05 / dignics 05 / ракетка butterfly | branded | — | Product/brand pages | існує |

**Дії:**
1. **Запустити категорію СТОЛИ** (найбільший попит): наповнити товарами, `isIndexable:true`, заповнити `stoly.seoText` (типи столів, розмір/товщина, бюджетні тіри, доставка/збірка) + 5-6 FAQ (`categories.ts:166-180`). **До появи товарів — `isIndexable:false`** (зараз 0 товарів → `routing.ts:177` віддає `index:false`, тож equity не тече, але UX/попит не закриті).
2. **Створити `/ua/guides`** — інфраструктури зараз немає (`ContentEntityType` не має `guide`, sitemap/nav без guides). 4-6 evergreen-статей 1000-1500 слів з H2/H3 + порівняльні таблиці + лінки на товари: «Як вибрати стіл», «Як вибрати ракетку (новачок)», «ALC vs ZLC», «Швидкість vs обертання», «Товщина накладки», «Догляд за столом».
3. **AI-overview / FAQ snippet plays:** SERP має question/ai_overview по всій ніші. Додати FAQPage schema до категорій з FAQ, HowTo schema до гайдів, семантичні таблиці (`scope="col/row"`) у `expert.ts`.

---

## 10. Технічний чеклист запуску (go-live)

- [ ] Підключити `ttmax.ua` як custom domain у Vercel (DNS A/CNAME).
- [ ] `NEXT_PUBLIC_SITE_URL=https://ttmax.ua` в Production env → ре-деплой.
- [ ] `NEXT_PUBLIC_SITE_LAUNCHED=true` (зняти whole-site noindex).
- [ ] DevTools live HTML: `<link canonical>`, `og:url`, hreflang, `sitemap.xml`, `robots.txt` → усі `ttmax.ua`.
- [ ] Sitemap емітить `hreflang="uk"`/`"ru"` + `x-default` (після фіксу `sitemap.ts:48`).
- [ ] 301 vercel.app → ttmax.ua активний (`curl -I`).
- [ ] Усі 5 analytics ID + Google Ads conversion label; перевірено GTM Preview / GA4 Realtime / Meta Pixel Test Events.
- [ ] GSC + Bing верифіковано, sitemap подано.
- [ ] `/privacy` і `/terms` → 200; перевірити checkout TOS-лінк.
- [ ] Backup-таблиці RLS пофіксено/видалено.
- [ ] Реальний телефон у `site.ts` (валідний Organization schema).
- [ ] Google Rich Results Test на ключових сторінках (Product з images, Breadcrumb, FAQ).
- [ ] `/ua/nonexistent` → HTTP 404 (не 200).

---

## 11. Вимірювання

- **GSC** (головне): Indexing/Coverage, Performance (запити/позиції/CTR), Enhancements (Product/Breadcrumb/FAQ rich results), Core Web Vitals, hreflang-помилки. Подати sitemap, стежити за переходом canonical на `ttmax.ua`.
- **GA4 + GTM**: трафік за каналами, конверсії (lead form, purchase), engagement по категоріях/гайдах. Підтвердити доставку подій (без GTM-контейнера `pushDataLayer` губиться).
- **Google Ads**: conversion tracking після виставлення label; ROAS.
- **Ahrefs**: **створити проєкт + Rank Tracker для `ttmax.ua` (зараз НЕ існує)**. Кластери: столи, ракетки (UA+RU), інфо (як вибрати), branded (tenergy/dignics/butterfly). Додати конкурентів. Site Audit щотижня.
- **Meta CAPI**: server-side конверсії не підключені — після запуску додати `api/conversions/route.ts`.

**Як верифікувати ранкінги:** baseline у Rank Tracker одразу після підключення домену; щотижневий зріз по кластерах; реальні impressions/clicks/position через GSC Performance.

---

## 12. План по тижнях

**Тиждень 1 — Фундамент індексації (P0):** custom domain ttmax.ua + `NEXT_PUBLIC_SITE_URL`; 301 vercel→ttmax; фікс `sitemap.ts:48` (uk + x-default); GSC/Bing + sitemap; усі analytics ID + Ads label; RLS backup-таблиць; перевірка launched-гейту.

**Тиждень 2 — Довіра + rich results:** `/privacy` + `/terms`; реальний телефон + social (Organization/sameAs); Product schema images + sku (`page.tsx:246`); og:image в обох білдерах; BreadcrumbList `@id`.

**Тиждень 3 — Контент-паритет каталогу:** топ-15 ракеток унікальні описи; бази (100 сл.) + ключові gear (80 сл.); ключі в title/desc товарів; опис бренду Butterfly; canonical на faceted URLs; CWV-фікси (Categories/Brands/Hero img).

**Тиждень 4 — Запуск СТОЛІВ (найбільший попит):** наповнити `stoly` товарами; seoText + 6 FAQ + FAQPage schema; `isIndexable:true`; перелінкувати з головної/нав (hub-and-spoke); CollectionPage schema на listing.

**Тиждень 5-6 — Інфо-контент + AI overviews:** інфраструктура `/ua/guides` (новий ContentEntityType + nav + sitemap); 4-6 гайдів («Як вибрати стіл» — №1, «Як вибрати ракетку», «ALC vs ZLC»); HowTo/FAQPage schema; покращення anchor-text + перелінковка гайди↔категорії↔товари; Ahrefs Rank Tracker baseline + перший тижневий зріз.

---

## 13. Ключові файли

`src/config/site.ts` (домен/контакти) · `src/app/sitemap.ts:48` (hreflang fix) · `src/app/robots.ts` · `src/middleware.ts:44` (redirect) · `src/lib/seo/metadata.ts` + `catalog-metadata.ts` (og:image/гейт) · `src/lib/seo/jsonld.ts` (Breadcrumb @id, collection) · `src/app/[locale]/[...segments]/page.tsx:246` (Product images/sku) · `src/lib/catalog/routing.ts:316-334` (titles/descriptions) · `src/data/catalog/{categories,brands,rackets,bases,gear}.ts` (контент) · `src/components/sections/{Categories,Brands,Hero}.tsx` (CWV) · `src/components/layout/Footer.tsx` + `src/components/checkout/CheckoutForm.tsx` (legal links).

---

## Журнал змін
- **2026-06-29** — створено живий файл; склоновано репо; під'єднано Supabase/Vercel/Ahrefs; keyword research UA; multi-agent SEO-аудит (29 агентів, 51 знахідка) → повний план P0/P1/P2.
- **2026-06-29** — ✅ **P0-3 виконано:** фікс hreflang у `sitemap.ts` (ключі `uk`/`ru` + `x-default`, URL лишився `/ua`). Перевірено симуляцією логіки.
- **2026-06-29** — ✅ **P0-7 виконано:** сторінки `/privacy` + `/terms` (двомовні, `src/data/legal.ts` + `LegalArticle` + у sitemap). ⚠️ Контент — базовий шаблон, узгодити реквізити юр-особи (ФОП/ТОВ, ЄДРПОУ) та реальний телефон перед фінальним запуском.
