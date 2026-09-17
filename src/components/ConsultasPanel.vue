<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatFecha } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const gym = useFitcheckStore()

const sesionId = ref(gym.consultaSesiones[0]?.id ?? '')
const equipoId = ref(gym.equipos[0]?.id ?? '')

watch(
  () => gym.consultaSesiones[0]?.id,
  (id) => {
    if (id && !sesionId.value) sesionId.value = id
  },
)
watch(
  () => gym.equipos[0]?.id,
  (id) => {
    if (id && !equipoId.value) equipoId.value = id
  },
  { immediate: true },
)

watch(
  sesionId,
  (id) => {
    if (id) void gym.cargarSesion(id)
  },
  { immediate: true },
)

const ausentes = computed(() => (sesionId.value ? gym.ausentesDe(sesionId.value) : []))
const sinMarcar = computed(() => (sesionId.value ? gym.sinMarcarDe(sesionId.value) : []))
const noUsaron = computed(() =>
  sesionId.value && equipoId.value ? gym.noUsaronEquipo(sesionId.value, equipoId.value) : [],
)
const nombreEquipo = computed(
  () => gym.equipos.find((e) => e.id === equipoId.value)?.nombre ?? 'ese equipo',
)
</script>

<template>
  <article class="card">
    <h2>Consultas</h2>
    <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
      Ausencias y quién, estando presente, no usó un equipo.
    </p>

    <label class="field">
      Sesión
      <select v-model="sesionId">
        <option v-for="s in gym.consultaSesiones" :key="s.id" :value="s.id">
          {{ formatFecha(s.fecha) }}{{ s.nota ? ` · ${s.nota}` : '' }}
        </option>
      </select>
    </label>

    <template v-if="sesionId">
      <h3>¿Quién no asistió?</h3>
      <p v-if="!ausentes.length && !sinMarcar.length" class="m-0 font-bold text-success">
        Nadie marcado como ausente.
      </p>
      <ul v-else class="m-0 grid list-none gap-1.5 p-0 text-muted-foreground">
        <li v-for="m in ausentes" :key="m.id">{{ m.nombre }} · ausente</li>
        <li v-for="m in sinMarcar" :key="'s' + m.id">{{ m.nombre }} · sin marcar</li>
      </ul>

      <h3>¿Quién no usó un equipo?</h3>
      <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
        Solo se cuenta a quien estuvo presente.
      </p>
      <label class="field">
        Equipo
        <select v-model="equipoId">
          <option v-for="eq in gym.equipos" :key="eq.id" :value="eq.id">{{ eq.nombre }}</option>
        </select>
      </label>
      <p
        v-if="!gym.presentesDe(sesionId).length"
        class="m-0 text-[0.85rem] leading-snug text-muted-foreground"
      >
        Nadie marcado presente en esta sesión.
      </p>
      <p v-else-if="!noUsaron.length" class="m-0 font-bold text-success">
        Todos los presentes usaron {{ nombreEquipo }}.
      </p>
      <ul v-else class="m-0 grid list-none gap-1.5 p-0 text-muted-foreground">
        <li v-for="m in noUsaron" :key="m.id">{{ m.nombre }} no usó {{ nombreEquipo }}</li>
      </ul>
    </template>
  </article>
</template>
