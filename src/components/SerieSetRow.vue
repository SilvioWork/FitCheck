<script setup lang="ts">
import { Copy, Pencil } from '@lucide/vue'
import { onUnmounted, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
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
  <div
    class="grid gap-2 rounded-sm border border-border bg-background p-2.5"
    data-testid="serie-set"
  >
    <div class="grid grid-cols-[1fr_auto] items-center gap-2">
      <p class="m-0 text-[0.9rem] font-extrabold text-accent">SET {{ serie.numero_serie }}</p>
      <button type="button" class="btn-ghost min-w-tap px-3" aria-label="Editar" @click="onEditar">
        <span class="inline-flex items-center justify-center">
          <AppIcon :icon="Pencil" size="sm" />
        </span>
        <span class="sr-only">Editar</span>
      </button>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <StepperControl v-model="reps" compact label="Reps" :min="1" />
      <StepperControl v-model="peso" compact label="Peso kg" :step="2.5" :min="0" />
    </div>
    <p v-if="serie.nota" class="m-0 text-[0.85rem] font-medium text-muted-foreground">
      {{ serie.nota }}
    </p>
    <button
      type="button"
      class="btn-ghost inline-flex w-full items-center justify-center gap-2"
      @click="onDuplicar"
    >
      <AppIcon :icon="Copy" size="sm" />
      Duplicar
    </button>
  </div>
</template>
