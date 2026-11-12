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

-- Eliminar la propia cuenta desde la app (Apple, guía 5.1.1(v)).
-- Solo borra al usuario que la llama; progreso y perfil se borran en cascada.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Invitaciones al nivel 7 (Santuario del Éter). Migración "invitaciones_nivel_7".
-- Reglas: solo invita quien completó los niveles 1 al 6; máximo 3 por persona;
-- cada código sirve para una sola persona y nadie canjea el suyo propio.
create or replace function public.create_invitation()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- sin O/0, I/1, L
  levels_done int;
  made int;
  raw bytea;
  body text;
  new_code text;
  attempt int := 0;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select count(distinct level) into levels_done
    from public.level_progress
   where user_id = uid and level between 1 and 6;
  if levels_done < 6 then
    raise exception 'levels_incomplete';
  end if;

  select count(*) into made from public.invitations where created_by = uid;
  if made >= 3 then
    raise exception 'limit_reached';
  end if;

  loop
    attempt := attempt + 1;
    raw := uuid_send(gen_random_uuid()); -- 16 bytes aleatorios seguros
    body := '';
    for i in 0..7 loop
      body := body || substr(alphabet, 1 + (get_byte(raw, i) % 31), 1);
    end loop;
    new_code := 'ETER-' || substr(body, 1, 4) || '-' || substr(body, 5, 4);
    begin
      insert into public.invitations (code, created_by) values (new_code, uid);
      return new_code;
    exception when unique_violation then
      if attempt >= 5 then
        raise exception 'try_again';
      end if;
    end;
  end loop;
end;
$$;

create or replace function public.redeem_invitation(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  norm text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Ya tiene una invitación canjeada: no gasta otra.
  if exists (select 1 from public.invitations where redeemed_by = uid) then
    return;
  end if;

  update public.invitations
     set redeemed_by = uid, redeemed_at = now()
   where code = norm
     and redeemed_by is null
     and (created_by is null or created_by <> uid);

  if not found then
    perform pg_sleep(1); -- frena a quien intente adivinar códigos
    raise exception 'invalid_code';
  end if;
end;
$$;

revoke all on function public.create_invitation() from public, anon;
revoke all on function public.redeem_invitation(text) from public, anon;
grant execute on function public.create_invitation() to authenticated;
grant execute on function public.redeem_invitation(text) to authenticated;

create index if not exists invitations_created_by_idx on public.invitations (created_by);
create index if not exists invitations_redeemed_by_idx on public.invitations (redeemed_by);
