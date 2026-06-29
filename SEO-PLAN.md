# TTMAX — SEO та база знань проєкту

> **Живий документ.** Ведеться автоматично (Claude) — оновлюється в міру збору даних і пушиться в GitHub, щоб завжди був свіжим.
> **Останнє оновлення:** 2026-06-29
> **Сайт:** Butterfly UA by TTMAX — магазин інвентарю для настільного тенісу (ринок України)
> **Live:** https://ttmax-site-z2za.vercel.app/ua · **Репо:** https://github.com/maxsushek/ttmax-site

---

## 0. Зміст
1. [Технічний стек](#1-технічний-стек)
2. [Підключення / інтеграції](#2-підключення--інтеграції)
3. [Пріоритетні товари (money-pages)](#3-пріоритетні-товари-money-pages)
4. [Дослідження ключових слів (Ahrefs, UA)](#4-дослідження-ключових-слів-ahrefs-ua)
5. [Ключові SEO-знахідки](#5-ключові-seo-знахідки)
6. [Безпека (Supabase)](#6-безпека-supabase)
7. [Повний SEO-план (P0/P1/P2)](#7-повний-seo-план-p0p1p2) — _генерується аудитом, доповниться_

---

## 1. Технічний стек

- **Next.js 15** (App Router) · React 19 · TypeScript strict
- **Tailwind CSS**, Server Components first
- **Supabase** (SSR) — ліди, замовлення, контент, медіа, налаштування
- **Cloudinary** — зображення (`res.cloudinary.com/dh6vuxjko`), формати AVIF/WebP
- **i18n** власний, легкий: `ua` (за замовч., `<html lang="uk">`) + `ru`. URL: `/ua/...`, `/ru/...`
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

**Таблиці Supabase (public):** `leads` (18), `lead_events` (42), `admins` (1), `orders` (7), `order_items` (7), `order_events` (7), `entity_media` (1061), `site_settings` (5), `product_overrides` (4), `content_blocks` (36) + 2 backup-таблиці (див. [§6](#6-безпека-supabase)).

**Змінні оточення (`.env`):** `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_LAUNCHED` (гейт noindex), Supabase-ключі, аналітика (GTM/GA/Ads/Meta), Telegram-сповіщення про замовлення.

---

## 3. Пріоритетні товари (money-pages)

Заданий пріоритет від власника. **Усі 18 товарів уже є в каталозі.** Це сторінки, які отримують максимум уваги в SEO (унікальний контент, schema Product з offers/наявністю, перелінковка, фото, відгуки).

### Накладки — `/{locale}/butterfly/nakladki/{slug}`

| # | Товар | slug | URL (UA) | Пошук (бренд-запит) |
|---|---|---|---|---|
| 1 | Butterfly Dignics 05 | `dignics-05` | `/ua/butterfly/nakladki/dignics-05` | dignics 05 ~50/міс |
| 2 | Butterfly Dignics 09C | `dignics-09c` | `/ua/butterfly/nakladki/dignics-09c` | бренд |
| 3 | Butterfly Dignics 64 | `dignics-64` | `/ua/butterfly/nakladki/dignics-64` | бренд |
| 4 | Butterfly Dignics 80 | `dignics-80` | `/ua/butterfly/nakladki/dignics-80` | бренд |
| 5 | Butterfly Tenergy 05 | `tenergy-05` | `/ua/butterfly/nakladki/tenergy-05` | tenergy 05 ~50/міс |
| 6 | Butterfly Tenergy 05 FX | `tenergy-05-fx` | `/ua/butterfly/nakladki/tenergy-05-fx` | бренд |
| 7 | Butterfly Tenergy 05 Hard | `tenergy-05-hard` | `/ua/butterfly/nakladki/tenergy-05-hard` | бренд |
| 8 | Butterfly Tenergy 19 | `tenergy-19` | `/ua/butterfly/nakladki/tenergy-19` | бренд |
| 9 | Butterfly Zyre 03 | `zyre-03` | `/ua/butterfly/nakladki/zyre-03` | бренд |
| 10 | Butterfly Glayzer | `glayzer` | `/ua/butterfly/nakladki/glayzer` | бренд |
| 11 | Butterfly Glayzer 09C | `glayzer-09c` | `/ua/butterfly/nakladki/glayzer-09c` | бренд |
| 12 | Butterfly Rozena | `rozena` | `/ua/butterfly/nakladki/rozena` | бренд |
| 13 | Butterfly Feint Long III | `feint-long-iii` | `/ua/butterfly/nakladki/feint-long-iii` | бренд (нішевий, довгі шипи) |

### Основи — `/{locale}/butterfly/osnovaniya/{slug}`

| # | Товар | slug | URL (UA) | Пошук (бренд-запит) |
|---|---|---|---|---|
| 14 | Butterfly Viscaria OFF | `viscaria` | `/ua/butterfly/osnovaniya/viscaria` | viscaria — топ-основа |
| 15 | Butterfly Timo Boll ALC | `timo-boll-alc` | `/ua/butterfly/osnovaniya/timo-boll-alc` | timo boll alc |
| 16 | Butterfly Harimoto Tomokazu ALC | `harimoto-tomokazu-alc` | `/ua/butterfly/osnovaniya/harimoto-tomokazu-alc` | бренд |
| 17 | Butterfly Apolonia ZLC | `apolonia-zlc` | `/ua/butterfly/osnovaniya/apolonia-zlc` | бренд |
| 18 | Butterfly Timo Boll CAF | `timo-boll-caf` | `/ua/butterfly/osnovaniya/timo-boll-caf` | бренд |

**SEO-дії по цих сторінках (буде деталізовано в §7):** унікальний опис 250+ слів кожна; повна schema `Product` з `offers`/`availability`/`priceValidUntil`/`sku`/`image`; реальні фото (Cloudinary); блок «з цим купують» (рубер↔основа↔ракетка-збірка); FAQ під featured snippet; відгуки → `aggregateRating` (коли збиратимуться першопартійно).

---

## 4. Дослідження ключових слів (Ahrefs, UA)

Country = UA. Дані з Ahrefs Keywords Explorer (2026-06-29). **Уся ніша має KD ≈ 0** — низька конкуренція, виграється контентом + технічним SEO.

| Запит | Обсяг/міс | KD | Traffic Potential | Інтент | Нотатка |
|---|---|---|---|---|---|
| тенісний стіл | **2800** | 0 | 300 | comm/trans | 🔴 столів у каталозі НЕМАЄ |
| настільний теніс | **2100** | 1 | 500 | info | гайд/контент |
| ракетка для настольного тенниса (RU) | **2000** | 0 | 1200 | comm/trans | категорія `rakety` |
| ракетки для настільного тенісу | **1200** | 0 | 1100 | comm/trans | категорія `rakety` |
| настольный теннис (RU) | 900 | 17 | 800 | info | ai_overview |
| ракетка для настільного тенісу | 600 | 0 | 800 | comm/trans | категорія `rakety` |
| стіл для настільного тенісу | 250 | 0 | **3000** | comm/trans | 🔴 столи |
| купити ракетку для настільного тенісу | 250 | 0 | 450 | trans | ai_overview |
| сітка для настільного тенісу | 200 | 0 | 100 | trans | категорія `setki` |
| теннисный стол купить (RU) | 150 | 1 | 400 | trans | local_pack |
| тенісні столи | 100 | 0 | **4000** | comm/trans | 🔴 столи |
| м'ячі для настільного тенісу | 100 | 0 | 40 | trans | категорія `myachi` |
| tenergy 05 | 50 | — | — | branded | товар |
| dignics 05 | 50 | — | — | branded | товар |
| ракетка butterfly | 30 | — | — | branded | бренд |

**Висновки:**
1. **Столи = найбільший незакритий попит** (сумарно ~3000+/міс, TP до 4000). Каталог їх не продає → це пробіл №1 у контент-роадмепі.
2. Генеричні запити (ракетки/накладки/основи) дають основний трафік, KD 0 → цільтесь категоріями, не лише брендом.
3. Часті SERP-фічі **question / ai_overview** → FAQ і how-to контент виграє сніпети.
4. Ринок двомовний (UA + RU великі обсяги) → паритет RU/UA контенту критичний.

---

## 5. Ключові SEO-знахідки

> Повний пріоритизований список — у [§7](#7-повний-seo-план-p0p1p2) (генерується multi-agent аудитом).

🔴 **P0 — Домен/канонікал.** Live на `ttmax-site-z2za.vercel.app`; `canonical`, `og:url`, `hreflang`, `sitemap` усі вказують на vercel-піддомен, а не на `ttmax.ua`. Весь SEO-вес накопичується на тимчасовому домені. Фікс: підключити `ttmax.ua` у Vercel, виставити `NEXT_PUBLIC_SITE_URL=https://ttmax.ua`, налаштувати 301 з vercel-домену.

🔴 **P0 — Гейт noindex.** `siteConfig.launched` (`NEXT_PUBLIC_SITE_LAUNCHED`) керує повним noindex + robots disallow. Зараз сайт індексується; стежити, щоб при міграції домену не злетіло випадково.

🟠 **P1 — Контент-пробіл «столи».** Найбільший попит ринку не покритий (див. §4).

🟠 **P1 — Structured data Product.** Перевірити повноту `Product` (offers/availability/sku/aggregateRating) на товарах — для rich results у видачі.

🟡 **P1 — OG-зображення.** У `<head>` live-сайту немає `og:image`/`twitter:image` — слабкі превʼю в соцмережах/чатах.

🟡 **P2 — Плейсхолдери в `src/config/site.ts`** — телефон `+380000000000`, порожня адреса, соцпосилання `#` → ламають/спустошують schema Organization/Store.

---

## 6. Безпека (Supabase)

⚠️ **RLS вимкнено на 2 backup-таблицях:** `entity_media_backup_20260618`, `entity_media_bak_20260622`. Будь-хто з anon-ключем може читати/змінювати всі рядки. Рекомендація — увімкнути RLS або видалити бекапи:

```sql
ALTER TABLE public.entity_media_backup_20260618 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_media_bak_20260622   ENABLE ROW LEVEL SECURITY;
-- (увімкнення RLS без політик заблокує доступ — це ок для backup-таблиць, або просто DROP їх)
```

---

## 7. Повний SEO-план (P0/P1/P2)

> ⏳ **Генерується.** Запущено multi-agent аудит коду (7 вимірів: indexing/домен, metadata/hreflang/OG, structured data, контент/каталог, перелінковка, performance/CWV, вимірювання/запуск) → верифікація → синтез.
> Цей розділ буде замінено повним планом із пріоритетами, мапою «запит → сторінка», чеклистом запуску та планом по тижнях.

<!-- SEO-PLAN-BODY -->
_(очікує результатів аудиту)_
<!-- /SEO-PLAN-BODY -->
