<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    step?: number
    min?: number
  }>(),
  { step: 1, min: 0 },
)

const model = defineModel<number>({ required: true })

function dec() {
  const next = Math.round((model.value - props.step) * 1000) / 1000
  model.value = next < props.min ? props.min : next
}

function inc() {
  model.value = Math.round((model.value + props.step) * 1000) / 1000
}

function display(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
</script>

<template>
  <div class="stepper">
    <p class="label">{{ label }}</p>
    <div class="row">
      <button type="button" class="btn" :aria-label="'Menos ' + label" @click="dec">−</button>
      <span class="value tabular">{{ display(model) }}</span>
      <button type="button" class="btn" :aria-label="'Más ' + label" @click="inc">+</button>
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
}

.value {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 800;
}
</style>
