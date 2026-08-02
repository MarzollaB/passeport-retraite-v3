create extension if not exists pgcrypto;

create table if not exists public.event_settings (
  id integer primary key,
  missions_running boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.event_settings (id, missions_running)
values (1, false)
on conflict (id) do nothing;

create table if not exists public.participants (
  id uuid primary key,
  first_name text not null,
  last_name text not null,
  group_name text not null,
  last_seen_at timestamptz not null default now(),
  completed_missions integer not null default 0,
  passport_finalized boolean not null default false,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  mission_id text,
  author_name text not null,
  author_group text not null,
  label text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete set null,
  author_name text not null,
  author_group text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_assignments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete cascade,
  mission_id text not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

alter table public.event_settings enable row level security;
alter table public.participants enable row level security;
alter table public.journal_entries enable row level security;
alter table public.private_messages enable row level security;
alter table public.mission_assignments enable row level security;

drop policy if exists "public event settings read" on public.event_settings;
create policy "public event settings read" on public.event_settings for select using (true);
drop policy if exists "public event settings write" on public.event_settings;
create policy "public event settings write" on public.event_settings for all using (true) with check (true);

drop policy if exists "public participants access" on public.participants;
create policy "public participants access" on public.participants for all using (true) with check (true);

drop policy if exists "public journal read" on public.journal_entries;
create policy "public journal read" on public.journal_entries for select using (true);
drop policy if exists "public journal insert" on public.journal_entries;
create policy "public journal insert" on public.journal_entries for insert with check (true);

drop policy if exists "public private insert" on public.private_messages;
create policy "public private insert" on public.private_messages for insert with check (true);

drop policy if exists "public assignments access" on public.mission_assignments;
create policy "public assignments access" on public.mission_assignments for all using (true) with check (true);

alter publication supabase_realtime add table public.event_settings;
alter publication supabase_realtime add table public.journal_entries;
