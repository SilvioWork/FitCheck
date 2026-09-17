<script setup lang="ts">
import { NOTA_CHIPS, type NotaChip } from '@/lib/notaChips'
import { cn } from '@/lib/cn'

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
  <div class="flex flex-wrap gap-2" role="group" aria-label="Marcas de la serie">
    <button
      v-for="chip in NOTA_CHIPS"
      :key="chip"
      type="button"
      :class="cn('chip px-3 text-[0.85rem]', isOn(chip) && 'chip-on')"
      :aria-pressed="isOn(chip)"
      @click="toggle(chip)"
    >
      {{ chip }}
    </button>
  </div>
</template>
