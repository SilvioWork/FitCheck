<script setup lang="ts">
import type { Serie } from '@/types/models'

defineProps<{
  serie: Serie
}>()
</script>

<template>
  <div
    class="grid min-h-tap content-center gap-0.5 rounded-sm border border-border bg-background p-2.5"
    data-testid="serie-consulta"
  >
    <p class="m-0 text-[0.9rem] font-extrabold text-accent">SET {{ serie.numero_serie }}</p>
    <p class="tabular m-0 font-bold">{{ serie.repeticiones }} × {{ serie.peso_kg }} kg</p>
    <p v-if="serie.nota" class="mt-1 mb-0 text-[0.85rem] font-medium text-muted-foreground">
      {{ serie.nota }}
    </p>
  </div>
</template>
