export type Miembro = {
  id: string
  nombre: string
  usuario: string
  email: string
  creado_en: string
}

export type Sesion = {
  id: string
  fecha: string
  nota: string | null
  creado_en: string
}

export type Asistencia = {
  id: string
  sesion_id: string
  miembro_id: string
  presente: boolean
}

export type GrupoMuscular = {
  id: string
  nombre: string
}

export type Equipo = {
  id: string
  nombre: string
  descripcion: string | null
}

export type Ejercicio = {
  id: string
  nombre: string
  grupo_muscular_id: string
}

export type Serie = {
  id: string
  sesion_id: string
  miembro_id: string
  ejercicio_id: string
  equipo_id: string
  numero_serie: number
  repeticiones: number
  peso_kg: number
  nota: string | null
  creado_en: string
  actualizado_en: string
}

export type FitcheckDB = {
  miembros: Miembro[]
  sesiones: Sesion[]
  asistencia: Asistencia[]
  grupos: GrupoMuscular[]
  equipos: Equipo[]
  ejercicios: Ejercicio[]
  series: Serie[]
  miembroActivoId: string | null
}
