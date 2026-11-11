-- SÚPER CONCIENCIA — esquema inicial de Supabase
-- Correr en el SQL Editor del proyecto de Supabase.

-- Progreso de cada usuario por nivel (1..7)
create table if not exists public.level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level int not null check (level between 1 and 7),
  completed_at timestamptz not null default now(),
  unique (user_id, level)
);

-- Invitaciones para desbloquear el portal final (nivel 7)
create table if not exists public.invitations (
  code text primary key,
  created_by uuid references auth.users (id) on delete set null,
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Preferencias del usuario (idioma, voz de IA, etc.)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  lang text not null default 'es' check (lang in ('es', 'en')),
  ai_voice text,
  updated_at timestamptz not null default now()
);

-- Seguridad por fila: cada quien ve y edita solo lo suyo.
alter table public.level_progress enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;

create policy "own progress" on public.level_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Las invitaciones: el dueño puede verlas; cualquiera autenticado puede canjear la suya.
create policy "see own invites" on public.invitations
  for select using (auth.uid() = created_by or auth.uid() = redeemed_by);
