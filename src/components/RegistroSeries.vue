<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import EjercicioAcordeon from '@/components/EjercicioAcordeon.vue'
import EjercicioSelector from '@/components/EjercicioSelector.vue'
import NotaChips from '@/components/NotaChips.vue'
import SerieSetRow from '@/components/SerieSetRow.vue'
import StepperControl from '@/components/StepperControl.vue'
import { parseNotaChips, serializeNotaChips } from '@/lib/notaChips'
import { useFitcheckStore } from '@/stores/fitcheck'
import type { Serie } from '@/types/models'

const props = defineProps<{
  sesionId: string
}>()

const miembroId = defineModel<string>('miembroId', { default: '' })
const gym = useFitcheckStore()

watch(
  () => gym.miembroActivoId,
  (id) => {
    if (id && !miembroId.value) miembroId.value = id
  },
  { immediate: true },
)

const elegidoId = computed(() => miembroId.value || gym.miembroActivoId || '')
const elegido = computed(
  () => gym.miembros.find((m) => m.id === elegidoId.value) ?? gym.miembroActivo,
)

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
const cerradoPorClave = ref<Record<string, boolean>>({})

const grupos = computed(() =>
  gym.seriesAgrupadasPorEjercicioEquipo(props.sesionId, elegidoId.value || undefined),
)

function claveGrupo(ejercicioId: string, equipoId: string) {
  return `${ejercicioId}:${equipoId}`
}

function estaAbierto(key: string) {
  return cerradoPorClave.value[key] !== true
}

function toggleGrupo(key: string) {
  cerradoPorClave.value = { ...cerradoPorClave.value, [key]: estaAbierto(key) }
}

function asegurarAbierto(ejercicioId: string, equipoId: string) {
  const key = claveGrupo(ejercicioId, equipoId)
  if (cerradoPorClave.value[key]) {
    const next = { ...cerradoPorClave.value }
    delete next[key]
    cerradoPorClave.value = next
  }
}

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

function elegir(id: string) {
  miembroId.value = id
}

async function guardar() {
  if (!form.ejercicioId || !form.equipoId || !elegidoId.value) return
  await gym.guardarSerie({
    sesionId: props.sesionId,
    miembroId: elegidoId.value,
    ejercicioId: form.ejercicioId,
    equipoId: form.equipoId,
    repeticiones: form.repeticiones,
    pesoKg: form.pesoKg,
    nota: serializeNotaChips(form.chips),
  })
  form.chips = []
  asegurarAbierto(form.ejercicioId, form.equipoId)
  flash('Serie guardada')
}

async function duplicar(serie: Serie) {
  await gym.guardarSerie({
    sesionId: props.sesionId,
    miembroId: elegidoId.value,
    ejercicioId: serie.ejercicio_id,
    equipoId: serie.equipo_id,
    repeticiones: serie.repeticiones,
    pesoKg: serie.peso_kg,
    nota: '',
  })
  form.ejercicioId = serie.ejercicio_id
  form.equipoId = serie.equipo_id
  form.repeticiones = serie.repeticiones
  form.pesoKg = serie.peso_kg
  form.chips = []
  asegurarAbierto(serie.ejercicio_id, serie.equipo_id)
  flash('Serie duplicada')
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
    <h2>Anotar serie</h2>
    <p v-if="feedback" class="ok">{{ feedback }}</p>

    <div>
      <p class="field-label">Anotar a</p>
      <div class="chips" role="group" aria-label="Miembro de la serie">
        <button
          v-for="miembro in gym.miembrosOrdenados"
          :key="miembro.id"
          type="button"
          class="chip"
          :class="{ on: elegidoId === miembro.id }"
          :aria-pressed="elegidoId === miembro.id"
          @click="elegir(miembro.id)"
        >
          {{ miembro.nombre }}
        </button>
      </div>
    </div>

    <div>
      <p class="field-label">Ejercicio</p>
      <EjercicioSelector
        v-model="form.ejercicioId"
        :ejercicios="gym.ejercicios"
        :grupo-de-ejercicio="gym.grupoDeEjercicio"
      />
    </div>

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
  </article>

  <article v-if="grupos.length" class="card">
    <h2>Series de {{ elegido?.nombre ?? 'este miembro' }}</h2>
    <div class="grupos">
      <EjercicioAcordeon
        v-for="grupo in grupos"
        :key="grupo.key"
        :abierto="estaAbierto(grupo.key)"
        :titulo="nombreEjercicio(grupo.ejercicioId)"
        :subtitulo="nombreEquipo(grupo.equipoId)"
        :recuento="grupo.series.length"
        @toggle="toggleGrupo(grupo.key)"
      >
        <SerieSetRow
          v-for="serie in grupo.series"
          :key="serie.id"
          :serie="serie"
          @editar="abrirEdicion"
          @duplicar="duplicar"
        />
      </EjercicioAcordeon>
    </div>
  </article>

  <div v-if="editando" class="overlay" @click.self="editando = null">
    <div class="sheet" role="dialog" aria-label="Editar serie">
      <h2>Editar serie</h2>
      <div>
        <p class="field-label">Ejercicio</p>
        <EjercicioSelector
          v-model="editando.ejercicio_id"
          :ejercicios="gym.ejercicios"
          :grupo-de-ejercicio="gym.grupoDeEjercicio"
        />
      </div>
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

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  min-height: var(--tap);
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 700;
}

.chip.on {
  border-color: transparent;
  background: var(--accent-soft);
  color: var(--text);
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

.grupos {
  display: grid;
  gap: 10px;
}

.danger {
  background: transparent;
  color: var(--danger);
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
