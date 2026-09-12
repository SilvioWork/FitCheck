<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ConsultasPanel from '@/components/ConsultasPanel.vue'
import HistorialMiembro from '@/components/HistorialMiembro.vue'
import { formatFecha } from '@/lib/ids'
import { HISTORIAL_PAGE, useFitcheckStore } from '@/stores/fitcheck'

const gym = useFitcheckStore()
const route = useRoute()
const router = useRouter()

const filtros = reactive({
  desde: '',
  hasta: '',
  grupoId: '',
})

const vacio = computed(() => gym.historialTotal === 0 && !hayFiltro.value)
const vista = computed(() => (route.query.vista === 'miembro' ? 'miembro' : 'sesiones'))
const hayFiltro = computed(() => Boolean(filtros.desde || filtros.hasta || filtros.grupoId))
const totalPaginas = computed(() => Math.max(1, Math.ceil(gym.historialTotal / HISTORIAL_PAGE)))
const frecuencia = computed(() => {
  if (!filtros.grupoId) return ''
  const nombre = gym.grupos.find((g) => g.id === filtros.grupoId)?.nombre ?? 'ese grupo'
  return `${gym.historialTotal} sesión${gym.historialTotal === 1 ? '' : 'es'} de ${nombre} en este rango`
})

async function aplicar() {
  gym.historialFiltros.desde = filtros.desde
  gym.historialFiltros.hasta = filtros.hasta
  gym.historialFiltros.grupoId = filtros.grupoId
  await gym.listarSesiones(0)
}

function limpiarFiltros() {
  filtros.desde = ''
  filtros.hasta = ''
  filtros.grupoId = ''
  void aplicar()
}

function setVista(next: 'sesiones' | 'miembro') {
  if (next === 'miembro') {
    void router.replace({ name: 'historial', query: { vista: 'miembro' } })
    return
  }
  void router.replace({ name: 'historial' })
}

onMounted(() => {
  filtros.desde = gym.historialFiltros.desde
  filtros.hasta = gym.historialFiltros.hasta
  filtros.grupoId = gym.historialFiltros.grupoId
  void gym.listarSesiones(gym.historialPagina)
  void gym.cargarConsultaSesiones()
})

watch(vista, (next) => {
  if (next === 'sesiones') void gym.listarSesiones(gym.historialPagina)
})
</script>

<template>
  <section class="page">
    <header>
      <h1>Historial</h1>
      <p>Sesiones del grupo, por miembro, y consultas de asistencia y equipos.</p>
    </header>

    <div class="segment" role="tablist" aria-label="Vista de historial">
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

    <template v-if="vista === 'miembro'">
      <HistorialMiembro />
    </template>

    <template v-else>
      <article class="card">
        <h2>Filtros</h2>
        <label>
          Grupo muscular
          <select v-model="filtros.grupoId">
            <option value="">Todos</option>
            <option v-for="g in gym.grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
          </select>
        </label>
        <div class="pair">
          <label>
            Desde
            <input v-model="filtros.desde" type="date" />
          </label>
          <label>
            Hasta
            <input v-model="filtros.hasta" type="date" />
          </label>
        </div>
        <button class="ghost" type="button" @click="aplicar">Aplicar</button>
        <button v-if="hayFiltro" class="ghost" type="button" @click="limpiarFiltros">
          Quitar filtros
        </button>
        <p v-if="frecuencia" class="freq">{{ frecuencia }}</p>
      </article>

      <ConsultasPanel />

      <article v-if="vacio" class="empty">
        <p>Todavía no hay sesiones guardadas.</p>
      </article>
      <article v-else-if="!gym.historialSesiones.length" class="empty">
        <p>Ninguna sesión encaja con esos filtros.</p>
      </article>
      <ul v-else>
        <li v-for="sesion in gym.historialSesiones" :key="sesion.id">
          <RouterLink :to="`/historial/${sesion.id}`" class="row">
            <strong>{{ formatFecha(sesion.fecha) }}</strong>
            <span>{{ sesion.nota || 'Sin nota' }}</span>
          </RouterLink>
        </li>
      </ul>

      <div v-if="gym.historialTotal > HISTORIAL_PAGE" class="pager">
        <button
          class="ghost"
          type="button"
          :disabled="gym.historialPagina === 0"
          @click="gym.listarSesiones(gym.historialPagina - 1)"
        >
          Anterior
        </button>
        <p>{{ gym.historialPagina + 1 }} / {{ totalPaginas }}</p>
        <button
          class="ghost"
          type="button"
          :disabled="gym.historialPagina + 1 >= totalPaginas"
          @click="gym.listarSesiones(gym.historialPagina + 1)"
        >
          Siguiente
        </button>
      </div>
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

header p,
.freq {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.freq {
  font-weight: 700;
  font-size: 0.9rem;
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

.card,
.empty {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.card {
  display: grid;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9rem;
}

input {
  min-height: var(--tap);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  padding: 0 12px;
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ghost {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
}

.ghost:disabled {
  opacity: 0.45;
}

.empty {
  min-height: 120px;
  display: grid;
  place-items: center;
  border-style: dashed;
  text-align: center;
  box-shadow: none;
}

.empty p {
  margin: 0;
  color: var(--text-muted);
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

.pager {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
}

.pager p {
  margin: 0;
  text-align: center;
  font-weight: 700;
  color: var(--text-muted);
}
</style>
