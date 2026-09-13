import type { GrupoSerieEjercicioEquipo, Serie } from '@/types/models'

export function agruparSeriesPorEjercicioEquipo(list: Serie[]): GrupoSerieEjercicioEquipo[] {
  const map = new Map<string, GrupoSerieEjercicioEquipo & { firstCreado: string }>()
  for (const s of list) {
    const key = `${s.ejercicio_id}:${s.equipo_id}`
    const g = map.get(key)
    if (g) {
      g.series.push(s)
      if (s.creado_en < g.firstCreado) g.firstCreado = s.creado_en
    } else {
      map.set(key, {
        key,
        ejercicioId: s.ejercicio_id,
        equipoId: s.equipo_id,
        series: [s],
        firstCreado: s.creado_en,
      })
    }
  }
  return [...map.values()]
    .sort((a, b) => a.firstCreado.localeCompare(b.firstCreado))
    .map((g) => ({
      key: g.key,
      ejercicioId: g.ejercicioId,
      equipoId: g.equipoId,
      series: [...g.series].sort((x, y) => x.numero_serie - y.numero_serie),
    }))
}
