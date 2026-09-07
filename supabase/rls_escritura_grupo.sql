-- Escritura de grupo: cualquier miembro anota series y asistencia de cualquiera.
-- Idempotente para el SQL Editor del proyecto vivo.

drop policy if exists "propia asistencia ins" on public.asistencia;
drop policy if exists "propia asistencia upd" on public.asistencia;
drop policy if exists "asistencia grupo ins" on public.asistencia;
drop policy if exists "asistencia grupo upd" on public.asistencia;

create policy "asistencia grupo ins" on public.asistencia
  for insert to authenticated with check (private.es_miembro());
create policy "asistencia grupo upd" on public.asistencia
  for update to authenticated using (private.es_miembro()) with check (private.es_miembro());

drop policy if exists "series ins propias" on public.series;
drop policy if exists "series upd propias" on public.series;
drop policy if exists "series del propias" on public.series;
drop policy if exists "series grupo ins" on public.series;
drop policy if exists "series grupo upd" on public.series;
drop policy if exists "series grupo del" on public.series;

create policy "series grupo ins" on public.series
  for insert to authenticated with check (private.es_miembro());
create policy "series grupo upd" on public.series
  for update to authenticated using (private.es_miembro()) with check (private.es_miembro());
create policy "series grupo del" on public.series
  for delete to authenticated using (private.es_miembro());
