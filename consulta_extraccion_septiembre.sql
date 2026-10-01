-- ============================================
-- CONSULTA DE EXTRACCIÓN: DATOS DE SEPTIEMBRE 2026
-- ============================================
-- Base de datos: Supabase FitCheck
-- Proyecto ID: zrbbmqowrjfnluzfybuc
-- Fecha de extracción: 1 de Octubre, 2026
-- Usuario objetivo: Silvio
-- Período: 1-30 de Septiembre 2026
-- ============================================

-- 1. EXTRACCIÓN COMPLETA DE TODAS LAS SERIES DE SILVIO EN SEPTIEMBRE
-- Esta consulta obtiene cada serie individual con todos los detalles
SELECT 
    m.id as miembro_id,
    m.nombre as miembro_nombre,
    m.usuario,
    s.id as sesion_id,
    s.fecha,
    s.nota as nota_sesion,
    e.nombre as ejercicio,
    gm.nombre as grupo_muscular,
    eq.nombre as equipo,
    se.numero_serie,
    se.repeticiones,
    se.peso_kg,
    se.nota as nota_serie,
    se.creado_en
FROM public.series se
JOIN public.sesiones s ON se.sesion_id = s.id
JOIN public.miembros m ON se.miembro_id = m.id
JOIN public.ejercicios e ON se.ejercicio_id = e.id
JOIN public.grupos_musculares gm ON e.grupo_muscular_id = gm.id
JOIN public.equipos eq ON se.equipo_id = eq.id
WHERE m.usuario = 'silvio'
  AND s.fecha >= '2026-09-01'
  AND s.fecha <= '2026-09-30'
ORDER BY s.fecha DESC, e.nombre, se.numero_serie;

-- ============================================

-- 2. RESUMEN ESTADÍSTICO POR DÍA DE ENTRENAMIENTO
-- Agrupa métricas por cada sesión de entrenamiento
SELECT 
    s.fecha,
    COUNT(DISTINCT se.ejercicio_id) as total_ejercicios,
    COUNT(se.id) as total_series,
    SUM(se.repeticiones) as total_repeticiones,
    ROUND(AVG(se.peso_kg::numeric), 2) as peso_promedio,
    MIN(se.peso_kg::numeric) as peso_minimo,
    MAX(se.peso_kg::numeric) as peso_maximo
FROM public.series se
JOIN public.sesiones s ON se.sesion_id = s.id
JOIN public.miembros m ON se.miembro_id = m.id
WHERE m.usuario = 'silvio'
  AND s.fecha >= '2026-09-01'
  AND s.fecha <= '2026-09-30'
GROUP BY s.fecha
ORDER BY s.fecha DESC;

-- ============================================

-- 3. RESUMEN POR EJERCICIO
-- Muestra las estadísticas de cada ejercicio durante el mes
SELECT 
    e.nombre as ejercicio,
    gm.nombre as grupo_muscular,
    COUNT(se.id) as veces_realizado,
    COUNT(DISTINCT s.fecha) as dias_entrenados,
    ROUND(AVG(se.peso_kg::numeric), 2) as peso_promedio,
    MIN(se.peso_kg::numeric) as peso_minimo,
    MAX(se.peso_kg::numeric) as peso_maximo,
    ROUND(AVG(se.repeticiones), 2) as reps_promedio
FROM public.series se
JOIN public.sesiones s ON se.sesion_id = s.id
JOIN public.miembros m ON se.miembro_id = m.id
JOIN public.ejercicios e ON se.ejercicio_id = e.id
JOIN public.grupos_musculares gm ON e.grupo_muscular_id = gm.id
WHERE m.usuario = 'silvio'
  AND s.fecha >= '2026-09-01'
  AND s.fecha <= '2026-09-30'
GROUP BY e.nombre, gm.nombre
ORDER BY veces_realizado DESC, ejercicio;

-- ============================================

-- 4. PROGRESIÓN DE PESOS POR EJERCICIO
-- Muestra la evolución del peso usado en cada ejercicio ordenado cronológicamente
SELECT 
    s.fecha,
    e.nombre as ejercicio,
    se.numero_serie,
    se.peso_kg,
    se.repeticiones,
    se.nota as nota_serie
FROM public.series se
JOIN public.sesiones s ON se.sesion_id = s.id
JOIN public.miembros m ON se.miembro_id = m.id
JOIN public.ejercicios e ON se.ejercicio_id = e.id
WHERE m.usuario = 'silvio'
  AND s.fecha >= '2026-09-01'
  AND s.fecha <= '2026-09-30'
ORDER BY e.nombre, s.fecha, se.numero_serie;

-- ============================================

-- 5. VOLUMEN TOTAL POR GRUPO MUSCULAR
-- Calcula el volumen de entrenamiento (series × reps × peso) por grupo muscular
SELECT 
    gm.nombre as grupo_muscular,
    COUNT(se.id) as total_series,
    SUM(se.repeticiones) as total_repeticiones,
    ROUND(SUM(se.repeticiones * se.peso_kg::numeric), 2) as volumen_total_kg,
    ROUND(AVG(se.peso_kg::numeric), 2) as peso_promedio
FROM public.series se
JOIN public.sesiones s ON se.sesion_id = s.id
JOIN public.miembros m ON se.miembro_id = m.id
JOIN public.ejercicios e ON se.ejercicio_id = e.id
JOIN public.grupos_musculares gm ON e.grupo_muscular_id = gm.id
WHERE m.usuario = 'silvio'
  AND s.fecha >= '2026-09-01'
  AND s.fecha <= '2026-09-30'
GROUP BY gm.nombre
ORDER BY volumen_total_kg DESC;

-- ============================================

-- 6. EQUIPAMIENTO MÁS UTILIZADO
-- Muestra qué equipos usa más frecuentemente
SELECT 
    eq.nombre as equipo,
    COUNT(se.id) as veces_usado,
    COUNT(DISTINCT e.id) as ejercicios_diferentes,
    ROUND(AVG(se.peso_kg::numeric), 2) as peso_promedio
FROM public.series se
JOIN public.sesiones s ON se.sesion_id = s.id
JOIN public.miembros m ON se.miembro_id = m.id
JOIN public.ejercicios e ON se.ejercicio_id = e.id
JOIN public.equipos eq ON se.equipo_id = eq.id
WHERE m.usuario = 'silvio'
  AND s.fecha >= '2026-09-01'
  AND s.fecha <= '2026-09-30'
GROUP BY eq.nombre
ORDER BY veces_usado DESC;

-- ============================================

-- 7. LISTADO DE TODAS LAS SESIONES
-- Vista general de las sesiones del mes
SELECT 
    s.fecha,
    s.nota as descripcion_sesion,
    COUNT(DISTINCT se.ejercicio_id) as ejercicios,
    COUNT(se.id) as series,
    SUM(se.repeticiones) as repeticiones_totales
FROM public.sesiones s
JOIN public.series se ON se.sesion_id = s.id
JOIN public.miembros m ON se.miembro_id = m.id
WHERE m.usuario = 'silvio'
  AND s.fecha >= '2026-09-01'
  AND s.fecha <= '2026-09-30'
GROUP BY s.id, s.fecha, s.nota
ORDER BY s.fecha DESC;

-- ============================================
-- NOTAS:
-- - Todas las consultas filtran por usuario = 'silvio'
-- - El período es fijo: 1 al 30 de septiembre de 2026
-- - Los pesos están en kilogramos (kg)
-- - Las consultas pueden ser modificadas para otros usuarios o períodos
-- ============================================
