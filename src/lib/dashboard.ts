import type { VentanaDashboard } from './ids'

export const EJERCICIO_FIJADO_KEY = 'fitcheck-ejercicio-fijado'

export const TEXTO_DASHBOARD = {
  nadie: 'Nadie cambió de peso en estas dos semanas.',
  ningunOtro: 'Ningún otro ejercicio cambió de peso en estas dos semanas.',
  sinVolumen: 'Sin volumen en estas dos semanas.',
  sinVez: 'Sin vez anterior en estas dos semanas',
  sinDatos: 'Sin datos de este ejercicio en estas dos semanas',
  leyenda: 'tenue = semana anterior, acento = esta semana',
  subio: 'subió',
  bajo: 'bajó',
  mismo: 'mismo peso',
} as const

export type SerieVentana = {
  miembroId: string
  ejercicioId: string
  equipoId: string
  grupoMuscularId: string
  numeroSerie: number
  repeticiones: number
  pesoKg: number
  sesionId: string
  fecha: string
  creadoEn: string
}

export type TonoBarra = 'muted' | 'accent' | 'danger'

export type EtiquetaProgreso = 'subio' | 'bajo' | 'mismo' | 'una'

export type BarraProgreso = {
  pesoKg: number
  repeticiones: number
  fecha: string
  equipoId: string
  tono: TonoBarra
  pct: number
}

export type TarjetaProgreso = {
  ejercicioId: string
  etiqueta: EtiquetaProgreso
  creadoEnUltima: string
  barras: BarraProgreso[]
}

export type BloqueMiembro = {
  miembroId: string
  nombre: string
  tarjetas: TarjetaProgreso[]
}

export type FijadoMiembro = {
  miembroId: string
  nombre: string
  tarjeta: TarjetaProgreso | null
}

export type ResultadoProgreso = {
  haySeries: boolean
  cambios: BloqueMiembro[]
  fijado: FijadoMiembro[] | null
}

export type FilaVolumen = {
  grupoId: string
  nombre: string
  anterior: number
  curso: number
  diferencia: number
}

type Vez = {
  sesionId: string
  fecha: string
  creadoEn: string
  pesoKg: number
  repeticiones: number
  equipoId: string
}

export function formatMedida(n: number): string {
  const signo = n < 0 ? -1 : 1
  const rounded = (Math.round((Math.abs(n) + Number.EPSILON) * 10) / 10) * signo
  const entero = Math.abs(rounded - Math.trunc(rounded)) < 1e-9
  return rounded.toLocaleString('es-ES', {
    minimumFractionDigits: entero ? 0 : 1,
    maximumFractionDigits: 1,
  })
}

export function pesoDistinto(a: number, b: number): boolean {
  return Number(a) !== Number(b)
}

export function pctDe(valor: number, max: number): number {
  if (!(max > 0)) return 0
  return (valor / max) * 100
}

function representativa(rows: SerieVentana[]): SerieVentana {
  return rows.reduce((best, row) => {
    if (row.pesoKg !== best.pesoKg) return row.pesoKg > best.pesoKg ? row : best
    if (row.repeticiones !== best.repeticiones)
      return row.repeticiones > best.repeticiones ? row : best
    return row.numeroSerie > best.numeroSerie ? row : best
  })
}

function dosUltimas(rows: SerieVentana[]): Vez[] {
  const porSesion = new Map<string, SerieVentana[]>()
  for (const row of rows) {
    const grupo = porSesion.get(row.sesionId)
    if (grupo) grupo.push(row)
    else porSesion.set(row.sesionId, [row])
  }
  const veces: Vez[] = []
  for (const [sesionId, series] of porSesion) {
    const rep = representativa(series)
    veces.push({
      sesionId,
      fecha: rep.fecha,
      creadoEn: rep.creadoEn,
      pesoKg: rep.pesoKg,
      repeticiones: rep.repeticiones,
      equipoId: rep.equipoId,
    })
  }
  veces.sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1
    if (a.creadoEn !== b.creadoEn) return a.creadoEn < b.creadoEn ? 1 : -1
    return 0
  })
  return veces.slice(0, 2)
}

function etiquetaDe(veces: Vez[]): EtiquetaProgreso {
  const ultima = veces[0]
  const anterior = veces[1]
  if (!ultima || !anterior) return 'una'
  if (!pesoDistinto(ultima.pesoKg, anterior.pesoKg)) return 'mismo'
  return ultima.pesoKg > anterior.pesoKg ? 'subio' : 'bajo'
}

function barrasDe(veces: Vez[], etiqueta: EtiquetaProgreso): BarraProgreso[] {
  const max = Math.max(...veces.map((vez) => vez.pesoKg))
  return veces.map((vez, index) => {
    let tono: TonoBarra = 'muted'
    if (index === 0 && etiqueta === 'subio') tono = 'accent'
    if (index === 0 && etiqueta === 'bajo') tono = 'danger'
    return {
      pesoKg: vez.pesoKg,
      repeticiones: vez.repeticiones,
      fecha: vez.fecha,
      equipoId: vez.equipoId,
      tono,
      pct: pctDe(vez.pesoKg, max),
    }
  })
}

function tarjetaDe(ejercicioId: string, rows: SerieVentana[]): TarjetaProgreso | null {
  const veces = dosUltimas(rows)
  const ultima = veces[0]
  if (!ultima) return null
  const etiqueta = etiquetaDe(veces)
  return {
    ejercicioId,
    etiqueta,
    creadoEnUltima: ultima.creadoEn,
    barras: barrasDe(veces, etiqueta),
  }
}

function ordenarTarjetas(
  tarjetas: TarjetaProgreso[],
  nombreDe: Map<string, string>,
): TarjetaProgreso[] {
  return [...tarjetas].sort((a, b) => {
    const fa = a.barras[0]?.fecha ?? ''
    const fb = b.barras[0]?.fecha ?? ''
    if (fa !== fb) return fb.localeCompare(fa)
    if (a.creadoEnUltima !== b.creadoEnUltima)
      return b.creadoEnUltima.localeCompare(a.creadoEnUltima)
    return (nombreDe.get(a.ejercicioId) ?? '').localeCompare(
      nombreDe.get(b.ejercicioId) ?? '',
      'es',
    )
  })
}

export function calcularProgreso(
  series: SerieVentana[],
  miembros: { id: string; nombre: string }[],
  ejercicios: { id: string; nombre: string }[],
  fijadoId: string | null,
): ResultadoProgreso {
  const nombreEjercicio = new Map(ejercicios.map((ej) => [ej.id, ej.nombre]))
  const porClave = new Map<string, SerieVentana[]>()
  for (const row of series) {
    const clave = `${row.miembroId}\0${row.ejercicioId}`
    const grupo = porClave.get(clave)
    if (grupo) grupo.push(row)
    else porClave.set(clave, [row])
  }

  const personas = [...miembros].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const cambios: BloqueMiembro[] = []

  for (const miembro of personas) {
    const tarjetas: TarjetaProgreso[] = []
    for (const [clave, rows] of porClave) {
      const [miembroId, ejercicioId] = clave.split('\0')
      if (!ejercicioId || miembroId !== miembro.id) continue
      if (fijadoId && ejercicioId === fijadoId) continue
      const tarjeta = tarjetaDe(ejercicioId, rows)
      if (!tarjeta || (tarjeta.etiqueta !== 'subio' && tarjeta.etiqueta !== 'bajo')) continue
      tarjetas.push(tarjeta)
    }
    const ordenadas = ordenarTarjetas(tarjetas, nombreEjercicio)
    if (ordenadas.length)
      cambios.push({ miembroId: miembro.id, nombre: miembro.nombre, tarjetas: ordenadas })
  }

  let fijado: FijadoMiembro[] | null = null
  if (fijadoId) {
    fijado = personas.map((miembro) => {
      const rows = porClave.get(`${miembro.id}\0${fijadoId}`) ?? []
      return { miembroId: miembro.id, nombre: miembro.nombre, tarjeta: tarjetaDe(fijadoId, rows) }
    })
  }

  return { haySeries: series.length > 0, cambios, fijado }
}

export function textoCambios(resultado: ResultadoProgreso): string | null {
  if (resultado.cambios.length) return null
  if (resultado.haySeries && resultado.fijado) return TEXTO_DASHBOARD.ningunOtro
  return TEXTO_DASHBOARD.nadie
}

export function calcularVolumen(
  series: SerieVentana[],
  grupos: { id: string; nombre: string }[],
  ventana: Pick<VentanaDashboard, 'lunes' | 'domingo' | 'lunesAnterior' | 'domingoAnterior'>,
): FilaVolumen[] {
  const nombreDe = new Map(grupos.map((grupo) => [grupo.id, grupo.nombre]))
  const sumas = new Map<string, { anterior: number; curso: number }>()
  for (const row of series) {
    const enCurso = row.fecha >= ventana.lunes && row.fecha <= ventana.domingo
    const anterior = row.fecha >= ventana.lunesAnterior && row.fecha <= ventana.domingoAnterior
    if (!enCurso && !anterior) continue
    const acc = sumas.get(row.grupoMuscularId) ?? { anterior: 0, curso: 0 }
    const producto = row.repeticiones * row.pesoKg
    if (enCurso) acc.curso += producto
    else acc.anterior += producto
    sumas.set(row.grupoMuscularId, acc)
  }
  return [...sumas.entries()]
    .map(([grupoId, acc]) => ({
      grupoId,
      nombre: nombreDe.get(grupoId) ?? 'Grupo',
      anterior: acc.anterior,
      curso: acc.curso,
      diferencia: acc.curso - acc.anterior,
    }))
    .filter((fila) => fila.anterior > 0 || fila.curso > 0)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function maxVolumen(filas: FilaVolumen[]): number {
  return filas.reduce((max, fila) => Math.max(max, fila.anterior, fila.curso), 0)
}
