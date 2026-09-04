<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ConsultasPanel from '@/components/ConsultasPanel.vue'
import HistorialMiembro from '@/components/HistorialMiembro.vue'
import { formatFecha } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const gym = useFitcheckStore()
const route = useRoute()
const router = useRouter()

const vacio = computed(() => gym.sesionesOrdenadas.length === 0)
const vista = computed(() => (route.query.vista === 'miembro' ? 'miembro' : 'sesiones'))

function setVista(next: 'sesiones' | 'miembro') {
  if (next === 'miembro') {
    void router.replace({ name: 'historial', query: { vista: 'miembro' } })
    return
  }
  void router.replace({ name: 'historial' })
}
</script>

<template>
  <section class="page">
    <header>
      <h1>Historial</h1>
      <p>Sesiones del grupo, por miembro, y consultas de asistencia y equipos.</p>
    </header>

    <div v-if="!vacio" class="segment" role="tablist" aria-label="Vista de historial">
      <button
        type="button"
        class="seg-btn"
        role="tab"
        :aria-selected="vista === 'sesiones'"
        :class="{ active: vista === 'sesiones' }"
        @click="setVista('sesiones')"
      >
        Sesiones
      </button>
      <button
        type="button"
        class="seg-btn"
        role="tab"
        :aria-selected="vista === 'miembro'"
        :class="{ active: vista === 'miembro' }"
        @click="setVista('miembro')"
      >
        Por miembro
      </button>
    </div>

    <template v-if="vacio">
      <article class="empty">
        <p>Todavía no hay sesiones guardadas.</p>
      </article>
    </template>

    <template v-else-if="vista === 'miembro'">
      <HistorialMiembro />
    </template>

    <template v-else>
      <ConsultasPanel />
      <ul>
        <li v-for="sesion in gym.sesionesOrdenadas" :key="sesion.id">
          <RouterLink :to="`/historial/${sesion.id}`" class="row">
            <strong>{{ formatFecha(sesion.fecha) }}</strong>
            <span>{{ sesion.nota || 'Sin nota' }}</span>
          </RouterLink>
        </li>
      </ul>
    </template>
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

.segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 4px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.seg-btn {
  min-height: var(--tap);
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-weight: 700;
}

.seg-btn.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
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
