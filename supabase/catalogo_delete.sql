-- Borrado de catálogo (cualquier miembro autenticado).
-- SQL Editor → Run. Si un ítem está en series, Postgres rechazará el DELETE.
-- Idempotente: se puede ejecutar aunque las políticas ya existan.

drop policy if exists "catalogo del grupos" on public.grupos_musculares;
drop policy if exists "catalogo del equipos" on public.equipos;
drop policy if exists "catalogo del ejercicios" on public.ejercicios;

create policy "catalogo del grupos" on public.grupos_musculares
  for delete to authenticated using (true);
create policy "catalogo del equipos" on public.equipos
  for delete to authenticated using (true);
create policy "catalogo del ejercicios" on public.ejercicios
  for delete to authenticated using (true);
