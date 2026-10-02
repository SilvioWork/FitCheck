export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export type VentanaDashboard = {
  lunes: string
  domingo: string
  lunesAnterior: string
  domingoAnterior: string
  desde: string
  hasta: string
}

export function lunesDeSemanaISO(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  const dow = new Date(year, month - 1, day).getDay()
  const back = dow === 0 ? 6 : dow - 1
  return addDaysISO(isoDate, -back)
}

export function ventanaDashboard(hoy = todayISO()): VentanaDashboard {
  const lunes = lunesDeSemanaISO(hoy)
  const domingo = addDaysISO(lunes, 6)
  const lunesAnterior = addDaysISO(lunes, -7)
  const domingoAnterior = addDaysISO(lunes, -1)
  return { lunes, domingo, lunesAnterior, domingoAnterior, desde: lunesAnterior, hasta: domingo }
}

export function addDaysISO(isoDate: string, n: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function formatFecha(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
