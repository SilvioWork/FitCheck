<script setup lang="ts">
import { computed } from 'vue'
import { useFitcheckStore } from '@/stores/fitcheck'
import type { Serie } from '@/types/models'

const props = defineProps<{
  serie: Serie
}>()

const gym = useFitcheckStore()

const ejercicio = computed(
  () => gym.ejercicios.find((e) => e.id === props.serie.ejercicio_id)?.nombre ?? 'Ejercicio',
)
const equipo = computed(
  () => gym.equipos.find((e) => e.id === props.serie.equipo_id)?.nombre ?? 'Equipo',
)
const grupo = computed(() => gym.grupoDeEjercicio(props.serie.ejercicio_id))
</script>

<template>
  <div class="line">
    <span class="tabular num">{{ serie.numero_serie }}</span>
    <span>
      <strong>{{ ejercicio }}</strong>
      <small>{{ serie.repeticiones }} × {{ serie.peso_kg }} kg · {{ equipo }}</small>
      <small v-if="grupo">{{ grupo }}</small>
      <small v-if="serie.nota">{{ serie.nota }}</small>
    </span>
  </div>
</template>

<style scoped>
.line {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  min-height: var(--tap);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.num {
  font-weight: 800;
  color: var(--accent);
}

strong,
small {
  display: block;
}

small {
  color: var(--text-muted);
  font-weight: 500;
}
</style>
