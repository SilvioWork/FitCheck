<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import AsistenciaList from '@/components/AsistenciaList.vue'
import RegistroSeries from '@/components/RegistroSeries.vue'
import SeriesGruposConsulta from '@/components/SeriesGruposConsulta.vue'
import { formatFecha } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const route = useRoute()
const gym = useFitcheckStore()
const cargando = ref(true)
const miembroElegidoId = ref('')

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

watch(
  () => gym.miembroActivoId,
  (id) => {
    if (id && !miembroElegidoId.value) miembroElegidoId.value = id
  },
  { immediate: true },
)

const grupos = computed(() => (sesion.value ? gym.seriesAgrupadasPorMiembro(sesion.value.id) : []))

const otros = computed(() => grupos.value.filter((g) => g.miembro.id !== miembroElegidoId.value))
</script>

<template>
  <p v-if="cargando" class="m-0 text-muted-foreground">Cargando sesión…</p>
  <section v-else-if="sesion" class="grid gap-4 pb-2">
    <header>
      <RouterLink
        class="inline-grid min-h-tap grid-flow-col items-center gap-1 text-[0.9rem] font-bold text-accent no-underline"
        to="/historial"
      >
        <AppIcon :icon="ChevronLeft" size="sm" />
        Historial
      </RouterLink>
      <h1>{{ formatFecha(sesion.fecha) }}</h1>
      <p class="m-0 text-muted-foreground">{{ sesion.nota || 'Sesión sin nota' }}</p>
    </header>

    <AsistenciaList :sesion-id="sesion.id" />
    <article
      v-if="gym.ausentesDe(sesion.id).length || gym.sinMarcarDe(sesion.id).length"
      class="card"
    >
      <h2>Quién no asistió</h2>
      <ul class="m-0 grid list-disc gap-1.5 pl-[1.1rem] text-muted-foreground">
        <li v-for="m in gym.ausentesDe(sesion.id)" :key="m.id">{{ m.nombre }} · ausente</li>
        <li v-for="m in gym.sinMarcarDe(sesion.id)" :key="'s' + m.id">
          {{ m.nombre }} · sin marcar
        </li>
      </ul>
    </article>

    <RegistroSeries
      v-if="gym.miembroActivoId"
      v-model:miembro-id="miembroElegidoId"
      :sesion-id="sesion.id"
    />

    <article v-for="grupo in otros" :key="grupo.miembro.id" class="card">
      <button
        type="button"
        class="mb-2 grid min-h-tap w-full gap-0.5 border-0 bg-transparent p-0 text-left text-inherit"
        @click="miembroElegidoId = grupo.miembro.id"
      >
        <h2>{{ grupo.miembro.nombre }}</h2>
        <p class="m-0 text-[0.85rem] text-muted-foreground">
          Pulsa para anotar o editar sus series.
        </p>
      </button>
      <p v-if="!grupo.series.length" class="m-0 text-muted-foreground">
        Sin series en esta sesión.
      </p>
      <SeriesGruposConsulta v-else :series="grupo.series" />
    </article>
  </section>
  <p v-else>Esa sesión no existe.</p>
</template>
