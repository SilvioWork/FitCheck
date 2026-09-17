<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatFecha } from '@/lib/ids'
import { cn } from '@/lib/cn'
import { useFitcheckStore } from '@/stores/fitcheck'

const props = defineProps<{
  sourceSesionId: string
  sourceMiembroId: string
  defaultFecha: string
}>()

const emit = defineEmits<{
  done: [count: number]
  close: []
}>()

const gym = useFitcheckStore()

const fecha = ref(props.defaultFecha)
const seleccion = ref<string[]>([])
const clonando = ref(false)

const origen = computed(() => gym.miembros.find((m) => m.id === props.sourceMiembroId) ?? null)

const plantilla = computed(() => gym.seriesDe(props.sourceSesionId, props.sourceMiembroId))

const destinos = computed(() => gym.miembrosOrdenados)

const totalSeries = computed(() => plantilla.value.length * seleccion.value.length)

const puedeClonar = computed(
  () => !clonando.value && plantilla.value.length > 0 && seleccion.value.length > 0,
)

function toggle(id: string) {
  seleccion.value = seleccion.value.includes(id)
    ? seleccion.value.filter((x) => x !== id)
    : [...seleccion.value, id]
}

function onFechaInput(event: Event) {
  fecha.value = (event.target as HTMLInputElement).value
}

async function clonar() {
  if (!puedeClonar.value) return
  clonando.value = true
  try {
    const count = await gym.clonarSeriesDe({
      sourceSesionId: props.sourceSesionId,
      sourceMiembroId: props.sourceMiembroId,
      targetFecha: fecha.value,
      targetMiembroIds: seleccion.value,
    })
    emit('done', count)
  } finally {
    clonando.value = false
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="sheet" role="dialog" aria-label="Clonar series">
      <h2>Clonar series de {{ origen?.nombre ?? 'este miembro' }}</h2>

      <p v-if="!plantilla.length" class="m-0 leading-snug text-muted-foreground">
        Este miembro no tiene series en esta sesión.
      </p>

      <template v-else>
        <label class="field">
          Día destino
          <input
            :value="fecha"
            class="field-input"
            type="date"
            @change="onFechaInput"
            @input="onFechaInput"
          />
        </label>

        <div>
          <p class="field mb-1.5">Copiar a</p>
          <p v-if="!destinos.length" class="m-0 leading-snug text-muted-foreground">
            No hay integrantes en el grupo.
          </p>
          <div v-else class="flex flex-wrap gap-2" role="group" aria-label="Integrantes destino">
            <button
              v-for="m in destinos"
              :key="m.id"
              type="button"
              :class="cn('chip', seleccion.includes(m.id) && 'chip-on')"
              :aria-pressed="seleccion.includes(m.id)"
              @click="toggle(m.id)"
            >
              {{ m.nombre }}<span v-if="m.id === sourceMiembroId"> · origen</span>
            </button>
          </div>
        </div>

        <p class="m-0 font-bold leading-snug text-muted-foreground">
          {{ plantilla.length }} series · {{ seleccion.length }} integrantes · {{ totalSeries }} a
          crear el {{ formatFecha(fecha) }}
        </p>

        <button class="btn-primary" type="button" :disabled="!puedeClonar" @click="clonar">
          {{ clonando ? 'Clonando…' : 'Clonar series' }}
        </button>
      </template>

      <button class="btn-ghost" type="button" @click="emit('close')">Cerrar</button>
    </div>
  </div>
</template>
