<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import NotaChips from '@/components/NotaChips.vue'
import StepperControl from '@/components/StepperControl.vue'
import { parseNotaChips, serializeNotaChips } from '@/lib/notaChips'
import { useFitcheckStore } from '@/stores/fitcheck'
import type { Serie } from '@/types/models'

const props = defineProps<{
  sesionId: string
}>()

const gym = useFitcheckStore()

const form = reactive({
  ejercicioId: gym.ejercicios[0]?.id ?? '',
  equipoId: gym.equipos[0]?.id ?? '',
  repeticiones: 8,
  pesoKg: 20,
  chips: [] as string[],
})

const feedback = ref('')
const editando = ref<Serie | null>(null)
const editChips = ref<string[]>([])
const confirmarBorrado = ref(false)

const mias = computed(() => gym.seriesDe(props.sesionId, gym.miembroActivoId ?? undefined))

function nombreEjercicio(id: string) {
  return gym.ejercicios.find((e) => e.id === id)?.nombre ?? id
}

function nombreEquipo(id: string) {
  return gym.equipos.find((e) => e.id === id)?.nombre ?? id
}

function flash(text: string) {
  feedback.value = text
  window.setTimeout(() => {
    if (feedback.value === text) feedback.value = ''
  }, 1200)
}

async function guardar() {
  if (!form.ejercicioId || !form.equipoId) return
  await gym.guardarSerie({
    sesionId: props.sesionId,
    ejercicioId: form.ejercicioId,
    equipoId: form.equipoId,
    repeticiones: form.repeticiones,
    pesoKg: form.pesoKg,
    nota: serializeNotaChips(form.chips),
  })
  form.chips = []
  flash('Serie guardada')
}

async function repetir() {
  const last = gym.ultimaSeriePropia(props.sesionId)
  if (!last) return
  await gym.guardarSerie({
    sesionId: props.sesionId,
    ejercicioId: last.ejercicio_id,
    equipoId: last.equipo_id,
    repeticiones: last.repeticiones,
    pesoKg: last.peso_kg,
    nota: '',
  })
  form.ejercicioId = last.ejercicio_id
  form.equipoId = last.equipo_id
  form.repeticiones = last.repeticiones
  form.pesoKg = last.peso_kg
  form.chips = []
  flash('Serie repetida')
}

function abrirEdicion(serie: Serie) {
  editando.value = { ...serie }
  editChips.value = parseNotaChips(serie.nota)
  confirmarBorrado.value = false
}

async function guardarEdicion() {
  if (!editando.value) return
  await gym.editarSerie(editando.value.id, {
    ejercicioId: editando.value.ejercicio_id,
    equipoId: editando.value.equipo_id,
    repeticiones: editando.value.repeticiones,
    pesoKg: editando.value.peso_kg,
    nota: serializeNotaChips(editChips.value),
  })
  editando.value = null
  flash('Serie actualizada')
}

async function borrar() {
  if (!editando.value) return
  if (!confirmarBorrado.value) {
    confirmarBorrado.value = true
    return
  }
  await gym.borrarSerie(editando.value.id)
  editando.value = null
  confirmarBorrado.value = false
  flash('Serie borrada')
}
</script>

<template>
  <article class="card">
    <h2>Tu serie</h2>
    <p v-if="feedback" class="ok">{{ feedback }}</p>

    <label>
      Ejercicio
      <select v-model="form.ejercicioId">
        <option v-for="ej in gym.ejercicios" :key="ej.id" :value="ej.id">
          {{ ej.nombre }} · {{ gym.grupoDeEjercicio(ej.id) }}
        </option>
      </select>
    </label>

    <label>
      Equipo
      <select v-model="form.equipoId">
        <option v-for="eq in gym.equipos" :key="eq.id" :value="eq.id">{{ eq.nombre }}</option>
      </select>
    </label>

    <div class="pair">
      <StepperControl v-model="form.repeticiones" label="Reps" :min="1" />
      <StepperControl v-model="form.pesoKg" label="Peso kg" :step="2.5" :min="0" />
    </div>

    <div>
      <p class="field-label">Marcas</p>
      <NotaChips v-model="form.chips" />
    </div>

    <button class="primary" type="button" @click="guardar">Guardar serie</button>
    <button class="ghost" type="button" :disabled="!gym.ultimaSeriePropia(sesionId)" @click="repetir">
      Repetir última
    </button>
  </article>

  <article v-if="mias.length" class="card">
    <h2>Tus series</h2>
    <ul>
      <li v-for="serie in mias" :key="serie.id">
        <button type="button" class="row" @click="abrirEdicion(serie)">
          <span class="tabular">{{ serie.numero_serie }}</span>
          <span>
            <strong>{{ nombreEjercicio(serie.ejercicio_id) }}</strong>
            <small>{{ serie.repeticiones }} × {{ serie.peso_kg }} kg · {{ nombreEquipo(serie.equipo_id) }}</small>
            <small v-if="serie.nota">{{ serie.nota }}</small>
          </span>
        </button>
      </li>
    </ul>
  </article>

  <div v-if="editando" class="overlay" @click.self="editando = null">
    <div class="sheet" role="dialog" aria-label="Editar serie">
      <h2>Editar serie</h2>
      <label>
        Ejercicio
        <select v-model="editando.ejercicio_id">
          <option v-for="ej in gym.ejercicios" :key="ej.id" :value="ej.id">{{ ej.nombre }}</option>
        </select>
      </label>
      <label>
        Equipo
        <select v-model="editando.equipo_id">
          <option v-for="eq in gym.equipos" :key="eq.id" :value="eq.id">{{ eq.nombre }}</option>
        </select>
      </label>
      <div class="pair">
        <StepperControl v-model="editando.repeticiones" label="Reps" :min="1" />
        <StepperControl v-model="editando.peso_kg" label="Peso kg" :step="2.5" :min="0" />
      </div>
      <div>
        <p class="field-label">Marcas</p>
        <NotaChips v-model="editChips" />
      </div>
      <button class="primary" type="button" @click="guardarEdicion">Guardar cambios</button>
      <button class="danger" type="button" @click="borrar">
        {{ confirmarBorrado ? 'Confirmar borrado' : 'Borrar' }}
      </button>
      <button class="ghost" type="button" @click="editando = null">Cerrar</button>
    </div>
  </div>
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

h2 {
  margin: 0;
  font-size: 1.05rem;
}

.ok {
  margin: 0;
  color: var(--success);
  font-weight: 700;
}

label,
.field-label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9rem;
}

.field-label {
  margin: 0 0 6px;
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

.primary,
.ghost,
.danger {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  font-weight: 700;
}

.primary {
  background: var(--accent);
  color: #06210f;
}

.ghost {
  background: var(--surface-2);
  color: var(--text);
}

.ghost:disabled {
  opacity: 0.45;
}

.danger {
  background: transparent;
  color: var(--danger);
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.row {
  width: 100%;
  min-height: var(--tap);
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  text-align: left;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: inherit;
  padding: 8px 10px;
}

.row span:first-child {
  font-weight: 800;
  color: var(--accent);
}

.row strong,
.row small {
  display: block;
}

.row small {
  color: var(--text-muted);
  font-weight: 500;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  align-items: end;
  z-index: 20;
}

.sheet {
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  padding: 16px 16px calc(16px + var(--safe-bottom));
  display: grid;
  gap: 12px;
  max-height: 85dvh;
  overflow: auto;
}
</style>
