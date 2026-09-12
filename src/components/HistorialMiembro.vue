<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import SerieLinea from '@/components/SerieLinea.vue'
import { formatFecha } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'
import type { Serie, Sesion } from '@/types/models'

const gym = useFitcheckStore()

const filtros = reactive({
  miembroId: gym.miembroActivoId ?? gym.miembrosOrdenados[0]?.id ?? '',
  grupoId: '',
  equipoId: '',
  desde: '',
  hasta: '',
})

const bloques = ref<{ sesion: Sesion; series: Serie[] }[]>([])
const cargando = ref(false)

watch(
  () => gym.miembroActivoId,
  (id) => {
    if (id && !filtros.miembroId) filtros.miembroId = id
  },
)

const hayFiltro = computed(() =>
  Boolean(filtros.grupoId || filtros.equipoId || filtros.desde || filtros.hasta),
)

async function cargar() {
  if (!filtros.miembroId) {
    bloques.value = []
    return
  }
  cargando.value = true
  bloques.value = await gym.fetchSeriesDeMiembro(filtros.miembroId, {
    grupoId: filtros.grupoId || undefined,
    equipoId: filtros.equipoId || undefined,
    desde: filtros.desde || undefined,
    hasta: filtros.hasta || undefined,
  })
  cargando.value = false
}

function limpiarFiltros() {
  filtros.grupoId = ''
  filtros.equipoId = ''
  filtros.desde = ''
  filtros.hasta = ''
  void cargar()
}

onMounted(() => {
  void cargar()
})

watch(
  () => [filtros.miembroId, filtros.grupoId, filtros.equipoId, filtros.desde, filtros.hasta],
  () => {
    void cargar()
  },
)
</script>

<template>
  <article class="card">
    <h2>Por miembro</h2>
    <p class="hint">Historial de series, filtrable por grupo, equipo o fechas.</p>

    <label>
      Miembro
      <select v-model="filtros.miembroId">
        <option v-for="m in gym.miembrosOrdenados" :key="m.id" :value="m.id">{{ m.nombre }}</option>
      </select>
    </label>

    <label>
      Grupo muscular
      <select v-model="filtros.grupoId">
        <option value="">Todos</option>
        <option v-for="g in gym.grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
      </select>
    </label>

    <label>
      Equipo
      <select v-model="filtros.equipoId">
        <option value="">Todos</option>
        <option v-for="eq in gym.equipos" :key="eq.id" :value="eq.id">{{ eq.nombre }}</option>
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

    <button v-if="hayFiltro" class="ghost" type="button" @click="limpiarFiltros">
      Quitar filtros
    </button>
  </article>

  <p v-if="!filtros.miembroId" class="empty">No hay miembros en el grupo.</p>
  <p v-else-if="cargando" class="empty">Cargando series…</p>
  <p v-else-if="!bloques.length" class="empty">
    {{ hayFiltro ? 'Ninguna serie encaja con esos filtros.' : 'Este miembro aún no tiene series.' }}
  </p>

  <article v-for="bloque in bloques" :key="bloque.sesion.id" class="card">
    <RouterLink :to="`/historial/${bloque.sesion.id}`" class="sesion">
      <strong>{{ formatFecha(bloque.sesion.fecha) }}</strong>
      <span>{{ bloque.sesion.nota || 'Sin nota' }}</span>
    </RouterLink>
    <ul>
      <li v-for="serie in bloque.series" :key="serie.id">
        <SerieLinea :serie="serie" />
      </li>
    </ul>
  </article>
</template>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
}

h2,
.hint {
  margin: 0;
}

h2 {
  font-size: 1.05rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
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

.empty {
  margin: 0;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-muted);
  text-align: center;
}

.sesion {
  display: grid;
  gap: 2px;
  min-height: var(--tap);
  align-content: center;
  text-decoration: none;
  color: inherit;
}

.sesion span {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
</style>
