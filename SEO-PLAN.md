# TTMAX — SEO та база знань проєкту

> **Живий документ.** Ведеться автоматично (Claude) — оновлюється в міру збору даних і пушиться в GitHub, щоб завжди був свіжим.
> **Останнє оновлення:** 2026-07-14 · rich-results код-фікси (og:image, Product images+sku, launched-гейт, hreflang) + Supabase RLS-фікс.
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
| **Vercel** | live на `ttmax-site-z2za.vercel.app` (тимч. домен) | ⚠️ не на `ttmax.com.ua` |
| **Cloudinary** | акаунт `dh6vuxjko`, 1061 медіа-записів | ✅ |
| **Ahrefs** | доступ є; окремого проєкту під `ttmax.com.ua` ще нема | ⏳ створити |

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

# Статус по напрямах

_Оновлено 2026-06-29. ✅ готово · 🔄 в роботі · 📋 план_

| Напрям | ✅ Зроблено | 🔄 В роботі | 📋 План |
|---|---|---|---|
| **SEO** | hreflang sitemap (uk/ru+x-default); /privacy,/terms; категорійні тексти+FAQ; метадані/canonical/JSON-LD; **експертні картки всіх 43 накладок** | — | Домен ttmax.com.ua+301+GSC; og:image+Product images/sku; столи, гайди, відгуки→зірки |
| **Контент** | ~430 товарів; **картки 43/43 накладок** + **84/84 основи** (повний набір характеристик: клас / тип / карбон inner-outer / шари / товщина / вага + опис×4 / рейтинги / FAQ / таблиця-орієнтир) | — | Описи ракеток-збірок / екіпірування; наповнення «Столи» |
| **Адмінка** | Auth; CRM лідів (статуси/нотатки/атрибуція/цінність); замовлення; медіа-менеджер; редактори контенту/цін; налаштування; **`/admin/homepage` — усі тексти головної (Hero, категорії, хіти, колекції, тристрічка довіри, CTA-форма, FAQ) UA/RU + менеджер блоку «Хіти» + контакти футера (телефон/email/TG/YT/FB); поля передзаповнені поточними значеннями, зберігаэться лише змінене, «↺ дефолт»; без передеплою**. `/admin/contacts` — повні контакти+адреса+доставка (теж передзаповнено) | — | — |
| **Заявки/Замовлення** | Форма лідів (/api/leads+Supabase+Zod); кошик+checkout+orders; аналітика-події; Telegram (код) | — | Реальні ID аналітики+токен (env); Meta CAPI; збір відгуків→рейтинг |
| **Блог/Гайди** | — | — | Інфраструктура /guides; «як вибрати стіл/ракетку», ALC vs ZLC; HowTo/FAQ schema |
| **Інфраструктура** | Next.js 15+Vercel+Supabase+Cloudinary; i18n ua/ru | — | Домен+env; RLS backup-таблиць; реальний телефон+адреса (Харків) |

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
1. **Уся SEO-вага накопичується на throwaway-домені** `ttmax-site-z2za.vercel.app`, а не на `ttmax.com.ua` (canonical/og/hreflang/sitemap/robots — усі ведуть туди). Жодного плану 301-редиректу.
2. **Найбільший попит ринку — СТОЛИ (2800/міс, KD0)** — а сайт продає 0 столів. Категорія `stoly` порожня.
3. **Каталог-сторінки втрачають rich-результати:** немає og:image, Product schema без images/sku, тонкі/шаблонні описи на 95 ракетках + 0 описів на базах і gear, відсутні гайди під інформаційні запити.

---

## 7. P0 — критичне (зробити першим)

| # | Проблема | Чому важливо | Що зробити (файл) | Impact / Effort |
|---|----------|--------------|-------------------|-----------------|
| P0-1 | **Canonical/og/hreflang/sitemap вказують на vercel.app** | Уся органіка та беклінки йдуть на тимчасовий домен; при переїзді вага НЕ передасться | Підключити `ttmax.com.ua` як custom domain у Vercel; `NEXT_PUBLIC_SITE_URL=https://ttmax.com.ua` у Vercel env (`src/config/site.ts:11`); ре-деплой; перевірити `sitemap.xml`/`robots.txt` | high / S |
| P0-2 | **Немає 301-редиректу vercel.app → ttmax.com.ua** | Обидва домени віддають однаковий контент → дублікати, розпорошення авторитету | Редирект у `next.config.ts` (`redirects()`) або `src/middleware.ts` за `Host`: усі `*.vercel.app` → 301 на `ttmax.com.ua` | high / M |
| P0-3 ✅ | ~~Sitemap hreflang = "ua" замість "uk", без x-default~~ **ЗРОБЛЕНО** | Невалідний BCP-47 → GSC ігнорує hreflang | ✅ `src/app/sitemap.ts`: ключі `uk`/`ru` через `localeToLang` + `x-default`. **URL лишився `/ua`** (змінено лише hreflang-код) | high / S |
| P0-4 | **GSC/Bing не верифіковані** | Без GSC немає діагностики індексації, не подати sitemap | Додати `ttmax.com.ua` у Google Search Console (DNS TXT), подати `sitemap.xml`; повторити для Bing | high / M |
| P0-5 | **Аналітика мовчки не пише / Ads label порожній** | Запуск без трекінгу; конверсії Google Ads не фіксуються (`google-ads.ts:6`) | Виставити в Vercel env усі 5 ID + conversion label; перевірити GTM Preview / GA4 / Meta Test Events | high / S |
| P0-6 ✅ | ~~Гейт `launched` у `buildMetadata()`~~ **ЗРОБЛЕНО (код)** | `buildMetadata()` хардкодив `index:true` → головна/статика indexable навіть при launched=false | ✅ `metadata.ts`: `robots` тепер `siteConfig.launched ? {...} : {index:false,follow:true}` (консистентно з `buildCatalogMetadata`). Перед go-live однаково виставити `NEXT_PUBLIC_SITE_LAUNCHED=true` | med / S |
| P0-7 ✅ | ~~Зламані /privacy і /terms~~ **ЗРОБЛЕНО** | Footer і checkout вели в 404 | ✅ Створено `src/app/[locale]/{privacy,terms}/page.tsx` + контент `src/data/legal.ts` + компонент `LegalArticle`; додано в sitemap. Двомовні, canonical+hreflang через `buildCatalogMetadata`, breadcrumb JSON-LD | high / M |
| P0-8 ✅ | ~~Backup-таблиці без RLS~~ **ЗРОБЛЕНО (live)** | Дані відкриті anon-ключем (див. §5) | ✅ Міграція `enable_rls_on_backup_tables`: `ENABLE ROW LEVEL SECURITY` на обох → deny-all. Перевірено `get_advisors`: обидва ERROR зникли (лишився лише INFO). За бажанням — `DROP` таблиць, якщо бекапи більше не потрібні | high / S |

---

## 8. P1 — високий пріоритет

**Структуровані дані (Product rich results):**
- ✅ **Product schema images** **ЗРОБЛЕНО (код)** — `page.tsx` тепер передає `images: pickAll(media,"product",slug).map(m => cldUrl(m.publicId,{w:900,h:900})).filter(Boolean)`.
- ✅ **Product schema SKU** **ЗРОБЛЕНО (код)** — `sku: variants.find(v=>v.sku)?.sku ?? product.slug` (sku живе на `CatalogVariant`, не на продукті; фолбек — slug).
- **Organization schema з placeholder-телефоном** — `site.ts:18` `phoneDisplay="+380 (XX) XXX-XX-XX"`. Поставити реальний (або override через `site_settings`). Адресні поля в Organization НЕ емітяться — не чіпати; `localBusinessJsonLd()` мертвий — видалити або викликати з реальними даними.
- **Порожній sameAs** — заповнити `siteConfig.social` реальними URL (Telegram/YouTube/FB), `site.ts:22-26`.
- **BreadcrumbList без @id** — додати `@id`=URL item у `jsonld.ts:83-88`.
- **Listing-сторінки без CollectionPage/ItemList** — додати `collectionJsonLd()` для category/brand/brandCategory.

**Метадані / OG:**
- ✅ **og:image / twitter:image на каталозі** **ЗРОБЛЕНО (код)** — `buildCatalogMetadata` отримав параметр `image?`; `generateMetadata` рахує primary product image (`cldUrl {w:1200,h:630,crop:fill}`) для товару, для листингів — фото першого товару. ⏳ Лишилось: **брендований fallback OG** для головної/хабів (`buildMetadata` / статика) — потрібен статичний ассет `public/og.png` (зараз лише `favicon.svg`) або динамічний `opengraph-image.tsx`.
- **Шаблонні meta descriptions** — у `routing.ts:316-334` для product/brandCategory додати специфіку (count + minPrice + специфікації); патерн авто-доповнення вже є для category в `page.tsx:114-120`.
- **Тайтли товарів без ключів** — у `routeTitle()`: `{name} — накладка/основа/ракетка для настільного тенісу, купити в Україні | TTMAX`.
- ✅ **LocaleSwitcher `hrefLang`** **ЗРОБЛЕНО (код)** — `hrefLang={localeToLang[l]}` (ua→uk) у `LocaleSwitcher.tsx`.

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

- [ ] Підключити `ttmax.com.ua` як custom domain у Vercel (DNS A/CNAME).
- [ ] `NEXT_PUBLIC_SITE_URL=https://ttmax.com.ua` в Production env → ре-деплой.
- [ ] `NEXT_PUBLIC_SITE_LAUNCHED=true` (зняти whole-site noindex).
- [ ] DevTools live HTML: `<link canonical>`, `og:url`, hreflang, `sitemap.xml`, `robots.txt` → усі `ttmax.com.ua`.
- [ ] Sitemap емітить `hreflang="uk"`/`"ru"` + `x-default` (після фіксу `sitemap.ts:48`).
- [ ] 301 vercel.app → ttmax.com.ua активний (`curl -I`).
- [ ] Усі 5 analytics ID + Google Ads conversion label; перевірено GTM Preview / GA4 Realtime / Meta Pixel Test Events.
- [ ] GSC + Bing верифіковано, sitemap подано.
- [ ] `/privacy` і `/terms` → 200; перевірити checkout TOS-лінк.
- [ ] Backup-таблиці RLS пофіксено/видалено.
- [ ] Реальний телефон у `site.ts` (валідний Organization schema).
- [ ] Google Rich Results Test на ключових сторінках (Product з images, Breadcrumb, FAQ).
- [ ] `/ua/nonexistent` → HTTP 404 (не 200).

---

## 11. Вимірювання

- **GSC** (головне): Indexing/Coverage, Performance (запити/позиції/CTR), Enhancements (Product/Breadcrumb/FAQ rich results), Core Web Vitals, hreflang-помилки. Подати sitemap, стежити за переходом canonical на `ttmax.com.ua`.
- **GA4 + GTM**: трафік за каналами, конверсії (lead form, purchase), engagement по категоріях/гайдах. Підтвердити доставку подій (без GTM-контейнера `pushDataLayer` губиться).
- **Google Ads**: conversion tracking після виставлення label; ROAS.
- **Ahrefs**: **створити проєкт + Rank Tracker для `ttmax.com.ua` (зараз НЕ існує)**. Кластери: столи, ракетки (UA+RU), інфо (як вибрати), branded (tenergy/dignics/butterfly). Додати конкурентів. Site Audit щотижня.
- **Meta CAPI**: server-side конверсії не підключені — після запуску додати `api/conversions/route.ts`.

**Як верифікувати ранкінги:** baseline у Rank Tracker одразу після підключення домену; щотижневий зріз по кластерах; реальні impressions/clicks/position через GSC Performance.

---

## 12. План по тижнях

**Тиждень 1 — Фундамент індексації (P0):** custom domain ttmax.com.ua + `NEXT_PUBLIC_SITE_URL`; 301 vercel→ttmax; фікс `sitemap.ts:48` (uk + x-default); GSC/Bing + sitemap; усі analytics ID + Ads label; RLS backup-таблиць; перевірка launched-гейту.

**Тиждень 2 — Довіра + rich results:** `/privacy` + `/terms`; реальний телефон + social (Organization/sameAs); Product schema images + sku (`page.tsx:246`); og:image в обох білдерах; BreadcrumbList `@id`.

**Тиждень 3 — Контент-паритет каталогу:** топ-15 ракеток унікальні описи; бази (100 сл.) + ключові gear (80 сл.); ключі в title/desc товарів; опис бренду Butterfly; canonical на faceted URLs; CWV-фікси (Categories/Brands/Hero img).

**Тиждень 4 — Запуск СТОЛІВ (найбільший попит):** наповнити `stoly` товарами; seoText + 6 FAQ + FAQPage schema; `isIndexable:true`; перелінкувати з головної/нав (hub-and-spoke); CollectionPage schema на listing.

**Тиждень 5-6 — Інфо-контент + AI overviews:** інфраструктура `/ua/guides` (новий ContentEntityType + nav + sitemap); 4-6 гайдів («Як вибрати стіл» — №1, «Як вибрати ракетку», «ALC vs ZLC»); HowTo/FAQPage schema; покращення anchor-text + перелінковка гайди↔категорії↔товари; Ahrefs Rank Tracker baseline + перший тижневий зріз.

---

## 13. Ключові файли

`src/config/site.ts` (домен/контакти) · `src/app/sitemap.ts:48` (hreflang fix) · `src/app/robots.ts` · `src/middleware.ts:44` (redirect) · `src/lib/seo/metadata.ts` + `catalog-metadata.ts` (og:image/гейт) · `src/lib/seo/jsonld.ts` (Breadcrumb @id, collection) · `src/app/[locale]/[...segments]/page.tsx:246` (Product images/sku) · `src/lib/catalog/routing.ts:316-334` (titles/descriptions) · `src/data/catalog/{categories,brands,rackets,bases,gear}.ts` (контент) · `src/components/sections/{Categories,Brands,Hero}.tsx` (CWV) · `src/components/layout/Footer.tsx` + `src/components/checkout/CheckoutForm.tsx` (legal links).

---

## ⚠️ ДЕ ЖИВУТЬ ТЕКСТИ: CMS перебиває код (читати ПЕРЕД будь-якою правкою метаданих)

**Пріоритет:** `content_blocks` (Supabase) **>** `categories.ts`. Код — лише fallback.
`page.tsx:108-110`: `content?.metaTitle || routeTitle(...)` — якщо рядок у CMS є, значення з коду **ніколи** не побачить ні користувач, ні Google. Правка в коді **мовчки** нічого не змінить.

| Категорія | Джерело title/desc | Хто і як править |
|---|---|---|
| `nakladki` · `myachi` · `chehly` · `setki` · `obuv` · `odyag` · `aksessuary` | **CMS** | **власник через `/admin`** |
| `osnovaniya` · `rakety` · `stoly` | **код** | розробник у `categories.ts` |

**Чому ТІЛЬКИ адмінка, а не прямий SQL:** адмінка робить **дві** дії — пише в базу **і** скидає кеш (`revalidateTag(CONTENT_TAG)`, `api/admin/content/route.ts:127`). `getContent` кешується **на годину** (`lib/content/get.ts:154`, `revalidate: 3600`). Запис в обхід адмінки (SQL, прямий запит) висить **невидимим до 60 хв** — база вже нова, сайт ще старий.

**Список НЕ вічний:** будь-який сейв в адмінці створює рядок і забирає категорію в CMS. Перевірка:
```sql
select slug, locale from content_blocks where entity_type='category' order by slug;
```

**Різниця description між шарами — НАВМИСНА:** у CMS — з токенами `{{count}}`/`{{price_from}}` (авто-суфікс не додається); у коді — без токенів, бо `page.tsx:114-121` сам допише « N моделей · від X грн», і лише коли CMS-опису немає. Дублювати токени в коді = задвоєння.

**Інші дрібниці бази:** `updated_at` у `content_blocks` **не оновлюється** при UPDATE (тригера немає) — не орієнтир. Локаль `uk` у таблиці **мертва**: застосунок читає `ua`/`ru` точним матчем (`get.ts:129-137`), рядки `uk` не читаються ніколи.

**Урок (2026-07-14):** дві правки `/nakladki` в коді пішли в стіл, і я відрапортував їх як live, перевіривши sitemap і `/rakety`, але не сам title `/nakladki`. **Перевіряти рендер тієї сторінки, яку міняв.** Зелений білд Vercel не означає, що рядок доїхав до видачі.

---

## 🏛️ АРХІТЕКТУРА SEO — довга логіка (читати першим перед будь-якою новою сторінкою)

### Правило канібалізації
**Канібалізація — це коли дві сторінки претендують на ОДИН ЗАПИТ.** Не на одну тему, не на одне слово в title. Різні запити = нуль канібалізації, навіть якщо сторінки про один виріб.

**Тест із 3 питань перед створенням будь-якої сторінки:**
1. **Який ОДИН запит ця сторінка виграє?** Не можеш назвати запит із обсягом → сторінка не для індексу.
2. **Чи є інша сторінка на цей же запит?** Є → одну прибрати або переточити.
3. **Що Google РЕАЛЬНО ставить у цю видачу?** Фінальний арбітр — не твоя логіка. Категорії → запит категорійний. Картки → модельний.

### Карта інтентів (кожен рівень має свій поверх попиту)

| Запит | Сторінка | Обсяг/міс | Форма |
|---|---|---|---|
| `ракетка для настольного тенниса` | `/rakety` | **2000** | ru однина |
| `ракетки для настільного тенісу` | `/ua/rakety` | 1000 | ua множина |
| `основание для ракетки` | `/osnovaniya` | 200 | ru (UA-попит = **0**) |
| `накладки на ракетку` | `/nakladki` | 80 | ru+ua (рядок ідентичний) |
| `butterfly viscaria`, `dignics 09c` | картка товару | 310 + **130 бренд-форми** | — |
| **комбо «основа+накладка»** | **свого запиту НЕМАЄ** | 40 на всі 95 | → `noindex, follow` |
| `правила`, `розміри столу`, `як вибрати` | `/blog` | 2360 | ru-first, ua на голові |

**Двоформена схема (застосована в усіх 3 категоріях):** `title` = head-форма, `H1` = друга за обсягом. Одна сторінка покриває обидві, сама з собою не конкурує.

### Чому категорія і картка НЕ канібали
Різні SERP. По `основание для ракетки` — 10/10 категорій. По `butterfly viscaria` — картки. **Google їх не зводить в одну видачу → 200 + 80 = 280, а не «280 пополам».** Категорія ловить того, хто ЩЕ обирає (треба лістинг), картка — хто ВЖЕ обрав (треба ціна й кнопка).

### Правило формату (головний захист блогу від категорій)
Канібалізація блог↔категорія виникає **не від збігу ключів, а від збігу ФОРМАТУ**:
- **Категорія** = сітка товарів + фільтри + **500-800 знаків**. Ніяких «як вибрати». H1 транзакційний.
- **Стаття** = текст + пояснення + таблиця + 3-5 моделей **посиланнями** (БЕЗ цін і кнопок «Купити»). H1 питальний.
- **Перевірка:** якщо за секунду не видно «це каталог, а це стаття» — вони канібали.

### Потік ваги (hub-and-spoke) — куди лити беклінки
```
Зовнішні лінки → головна + КАТЕГОРІЇ (/rakety найперше)
                        ↓
   категорія → картки (сітка)     блог-стаття → категорія (CTA) + 3-5 карток
                        ↓                              ↓
              картка → категорія (крихти) + суміжні моделі
   комбо (noindex, FOLLOW) → прокачує вагу на картки компонентів ✅
```
**Пріоритет беклінків:** (1) `/rakety` — головний money-page; конкурент raketka.ua тримає топ-2/3 при **2 беклінках і DR 5** → 5-10 нормальних лінків обганяють; (2) головна — загальний DR; (3) блог-статті — вони природно збирають лінки (правила/розміри) і передають вагу на категорії. **НЕ лити на комбо** (вони noindex).

### Що НЕ робити (перевірено даними, не думками)
- ❌ **Експертні гайди під SEO** (`alc или zlc`, `как выбрать накладку`, `как клеить`, `толщина накладки`) — Ahrefs повертає **НУЛЬ рядків**. Експертного кластера в Україні НЕ ІСНУЄ. Профі гуглять бренд+модель, не теорію. (Скасовує стару рекомендацію з §9 цього файлу.)
- ❌ **UA-оптимізація `/osnovaniya`** — `основа для настільного тенісу` = 0/0. Ринок шукає основи ВИКЛЮЧНО російською. UA-версія — для UX і hreflang, трафіку не чекати.
- ❌ **Голе `ракетка`** (1700) і `перша/первая ракетка` (~19-21k) — **ТЕЛЕСЕРІАЛ**. `тенісна ракетка` (2000) — великий теніс.
- ❌ **`основание`** (1400) — серіал «Основание»/Фундація (Азімов), не будівництво.
- ❌ **Переписувати 95 описів комбо** — приз 40/міс на всі; після noindex Google їх не використає взагалі.

### Дірка, що коштує грошей: бренд-форма
`butterfly viscaria` = **40** проти голого `viscaria` = **20** — бренд-форма **вдвічі жирніша**. Так само `butterfly dignics 05` +30 понад `dignics 05` 50. Сумарно «butterfly + модель» = **+130/міс (~+40%)** до модельного трафіку. Картки заточені лише під голе ім'я → половина попиту мимо. **Не зроблено.**

---

## Кластер «ракетки» + конкурент (2026-07-14, Ahrefs UA)

**Чистий кластер = 8 560/міс, увесь KD 0.** Асиметрія мов дзеркальна:

| Мова | Ядро | Обсяг | Друга форма | Обсяг |
|---|---|---|---|---|
| **RU** | `ракетка для настольного тенниса` (однина) | **2000** | `ракетки…` (множина) | 700 |
| **UA** | `ракетки для настільного тенісу` (множина) | **1000** | `ракетка…` (однина) | 250 |

Сума: RU **6 070** + UA **2 490**. Транзакційний хвіст UA ≈ 410 (`купити ракетку…` 250). Сильні модифікатори: `професійні ракетки` (UA 180 / RU ~240), `найкращі ракетки…` 200, `як вибрати ракетку…` 50.

**Мертві хвости (НЕ таргетити):** `готова ракетка` / `збірна ракетка` / `ракетка в зборі` — відсутні в базі (RU `сборная ракетка для настольного тенниса` = лише 40). `для початківців` в UA = **0**. `ракетка для настільного тенісу ціна` = 0.
**Шум:** `перша/первая ракетка` — **ТЕЛЕСЕРІАЛ**, ~19-21k/міс. Голе `ракетка` (1700) не таргетити. `тенісна ракетка` (2000-3100, KD 0) — спірне: в UA покриває і великий, і настільний теніс (агенти розійшлися; окремо перевірити SERP).

**Конкурент — `raketka.ua`** (це і є запит «ракетка юа» 350-400/міс, їхній бренд):
- **DR 5.** Сторінка `/tennis/raketki` тримає №2-3 по головному запиту при **2 беклінках, UR 0**. Органіка 5196/міс, 440 ключів.
- SERP слабкий: Rozetka (DR 83) №1, Epicentrk (DR 77) аж №7, між ними DR 5/11/12 → **вирішує релевантність, не авторитет**. Двері відчинені.
- Їхня формула title: `Купить ракетки для настольного тенниса` — ключ першим, без бренду й сміття. **Дві окремі мовні сторінки** (`/tennis/raketki` RU + `/ua/tennis/raketki` UA) під різні кластери.
- №1 по голові `ракетка` — це exact-match домен, **не копіюється**, не витрачати ресурс.
- 💡 `tt-pro.com.ua` тримає **2 місця в топ-10 чистими статтями** («ТОП-10 лучших», «Как выбрать») при **0 беклінків**, DR 11 → **інфо-інтент у цьому SERP вільний** — прямий аргумент за `/guides`.

---

## Журнал змін
- **2026-07-14** — ✅ **Блог (Фаза A, інфраструктура) — задеплоєно й перевірено:** роути `/blog`, `/blog/[slug]`, `/author/[slug]` (поруч із catch-all, патерн privacy — конфлікту немає). Дані в коді: `src/data/blog.ts` (тип BlogPost + 1-ша стаття «Правила настільного тенісу» з розділами/таблицею ITTF/FAQ×5/«думка магазину»/перелінковкою), `src/data/authors.ts` (Артем Максимчук + 3 профілі sameAs). Schema: `blogPostingJsonLd`+`personJsonLd` у jsonld.ts, `buildBlogMetadata` (og:type=article). На статті перевірено live: BlogPosting+Person(3 sameAs)+FAQPage+Breadcrumb, dateP/dateM, UA/RU. Sitemap+nav оновлено. Білд падав раз на `noUncheckedIndexedAccess` (UI-словники → satisfies) — виправлено. **Фаза B (від власника):** фото автора+обкладинка (Cloudinary publicId у blog.ts/authors.ts), `public/logo.png` (publisher schema), переписати «думку магазину». Стаття noindex до launched=true.
- **2026-07-14** — ✅ **Переточка `/rakety` під реальний кластер:** title/h1/metaDescription/intro (ua+ru) у `categories.ts`. Було заточено під `готові ракетки у зборі` — запитів НЕ існує. Стало: ru-title однина (2000/міс), ua-title множина (1000/міс), H1 бере протилежну форму (+700/+250) — одна сторінка покриває обидві. «Готовість» збережено як **офер** (H1 після ключа + description + lead у тілі), а не як SEO-таргет. CMS перевірено: `content_blocks` для `rakety` = **0 рядків**, тож код доїжджає до видачі (⚠️ якщо категорію заведуть в адмінці — ці рядки мовчки перестануть діяти). `name` НЕ чіпав (хлібні крихти/меню + дає ключ у описі `/butterfly/rakety`). `seoText`/`faq` у `categories.ts` не чіпав — вони й так не рендеряться (RichContent робить ранній return, page.tsx:447-448).
- **2026-07-14** — ✅ **P0-8 (безпека, live):** міграція `enable_rls_on_backup_tables` — RLS on на `entity_media_backup_20260618` + `entity_media_bak_20260622`. `get_advisors` підтвердив: обидва `rls_disabled_in_public` ERROR зникли. Лишились WARN (не критичні): `is_admin`/lead/order-функції SECURITY DEFINER викликаються anon-роллю, `generate_order_number` mutable search_path, leaked-password protection off — опційне хардненінг.
- **2026-07-14** — ✅ **Rich-results код-фікси (у working tree, ще не задеплоєно):** (1) P0-6 — `buildMetadata()` гейтить `robots` на `siteConfig.launched`; (2) og:image/twitter image на каталозі (`buildCatalogMetadata.image` + розрахунок у `generateMetadata`, 1200×630); (3) Product JSON-LD `images`+`sku` (`page.tsx`); (4) `LocaleSwitcher` hrefLang ua→uk. ⚠️ Локальний `tsc`/`next build` не ганявся — **node не встановлено в оточенні**; правки звірені вручну по типах, фінальна перевірка = білд Vercel при пуші. Лишається: брендований fallback OG (головна/статика), CollectionPage/ItemList на листингах, ключі в title/desc товарів, CWV.
- **2026-06-29** — створено живий файл; склоновано репо; під'єднано Supabase/Vercel/Ahrefs; keyword research UA; multi-agent SEO-аудит (29 агентів, 51 знахідка) → повний план P0/P1/P2.
- **2026-06-29** — ✅ **P0-3 виконано:** фікс hreflang у `sitemap.ts` (ключі `uk`/`ru` + `x-default`, URL лишився `/ua`). Перевірено симуляцією логіки.
- **2026-06-29** — ✅ **P0-7 виконано:** сторінки `/privacy` + `/terms` (двомовні, `src/data/legal.ts` + `LegalArticle` + у sitemap). ⚠️ Контент — базовий шаблон, узгодити реквізити юр-особи (ФОП/ТОВ, ЄДРПОУ) та реальний телефон перед фінальним запуском.
- **2026-06-30** — ✅ **Усі 84 основи готові:** додано решту 79 (Zhang Jike, Fan Zhendong, Garaydia, Innerforce-серія, Hadraw, деревʼяні Korbel/Maze/Primorac тощо) через workflow з веб-дослідженням фактів (inner/outer, дерево, вага, товщина) + контроль specs (omar-assar форсовано «дерево» за каталогом). Картка = опис×4 + рейтинги + кому підійде + думка + FAQ + таблиця-орієнтир + повні «Характеристики». Термінологія: лопать/лопасть, центральний (внутрішній) шар.
- **2026-06-30** — ⚙️ Налаштовано автономію (`.claude/settings.json`: acceptEdits + дозволи git/python3/curl/gh + Vercel-read) — менше підтверджень.
- **2026-06-29** — ✅ **Основи: вага + карбон у «Характеристиках».** Винесено в SpecTable окремі рядки «Карбон» (Зовнішній/Внутрішній) і «Середня вага» (діапазон) — нові поля `BaseSpec.weight`/`fiber`, проставлено для 5 основ. Перевірено наживо.
- **2026-06-29** — ✅ **Основи: структура + дерево + вага.** Додано в картки 5 основ: тип конструкції (outer/inner), шари + порода дерева (Koto/Limba/Kiri/Ayous), вага від–до. Звірено з Butterfly → **виправлено**: Harimoto ALC та Apolonia ZLC насправді **inner** (карбон біля ядра, м'яка Limba зовні) — переписано описи/рейтинги/таблицю. Перевірено наживо.
- **2026-06-29** — ✅ **Картки 5 пріоритетних основ:** Viscaria, Timo Boll ALC, Harimoto ALC, Apolonia ZLC, Timo Boll CAF (опис×4, рейтинги швидк/контроль/жорсткість/відчуття/вимогливість, таблиця «Топ-основи ALC/ZLC/CAF», FAQ, CTA). Узагальнено `ExpertSections` під основи (кастомні колонки/клас/CTA). Фікс: гілка основ не рендерила блок — додано. Перевірено наживо. Далі — решта основ (79) через workflow.
- **2026-06-29** — ✅ **Таблиці порівняння для всіх накладок (єдина шкала 0–10):** 5 груп — короткі шипи, довгі шипи, сучасні гладкі (+Dignics05/Tenergy05), класичні гладкі (+Tenergy05), липкі (+Dignics09C). Dignics/Tenergy теж переведено на 0–10. Шипи без губки → «—». Перевірено наживо (7 груп).
- **2026-06-29** — ✅ **Експертні картки ВСІХ 43 накладок:** додано решту 29 (Sriver×3, Glayzer×2, Rozena, Zyre 03, Roundell×2, Feint×5, Tackiness×3, Impartial×2, Ilius×2, Bryce HS, Flextra, Orthodox, Speedy P.O., Challenger Attack, Super Anti, Aibiss, Bugller). Текст — multi-agent workflow (двомовний, типи звірені); числа/тип — з каталогу. Перевірено наживо (HTTP 200, FAQPage JSON-LD). Далі по контенту — **основи**.
- **2026-06-29** — ✅ **Розширені картки Tenergy:** додано експертний контент (verdict/опис×4/рейтинги/кому підійде/думка/порівняння/FAQ) для 6 моделей серії — `tenergy-05`, `05-fx`, `05-hard`, `19`, `64`, `80` (`src/data/catalog/expert.ts`, формат як у Dignics). Числа — на шкалі Dignics. Виправлено баг: заголовок таблиці порівняння був захардкоджений «Dignics» → тепер динамічний (`ExpertSections.tsx`). Лишилось (за бажанням): 25/25-FX/64-FX/80-FX — додаються так само.
- **2026-06-29** — ✅ **Інфо-сторінки футера:** створено `/about`, `/delivery`, `/payment`, `/returns`, `/contacts` (двомовні, `src/data/info.ts`, рендер `LegalArticle`); підв'язано колонку «Інформація» у футері (раніше всі вели в `#`); додано в sitemap. Магазин зазначено **у Харкові** (також `site.ts addressLocality: Kyiv→Kharkiv`). ⚠️ **TODO (додати пізніше):** точна адреса магазину в Харкові (`site.ts streetAddress` + сторінка «Контакти») та реальний телефон; після цього — розглянути LocalBusiness/Store schema на `/contacts`.
