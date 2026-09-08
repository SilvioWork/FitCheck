<script setup lang="ts">
import { onUnmounted } from 'vue'

const HOLD_DELAY_MS = 1000
const REPEAT_MS = 100

const props = withDefaults(
  defineProps<{
    label: string
    step?: number
    min?: number
  }>(),
  { step: 1, min: 0 },
)

const model = defineModel<number>({ required: true })

let delayId = 0
let repeatId = 0
let repeating = false
let skipClick = false
let gesture = false

function dec() {
  const next = Math.round((model.value - props.step) * 1000) / 1000
  model.value = next < props.min ? props.min : next
}

function inc() {
  model.value = Math.round((model.value + props.step) * 1000) / 1000
}

function apply(dir: 1 | -1) {
  if (dir < 0) dec()
  else inc()
}

function stopTimers() {
  if (delayId) {
    clearTimeout(delayId)
    delayId = 0
  }
  if (repeatId) {
    clearInterval(repeatId)
    repeatId = 0
  }
}

function onPointerDown(dir: 1 | -1, event: PointerEvent) {
  if (event.button !== 0) return
  skipClick = false
  repeating = false
  gesture = true
  stopTimers()
  const el = event.currentTarget as HTMLElement
  el.setPointerCapture(event.pointerId)
  delayId = window.setTimeout(() => {
    repeating = true
    skipClick = true
    apply(dir)
    repeatId = window.setInterval(() => apply(dir), REPEAT_MS)
  }, HOLD_DELAY_MS)
}

function onPointerUp(dir: 1 | -1) {
  if (!gesture) return
  gesture = false
  const wasRepeating = repeating
  stopTimers()
  repeating = false
  if (!wasRepeating) {
    apply(dir)
    skipClick = true
  }
}

function onCancel() {
  if (!gesture) return
  gesture = false
  stopTimers()
  repeating = false
  skipClick = true
}

function onClick(dir: 1 | -1, event: MouseEvent) {
  if (skipClick) {
    event.preventDefault()
    skipClick = false
    return
  }
  apply(dir)
}

onUnmounted(() => {
  stopTimers()
})

function display(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
</script>

<template>
  <div class="stepper">
    <p class="label">{{ label }}</p>
    <div class="row">
      <button
        type="button"
        class="btn"
        :aria-label="'Menos ' + label"
        @pointerdown="onPointerDown(-1, $event)"
        @pointerup="onPointerUp(-1)"
        @pointercancel="onCancel"
        @click="onClick(-1, $event)"
        @contextmenu.prevent
      >
        −
      </button>
      <span class="value tabular">{{ display(model) }}</span>
      <button
        type="button"
        class="btn"
        :aria-label="'Más ' + label"
        @pointerdown="onPointerDown(1, $event)"
        @pointerup="onPointerUp(1)"
        @pointercancel="onCancel"
        @click="onClick(1, $event)"
        @contextmenu.prevent
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.stepper {
  display: grid;
  gap: 8px;
}

.label {
  margin: 0;
  font-weight: 700;
  font-size: 0.9rem;
}

.row {
  display: grid;
  grid-template-columns: var(--tap) 1fr var(--tap);
  gap: 8px;
  align-items: center;
}

.btn {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  font-size: 1.4rem;
  font-weight: 700;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.value {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 800;
}
</style>
