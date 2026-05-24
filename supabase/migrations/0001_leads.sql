-- TTMAX — leads table
-- Apply with: supabase db push OR paste into SQL Editor

create extension if not exists "uuid-ossp";

create table if not exists public.leads (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  name        text not null,
  phone       text not null,
  email       text,
  source      text not null,
  locale      text not null check (locale in ('uk','ru')),
  attribution jsonb not null default '{}'::jsonb
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_source_idx on public.leads (source);

-- Row Level Security
alter table public.leads enable row level security;

-- Server-only writes (service role bypasses RLS).
-- No public/anon access policies are created on purpose: the anon key cannot read or write.
revoke all on public.leads from anon, authenticated;
