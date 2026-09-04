-- Activar Realtime en las tablas de FitCheck.
-- SQL Editor → New query → Run (si una tabla ya está en la publicación, ignora el error o comenta esa línea).

alter publication supabase_realtime add table public.sesiones;
alter publication supabase_realtime add table public.asistencia;
alter publication supabase_realtime add table public.series;
alter publication supabase_realtime add table public.ejercicios;
alter publication supabase_realtime add table public.equipos;
alter publication supabase_realtime add table public.grupos_musculares;
alter publication supabase_realtime add table public.miembros;
