-- Borrado de catálogo (cualquier miembro autenticado).
-- SQL Editor → Run. Si un ítem está en series, Postgres rechazará el DELETE.

create policy "catalogo del grupos" on public.grupos_musculares
  for delete to authenticated using (true);
create policy "catalogo del equipos" on public.equipos
  for delete to authenticated using (true);
create policy "catalogo del ejercicios" on public.ejercicios
  for delete to authenticated using (true);
