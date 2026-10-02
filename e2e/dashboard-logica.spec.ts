import { test, expect } from '@playwright/test'
import {
  calcularProgreso,
  calcularVolumen,
  formatMedida,
  maxVolumen,
  pctDe,
  textoCambios,
  type SerieVentana,
} from '../src/lib/dashboard'
import { ventanaDashboard } from '../src/lib/ids'

const miembros = [
  { id: 'm-silvio', nombre: 'Silvio' },
  { id: 'm-armando', nombre: 'Armando' },
]
const ejercicios = [
  { id: 'e-press', nombre: 'Press banca' },
  { id: 'e-remo', nombre: 'Remo con barra' },
  { id: 'e-sentadilla', nombre: 'Sentadilla' },
]
const grupos = [
  { id: 'g-pecho', nombre: 'Pecho' },
  { id: 'g-espalda', nombre: 'Espalda' },
  { id: 'g-pierna', nombre: 'Pierna' },
  { id: 'g-hombro', nombre: 'Hombro' },
]
const ventana = ventanaDashboard('2026-10-02')

function serie(
  partial: Partial<SerieVentana> & Pick<SerieVentana, 'sesionId' | 'fecha'>,
): SerieVentana {
  return {
    miembroId: 'm-silvio',
    ejercicioId: 'e-press',
    equipoId: 'eq-barra',
    grupoMuscularId: 'g-pecho',
    numeroSerie: 1,
    repeticiones: 8,
    pesoKg: 80,
    creadoEn: `${partial.fecha}T10:00:00.000Z`,
    ...partial,
  }
}

test('ventana lunes a domingo, catorce días', () => {
  expect(ventana.lunes).toBe('2026-09-28')
  expect(ventana.domingo).toBe('2026-10-04')
  expect(ventana.lunesAnterior).toBe('2026-09-21')
  expect(ventana.domingoAnterior).toBe('2026-09-27')
  expect(ventana.desde).toBe('2026-09-21')
  expect(ventana.hasta).toBe('2026-10-04')
  expect(ventanaDashboard('2026-10-04').lunes).toBe('2026-09-28')
  expect(ventanaDashboard('2026-09-28').lunes).toBe('2026-09-28')
  expect(ventanaDashboard('2026-09-27').lunes).toBe('2026-09-21')
})

test('progreso: pesos, serie representativa y solo dos veces', () => {
  const series: SerieVentana[] = [
    serie({
      sesionId: 's-vieja',
      fecha: '2026-09-22',
      pesoKg: 70,
      creadoEn: '2026-09-22T10:00:00.000Z',
    }),
    serie({
      sesionId: 's-media',
      fecha: '2026-09-30',
      pesoKg: 90,
      creadoEn: '2026-09-30T10:00:00.000Z',
    }),
    serie({
      sesionId: 's-ultima',
      fecha: '2026-10-02',
      pesoKg: 60,
      repeticiones: 12,
      numeroSerie: 1,
      equipoId: 'eq-maquina',
      creadoEn: '2026-10-02T18:00:00.000Z',
    }),
    serie({
      sesionId: 's-ultima',
      fecha: '2026-10-02',
      pesoKg: 100,
      repeticiones: 5,
      numeroSerie: 2,
      equipoId: 'eq-barra',
      creadoEn: '2026-10-02T18:00:00.000Z',
    }),
    serie({
      sesionId: 's-ultima',
      fecha: '2026-10-02',
      pesoKg: 100,
      repeticiones: 5,
      numeroSerie: 3,
      equipoId: 'eq-barra',
      creadoEn: '2026-10-02T18:00:00.000Z',
    }),
  ]
  const resultado = calcularProgreso(series, miembros, ejercicios, null)
  expect(resultado.cambios).toHaveLength(1)
  const tarjeta = resultado.cambios[0].tarjetas[0]
  expect(tarjeta.etiqueta).toBe('subio')
  expect(tarjeta.barras).toHaveLength(2)
  expect(tarjeta.barras[0].pesoKg).toBe(100)
  expect(tarjeta.barras[0].repeticiones).toBe(5)
  expect(tarjeta.barras[0].equipoId).toBe('eq-barra')
  expect(tarjeta.barras[0].tono).toBe('accent')
  expect(tarjeta.barras[0].pct).toBe(100)
  expect(tarjeta.barras[1].pesoKg).toBe(90)
  expect(tarjeta.barras[1].tono).toBe('muted')
  expect(tarjeta.barras[1].pct).toBe(90)
  expect(resultado.cambios[0].nombre).toBe('Silvio')
  expect(resultado.cambios.find((b) => b.nombre === 'Armando')).toBeUndefined()
})

test('progreso: 80 y 80.0 no cambian; las reps solas tampoco; bajada', () => {
  const mismo: SerieVentana[] = [
    serie({ sesionId: 'a', fecha: '2026-09-22', pesoKg: 80, repeticiones: 8 }),
    serie({ sesionId: 'b', fecha: '2026-10-02', pesoKg: 80.0, repeticiones: 12 }),
  ]
  const sinCambio = calcularProgreso(mismo, miembros, ejercicios, null)
  expect(sinCambio.cambios).toHaveLength(0)
  expect(textoCambios(sinCambio)).toBe('Nadie cambió de peso en estas dos semanas.')

  const baja = calcularProgreso(
    [
      serie({ sesionId: 'a', fecha: '2026-09-22', pesoKg: 80 }),
      serie({ sesionId: 'b', fecha: '2026-10-02', pesoKg: 70 }),
    ],
    miembros,
    ejercicios,
    null,
  )
  const tarjeta = baja.cambios[0].tarjetas[0]
  expect(tarjeta.etiqueta).toBe('bajo')
  expect(tarjeta.barras[0].tono).toBe('danger')
  expect(tarjeta.barras[0].pct).toBe(87.5)
  expect(tarjeta.barras[1].tono).toBe('muted')
  expect(tarjeta.barras[1].pct).toBe(100)
})

test('progreso: mismo día ordena por creado_en y el fijado no se repite', () => {
  const series: SerieVentana[] = [
    serie({
      sesionId: 'manana',
      fecha: '2026-10-02',
      pesoKg: 80,
      creadoEn: '2026-10-02T08:00:00.000Z',
    }),
    serie({
      sesionId: 'noche',
      fecha: '2026-10-02',
      pesoKg: 100,
      creadoEn: '2026-10-02T20:00:00.000Z',
    }),
    serie({
      sesionId: 'remo-antes',
      fecha: '2026-09-25',
      ejercicioId: 'e-remo',
      grupoMuscularId: 'g-espalda',
      pesoKg: 40,
    }),
    serie({
      sesionId: 'remo-ahora',
      fecha: '2026-10-03',
      ejercicioId: 'e-remo',
      grupoMuscularId: 'g-espalda',
      pesoKg: 50,
    }),
  ]
  const resultado = calcularProgreso(series, miembros, ejercicios, 'e-press')
  expect(resultado.fijado).toHaveLength(2)
  const silvio = resultado.fijado!.find((b) => b.nombre === 'Silvio')!
  const armando = resultado.fijado!.find((b) => b.nombre === 'Armando')!
  expect(silvio.tarjeta?.etiqueta).toBe('subio')
  expect(silvio.tarjeta?.barras[0].pesoKg).toBe(100)
  expect(silvio.tarjeta?.barras[1].pesoKg).toBe(80)
  expect(armando.tarjeta).toBeNull()
  expect(resultado.cambios.map((b) => b.tarjetas.map((t) => t.ejercicioId)).flat()).toEqual([
    'e-remo',
  ])
  expect(textoCambios(calcularProgreso(series.slice(0, 2), miembros, ejercicios, 'e-press'))).toBe(
    'Ningún otro ejercicio cambió de peso en estas dos semanas.',
  )
})

test('progreso: una sola vez y mismo peso en el fijado', () => {
  const una = calcularProgreso(
    [serie({ sesionId: 'solo', fecha: '2026-10-01', pesoKg: 82.5 })],
    miembros,
    ejercicios,
    'e-press',
  )
  const tarjetaUna = una.fijado!.find((bloque) => bloque.nombre === 'Silvio')!.tarjeta!
  expect(tarjetaUna.etiqueta).toBe('una')
  expect(tarjetaUna.barras).toHaveLength(1)
  expect(tarjetaUna.barras[0].tono).toBe('muted')
  expect(tarjetaUna.barras[0].pct).toBe(100)
  expect(textoCambios(una)).toBe('Ningún otro ejercicio cambió de peso en estas dos semanas.')

  const mismo = calcularProgreso(
    [
      serie({ sesionId: 'a', fecha: '2026-09-22', pesoKg: 80 }),
      serie({ sesionId: 'b', fecha: '2026-10-02', pesoKg: 80 }),
    ],
    miembros,
    ejercicios,
    'e-press',
  )
  const tarjeta = mismo.fijado!.find((bloque) => bloque.nombre === 'Silvio')!.tarjeta!
  expect(tarjeta.etiqueta).toBe('mismo')
  expect(tarjeta.barras.every((barra) => barra.tono === 'muted')).toBe(true)
  expect(tarjeta.barras.every((barra) => barra.pct === 100)).toBe(true)
})

test('progreso vacío y orden por fecha dentro de la persona', () => {
  const vacio = calcularProgreso([], miembros, ejercicios, 'e-press')
  expect(vacio.haySeries).toBe(false)
  expect(vacio.fijado).toHaveLength(2)
  expect(vacio.fijado!.every((b) => b.tarjeta === null)).toBe(true)
  expect(textoCambios(vacio)).toBe('Nadie cambió de peso en estas dos semanas.')

  const series: SerieVentana[] = [
    serie({ sesionId: 'p1', fecha: '2026-09-22', ejercicioId: 'e-press', pesoKg: 70 }),
    serie({ sesionId: 'p2', fecha: '2026-09-29', ejercicioId: 'e-press', pesoKg: 80 }),
    serie({
      sesionId: 'r1',
      fecha: '2026-09-23',
      ejercicioId: 'e-remo',
      grupoMuscularId: 'g-espalda',
      pesoKg: 40,
    }),
    serie({
      sesionId: 'r2',
      fecha: '2026-10-02',
      ejercicioId: 'e-remo',
      grupoMuscularId: 'g-espalda',
      pesoKg: 50,
    }),
  ]
  const cambios = calcularProgreso(series, miembros, ejercicios, null).cambios[0].tarjetas
  expect(cambios.map((t) => t.ejercicioId)).toEqual(['e-remo', 'e-press'])
})

test('volumen: suma, escala común, ceros y fecha futura', () => {
  const series: SerieVentana[] = [
    serie({ sesionId: 'a', fecha: '2026-09-22', repeticiones: 10, pesoKg: 50 }),
    serie({ sesionId: 'b', fecha: '2026-10-02', repeticiones: 8, pesoKg: 80 }),
    serie({ sesionId: 'c', fecha: '2026-10-02', repeticiones: 8, pesoKg: 80, numeroSerie: 2 }),
    serie({ sesionId: 'd', fecha: '2026-10-04', repeticiones: 5, pesoKg: 20 }),
    serie({
      sesionId: 'e',
      fecha: '2026-09-25',
      ejercicioId: 'e-remo',
      grupoMuscularId: 'g-espalda',
      repeticiones: 5,
      pesoKg: 40,
    }),
    serie({
      sesionId: 'fuera',
      fecha: '2026-09-19',
      repeticiones: 99,
      pesoKg: 99,
    }),
  ]
  const filas = calcularVolumen(series, grupos, ventana)
  expect(filas.map((f) => f.nombre)).toEqual(['Espalda', 'Pecho'])
  const pecho = filas.find((f) => f.nombre === 'Pecho')!
  const espalda = filas.find((f) => f.nombre === 'Espalda')!
  expect(pecho.anterior).toBe(500)
  expect(pecho.curso).toBe(8 * 80 + 8 * 80 + 5 * 20)
  expect(pecho.diferencia).toBe(pecho.curso - pecho.anterior)
  expect(espalda.curso).toBe(0)
  expect(espalda.anterior).toBe(200)
  expect(filas.find((f) => f.nombre === 'Hombro')).toBeUndefined()
  const tope = maxVolumen(filas)
  expect(tope).toBe(pecho.curso)
  expect(pctDe(pecho.curso, tope)).toBe(100)
  expect(pctDe(espalda.anterior, tope)).toBe((200 / pecho.curso) * 100)
  expect(pctDe(0, tope)).toBe(0)
})

test('formato kg·rep en es-ES', () => {
  expect(formatMedida(1000).replace(/\D/g, '')).toBe('1000')
  expect(formatMedida(1000)).not.toMatch(/[.,]\d/)
  expect(formatMedida(12.5)).toMatch(/^12[.,]5$/)
  expect(formatMedida(0)).toBe((0).toLocaleString('es-ES', { maximumFractionDigits: 0 }))
  expect(formatMedida(12.04)).toBe(formatMedida(12))
  expect(formatMedida(-20.5)).toMatch(/20[.,]5/)
})
