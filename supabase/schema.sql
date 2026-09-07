-- FitCheck — esquema v1.1 (Postgres / Supabase)
-- Pegar en SQL Editor de un proyecto vacío. Requiere Auth (email + password, confirmación off).

create extension if not exists "pgcrypto";

create schema if not exists private;

create table public.miembros (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  usuario text not null unique,
  email text not null unique,
  creado_en timestamptz not null default now(),
  constraint miembros_usuario_fmt check (usuario ~ '^[a-z0-9_]{3,24}$')
);

create table public.sesiones (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  nota text,
  creado_en timestamptz not null default now()
);

create table public.asistencia (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id) on delete cascade,
  presente boolean not null,
  unique (sesion_id, miembro_id)
);

create table public.grupos_musculares (
  id uuid primary key default gen_random_uuid(),
  nombre text not null
);

create table public.equipos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text
);

create table public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo_muscular_id uuid not null references public.grupos_musculares (id)
);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id) on delete cascade,
  ejercicio_id uuid not null references public.ejercicios (id),
  equipo_id uuid not null references public.equipos (id),
  numero_serie int not null check (numero_serie > 0),
  repeticiones int not null check (repeticiones > 0),
  peso_kg numeric not null check (peso_kg >= 0),
  nota text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index grupos_nombre_uidx on public.grupos_musculares (lower(trim(nombre)));
create unique index equipos_nombre_uidx on public.equipos (lower(trim(nombre)));
create unique index ejercicios_nombre_uidx on public.ejercicios (lower(trim(nombre)));
create index series_sesion_idx on public.series (sesion_id);
create index series_miembro_idx on public.series (miembro_id);
create index series_ejercicio_idx on public.series (ejercicio_id);
create index series_equipo_idx on public.series (equipo_id);
create index ejercicios_grupo_idx on public.ejercicios (grupo_muscular_id);
create index sesiones_fecha_idx on public.sesiones (fecha desc);
create index asistencia_miembro_idx on public.asistencia (miembro_id);

create or replace function private.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.miembros where id = auth.uid());
$$;

-- Devuelve solo un boolean. Anon lo llama en /entrar para saber si mostrar «crear grupo».
create or replace function public.grupo_esta_vacio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.miembros);
$$;

create or replace function public.ensure_catalogo()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  pecho uuid;
  espalda uuid;
  pierna uuid;
  hombro uuid;
begin
  insert into public.grupos_musculares (nombre)
  values ('Pecho'), ('Espalda'), ('Pierna'), ('Hombro')
  on conflict ((lower(trim(nombre)))) do nothing;

  insert into public.equipos (nombre)
  values ('Barra'), ('Mancuernas'), ('Máquina press'), ('Polea')
  on conflict ((lower(trim(nombre)))) do nothing;

  select id into pecho from public.grupos_musculares where lower(trim(nombre)) = 'pecho';
  select id into espalda from public.grupos_musculares where lower(trim(nombre)) = 'espalda';
  select id into pierna from public.grupos_musculares where lower(trim(nombre)) = 'pierna';
  select id into hombro from public.grupos_musculares where lower(trim(nombre)) = 'hombro';

  insert into public.ejercicios (nombre, grupo_muscular_id)
  values
    ('Press banca', pecho),
    ('Aperturas', pecho),
    ('Remo con barra', espalda),
    ('Jalón al pecho', espalda),
    ('Sentadilla', pierna),
    ('Prensa', pierna),
    ('Press militar', hombro)
  on conflict ((lower(trim(nombre)))) do nothing;
end;
$$;

create or replace function public.listar_sesiones(
  p_desde date default null,
  p_hasta date default null,
  p_grupo_id uuid default null,
  p_offset integer default 0,
  p_limit integer default 15
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with filtradas as (
    select s.id, s.fecha, s.nota, s.creado_en
    from public.sesiones s
    where (p_desde is null or s.fecha >= p_desde)
      and (p_hasta is null or s.fecha <= p_hasta)
      and (
        p_grupo_id is null
        or exists (
          select 1
          from public.series se
          join public.ejercicios e on e.id = se.ejercicio_id
          where se.sesion_id = s.id
            and e.grupo_muscular_id = p_grupo_id
        )
      )
  )
  select jsonb_build_object(
    'total', (select count(*)::int from filtradas),
    'sesiones', coalesce((
      select jsonb_agg(to_jsonb(p))
      from (
        select id, fecha, nota, creado_en
        from filtradas
        order by fecha desc, creado_en desc
        offset greatest(coalesce(p_offset, 0), 0)
        limit greatest(coalesce(p_limit, 15), 1)
      ) p
    ), '[]'::jsonb)
  );
$$;

alter table public.miembros enable row level security;
alter table public.sesiones enable row level security;
alter table public.asistencia enable row level security;
alter table public.grupos_musculares enable row level security;
alter table public.equipos enable row level security;
alter table public.ejercicios enable row level security;
alter table public.series enable row level security;

create policy "lectura grupo" on public.miembros for select to authenticated using (private.es_miembro());
create policy "lectura grupo" on public.sesiones for select to authenticated using (private.es_miembro());
create policy "lectura grupo" on public.asistencia for select to authenticated using (private.es_miembro());
create policy "lectura grupo" on public.grupos_musculares for select to authenticated using (private.es_miembro());
create policy "lectura grupo" on public.equipos for select to authenticated using (private.es_miembro());
create policy "lectura grupo" on public.ejercicios for select to authenticated using (private.es_miembro());
create policy "lectura grupo" on public.series for select to authenticated using (private.es_miembro());

create policy "alta sesion" on public.sesiones for insert to authenticated with check (private.es_miembro());
create policy "editar sesion" on public.sesiones for update to authenticated using (private.es_miembro());

create policy "asistencia grupo ins" on public.asistencia
  for insert to authenticated with check (private.es_miembro());
create policy "asistencia grupo upd" on public.asistencia
  for update to authenticated using (private.es_miembro()) with check (private.es_miembro());

create policy "catalogo ins grupos" on public.grupos_musculares for insert to authenticated with check (private.es_miembro());
create policy "catalogo upd grupos" on public.grupos_musculares for update to authenticated using (private.es_miembro());
create policy "catalogo del grupos" on public.grupos_musculares for delete to authenticated using (private.es_miembro());
create policy "catalogo ins equipos" on public.equipos for insert to authenticated with check (private.es_miembro());
create policy "catalogo upd equipos" on public.equipos for update to authenticated using (private.es_miembro());
create policy "catalogo del equipos" on public.equipos for delete to authenticated using (private.es_miembro());
create policy "catalogo ins ejercicios" on public.ejercicios for insert to authenticated with check (private.es_miembro());
create policy "catalogo upd ejercicios" on public.ejercicios for update to authenticated using (private.es_miembro());
create policy "catalogo del ejercicios" on public.ejercicios for delete to authenticated using (private.es_miembro());

create policy "series grupo ins" on public.series
  for insert to authenticated with check (private.es_miembro());
create policy "series grupo upd" on public.series
  for update to authenticated using (private.es_miembro()) with check (private.es_miembro());
create policy "series grupo del" on public.series
  for delete to authenticated using (private.es_miembro());

create policy "miembro propio ins" on public.miembros
  for insert to authenticated with check (
    id = (select auth.uid()) and (select count(*) from public.miembros) = 0
  );
create policy "miembro propio upd" on public.miembros
  for update to authenticated using (id = (select auth.uid()));

revoke all on function public.grupo_esta_vacio() from public;
grant execute on function public.grupo_esta_vacio() to anon, authenticated;
revoke all on function public.ensure_catalogo() from public;
grant execute on function public.ensure_catalogo() to authenticated;
revoke all on function public.listar_sesiones(date, date, uuid, integer, integer) from public;
grant execute on function public.listar_sesiones(date, date, uuid, integer, integer) to authenticated;
