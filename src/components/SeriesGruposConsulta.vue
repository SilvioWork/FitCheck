<script setup lang="ts">
import { computed, ref } from 'vue'
import EjercicioAcordeon from '@/components/EjercicioAcordeon.vue'
import SerieConsultaRow from '@/components/SerieConsultaRow.vue'
import { agruparSeriesPorEjercicioEquipo } from '@/lib/seriesGrupos'
import { useFitcheckStore } from '@/stores/fitcheck'
import type { Serie } from '@/types/models'

const props = defineProps<{
  series: Serie[]
}>()

const gym = useFitcheckStore()
const abiertoPorClave = ref<Record<string, boolean>>({})

const grupos = computed(() => agruparSeriesPorEjercicioEquipo(props.series))

function estaAbierto(key: string) {
  return abiertoPorClave.value[key] === true
}

function toggleGrupo(key: string) {
  abiertoPorClave.value = { ...abiertoPorClave.value, [key]: !estaAbierto(key) }
}

function nombreEjercicio(id: string) {
  return gym.ejercicios.find((e) => e.id === id)?.nombre ?? id
}

function nombreEquipo(id: string) {
  return gym.equipos.find((e) => e.id === id)?.nombre ?? id
}
</script>

<template>
  <div v-if="grupos.length" class="grupos">
    <EjercicioAcordeon
      v-for="grupo in grupos"
      :key="grupo.key"
      :abierto="estaAbierto(grupo.key)"
      :titulo="nombreEjercicio(grupo.ejercicioId)"
      :subtitulo="nombreEquipo(grupo.equipoId)"
      :recuento="grupo.series.length"
      @toggle="toggleGrupo(grupo.key)"
    >
      <SerieConsultaRow v-for="serie in grupo.series" :key="serie.id" :serie="serie" />
    </EjercicioAcordeon>
  </div>
</template>

<style scoped>
.grupos {
  display: grid;
  gap: 10px;
}
</style>
