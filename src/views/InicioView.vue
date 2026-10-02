<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EJERCICIO_FIJADO_KEY,
  TEXTO_DASHBOARD,
  calcularProgreso,
  calcularVolumen,
  formatMedida,
  maxVolumen,
  pctDe,
  textoCambios,
  type BarraProgreso,
  type EtiquetaProgreso,
  type FilaVolumen,
  type TarjetaProgreso,
  type TonoBarra,
} from '@/lib/dashboard'
import { formatFecha, todayISO, ventanaDashboard } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const gym = useFitcheckStore()
const router = useRouter()
const yendo = ref(false)
const pinGuardado = ref(localStorage.getItem(EJERCICIO_FIJADO_KEY) ?? '')

const ventana = computed(() => gym.ventanaActiva ?? ventanaDashboard())
const rango = computed(
  () => `${formatFecha(ventana.value.lunes)} – ${formatFecha(ventana.value.domingo)}`,
)

const ejerciciosOrdenados = computed(() =>
  [...gym.ejercicios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
)

const pinEfectivo = computed(() => {
  if (!pinGuardado.value) return null
  return gym.ejercicios.find((ej) => ej.id === pinGuardado.value) ?? null
})

const progreso = computed(() =>
  calcularProgreso(gym.seriesVentana, gym.miembros, gym.ejercicios, pinEfectivo.value?.id ?? null),
)

const fraseCambios = computed(() => textoCambios(progreso.value))

const filasVolumen = computed(() => calcularVolumen(gym.seriesVentana, gym.grupos, ventana.value))
const topeVolumen = computed(() => maxVolumen(filasVolumen.value))

function fijar(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (!id) localStorage.removeItem(EJERCICIO_FIJADO_KEY)
  else localStorage.setItem(EJERCICIO_FIJADO_KEY, id)
  pinGuardado.value = id
}

async function anotarHoy() {
  if (yendo.value) return
  yendo.value = true
  try {
    await gym.seleccionarFecha(todayISO())
    await router.push({ name: 'hoy' })
  } finally {
    yendo.value = false
  }
}

function nombreEquipo(id: string): string {
  return gym.equipos.find((equipo) => equipo.id === id)?.nombre ?? 'equipo'
}

function nombreEjercicio(id: string): string {
  return gym.ejercicios.find((ej) => ej.id === id)?.nombre ?? 'ejercicio'
}

function fechaCorta(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function cifraBarra(barra: BarraProgreso): string {
  return `${formatMedida(barra.pesoKg)} kg · ${barra.repeticiones} · ${fechaCorta(barra.fecha)}`
}

function equiposDe(tarjeta: TarjetaProgreso): string[] {
  const nombres = tarjeta.barras.map((barra) => nombreEquipo(barra.equipoId))
  const [primero, segundo] = nombres
  if (primero && segundo && primero === segundo) return [primero]
  return nombres
}

function rotulo(etiqueta: EtiquetaProgreso): string | null {
  if (etiqueta === 'subio') return TEXTO_DASHBOARD.subio
  if (etiqueta === 'bajo') return TEXTO_DASHBOARD.bajo
  if (etiqueta === 'mismo') return TEXTO_DASHBOARD.mismo
  return null
}

function claseRotulo(etiqueta: EtiquetaProgreso): string {
  if (etiqueta === 'subio') return 'text-accent'
  if (etiqueta === 'bajo') return 'text-danger'
  return 'text-muted-foreground'
}

function colorBarra(tono: TonoBarra): string {
  if (tono === 'accent') return 'var(--accent)'
  if (tono === 'danger') return 'var(--danger)'
  return 'var(--text-muted)'
}

function claseDiferencia(fila: FilaVolumen): string {
  if (fila.diferencia > 0) return 'text-success'
  if (fila.diferencia < 0) return 'text-danger'
  return 'text-muted-foreground'
}
</script>

<template>
  <section class="grid gap-4 pb-2" data-testid="dashboard">
    <header class="grid gap-3">
      <div>
        <p class="m-0 text-xs font-bold tracking-wide text-accent uppercase">Semana</p>
        <h1>Inicio</h1>
        <p class="m-0 leading-snug text-muted-foreground">{{ rango }}</p>
      </div>
      <button class="btn-primary" type="button" :disabled="yendo" @click="anotarHoy">
        Anotar hoy
      </button>
    </header>

    <article v-if="!gym.listo" class="card">
      <p class="m-0 text-muted-foreground">Sincronizando con Supabase…</p>
    </article>

    <template v-else>
      <section class="grid gap-3" aria-labelledby="progreso-titulo">
        <h2 id="progreso-titulo">Progreso</h2>
        <label class="field" for="fijar-ejercicio">
          Fijar ejercicio
          <select
            id="fijar-ejercicio"
            :value="pinEfectivo?.id ?? ''"
            :disabled="gym.ejercicios.length === 0"
            @change="fijar"
          >
            <option v-if="gym.ejercicios.length > 0" value="">Sin fijar</option>
            <option v-for="ej in ejerciciosOrdenados" :key="ej.id" :value="ej.id">
              {{ ej.nombre }}
            </option>
          </select>
        </label>

        <article v-for="bloque in progreso.fijado ?? []" :key="bloque.miembroId" class="card">
          <h3>{{ bloque.nombre }}</h3>
          <p v-if="!bloque.tarjeta" class="m-0 text-muted-foreground">
            {{ TEXTO_DASHBOARD.sinDatos }}
          </p>
          <template v-else>
            <div>
              <p class="m-0 font-bold">{{ nombreEjercicio(bloque.tarjeta.ejercicioId) }}</p>
              <p
                v-for="(equipo, indice) in equiposDe(bloque.tarjeta)"
                :key="indice"
                class="m-0 text-sm text-muted-foreground"
              >
                {{ equipo }}
              </p>
            </div>
            <div
              v-for="(barra, indice) in bloque.tarjeta.barras"
              :key="indice"
              class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
              data-testid="barra-progreso"
              :data-tono="barra.tono"
            >
              <div class="h-3 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
                <div
                  class="h-full rounded-sm"
                  :style="{ width: `${barra.pct}%`, background: colorBarra(barra.tono) }"
                />
              </div>
              <p class="tabular m-0 text-sm">{{ cifraBarra(barra) }}</p>
            </div>
            <p
              v-if="rotulo(bloque.tarjeta.etiqueta)"
              class="m-0 text-sm font-bold"
              :class="claseRotulo(bloque.tarjeta.etiqueta)"
            >
              {{ rotulo(bloque.tarjeta.etiqueta) }}
            </p>
            <p v-if="bloque.tarjeta.etiqueta === 'una'" class="m-0 text-sm text-muted-foreground">
              {{ TEXTO_DASHBOARD.sinVez }}
            </p>
          </template>
        </article>

        <p v-if="fraseCambios" class="m-0 text-muted-foreground">{{ fraseCambios }}</p>
        <article
          v-for="bloque in progreso.cambios"
          :key="bloque.miembroId"
          class="card"
          data-testid="progreso-cambio"
        >
          <h3>{{ bloque.nombre }}</h3>
          <div
            v-for="tarjeta in bloque.tarjetas"
            :key="tarjeta.ejercicioId"
            class="grid gap-2"
            data-testid="progreso-tarjeta"
          >
            <div>
              <p class="m-0 font-bold">{{ nombreEjercicio(tarjeta.ejercicioId) }}</p>
              <p
                v-for="(equipo, indice) in equiposDe(tarjeta)"
                :key="indice"
                class="m-0 text-sm text-muted-foreground"
              >
                {{ equipo }}
              </p>
            </div>
            <div
              v-for="(barra, indice) in tarjeta.barras"
              :key="indice"
              class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
              data-testid="barra-progreso"
              :data-tono="barra.tono"
            >
              <div class="h-3 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
                <div
                  class="h-full rounded-sm"
                  :style="{ width: `${barra.pct}%`, background: colorBarra(barra.tono) }"
                />
              </div>
              <p class="tabular m-0 text-sm">{{ cifraBarra(barra) }}</p>
            </div>
            <p
              v-if="rotulo(tarjeta.etiqueta)"
              class="m-0 text-sm font-bold"
              :class="claseRotulo(tarjeta.etiqueta)"
            >
              {{ rotulo(tarjeta.etiqueta) }}
            </p>
          </div>
        </article>
      </section>

      <section class="grid gap-3" aria-labelledby="volumen-titulo">
        <div>
          <h2 id="volumen-titulo">Volumen</h2>
          <p v-if="filasVolumen.length" class="m-0 mt-1 text-sm text-muted-foreground">
            {{ TEXTO_DASHBOARD.leyenda }}
          </p>
        </div>
        <p v-if="!filasVolumen.length" class="m-0 text-muted-foreground">
          {{ TEXTO_DASHBOARD.sinVolumen }}
        </p>
        <article
          v-for="fila in filasVolumen"
          :key="fila.grupoId"
          class="card"
          data-testid="volumen-grupo"
        >
          <div class="flex items-baseline justify-between gap-3">
            <h3>{{ fila.nombre }}</h3>
            <p class="tabular m-0 font-bold" :class="claseDiferencia(fila)">
              {{ formatMedida(fila.diferencia) }} kg·rep
            </p>
          </div>
          <div
            class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
            data-testid="barra-volumen"
            data-semana="curso"
          >
            <div class="h-3 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
              <div
                class="h-full rounded-sm"
                :style="{
                  width: `${pctDe(fila.curso, topeVolumen)}%`,
                  background: 'var(--accent)',
                }"
              />
            </div>
            <p class="tabular m-0 text-sm">{{ formatMedida(fila.curso) }} kg·rep</p>
          </div>
          <div
            class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
            data-testid="barra-volumen"
            data-semana="anterior"
          >
            <div class="h-3 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
              <div
                class="h-full rounded-sm"
                :style="{
                  width: `${pctDe(fila.anterior, topeVolumen)}%`,
                  background: 'var(--text-muted)',
                }"
              />
            </div>
            <p class="tabular m-0 text-sm">{{ formatMedida(fila.anterior) }} kg·rep</p>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>
