<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AsistenciaList from '@/components/AsistenciaList.vue'
import RegistroSeries from '@/components/RegistroSeries.vue'
import { formatFecha } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const route = useRoute()
const gym = useFitcheckStore()

const sesion = computed(() => gym.sesionPorId(String(route.params.id)))

const seriesAjenas = computed(() => {
  if (!sesion.value) return []
  return gym.seriesDe(sesion.value.id).filter((s) => s.miembro_id !== gym.miembroActivoId)
})

function nombreMiembro(id: string) {
  return gym.miembros.find((m) => m.id === id)?.nombre ?? 'Alguien'
}

function nombreEjercicio(id: string) {
  return gym.ejercicios.find((e) => e.id === id)?.nombre ?? id
}
</script>

<template>
  <section v-if="sesion" class="page">
    <header>
      <h1>{{ formatFecha(sesion.fecha) }}</h1>
      <p>{{ sesion.nota || 'Sesión sin nota' }}</p>
    </header>

    <AsistenciaList :sesion-id="sesion.id" />
    <article v-if="gym.ausentesDe(sesion.id).length || gym.sinMarcarDe(sesion.id).length" class="card">
      <h2>Quién no asistió</h2>
      <ul>
        <li v-for="m in gym.ausentesDe(sesion.id)" :key="m.id">{{ m.nombre }} · ausente</li>
        <li v-for="m in gym.sinMarcarDe(sesion.id)" :key="'s' + m.id">{{ m.nombre }} · sin marcar</li>
      </ul>
    </article>
    <RegistroSeries v-if="gym.miembroActivoId" :sesion-id="sesion.id" />

    <article v-if="seriesAjenas.length" class="card">
      <h2>Resto del grupo</h2>
      <ul>
        <li v-for="serie in seriesAjenas" :key="serie.id">
          <strong>{{ nombreMiembro(serie.miembro_id) }}</strong>
          · {{ nombreEjercicio(serie.ejercicio_id) }} · {{ serie.repeticiones }} × {{ serie.peso_kg }} kg
        </li>
      </ul>
    </article>
  </section>
  <p v-else>Esa sesión no existe.</p>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
  padding-bottom: 8px;
}

h1 {
  margin: 0 0 8px;
  font-size: 2rem;
}

p {
  margin: 0;
  color: var(--text-muted);
}

.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

h2 {
  margin: 0 0 8px;
  font-size: 1.05rem;
}

ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-muted);
  display: grid;
  gap: 6px;
}
</style>
