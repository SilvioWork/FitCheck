<script setup lang="ts">
import { computed, ref } from 'vue'
import AsistenciaList from '@/components/AsistenciaList.vue'
import RegistroSeries from '@/components/RegistroSeries.vue'
import { addDaysISO, formatFecha, todayISO } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const gym = useFitcheckStore()
const nota = ref('')
const cambiando = ref(false)

const sesion = computed(() => gym.sesionDeFecha)
const esHoy = computed(() => gym.fechaActiva === todayISO())
const titulo = computed(() => (esHoy.value ? 'Hoy' : formatFecha(gym.fechaActiva)))

async function cambiarFecha(fecha: string) {
  if (!fecha || fecha === gym.fechaActiva || cambiando.value) return
  cambiando.value = true
  try {
    await gym.seleccionarFecha(fecha)
  } finally {
    cambiando.value = false
  }
}

function onFechaInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  void cambiarFecha(value)
}

function diaAnterior() {
  void cambiarFecha(addDaysISO(gym.fechaActiva, -1))
}

function diaSiguiente() {
  void cambiarFecha(addDaysISO(gym.fechaActiva, 1))
}

function irAHoy() {
  void cambiarFecha(todayISO())
}

async function crearSesion() {
  await gym.crearSesion(gym.fechaActiva, nota.value)
  nota.value = ''
}
</script>

<template>
  <section class="page">
    <header class="header">
      <p class="eyebrow">Sesión</p>
      <h1>{{ titulo }}</h1>
      <p class="lede">
        {{
          gym.miembroActivo
            ? `Entraste como ${gym.miembroActivo.nombre}. Puedes anotar a cualquiera.`
            : 'Cargando perfil…'
        }}
        <span v-if="gym.enVivo"> · En vivo</span>
      </p>
    </header>

    <div class="fecha-bar" role="group" aria-label="Fecha de la sesión">
      <label class="fecha-label" for="fecha-sesion">Fecha</label>
      <div class="fecha-row">
        <button
          class="fecha-step"
          type="button"
          aria-label="Día anterior"
          :disabled="cambiando"
          @click="diaAnterior"
        >
          ‹
        </button>
        <div class="fecha-input-wrap">
          <input
            id="fecha-sesion"
            class="fecha-input"
            :value="gym.fechaActiva"
            type="date"
            :disabled="cambiando"
            @change="onFechaInput"
            @input="onFechaInput"
          />
        </div>
        <button
          class="fecha-step"
          type="button"
          aria-label="Día siguiente"
          :disabled="cambiando"
          @click="diaSiguiente"
        >
          ›
        </button>
      </div>
    </div>
    <button v-if="!esHoy" class="ghost" type="button" :disabled="cambiando" @click="irAHoy">
      Ir a hoy
    </button>

    <article v-if="!gym.listo || cambiando" class="card">
      <p>{{ gym.listo ? 'Cargando sesión…' : 'Sincronizando con Supabase…' }}</p>
    </article>

    <template v-else-if="!sesion">
      <article class="card">
        <h2>Nueva sesión</h2>
        <label>
          Nota (opcional)
          <input v-model="nota" type="text" maxlength="80" placeholder="pierna + hombro" />
        </label>
        <button class="primary" type="button" @click="crearSesion">Crear sesión</button>
      </article>
    </template>

    <template v-else>
      <p class="meta">
        {{ formatFecha(sesion.fecha) }}<span v-if="sesion.nota"> · {{ sesion.nota }}</span>
      </p>
      <AsistenciaList :sesion-id="sesion.id" />
      <RegistroSeries :sesion-id="sesion.id" />
    </template>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
  padding-bottom: 8px;
}

.header h1 {
  margin: 4px 0 8px;
  font-size: 2rem;
}

.eyebrow {
  margin: 0;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lede,
.meta,
.card p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.fecha-bar {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.fecha-label {
  font-weight: 700;
  font-size: 0.9rem;
}

.fecha-row {
  display: grid;
  grid-template-columns: var(--tap) minmax(0, 1fr) var(--tap);
  gap: 8px;
  align-items: stretch;
  min-width: 0;
}

.fecha-step {
  width: 100%;
  height: var(--tap);
  min-height: var(--tap);
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.fecha-step:disabled {
  opacity: 0.45;
}

.fecha-input-wrap {
  position: relative;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.fecha-input {
  position: relative;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  appearance: none;
  -webkit-appearance: none;
}

.fecha-input::-webkit-date-and-time-value {
  text-align: left;
  min-width: 0;
}

.fecha-input::-webkit-datetime-edit {
  min-width: 0;
  padding: 0;
}

.fecha-input::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  background: transparent;
  color: transparent;
  cursor: pointer;
}

.ghost {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
}

.ghost:disabled {
  opacity: 0.45;
}

.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9rem;
}

input {
  min-height: var(--tap);
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  padding: 0 12px;
}

.primary {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--accent);
  color: #06210f;
  font-weight: 700;
}
</style>
