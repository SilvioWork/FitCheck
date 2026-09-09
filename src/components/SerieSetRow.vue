<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import StepperControl from '@/components/StepperControl.vue'
import { useFitcheckStore } from '@/stores/fitcheck'
import type { Serie } from '@/types/models'

const SAVE_DEBOUNCE_MS = 400

const props = defineProps<{
  serie: Serie
}>()

const emit = defineEmits<{
  editar: [serie: Serie]
  duplicar: [serie: Serie]
}>()

const gym = useFitcheckStore()
const reps = ref(props.serie.repeticiones)
const peso = ref(props.serie.peso_kg)
let dirty = false
let timer = 0
let persistiendo: Promise<void> | null = null

watch(
  () => props.serie.id,
  () => {
    dirty = false
    if (timer) {
      window.clearTimeout(timer)
      timer = 0
    }
    reps.value = props.serie.repeticiones
    peso.value = props.serie.peso_kg
  },
)

watch(
  () => [props.serie.repeticiones, props.serie.peso_kg] as const,
  ([r, p]) => {
    if (dirty) return
    reps.value = r
    peso.value = p
  },
)

watch([reps, peso], () => {
  if (reps.value === props.serie.repeticiones && peso.value === props.serie.peso_kg) return
  dirty = true
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    void persist()
  }, SAVE_DEBOUNCE_MS)
})

async function persist() {
  if (!dirty) return
  timer = 0
  const repsSnap = reps.value
  const pesoSnap = peso.value
  persistiendo = gym.editarSerie(props.serie.id, {
    ejercicioId: props.serie.ejercicio_id,
    equipoId: props.serie.equipo_id,
    repeticiones: repsSnap,
    pesoKg: pesoSnap,
    nota: props.serie.nota ?? '',
  })
  await persistiendo
  persistiendo = null
  if (reps.value === repsSnap && peso.value === pesoSnap) dirty = false
  else {
    timer = window.setTimeout(() => {
      void persist()
    }, SAVE_DEBOUNCE_MS)
  }
}

async function flush() {
  if (timer) {
    window.clearTimeout(timer)
    timer = 0
  }
  if (persistiendo) await persistiendo
  if (dirty) await persist()
}

async function onEditar() {
  await flush()
  emit('editar', props.serie)
}

async function onDuplicar() {
  await flush()
  emit('duplicar', props.serie)
}

onUnmounted(() => {
  if (timer) {
    window.clearTimeout(timer)
    timer = 0
    void persist()
  }
})
</script>

<template>
  <div class="set" data-testid="serie-set">
    <div class="top">
      <p class="label">SET {{ serie.numero_serie }}</p>
      <button type="button" class="ghost" @click="onEditar">Editar</button>
    </div>
    <div class="pair">
      <StepperControl v-model="reps" compact label="Reps" :min="1" />
      <StepperControl v-model="peso" compact label="Peso kg" :step="2.5" :min="0" />
    </div>
    <p v-if="serie.nota" class="nota">{{ serie.nota }}</p>
    <button type="button" class="ghost duplicar" @click="onDuplicar">Duplicar</button>
  </div>
</template>

<style scoped>
.set {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
}

.top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.label {
  margin: 0;
  font-weight: 800;
  color: var(--accent);
  font-size: 0.9rem;
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.nota {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.ghost {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
}

.duplicar {
  width: 100%;
}
</style>
