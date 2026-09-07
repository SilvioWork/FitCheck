<script setup lang="ts">
import { NOTA_CHIPS, type NotaChip } from '@/lib/notaChips'

const selected = defineModel<string[]>({ default: () => [] })

function isOn(chip: NotaChip) {
  return selected.value.includes(chip)
}

function toggle(chip: NotaChip) {
  if (isOn(chip)) {
    selected.value = selected.value.filter((item) => item !== chip)
    return
  }
  selected.value = [...selected.value, chip]
}
</script>

<template>
  <div class="chips" role="group" aria-label="Marcas de la serie">
    <button
      v-for="chip in NOTA_CHIPS"
      :key="chip"
      type="button"
      class="chip"
      :class="{ on: isOn(chip) }"
      :aria-pressed="isOn(chip)"
      @click="toggle(chip)"
    >
      {{ chip }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  min-height: var(--tap);
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.85rem;
}

.chip.on {
  border-color: transparent;
  background: var(--accent-soft);
  color: var(--text);
}
</style>
