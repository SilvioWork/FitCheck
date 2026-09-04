-- FitCheck — esquema v1 (Postgres / Supabase)
-- Pegar en SQL Editor del proyecto. Requiere Auth activado (magic link).

create extension if not exists "pgcrypto";

create table public.miembros (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null unique,
  creado_en timestamptz not null default now()
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

create index series_sesion_idx on public.series (sesion_id);
create index series_miembro_idx on public.series (miembro_id);

alter table public.miembros enable row level security;
alter table public.sesiones enable row level security;
alter table public.asistencia enable row level security;
alter table public.grupos_musculares enable row level security;
alter table public.equipos enable row level security;
alter table public.ejercicios enable row level security;
alter table public.series enable row level security;

create policy "lectura grupo" on public.miembros for select to authenticated using (true);
create policy "lectura grupo" on public.sesiones for select to authenticated using (true);
create policy "lectura grupo" on public.asistencia for select to authenticated using (true);
create policy "lectura grupo" on public.grupos_musculares for select to authenticated using (true);
create policy "lectura grupo" on public.equipos for select to authenticated using (true);
create policy "lectura grupo" on public.ejercicios for select to authenticated using (true);
create policy "lectura grupo" on public.series for select to authenticated using (true);

create policy "alta sesion" on public.sesiones for insert to authenticated with check (true);
create policy "editar sesion" on public.sesiones for update to authenticated using (true);

create policy "propia asistencia ins" on public.asistencia
  for insert to authenticated with check (miembro_id = auth.uid());
create policy "propia asistencia upd" on public.asistencia
  for update to authenticated using (miembro_id = auth.uid());

create policy "catalogo ins grupos" on public.grupos_musculares for insert to authenticated with check (true);
create policy "catalogo upd grupos" on public.grupos_musculares for update to authenticated using (true);
create policy "catalogo del grupos" on public.grupos_musculares for delete to authenticated using (true);
create policy "catalogo ins equipos" on public.equipos for insert to authenticated with check (true);
create policy "catalogo upd equipos" on public.equipos for update to authenticated using (true);
create policy "catalogo del equipos" on public.equipos for delete to authenticated using (true);
create policy "catalogo ins ejercicios" on public.ejercicios for insert to authenticated with check (true);
create policy "catalogo upd ejercicios" on public.ejercicios for update to authenticated using (true);
create policy "catalogo del ejercicios" on public.ejercicios for delete to authenticated using (true);

create policy "series ins propias" on public.series
  for insert to authenticated with check (miembro_id = auth.uid());
create policy "series upd propias" on public.series
  for update to authenticated using (miembro_id = auth.uid());
create policy "series del propias" on public.series
  for delete to authenticated using (miembro_id = auth.uid());

create policy "miembro propio ins" on public.miembros
  for insert to authenticated with check (id = auth.uid());
create policy "miembro propio upd" on public.miembros
  for update to authenticated using (id = auth.uid());
