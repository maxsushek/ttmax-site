# Поля BlogPost (`src/data/blog.ts`)

`L` = `{ ua: string; ru: string }`. Тип в начале `blog.ts` — источник правды; здесь только правила заполнения.

| Поле | Правило |
|---|---|
| `slug` | `^[a-z0-9-]{1,80}$`, совпадает с ключом в `POSTS`. URL: `/{ua,ru}/blog/<slug>`. |
| `h1` | Вопрос или «как/что/чем» — формат статьи, не каталога. |
| `metaTitle` | ≤ 60 символов, `… \| TTMAX`. |
| `metaDescription` | 110–158 символов, эмодзи в начале, запрос и числа. |
| `excerpt` | 1–2 предложения для карточки в списке и запасного og:description. |
| `datePublished`, `dateModified` | `YYYY-MM-DD`, вручную. |
| `author` | `"artem-maksymchuk"` (слаги — `src/data/authors.ts`). |
| `coverSrc` | `/blog/<slug>-cover.png` (Canva) или `.svg` (генератор) — см. `visuals.md`. `heroPublicId` (Cloudinary) — альтернатива, сейчас не используется. |
| `heroAlt`, `heroCaption?` | alt 5–15 слов на каждую локаль, без «купити». |
| `intro` | 2 абзаца: суть + что будет в статье. Главный запрос — в первом абзаце. |
| `sections[]` | 5–9 секций, первая — `id: "korotko"` (answer-first). |
| `opinion?` | Только текст владельца. |
| `faq?` | 6–9 пар `q`/`a` → FAQPage. |
| `officialSource?` | Главный первоисточник `{label, url}`. |
| `sources?` | `{label, url, kind: "official"\|"forum"\|"review"}`, официальные первыми. |
| `relatedProducts?` | 2–4 `BlogLink` на хабы и категории. |
| `relatedPosts?` | 3–4 слага существующих статей. |
| `interactive?` | `playStyle` \| `racketPicker` \| `tableSpace` \| `rubberPoll` — только если по теме. |
| `consultAfter?` | id секции, после которой блок «Не впевнені, що обрати? — підберемо» (заявка `blog-consult`). Только статьи-сравнения, где читатель выбирает модель. Это консультация, не кнопка «Купить» — правило формата не нарушает. |
| `draft?` | `true` — скрыта на проде и в sitemap. |

## Секция (`BlogSection`)
| Поле | Правило |
|---|---|
| `id` | Якорь `^[a-z0-9-]+$`, уникальный в статье, латиницей по смыслу (`materialy`, `yak-obraty`). |
| `h` | h2. Первое предложение `p` отвечает на него. |
| `p` | Абзацы `{ ua: string[], ru: string[] }`, одинаковое количество в обеих локалях. |
| `table?` | `{ columns: L[], rows: BlogCell[][] }`. Чаще 3–5 колонок, первая — объект сравнения. Числа в обеих локалях одинаковые, десятичная запятая. Клетка с игроком — `{ ua, ru, player: "<slug>" }`: аватарка, блок «Фото игроков» и Person в разметке появляются сами. Игрок — в `src/data/players.ts`; фото только из Wikimedia Commons с автором и лицензией, иначе без `photo` (инициалы). |
| `image?` | Схема из генератора: `{ src: {ua, ru}, alt: L, caption?: L }` (`visuals.md`). |
| `rec?` | Одна карточка: `publicId` (`ttmax/product/<slug>/NN`, лучше не `/00`), `name`, `verdict` (факт из данных), `alt`, `href` на карточку товара. Без цены. |
| `links?` | Контекстные `BlogLink` на каталог, без цен. |
| `steps?` | `{ name: L, text: L }[]` → HowTo. Только в одной секции статьи. |

## Проверка карточек и ссылок
- Карточка существует: `grep -n '"<slug>"' src/data/catalog/*.ts` или `getProductBySlug`. Скрытые и снятые товары (`src/lib/catalog/hidden.ts`) не ссылать.
- Фото для `rec`: `publicId` формата `ttmax/product/<slug>/NN`. Кадры есть в Supabase `entity_media` (`select public_id from entity_media where entity_slug='<slug>' order by sort limit 10`).
- Хабы и категории: пути из `src/data/catalog/hubs.ts` / `categories.ts` (grep по slug).
