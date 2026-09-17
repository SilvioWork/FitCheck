<script setup lang="ts">
import { computed } from 'vue'
import { useFitcheckStore } from '@/stores/fitcheck'
import { cn } from '@/lib/cn'

const props = defineProps<{
  sesionId: string
}>()

const gym = useFitcheckStore()

const rows = computed(() =>
  gym.miembros.map((miembro) => {
    const row = gym.asistenciaDe(props.sesionId).find((a) => a.miembro_id === miembro.id)
    return {
      miembro,
      presente: row?.presente,
      marcado: Boolean(row),
    }
  }),
)
</script>

<template>
  <article class="card">
    <h2 class="mb-2">Asistencia</h2>
    <p class="mb-3 text-[0.85rem] leading-snug text-muted-foreground">
      Cualquiera puede marcar a cualquiera. Quien aún no tiene Sí/No aparece como sin marcar.
    </p>
    <ul class="m-0 grid list-none gap-2.5 p-0">
      <li v-for="row in rows" :key="row.miembro.id" class="flex items-center justify-between gap-3">
        <div class="grid gap-0.5">
          <strong>{{ row.miembro.nombre }}</strong>
          <span v-if="!row.marcado" class="text-[0.85rem] text-muted-foreground">Sin marcar</span>
          <span v-else-if="row.presente" class="text-[0.85rem] text-success">Presente</span>
          <span v-else class="text-[0.85rem] text-danger">Ausente</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            :class="
              cn(
                'min-h-tap min-w-[52px] rounded-[10px] border-0 font-bold',
                row.presente === true
                  ? 'bg-accent-soft text-foreground'
                  : 'bg-muted text-muted-foreground',
              )
            "
            @click="gym.marcarAsistencia(sesionId, true, row.miembro.id)"
          >
            Sí
          </button>
          <button
            type="button"
            :class="
              cn(
                'min-h-tap min-w-[52px] rounded-[10px] border-0 font-bold',
                row.presente === false
                  ? 'bg-accent-soft text-foreground'
                  : 'bg-muted text-muted-foreground',
              )
            "
            @click="gym.marcarAsistencia(sesionId, false, row.miembro.id)"
          >
            No
          </button>
        </div>
      </li>
    </ul>
  </article>
</template>
