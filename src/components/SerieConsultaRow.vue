<script setup lang="ts">
import type { Serie } from '@/types/models'

defineProps<{
  serie: Serie
}>()
</script>

<template>
  <div class="set" data-testid="serie-consulta">
    <p class="label">SET {{ serie.numero_serie }}</p>
    <p class="vals tabular">{{ serie.repeticiones }} × {{ serie.peso_kg }} kg</p>
    <p v-if="serie.nota" class="nota">{{ serie.nota }}</p>
  </div>
</template>

<style scoped>
.set {
  display: grid;
  gap: 2px;
  min-height: var(--tap);
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
  align-content: center;
}

.label {
  margin: 0;
  font-weight: 800;
  color: var(--accent);
  font-size: 0.9rem;
}

.vals {
  margin: 0;
  font-weight: 700;
}

.nota {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}
</style>
