<script setup lang="ts">
import { Inbox, SearchX } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import SeriesGruposConsulta from '@/components/SeriesGruposConsulta.vue'
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
    <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
      Historial de series, filtrable por grupo, equipo o fechas.
    </p>

    <label class="field">
      Miembro
      <select v-model="filtros.miembroId">
        <option v-for="m in gym.miembrosOrdenados" :key="m.id" :value="m.id">{{ m.nombre }}</option>
      </select>
    </label>

    <label class="field">
      Grupo muscular
      <select v-model="filtros.grupoId">
        <option value="">Todos</option>
        <option v-for="g in gym.grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
      </select>
    </label>

    <label class="field">
      Equipo
      <select v-model="filtros.equipoId">
        <option value="">Todos</option>
        <option v-for="eq in gym.equipos" :key="eq.id" :value="eq.id">{{ eq.nombre }}</option>
      </select>
    </label>

    <div class="grid grid-cols-2 gap-3">
      <label class="field">
        Desde
        <input v-model="filtros.desde" class="field-input" type="date" />
      </label>
      <label class="field">
        Hasta
        <input v-model="filtros.hasta" class="field-input" type="date" />
      </label>
    </div>

    <button v-if="hayFiltro" class="btn-ghost" type="button" @click="limpiarFiltros">
      Quitar filtros
    </button>
  </article>

  <p v-if="!filtros.miembroId" class="empty-panel">
    <AppIcon :icon="Inbox" size="lg" class="text-muted-foreground" />
    No hay miembros en el grupo.
  </p>
  <p v-else-if="cargando" class="empty-panel">Cargando series…</p>
  <p v-else-if="!bloques.length" class="empty-panel">
    <AppIcon :icon="hayFiltro ? SearchX : Inbox" size="lg" class="text-muted-foreground" />
    {{ hayFiltro ? 'Ninguna serie encaja con esos filtros.' : 'Este miembro aún no tiene series.' }}
  </p>

  <article v-for="bloque in bloques" :key="bloque.sesion.id" class="card">
    <RouterLink
      :to="`/historial/${bloque.sesion.id}`"
      class="grid min-h-tap content-center gap-0.5 text-inherit no-underline"
    >
      <strong>{{ formatFecha(bloque.sesion.fecha) }}</strong>
      <span class="text-[0.9rem] font-medium text-muted-foreground">
        {{ bloque.sesion.nota || 'Sin nota' }}
      </span>
    </RouterLink>
    <SeriesGruposConsulta :series="bloque.series" />
  </article>
</template>
