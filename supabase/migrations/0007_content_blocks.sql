-- supabase/migrations/0007_content_blocks.sql
-- Контентний шар: SEO-описи по сутностях каталогу та мовах.
-- entity_type: 'product' | 'category' | 'brand' | 'brandCategory' | 'facet' (відкрите поле — на майбутнє 'series' тощо).
-- Один рядок = (entity_type, slug, locale). Порожні поля не рендеряться (без авто-сміття).
-- Закрита RLS (service-role only): читання лише на сервері через кешований резолвер, як site_settings/product_overrides.

create table if not exists content_blocks (
  entity_type      text        not null,
  slug             text        not null,
  locale           text        not null,
  meta_title       text,
  meta_description text,
  intro            text,
  body             text,                -- markdown (безпечний рендер на сервері)
  faq              jsonb,               -- [{ "q": "...", "a": "..." }, ...]
  comparison       jsonb,               -- { heading?, columns: [...], rows: [{ cells: [...], href? }], note? }
  noindex          boolean,             -- per-entity примусовий noindex (напр. тонкий фасет)
  updated_at       timestamptz not null default now(),
  primary key (entity_type, slug, locale)
);

-- Швидкий вибір усіх описів сутності (обидві мови) для адмінки.
create index if not exists content_blocks_entity_idx on content_blocks (entity_type, slug);

alter table content_blocks enable row level security;
-- Жодних policy → доступ лише service-role ключем (сервер). Anon/public не читають напряму.
