# TT Max — инструкции для Claude Code

Интернет-магазин Butterfly (настольный теннис): https://ttmax.com.ua. Один владелец, одна ветка `main`.
Отвечай по-русски. Комментарии в коде и сообщения коммитов — по-украински, как в репозитории.

## Стек
Next.js 15.5 (App Router) · React 19 · TypeScript 5.6 · Tailwind 3.4 · zod · Supabase (supabase-js 2, @supabase/ssr) · Cloudinary · posthog-js.
Пакеты — npm. Хостинг — Vercel Pro (fra1). Supabase — тариф Free (Postgres 17, eu-central-1). Автотестов нет.

## Карта проекта
- `src/app/(site)/[locale]/` — сайт, локали `ua` | `ru`. Каталог, хабы и карточки — один catch-all `[...segments]/page.tsx`; маршрутизация — `src/lib/catalog/routing.ts`.
- `src/app/(admin)/admin/` — админка: отдельный корневой layout, всегда динамическая. Доступ — `src/middleware.ts` + `requireAdmin()` (`src/lib/auth/admin.ts`, RPC `is_admin`).
- `src/app/api/` — `orders`, `leads`, `reviews`, `telegram/{webhook,setup,card}`, `admin/*` (везде `requireAdmin`).
- `src/data/catalog/` — каталог в TS (товары, тексты, хабы в `hubContent/`); `src/data/blog.ts` — статьи (работа с ними — skill `ttmax-blog`); `src/data/legal.ts` — политики; `src/i18n/messages/{ua,ru}.ts` — строки UI.
- Supabase поверх файлов: `product_overrides` (актуальные цены и наличие; цифры в коде — запасные), `content_blocks` (CMS-тексты категорий, перебивают файлы), `site_settings` (контакты, ID счётчиков), `entity_media` (фото в Cloudinary). Категории в CMS владелец правит сам через /admin.
- `src/lib/`: `seo/` (JSON-LD, llms.txt, метаданные), `feeds/` (Google Merchant), `analytics/` (единая точка — `trackEvent` в `events.ts`; PostHog — `posthog.ts`, `posthog-server.ts`), `telegram/cards.ts` (карточки заявок и заказов), `crm/status.ts`, `reviews/`, `supabase/` (клиенты; `types.ts` — типы БД, ведутся вручную).
- `supabase/migrations/00NN_*.sql` — схема БД. `scripts/` — проверки (`check-*`), генераторы схем (`gen-*`), деплой (`wait-deploy.sh`, `vercel-ignore-build.sh`).
- `docs/archive/` — старые аудиты и разовые скрипты: не источник правды и не повод для поиска. README частично устарел.

## Экономия контекста
- Огромные файлы не читать целиком: `src/data/catalog/expert.ts` (2,4 МБ), `src/data/blog.ts` (600 КБ), `gearExpert*.ts`, `gear.ts`, `rackets.ts`, `hubs.ts`, `bases.ts`, `[...segments]/page.tsx` (2000 строк). Сначала `grep -n`, затем Read с `offset`/`limit` вокруг найденного места.
- Искать в `src/`, `scripts/`, `supabase/`, а не по всему корню.
- Не перечитывать файл после своего Edit и не читать повторно то, что уже есть в контексте.
- Обрезать вывод: `npm run build 2>&1 | tail -30`, `npx tsc --noEmit 2>&1 | head -30`.
- Ответы MCP держать узкими: в SQL — нужные колонки и `LIMIT`; в PostHog — `schema <tool> <поле>` вместо `info` для больших схем.
- Не запускать субагентов и workflow без явной просьбы.
- Объём исследования соразмерен задаче: точечная правка — grep и 1–2 файла; новая функция — один похожий модуль как образец; широкий аудит — только по запросу.

## Проверка изменений
- Типы: `npm run typecheck`. Линт — только изменённые файлы: `npx next lint --file <файл> …`.
- Сборка: `npm run build 2>&1 | tail -30` (около 15–30 с). Локально нет env Supabase/Cloudinary: данные из БД и фото не загрузятся — это норма, чинить не нужно.
- SEO/GEO: `npm run check:meta` и `npm run check:geo` проверяют живой сайт (`-- --build` — локальную сборку); `npm run check:merchant` — фид из `.feed-data/` (`-- https://ttmax.com.ua` — живой).
- Поведение с реальными данными проверять на проде после деплоя: браузер и Supabase MCP только на чтение.

## Git и деплой
- Push в `main` = продакшен-деплой на Vercel. Каждая сборка — ~1600 страниц и чтение Supabase (egress на Free — 5 ГБ в месяц). Поэтому изменения группировать; пушить, когда пользователь просит деплой или задаче нужна проверка на проде (сказать об этом заранее).
- Коммит, меняющий только `docs/`, `.claude/`, `scripts/`, `supabase/` или `*.md` в корне, сборку не запускает (`scripts/vercel-ignore-build.sh`). Такие изменения можно пушить сразу.
- Дождаться деплоя: `bash scripts/wait-deploy.sh` в фоне — одна строка с итогом (статус из GitHub). Без серии опросов.
- Коннектор Vercel по умолчанию выключен (экономия контекста). Для логов рантайма или env на Vercel — попросить пользователя включить его; изменение действует со следующего хода.
- Коммит: тема «Область: что сделано» по-украински, в теле — зачем. Не коммитить `.env*`, `.next/`, `out/`, `.feed-data/`.
- ID сервисов: Vercel `prj_Ld0TXxt0OBnZPFLstADYw7Do5jgw` (ttmax-site-z2za); Supabase `ttpjtpivtcxjvlzbpwoi`; PostHog EU, проект `315663`; GitHub `maxsushek/ttmax-site`.

## Архитектурные ловушки
- Страницы: `revalidate = false`. Данные — через `unstable_cache` с тегами, админка сбрасывает их через `revalidateTag`. Каждая страница, зависящая от данных, вызывает свой `unstable_cache`, иначе не получит тег. `buildMemo` (`lib/supabase/build-memo.ts`) — только внутри `unstable_cache`.
- Не возвращать оптимизатор картинок Vercel (`images.unoptimized`) и не менять `htmlLimitedBots`, `inlineCss`. Причины (квоты Vercel) — в комментариях `next.config.ts`.
- Локаль в URL `ua` ≠ язык в БД `uk`: использовать `localeToLang`.
- Тексты сайта — всегда в двух локалях (`ua` и `ru`).
- Новый внешний хост (скрипт, API, картинки) добавлять в CSP в `next.config.ts` (режим Report-Only).
- Новая таблица или колонка — миграция в `supabase/migrations/` плюс правка `src/lib/supabase/types.ts`.
- Комментарии «⚠️ НАВІЩО» описывают реальные инциденты: прочитать перед изменением этого места и не удалять.

## Безопасность
- Секреты не выводить и не коммитить (`.env*`, переменные Vercel, ключи Cloudinary, Telegram, Supabase service role). Проверять только наличие и формат.
- Прод-БД: чтение — с `LIMIT`; INSERT/UPDATE/DELETE и миграции — только после явного «да» пользователя.
- Персональные данные клиентов (имя, телефон, адрес) не выводить без нужды, не передавать в аналитику, логи и коммиты.
- Тесты не должны создавать на проде реальные заказы, заявки или отзывы: они уходят владельцу в Telegram.
- Цены: закреслённая цена (`promos.ts`) — только реальная прежняя цена. Купонов и промокодов в коде нет.
- Отзывы и рейтинги — только настоящие; `AggregateRating` — только для товаров. Не писать тексты от имени реальных людей (например, тренеров).
- Платные внешние запросы (Ahrefs и т. п.) и изменения настроек внешних сервисов — сначала спросить, назвав стоимость.

## Формат ответа
Сначала результат (1–2 предложения), затем что проверено и что нужно от пользователя. Без пересказа процесса.
