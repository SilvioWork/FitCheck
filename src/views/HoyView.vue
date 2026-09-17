<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
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
  <section class="grid gap-4 pb-2">
    <header>
      <p class="m-0 text-xs font-bold tracking-wide text-accent uppercase">Sesión</p>
      <h1>{{ titulo }}</h1>
      <p class="m-0 leading-snug text-muted-foreground">
        {{
          gym.miembroActivo
            ? `Entraste como ${gym.miembroActivo.nombre}. Puedes anotar a cualquiera.`
            : 'Cargando perfil…'
        }}
        <span v-if="gym.enVivo"> · En vivo</span>
      </p>
    </header>

    <div class="grid min-w-0 gap-1.5" role="group" aria-label="Fecha de la sesión">
      <label class="text-[0.9rem] font-bold" for="fecha-sesion">Fecha</label>
      <div class="grid min-w-0 grid-cols-[var(--tap)_minmax(0,1fr)_var(--tap)] items-stretch gap-2">
        <button
          class="grid h-tap min-h-tap w-full place-items-center rounded-sm border border-border bg-card p-0 text-foreground disabled:opacity-45"
          type="button"
          aria-label="Día anterior"
          :disabled="cambiando"
          @click="diaAnterior"
        >
          <AppIcon :icon="ChevronLeft" />
        </button>
        <div class="relative min-w-0 max-w-full overflow-hidden">
          <input
            id="fecha-sesion"
            class="fecha-input field-input"
            :value="gym.fechaActiva"
            type="date"
            :disabled="cambiando"
            @change="onFechaInput"
            @input="onFechaInput"
          />
        </div>
        <button
          class="grid h-tap min-h-tap w-full place-items-center rounded-sm border border-border bg-card p-0 text-foreground disabled:opacity-45"
          type="button"
          aria-label="Día siguiente"
          :disabled="cambiando"
          @click="diaSiguiente"
        >
          <AppIcon :icon="ChevronRight" />
        </button>
      </div>
    </div>
    <button v-if="!esHoy" class="btn-ghost" type="button" :disabled="cambiando" @click="irAHoy">
      Ir a hoy
    </button>

    <article v-if="!gym.listo || cambiando" class="card">
      <p class="m-0 text-muted-foreground">
        {{ gym.listo ? 'Cargando sesión…' : 'Sincronizando con Supabase…' }}
      </p>
    </article>

    <template v-else-if="!sesion">
      <article class="card">
        <h2>Nueva sesión</h2>
        <label class="field">
          Nota (opcional)
          <input
            v-model="nota"
            class="field-input"
            type="text"
            maxlength="80"
            placeholder="pierna + hombro"
          />
        </label>
        <button class="btn-primary" type="button" @click="crearSesion">Crear sesión</button>
      </article>
    </template>

    <template v-else>
      <p class="m-0 leading-snug text-muted-foreground">
        {{ formatFecha(sesion.fecha) }}<span v-if="sesion.nota"> · {{ sesion.nota }}</span>
      </p>
      <AsistenciaList :sesion-id="sesion.id" />
      <RegistroSeries :sesion-id="sesion.id" />
    </template>
  </section>
</template>
