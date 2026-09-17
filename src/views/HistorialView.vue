<script setup lang="ts">
import { Inbox, SearchX } from '@lucide/vue'
import { computed, onMounted, reactive, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ConsultasPanel from '@/components/ConsultasPanel.vue'
import HistorialMiembro from '@/components/HistorialMiembro.vue'
import { formatFecha } from '@/lib/ids'
import { HISTORIAL_PAGE, useFitcheckStore } from '@/stores/fitcheck'
import { cn } from '@/lib/cn'

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
  <section class="grid gap-4">
    <header>
      <h1>Historial</h1>
      <p class="m-0 leading-snug text-muted-foreground">
        Sesiones del grupo, por miembro, y consultas de asistencia y equipos.
      </p>
    </header>

    <div
      class="grid grid-cols-2 gap-2 rounded-sm bg-muted p-1"
      role="tablist"
      aria-label="Vista de historial"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="vista === 'sesiones'"
        :class="cn('btn-seg', vista === 'sesiones' && 'btn-seg-active')"
        @click="setVista('sesiones')"
      >
        Sesiones
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="vista === 'miembro'"
        :class="cn('btn-seg', vista === 'miembro' && 'btn-seg-active')"
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
        <label class="field">
          Grupo muscular
          <select v-model="filtros.grupoId">
            <option value="">Todos</option>
            <option v-for="g in gym.grupos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
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
        <button class="btn-ghost" type="button" @click="aplicar">Aplicar</button>
        <button v-if="hayFiltro" class="btn-ghost" type="button" @click="limpiarFiltros">
          Quitar filtros
        </button>
        <p v-if="frecuencia" class="m-0 text-[0.9rem] font-bold text-muted-foreground">
          {{ frecuencia }}
        </p>
      </article>

      <ConsultasPanel />

      <article v-if="vacio" class="empty-panel">
        <AppIcon :icon="Inbox" size="lg" class="text-muted-foreground" />
        <p class="m-0 text-muted-foreground">Todavía no hay sesiones guardadas.</p>
      </article>
      <article v-else-if="!gym.historialSesiones.length" class="empty-panel">
        <AppIcon :icon="SearchX" size="lg" class="text-muted-foreground" />
        <p class="m-0 text-muted-foreground">Ninguna sesión encaja con esos filtros.</p>
      </article>
      <ul v-else class="m-0 grid list-none gap-2 p-0">
        <li v-for="sesion in gym.historialSesiones" :key="sesion.id">
          <RouterLink
            :to="`/historial/${sesion.id}`"
            class="grid min-h-tap gap-1 rounded-lg border border-border bg-card px-3.5 py-3 text-inherit no-underline shadow-card"
          >
            <strong>{{ formatFecha(sesion.fecha) }}</strong>
            <span class="text-[0.9rem] text-muted-foreground">{{ sesion.nota || 'Sin nota' }}</span>
          </RouterLink>
        </li>
      </ul>

      <div
        v-if="gym.historialTotal > HISTORIAL_PAGE"
        class="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
      >
        <button
          class="btn-ghost"
          type="button"
          :disabled="gym.historialPagina === 0"
          @click="gym.listarSesiones(gym.historialPagina - 1)"
        >
          Anterior
        </button>
        <p class="m-0 text-center font-bold text-muted-foreground">
          {{ gym.historialPagina + 1 }} / {{ totalPaginas }}
        </p>
        <button
          class="btn-ghost"
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
