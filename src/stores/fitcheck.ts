import { computed, ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/ids'
import { emailDeUsuario, normalizarUsuario } from '@/lib/usuario'
import { useAuthStore } from '@/stores/auth'
import type { Asistencia, Ejercicio, Equipo, GrupoMuscular, Miembro, Serie, Sesion } from '@/types/models'

export const HISTORIAL_PAGE = 15

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

function mapSerie(row: Serie & { peso_kg: number | string }): Serie {
  return { ...row, peso_kg: asNumber(row.peso_kg) }
}

export const useFitcheckStore = defineStore('fitcheck', () => {
  const miembros = ref<Miembro[]>([])
  const sesiones = ref<Sesion[]>([])
  const asistencia = ref<Asistencia[]>([])
  const grupos = ref<GrupoMuscular[]>([])
  const equipos = ref<Equipo[]>([])
  const ejercicios = ref<Ejercicio[]>([])
  const series = ref<Serie[]>([])
  const historialSesiones = ref<Sesion[]>([])
  const historialTotal = ref(0)
  const historialPagina = ref(0)
  const historialFiltros = ref({ desde: '', hasta: '', grupoId: '' })
  const consultaSesiones = ref<Sesion[]>([])
  const error = ref('')
  const listo = ref(false)
  const enVivo = ref(false)

  let canal: RealtimeChannel | null = null
  let refreshTimer: ReturnType<typeof setTimeout> | undefined

  const auth = useAuthStore()
  const miembroActivoId = computed(() => auth.user?.id ?? null)
  const miembroActivo = computed(
    () => miembros.value.find((m) => m.id === miembroActivoId.value) ?? null,
  )

  const sesionDeHoy = computed(() => {
    const today = todayISO()
    return (
      sesiones.value
        .filter((s) => s.fecha === today)
        .sort((a, b) => b.creado_en.localeCompare(a.creado_en))[0] ?? null
    )
  })

  const sesionesOrdenadas = computed(() =>
    [...sesiones.value].sort((a, b) => {
      if (a.fecha === b.fecha) return b.creado_en.localeCompare(a.creado_en)
      return b.fecha.localeCompare(a.fecha)
    }),
  )

  function fail(message: string) {
    error.value = message
  }

  function limpiarError() {
    error.value = ''
  }

  function nombreCatalogo(tabla: 'equipos' | 'ejercicios' | 'grupos_musculares', id: string) {
    if (tabla === 'equipos') return equipos.value.find((e) => e.id === id)?.nombre ?? 'este equipo'
    if (tabla === 'ejercicios')
      return ejercicios.value.find((e) => e.id === id)?.nombre ?? 'este ejercicio'
    return grupos.value.find((g) => g.id === id)?.nombre ?? 'este grupo'
  }

  function mensajeCatalogoEnUso(tabla: 'equipos' | 'ejercicios' | 'grupos_musculares', id: string) {
    const nombre = nombreCatalogo(tabla, id)
    if (tabla === 'grupos_musculares') {
      return `No se puede quitar «${nombre}»: hay ejercicios en ese grupo.`
    }
    return `No se puede quitar «${nombre}»: ya está en series guardadas.`
  }

  function esRestriccionUso(err: { message?: string; code?: string } | null) {
    const code = err?.code ?? ''
    const message = err?.message ?? ''
    return code === '23503' || /foreign key|violates/i.test(message)
  }

  function esNombreDuplicado(err: { message?: string; code?: string } | null) {
    const code = err?.code ?? ''
    const message = err?.message ?? ''
    return code === '23505' || /duplicate key|unique/i.test(message)
  }

  function mensajeDuplicado(nombre: string) {
    return `Ya existe «${nombre.trim()}» en el catálogo.`
  }

  function mergeSesion(row: Sesion) {
    const next = { ...row, fecha: String(row.fecha).slice(0, 10) }
    const idx = sesiones.value.findIndex((s) => s.id === next.id)
    if (idx >= 0) sesiones.value[idx] = next
    else sesiones.value.push(next)
  }

  function replaceDatosSesion(sesionId: string, asis: Asistencia[], ser: Serie[]) {
    asistencia.value = asistencia.value.filter((a) => a.sesion_id !== sesionId).concat(asis)
    series.value = series.value.filter((s) => s.sesion_id !== sesionId).concat(ser)
  }

  function grupoDeEjercicio(ejercicioId: string): string {
    const ej = ejercicios.value.find((e) => e.id === ejercicioId)
    return grupos.value.find((g) => g.id === ej?.grupo_muscular_id)?.nombre ?? ''
  }

  async function seedCatalogIfEmpty() {
    const [gCount, eCount, xCount] = await Promise.all([
      supabase.from('grupos_musculares').select('id', { count: 'exact', head: true }),
      supabase.from('equipos').select('id', { count: 'exact', head: true }),
      supabase.from('ejercicios').select('id', { count: 'exact', head: true }),
    ])
    const countErr = [gCount, eCount, xCount].find((r) => r.error)?.error
    if (countErr) throw countErr
    if ((gCount.count ?? 0) + (eCount.count ?? 0) + (xCount.count ?? 0) > 0) return
    const { error: err } = await supabase.rpc('ensure_catalogo')
    if (err) throw err
  }

  async function ensureMiembro() {
    const user = auth.user
    if (!user?.email) return
    const { data: existente, error: selErr } = await supabase
      .from('miembros')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (selErr) throw selErr
    // El grupo ya está formado: un upsert (INSERT … ON CONFLICT) choca con RLS
    // aunque la fila exista. Si ya eres miembro, no hay nada que crear.
    if (existente) return
    const usuario =
      (typeof user.user_metadata.usuario === 'string' && normalizarUsuario(user.user_metadata.usuario)) ||
      user.email.split('@')[0] ||
      'yo'
    const nombre =
      (typeof user.user_metadata.nombre === 'string' && user.user_metadata.nombre) || usuario
    const { error: err } = await supabase.from('miembros').insert({
      id: user.id,
      nombre,
      usuario,
      email: user.email.includes('@') ? user.email : emailDeUsuario(usuario),
    })
    if (err) throw new Error('No formas parte del grupo. Pide a un compañero que te dé de alta.')
  }

  async function refreshBase() {
    const [m, g, e, x] = await Promise.all([
      supabase.from('miembros').select('*'),
      supabase.from('grupos_musculares').select('*'),
      supabase.from('equipos').select('*'),
      supabase.from('ejercicios').select('*'),
    ])
    const firstErr = [m, g, e, x].find((r) => r.error)?.error
    if (firstErr) throw firstErr
    miembros.value = (m.data ?? []) as Miembro[]
    grupos.value = (g.data ?? []) as GrupoMuscular[]
    equipos.value = (e.data ?? []) as Equipo[]
    ejercicios.value = (x.data ?? []) as Ejercicio[]
  }

  async function cargarSesion(id: string) {
    const [s, a, se] = await Promise.all([
      supabase.from('sesiones').select('*').eq('id', id).maybeSingle(),
      supabase.from('asistencia').select('*').eq('sesion_id', id),
      supabase.from('series').select('*').eq('sesion_id', id),
    ])
    const firstErr = [s, a, se].find((r) => r.error)?.error
    if (firstErr) throw firstErr
    if (s.data) mergeSesion(s.data as Sesion)
    replaceDatosSesion(
      id,
      (a.data ?? []) as Asistencia[],
      ((se.data ?? []) as (Serie & { peso_kg: number | string })[]).map(mapSerie),
    )
    return (s.data as Sesion | null) ?? null
  }

  async function cargarHoy() {
    const today = todayISO()
    const { data, error: err } = await supabase
      .from('sesiones')
      .select('*')
      .eq('fecha', today)
      .order('creado_en', { ascending: false })
      .limit(1)
    if (err) throw err
    const row = (data ?? [])[0] as Sesion | undefined
    if (!row) return
    mergeSesion(row)
    await cargarSesion(row.id)
  }

  async function listarSesiones(pagina = historialPagina.value) {
    historialPagina.value = Math.max(pagina, 0)
    const filtros = historialFiltros.value
    const { data, error: err } = await supabase.rpc('listar_sesiones', {
      p_desde: filtros.desde || null,
      p_hasta: filtros.hasta || null,
      p_grupo_id: filtros.grupoId || null,
      p_offset: historialPagina.value * HISTORIAL_PAGE,
      p_limit: HISTORIAL_PAGE,
    })
    if (err) {
      fail(err.message)
      return
    }
    const payload = data as { total?: number; sesiones?: Sesion[] } | null
    historialTotal.value = payload?.total ?? 0
    historialSesiones.value = payload?.sesiones ?? []
    for (const row of historialSesiones.value) mergeSesion(row)
  }

  async function cargarConsultaSesiones() {
    const { data, error: err } = await supabase.rpc('listar_sesiones', {
      p_desde: null,
      p_hasta: null,
      p_grupo_id: null,
      p_offset: 0,
      p_limit: 40,
    })
    if (err) {
      fail(err.message)
      return
    }
    const payload = data as { sesiones?: Sesion[] } | null
    consultaSesiones.value = payload?.sesiones ?? []
    for (const row of consultaSesiones.value) mergeSesion(row)
  }

  async function fetchSeriesDeMiembro(
    miembroId: string,
    filtros: { grupoId?: string; equipoId?: string; desde?: string; hasta?: string } = {},
  ) {
    const select = filtros.grupoId
      ? '*, sesiones!inner(id, fecha, nota, creado_en), ejercicios!inner(grupo_muscular_id)'
      : '*, sesiones!inner(id, fecha, nota, creado_en)'
    let q = supabase
      .from('series')
      .select(select)
      .eq('miembro_id', miembroId)
      .order('creado_en', { ascending: false })
      .limit(80)
    if (filtros.equipoId) q = q.eq('equipo_id', filtros.equipoId)
    if (filtros.desde) q = q.gte('sesiones.fecha', filtros.desde)
    if (filtros.hasta) q = q.lte('sesiones.fecha', filtros.hasta)
    if (filtros.grupoId) q = q.eq('ejercicios.grupo_muscular_id', filtros.grupoId)
    const { data, error: err } = await q
    if (err) {
      fail(err.message)
      return [] as { sesion: Sesion; series: Serie[] }[]
    }
    type Row = Serie & { peso_kg: number | string; sesiones: Sesion }
    const rows = (data ?? []) as unknown as Row[]
    const bySesion = new Map<string, { sesion: Sesion; series: Serie[] }>()
    for (const row of rows) {
      const mapped = mapSerie(row)
      mergeSesion(row.sesiones)
      const block = bySesion.get(row.sesion_id)
      if (block) block.series.push(mapped)
      else bySesion.set(row.sesion_id, { sesion: row.sesiones, series: [mapped] })
    }
    return [...bySesion.values()].sort((a, b) => {
      if (a.sesion.fecha === b.sesion.fecha) return b.sesion.creado_en.localeCompare(a.sesion.creado_en)
      return b.sesion.fecha.localeCompare(a.sesion.fecha)
    })
  }

  async function refresh() {
    await refreshBase()
    const ids = new Set<string>([
      ...series.value.map((s) => s.sesion_id),
      ...sesiones.value.map((s) => s.id),
    ])
    await cargarHoy()
    await Promise.all([...ids].map((id) => cargarSesion(id)))
    if (historialSesiones.value.length || historialFiltros.value.grupoId || historialFiltros.value.desde) {
      await listarSesiones()
    }
  }

  function stopRealtime() {
    if (refreshTimer) clearTimeout(refreshTimer)
    if (canal) {
      supabase.removeChannel(canal)
      canal = null
    }
    enVivo.value = false
  }

  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      refresh().catch((err) => fail(err instanceof Error ? err.message : 'Error al sincronizar'))
    }, 160)
  }

  function listenRealtime() {
    stopRealtime()
    const tablas = [
      'sesiones',
      'asistencia',
      'series',
      'ejercicios',
      'equipos',
      'grupos_musculares',
      'miembros',
    ] as const
    const ch = supabase.channel('fitcheck-live')
    for (const table of tablas) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh)
    }
    canal = ch.subscribe((status) => {
      enVivo.value = status === 'SUBSCRIBED'
    })
  }

  async function reset() {
    stopRealtime()
    miembros.value = []
    sesiones.value = []
    asistencia.value = []
    grupos.value = []
    equipos.value = []
    ejercicios.value = []
    series.value = []
    historialSesiones.value = []
    historialTotal.value = 0
    historialPagina.value = 0
    historialFiltros.value = { desde: '', hasta: '', grupoId: '' }
    consultaSesiones.value = []
    error.value = ''
    listo.value = false
  }

  async function load() {
    if (!auth.user) {
      reset()
      listo.value = true
      return
    }
    error.value = ''
    try {
      await ensureMiembro()
      await seedCatalogIfEmpty()
      await refreshBase()
      await cargarHoy()
      listenRealtime()
    } catch (err) {
      fail(err instanceof Error ? err.message : 'No se pudo cargar FitCheck')
    } finally {
      listo.value = true
    }
  }

  async function crearEquipo(nombre: string, descripcion = '') {
    const { data, error: err } = await supabase
      .from('equipos')
      .insert({ nombre: nombre.trim(), descripcion: descripcion.trim() || null })
      .select()
      .single()
    if (err || !data) {
      fail(esNombreDuplicado(err) ? mensajeDuplicado(nombre) : (err?.message ?? 'No se pudo crear el equipo'))
      return
    }
    equipos.value.push(data as Equipo)
  }

  async function crearEjercicio(nombre: string, grupoMuscularId: string) {
    const { data, error: err } = await supabase
      .from('ejercicios')
      .insert({ nombre: nombre.trim(), grupo_muscular_id: grupoMuscularId })
      .select()
      .single()
    if (err || !data) {
      fail(esNombreDuplicado(err) ? mensajeDuplicado(nombre) : (err?.message ?? 'No se pudo crear el ejercicio'))
      return
    }
    ejercicios.value.push(data as Ejercicio)
  }

  async function crearGrupo(nombre: string) {
    const { data, error: err } = await supabase
      .from('grupos_musculares')
      .insert({ nombre: nombre.trim() })
      .select()
      .single()
    if (err || !data) {
      fail(esNombreDuplicado(err) ? mensajeDuplicado(nombre) : (err?.message ?? 'No se pudo crear el grupo muscular'))
      return
    }
    grupos.value.push(data as GrupoMuscular)
  }

  function grupoEnUso(id: string) {
    return ejercicios.value.some((e) => e.grupo_muscular_id === id)
  }

  async function serieUsa(columna: 'equipo_id' | 'ejercicio_id', id: string) {
    const { count, error: err } = await supabase
      .from('series')
      .select('id', { count: 'exact', head: true })
      .eq(columna, id)
    if (err) {
      fail(err.message)
      return true
    }
    return (count ?? 0) > 0
  }

  async function editarEquipo(id: string, nombre: string, descripcion = '') {
    const { error: err } = await supabase
      .from('equipos')
      .update({ nombre: nombre.trim(), descripcion: descripcion.trim() || null })
      .eq('id', id)
    if (err) {
      fail(esNombreDuplicado(err) ? mensajeDuplicado(nombre) : err.message)
      return
    }
    const row = equipos.value.find((e) => e.id === id)
    if (row) {
      row.nombre = nombre.trim()
      row.descripcion = descripcion.trim() || null
    }
  }

  async function borrarFilaCatalogo(
    tabla: 'equipos' | 'ejercicios' | 'grupos_musculares',
    id: string,
  ): Promise<boolean> {
    const { data, error: err } = await supabase.from(tabla).delete().eq('id', id).select('id')
    if (err) {
      fail(esRestriccionUso(err) ? mensajeCatalogoEnUso(tabla, id) : err.message)
      return false
    }
    // Sin política DELETE, PostgREST responde 200 y 0 filas: la app creía que se borró.
    if (!data?.length) {
      fail(
        'Supabase no dejó borrar el catálogo. En el SQL Editor ejecuta supabase/catalogo_delete.sql.',
      )
      return false
    }
    return true
  }

  async function borrarEquipo(id: string) {
    if (await serieUsa('equipo_id', id)) {
      fail(mensajeCatalogoEnUso('equipos', id))
      return
    }
    if (!(await borrarFilaCatalogo('equipos', id))) return
    limpiarError()
    equipos.value = equipos.value.filter((e) => e.id !== id)
  }

  async function editarEjercicio(id: string, nombre: string, grupoMuscularId: string) {
    const { error: err } = await supabase
      .from('ejercicios')
      .update({ nombre: nombre.trim(), grupo_muscular_id: grupoMuscularId })
      .eq('id', id)
    if (err) {
      fail(esNombreDuplicado(err) ? mensajeDuplicado(nombre) : err.message)
      return
    }
    const row = ejercicios.value.find((e) => e.id === id)
    if (row) {
      row.nombre = nombre.trim()
      row.grupo_muscular_id = grupoMuscularId
    }
  }

  async function borrarEjercicio(id: string) {
    if (await serieUsa('ejercicio_id', id)) {
      fail(mensajeCatalogoEnUso('ejercicios', id))
      return
    }
    if (!(await borrarFilaCatalogo('ejercicios', id))) return
    limpiarError()
    ejercicios.value = ejercicios.value.filter((e) => e.id !== id)
  }

  async function editarGrupo(id: string, nombre: string) {
    const { error: err } = await supabase
      .from('grupos_musculares')
      .update({ nombre: nombre.trim() })
      .eq('id', id)
    if (err) {
      fail(esNombreDuplicado(err) ? mensajeDuplicado(nombre) : err.message)
      return
    }
    const row = grupos.value.find((g) => g.id === id)
    if (row) row.nombre = nombre.trim()
  }

  async function borrarGrupo(id: string) {
    if (grupoEnUso(id)) {
      fail(mensajeCatalogoEnUso('grupos_musculares', id))
      return
    }
    if (!(await borrarFilaCatalogo('grupos_musculares', id))) return
    limpiarError()
    grupos.value = grupos.value.filter((g) => g.id !== id)
  }

  function sesionPorId(id: string): Sesion | undefined {
    return sesiones.value.find((s) => s.id === id)
  }

  async function crearSesion(fecha: string, nota: string) {
    const mid = miembroActivoId.value
    if (!mid) return
    const { data, error: err } = await supabase
      .from('sesiones')
      .insert({ fecha, nota: nota.trim() || null })
      .select()
      .single()
    if (err || !data) {
      fail(err?.message ?? 'No se pudo crear la sesión')
      return
    }
    sesiones.value.push(data as Sesion)
    const { data: asis, error: aErr } = await supabase
      .from('asistencia')
      .insert({ sesion_id: data.id, miembro_id: mid, presente: true })
      .select()
      .single()
    if (aErr) {
      fail(aErr.message)
      return
    }
    if (asis) asistencia.value.push(asis as Asistencia)
  }

  async function marcarAsistencia(sesionId: string, presente: boolean, miembroId?: string) {
    const mid = miembroId ?? miembroActivoId.value
    if (!mid) return
    const existing = asistencia.value.find((a) => a.sesion_id === sesionId && a.miembro_id === mid)
    if (existing) {
      if (existing.presente === presente) return
      const { error: err } = await supabase.from('asistencia').update({ presente }).eq('id', existing.id)
      if (err) {
        fail(err.message)
        return
      }
      existing.presente = presente
      return
    }
    const { data, error: err } = await supabase
      .from('asistencia')
      .insert({ sesion_id: sesionId, miembro_id: mid, presente })
      .select()
      .single()
    if (err || !data) {
      fail(err?.message ?? 'No se pudo marcar asistencia')
      return
    }
    asistencia.value.push(data as Asistencia)
  }

  function asistenciaDe(sesionId: string): Asistencia[] {
    return asistencia.value.filter((a) => a.sesion_id === sesionId)
  }

  function seriesDe(sesionId: string, miembroId?: string): Serie[] {
    return series.value
      .filter((s) => s.sesion_id === sesionId && (!miembroId || s.miembro_id === miembroId))
      .sort((a, b) => {
        if (a.ejercicio_id !== b.ejercicio_id) return a.ejercicio_id.localeCompare(b.ejercicio_id)
        return a.numero_serie - b.numero_serie
      })
  }

  function ultimaSerieDe(sesionId: string, miembroId?: string): Serie | undefined {
    const mid = miembroId ?? miembroActivoId.value
    if (!mid) return undefined
    return series.value
      .filter((s) => s.sesion_id === sesionId && s.miembro_id === mid)
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en))[0]
  }

  function siguienteNumero(sesionId: string, miembroId: string, ejercicioId: string): number {
    const nums = series.value
      .filter(
        (s) =>
          s.sesion_id === sesionId && s.miembro_id === miembroId && s.ejercicio_id === ejercicioId,
      )
      .map((s) => s.numero_serie)
    return nums.length ? Math.max(...nums) + 1 : 1
  }

  async function persistNumeros(sesionId: string, miembroId: string, ejercicioId: string) {
    const grupo = series.value
      .filter(
        (s) =>
          s.sesion_id === sesionId && s.miembro_id === miembroId && s.ejercicio_id === ejercicioId,
      )
      .sort((a, b) => a.numero_serie - b.numero_serie)
    await Promise.all(
      grupo.map((row, index) => {
        row.numero_serie = index + 1
        return supabase.from('series').update({ numero_serie: index + 1 }).eq('id', row.id)
      }),
    )
  }

  async function guardarSerie(input: {
    sesionId: string
    miembroId?: string
    ejercicioId: string
    equipoId: string
    repeticiones: number
    pesoKg: number
    nota: string
  }) {
    const mid = input.miembroId ?? miembroActivoId.value
    if (!mid) return
    const { data, error: err } = await supabase
      .from('series')
      .insert({
        sesion_id: input.sesionId,
        miembro_id: mid,
        ejercicio_id: input.ejercicioId,
        equipo_id: input.equipoId,
        numero_serie: siguienteNumero(input.sesionId, mid, input.ejercicioId),
        repeticiones: input.repeticiones,
        peso_kg: input.pesoKg,
        nota: input.nota.trim() || null,
      })
      .select()
      .single()
    if (err || !data) {
      fail(err?.message ?? 'No se pudo guardar la serie')
      return
    }
    series.value.push(mapSerie(data as Serie & { peso_kg: number | string }))
    await marcarAsistencia(input.sesionId, true, mid)
  }

  async function editarSerie(
    id: string,
    patch: {
      ejercicioId: string
      equipoId: string
      repeticiones: number
      pesoKg: number
      nota: string
    },
  ) {
    const serie = series.value.find((s) => s.id === id)
    if (!serie) return
    const oldEj = serie.ejercicio_id
    let numero = serie.numero_serie
    if (oldEj !== patch.ejercicioId) {
      numero = siguienteNumero(serie.sesion_id, serie.miembro_id, patch.ejercicioId)
    }
    const { error: err } = await supabase
      .from('series')
      .update({
        ejercicio_id: patch.ejercicioId,
        equipo_id: patch.equipoId,
        repeticiones: patch.repeticiones,
        peso_kg: patch.pesoKg,
        nota: patch.nota.trim() || null,
        numero_serie: numero,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
    if (err) {
      fail(err.message)
      return
    }
    serie.ejercicio_id = patch.ejercicioId
    serie.equipo_id = patch.equipoId
    serie.repeticiones = patch.repeticiones
    serie.peso_kg = patch.pesoKg
    serie.nota = patch.nota.trim() || null
    serie.numero_serie = numero
    if (oldEj !== patch.ejercicioId) await persistNumeros(serie.sesion_id, serie.miembro_id, oldEj)
  }

  async function borrarSerie(id: string) {
    const serie = series.value.find((s) => s.id === id)
    if (!serie) return
    const { error: err } = await supabase.from('series').delete().eq('id', id)
    if (err) {
      fail(err.message)
      return
    }
    series.value = series.value.filter((s) => s.id !== id)
    await persistNumeros(serie.sesion_id, serie.miembro_id, serie.ejercicio_id)
  }

  function ausentesDe(sesionId: string) {
    return miembros.value.filter((m) =>
      asistencia.value.some((a) => a.sesion_id === sesionId && a.miembro_id === m.id && !a.presente),
    )
  }

  function sinMarcarDe(sesionId: string) {
    return miembros.value.filter(
      (m) => !asistencia.value.some((a) => a.sesion_id === sesionId && a.miembro_id === m.id),
    )
  }

  function presentesDe(sesionId: string) {
    return miembros.value.filter((m) =>
      asistencia.value.some((a) => a.sesion_id === sesionId && a.miembro_id === m.id && a.presente),
    )
  }

  function noUsaronEquipo(sesionId: string, equipoId: string) {
    return presentesDe(sesionId).filter(
      (m) =>
        !series.value.some(
          (s) => s.sesion_id === sesionId && s.miembro_id === m.id && s.equipo_id === equipoId,
        ),
    )
  }

  function seriesAgrupadasPorMiembro(sesionId: string) {
    const mid = miembroActivoId.value
    const porId = new Map<string, Serie[]>()
    for (const s of seriesDe(sesionId)) {
      const list = porId.get(s.miembro_id) ?? []
      list.push(s)
      porId.set(s.miembro_id, list)
    }
    if (mid && !porId.has(mid)) porId.set(mid, [])

    const rows = [...porId.entries()]
      .map(([id, list]) => {
        const miembro = miembros.value.find((m) => m.id === id)
        if (!miembro) return null
        return { miembro, series: list, propio: id === mid }
      })
      .filter((row): row is { miembro: Miembro; series: Serie[]; propio: boolean } => row !== null)

    rows.sort((a, b) => {
      if (a.propio !== b.propio) return a.propio ? -1 : 1
      return a.miembro.nombre.localeCompare(b.miembro.nombre, 'es')
    })
    return rows
  }

  function seriesDeMiembro(
    miembroId: string,
    filtros: { grupoId?: string; equipoId?: string; desde?: string; hasta?: string } = {},
  ) {
    const fechaDe = (sesionId: string) => sesionPorId(sesionId)?.fecha ?? ''
    return series.value
      .filter((s) => {
        if (s.miembro_id !== miembroId) return false
        if (filtros.equipoId && s.equipo_id !== filtros.equipoId) return false
        if (filtros.grupoId) {
          const ej = ejercicios.value.find((e) => e.id === s.ejercicio_id)
          if (ej?.grupo_muscular_id !== filtros.grupoId) return false
        }
        const fecha = fechaDe(s.sesion_id)
        if (filtros.desde && fecha < filtros.desde) return false
        if (filtros.hasta && fecha > filtros.hasta) return false
        return true
      })
      .sort((a, b) => {
        const fa = fechaDe(a.sesion_id)
        const fb = fechaDe(b.sesion_id)
        if (fa !== fb) return fb.localeCompare(fa)
        if (a.sesion_id !== b.sesion_id) return b.sesion_id.localeCompare(a.sesion_id)
        if (a.ejercicio_id !== b.ejercicio_id) return a.ejercicio_id.localeCompare(b.ejercicio_id)
        return a.numero_serie - b.numero_serie
      })
  }

  const miembrosOrdenados = computed(() =>
    [...miembros.value].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  )

  return {
    miembros,
    sesiones,
    asistencia,
    grupos,
    equipos,
    ejercicios,
    series,
    historialSesiones,
    historialTotal,
    historialPagina,
    historialFiltros,
    consultaSesiones,
    error,
    limpiarError,
    listo,
    enVivo,
    miembroActivoId,
    miembroActivo,
    sesionDeHoy,
    sesionesOrdenadas,
    grupoDeEjercicio,
    load,
    reset,
    refresh,
    listarSesiones,
    cargarSesion,
    cargarConsultaSesiones,
    fetchSeriesDeMiembro,
    crearSesion,
    sesionPorId,
    marcarAsistencia,
    asistenciaDe,
    seriesDe,
    ultimaSerieDe,
    guardarSerie,
    editarSerie,
    borrarSerie,
    crearEquipo,
    crearEjercicio,
    crearGrupo,
    editarEquipo,
    borrarEquipo,
    editarEjercicio,
    borrarEjercicio,
    editarGrupo,
    borrarGrupo,
    ausentesDe,
    sinMarcarDe,
    presentesDe,
    noUsaronEquipo,
    seriesAgrupadasPorMiembro,
    seriesDeMiembro,
    miembrosOrdenados,
  }
})
