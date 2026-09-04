<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ConsultasPanel from '@/components/ConsultasPanel.vue'
import { formatFecha } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const gym = useFitcheckStore()
const vacio = computed(() => gym.sesionesOrdenadas.length === 0)
</script>

<template>
  <section class="page">
    <header>
      <h1>Historial</h1>
      <p>Sesiones del grupo y consultas de asistencia y equipos.</p>
    </header>

    <ConsultasPanel v-if="!vacio" />

    <article v-if="vacio" class="empty">
      <p>Todavía no hay sesiones guardadas.</p>
    </article>

    <ul v-else>
      <li v-for="sesion in gym.sesionesOrdenadas" :key="sesion.id">
        <RouterLink :to="`/historial/${sesion.id}`" class="row">
          <strong>{{ formatFecha(sesion.fecha) }}</strong>
          <span>{{ sesion.nota || 'Sin nota' }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

h1 {
  margin: 0 0 8px;
  font-size: 2rem;
}

p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.empty {
  min-height: 120px;
  display: grid;
  place-items: center;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  text-align: center;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.row {
  display: grid;
  gap: 4px;
  min-height: var(--tap);
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--border);
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow);
}

.row span {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
