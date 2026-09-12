<script setup lang="ts">
import { computed } from 'vue'
import { useFitcheckStore } from '@/stores/fitcheck'

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
    <h2>Asistencia</h2>
    <p class="hint">
      Cualquiera puede marcar a cualquiera. Quien aún no tiene Sí/No aparece como sin marcar.
    </p>
    <ul>
      <li v-for="row in rows" :key="row.miembro.id">
        <div>
          <strong>{{ row.miembro.nombre }}</strong>
          <span v-if="!row.marcado" class="muted">Sin marcar</span>
          <span v-else-if="row.presente" class="ok">Presente</span>
          <span v-else class="no">Ausente</span>
        </div>
        <div class="actions">
          <button
            type="button"
            :class="{ on: row.presente === true }"
            @click="gym.marcarAsistencia(sesionId, true, row.miembro.id)"
          >
            Sí
          </button>
          <button
            type="button"
            :class="{ on: row.presente === false }"
            @click="gym.marcarAsistencia(sesionId, false, row.miembro.id)"
          >
            No
          </button>
        </div>
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
}

h2 {
  margin: 0 0 8px;
  font-size: 1.05rem;
}

.hint,
.muted {
  color: var(--text-muted);
}

.hint {
  margin: 0 0 12px;
  font-size: 0.85rem;
  line-height: 1.4;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

li div:first-child {
  display: grid;
  gap: 2px;
}

.ok {
  color: var(--success);
  font-size: 0.85rem;
}

.no {
  color: var(--danger);
  font-size: 0.85rem;
}

.muted {
  font-size: 0.85rem;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.actions button {
  min-height: var(--tap);
  min-width: 52px;
  border: 0;
  border-radius: 10px;
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 700;
}

.actions button.on {
  background: var(--accent-soft);
  color: var(--text);
}
</style>
