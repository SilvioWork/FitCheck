<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CatalogList from '@/components/CatalogList.vue'
import { useFitcheckStore } from '@/stores/fitcheck'
import type { Ejercicio, Equipo, GrupoMuscular } from '@/types/models'

const gym = useFitcheckStore()

const equipoNombre = ref('')
const equipoDesc = ref('')
const ejercicioNombre = ref('')
const ejercicioGrupo = ref('')
const grupoNombre = ref('')

watch(
  () => gym.grupos[0]?.id,
  (id) => {
    if (id && !ejercicioGrupo.value) ejercicioGrupo.value = id
  },
  { immediate: true },
)

const equiposOrden = computed(() =>
  [...gym.equipos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
)
const ejerciciosOrden = computed(() =>
  [...gym.ejercicios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
)
const gruposOrden = computed(() =>
  [...gym.grupos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
)

const equiposItems = computed(() =>
  equiposOrden.value.map((eq) => ({
    id: eq.id,
    title: eq.nombre,
    subtitle: eq.descripcion ?? undefined,
  })),
)
const ejerciciosItems = computed(() =>
  ejerciciosOrden.value.map((ej) => ({
    id: ej.id,
    title: ej.nombre,
    subtitle: gym.grupoDeEjercicio(ej.id) || undefined,
  })),
)
const gruposItems = computed(() =>
  gruposOrden.value.map((g) => ({
    id: g.id,
    title: g.nombre,
  })),
)

type EditState =
  | { kind: 'equipo'; item: Equipo; nombre: string; descripcion: string }
  | { kind: 'ejercicio'; item: Ejercicio; nombre: string; grupoId: string }
  | { kind: 'grupo'; item: GrupoMuscular; nombre: string }

const editando = ref<EditState | null>(null)

async function addEquipo() {
  if (!equipoNombre.value.trim()) return
  await gym.crearEquipo(equipoNombre.value, equipoDesc.value)
  equipoNombre.value = ''
  equipoDesc.value = ''
}

async function addEjercicio() {
  if (!ejercicioNombre.value.trim() || !ejercicioGrupo.value) return
  await gym.crearEjercicio(ejercicioNombre.value, ejercicioGrupo.value)
  ejercicioNombre.value = ''
}

async function addGrupo() {
  if (!grupoNombre.value.trim()) return
  await gym.crearGrupo(grupoNombre.value)
  grupoNombre.value = ''
}

function editarEquipo(item: Equipo) {
  editando.value = {
    kind: 'equipo',
    item,
    nombre: item.nombre,
    descripcion: item.descripcion ?? '',
  }
}

function editarEjercicio(item: Ejercicio) {
  editando.value = {
    kind: 'ejercicio',
    item,
    nombre: item.nombre,
    grupoId: item.grupo_muscular_id,
  }
}

function editarGrupo(item: GrupoMuscular) {
  editando.value = { kind: 'grupo', item, nombre: item.nombre }
}

function editarEquipoPorId(id: string) {
  const item = gym.equipos.find((eq) => eq.id === id)
  if (item) editarEquipo(item)
}

function editarEjercicioPorId(id: string) {
  const item = gym.ejercicios.find((ej) => ej.id === id)
  if (item) editarEjercicio(item)
}

function editarGrupoPorId(id: string) {
  const item = gym.grupos.find((g) => g.id === id)
  if (item) editarGrupo(item)
}

async function guardarEdicion() {
  const draft = editando.value
  if (!draft) return
  if (draft.kind === 'equipo') {
    await gym.editarEquipo(draft.item.id, draft.nombre, draft.descripcion)
  } else if (draft.kind === 'ejercicio') {
    await gym.editarEjercicio(draft.item.id, draft.nombre, draft.grupoId)
  } else {
    await gym.editarGrupo(draft.item.id, draft.nombre)
  }
  editando.value = null
}
</script>

<template>
  <article class="card">
    <h2>Catálogo</h2>
    <p class="hint">
      Busca por nombre. Editar o quitar en cada fila. Si ya hay series, no se puede borrar.
    </p>

    <h3>Equipos</h3>
    <CatalogList
      :items="equiposItems"
      label="Equipos"
      placeholder="Buscar equipo"
      empty-label="No hay equipos"
      @edit="editarEquipoPorId"
      @remove="gym.borrarEquipo"
    />
    <label>
      Nombre
      <input v-model="equipoNombre" type="text" maxlength="60" placeholder="Máquina press banca Technogym" />
    </label>
    <label>
      Descripción (opcional)
      <input v-model="equipoDesc" type="text" maxlength="80" />
    </label>
    <button class="ghost" type="button" :disabled="!equipoNombre.trim()" @click="addEquipo">Añadir equipo</button>

    <h3>Ejercicios</h3>
    <CatalogList
      :items="ejerciciosItems"
      label="Ejercicios"
      placeholder="Buscar ejercicio"
      empty-label="No hay ejercicios"
      @edit="editarEjercicioPorId"
      @remove="gym.borrarEjercicio"
    />
    <label>
      Nombre
      <input v-model="ejercicioNombre" type="text" maxlength="60" placeholder="Press banca" />
    </label>
    <label>
      Grupo muscular
      <select v-model="ejercicioGrupo">
        <option v-for="g in gruposOrden" :key="g.id" :value="g.id">{{ g.nombre }}</option>
      </select>
    </label>
    <button class="ghost" type="button" :disabled="!ejercicioNombre.trim() || !ejercicioGrupo" @click="addEjercicio">
      Añadir ejercicio
    </button>

    <h3>Grupos musculares</h3>
    <CatalogList
      :items="gruposItems"
      label="Grupos musculares"
      placeholder="Buscar grupo"
      empty-label="No hay grupos"
      @edit="editarGrupoPorId"
      @remove="gym.borrarGrupo"
    />
    <label>
      Nombre
      <input v-model="grupoNombre" type="text" maxlength="40" placeholder="Core" />
    </label>
    <button class="ghost" type="button" :disabled="!grupoNombre.trim()" @click="addGrupo">Añadir grupo</button>
  </article>

  <div v-if="editando" class="overlay" @click.self="editando = null">
    <div class="sheet" role="dialog" aria-label="Editar catálogo">
      <h2>Editar</h2>
      <template v-if="editando.kind === 'equipo'">
        <label>
          Nombre
          <input v-model="editando.nombre" type="text" maxlength="60" />
        </label>
        <label>
          Descripción
          <input v-model="editando.descripcion" type="text" maxlength="80" />
        </label>
      </template>
      <template v-else-if="editando.kind === 'ejercicio'">
        <label>
          Nombre
          <input v-model="editando.nombre" type="text" maxlength="60" />
        </label>
        <label>
          Grupo muscular
          <select v-model="editando.grupoId">
            <option v-for="g in gruposOrden" :key="g.id" :value="g.id">{{ g.nombre }}</option>
          </select>
        </label>
      </template>
      <template v-else>
        <label>
          Nombre
          <input v-model="editando.nombre" type="text" maxlength="40" />
        </label>
      </template>
      <button class="primary" type="button" @click="guardarEdicion">Guardar</button>
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

h2,
h3,
.hint {
  margin: 0;
}

h2 {
  font-size: 1.05rem;
}

h3 {
  font-size: 0.95rem;
  padding-top: 4px;
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

.ghost,
.primary {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  font-weight: 700;
}

.ghost {
  background: var(--surface-2);
  color: var(--text);
}

.ghost:disabled {
  opacity: 0.45;
}

.primary {
  background: var(--accent);
  color: #06210f;
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
}
</style>
