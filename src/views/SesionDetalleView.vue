<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AsistenciaList from '@/components/AsistenciaList.vue'
import RegistroSeries from '@/components/RegistroSeries.vue'
import SerieLinea from '@/components/SerieLinea.vue'
import { formatFecha } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const route = useRoute()
const gym = useFitcheckStore()
const cargando = ref(true)

const sesionId = computed(() => String(route.params.id))
const sesion = computed(() => gym.sesionPorId(sesionId.value))

onMounted(async () => {
  await gym.cargarSesion(sesionId.value)
  cargando.value = false
})

watch(sesionId, async (id) => {
  cargando.value = true
  await gym.cargarSesion(id)
  cargando.value = false
})

const grupos = computed(() => (sesion.value ? gym.seriesAgrupadasPorMiembro(sesion.value.id) : []))

const otros = computed(() => grupos.value.filter((g) => !g.propio))
</script>

<template>
  <p v-if="cargando" class="muted">Cargando sesión…</p>
  <section v-else-if="sesion" class="page">
    <header>
      <RouterLink class="back" to="/historial">Historial</RouterLink>
      <h1>{{ formatFecha(sesion.fecha) }}</h1>
      <p>{{ sesion.nota || 'Sesión sin nota' }}</p>
    </header>

    <AsistenciaList :sesion-id="sesion.id" />
    <article v-if="gym.ausentesDe(sesion.id).length || gym.sinMarcarDe(sesion.id).length" class="card">
      <h2>Quién no asistió</h2>
      <ul class="plain">
        <li v-for="m in gym.ausentesDe(sesion.id)" :key="m.id">{{ m.nombre }} · ausente</li>
        <li v-for="m in gym.sinMarcarDe(sesion.id)" :key="'s' + m.id">{{ m.nombre }} · sin marcar</li>
      </ul>
    </article>

    <RegistroSeries v-if="gym.miembroActivoId" :sesion-id="sesion.id" />

    <article v-for="grupo in otros" :key="grupo.miembro.id" class="card">
      <h2>{{ grupo.miembro.nombre }}</h2>
      <p v-if="!grupo.series.length" class="muted">Sin series en esta sesión.</p>
      <ul v-else class="series">
        <li v-for="serie in grupo.series" :key="serie.id">
          <SerieLinea :serie="serie" />
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

.back {
  display: inline-grid;
  align-items: center;
  min-height: var(--tap);
  color: var(--accent);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}

h1 {
  margin: 0 0 8px;
  font-size: 2rem;
}

header p,
.muted {
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

.plain {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-muted);
  display: grid;
  gap: 6px;
}

.series {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
</style>
