<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatFecha } from '@/lib/ids'
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

// Todos los integrantes son destinos posibles: el origen no viene preseleccionado
// (para no duplicar en la misma sesión), pero se puede añadir (p. ej. clonar mi
// rutina de un día a otro día para mí mismo).
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

      <p v-if="!plantilla.length" class="muted">Este miembro no tiene series en esta sesión.</p>

      <template v-else>
        <label>
          Día destino
          <input :value="fecha" type="date" @change="onFechaInput" @input="onFechaInput" />
        </label>

        <div>
          <p class="field-label">Copiar a</p>
          <p v-if="!destinos.length" class="muted">No hay integrantes en el grupo.</p>
          <div v-else class="chips" role="group" aria-label="Integrantes destino">
            <button
              v-for="m in destinos"
              :key="m.id"
              type="button"
              class="chip"
              :class="{ on: seleccion.includes(m.id) }"
              :aria-pressed="seleccion.includes(m.id)"
              @click="toggle(m.id)"
            >
              {{ m.nombre }}<span v-if="m.id === sourceMiembroId"> · origen</span>
            </button>
          </div>
        </div>

        <p class="muted resumen">
          {{ plantilla.length }} series · {{ seleccion.length }} integrantes ·
          {{ totalSeries }} a crear el {{ formatFecha(fecha) }}
        </p>

        <button class="primary" type="button" :disabled="!puedeClonar" @click="clonar">
          {{ clonando ? 'Clonando…' : 'Clonar series' }}
        </button>
      </template>

      <button class="ghost" type="button" @click="emit('close')">Cerrar</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  align-items: end;
  z-index: 20;
}

.sheet {
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  padding: 16px 16px calc(16px + var(--safe-bottom));
  display: grid;
  gap: 12px;
  max-height: 85dvh;
  overflow: auto;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

label,
.field-label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9rem;
}

.field-label {
  margin: 0 0 6px;
}

input {
  min-height: var(--tap);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  padding: 0 12px;
}

.muted {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.resumen {
  font-weight: 700;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  min-height: var(--tap);
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 700;
}

.chip.on {
  border-color: transparent;
  background: var(--accent-soft);
  color: var(--text);
}

.primary,
.ghost {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  font-weight: 700;
}

.primary {
  background: var(--accent);
  color: #06210f;
}

.primary:disabled {
  opacity: 0.45;
}

.ghost {
  background: var(--surface-2);
  color: var(--text);
}
</style>
