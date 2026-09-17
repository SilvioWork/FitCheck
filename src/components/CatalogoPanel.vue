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
    <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
      Busca por nombre. Editar o quitar en cada fila. Si ya hay series, no se puede borrar.
    </p>

    <h3 class="pt-1">Equipos</h3>
    <CatalogList
      :items="equiposItems"
      label="Equipos"
      placeholder="Buscar equipo"
      empty-label="No hay equipos"
      @edit="editarEquipoPorId"
      @remove="gym.borrarEquipo"
    />
    <label class="field">
      Nombre
      <input
        v-model="equipoNombre"
        class="field-input"
        type="text"
        maxlength="60"
        placeholder="Máquina press banca Technogym"
      />
    </label>
    <label class="field">
      Descripción (opcional)
      <input v-model="equipoDesc" class="field-input" type="text" maxlength="80" />
    </label>
    <button class="btn-ghost" type="button" :disabled="!equipoNombre.trim()" @click="addEquipo">
      Añadir equipo
    </button>

    <h3 class="pt-1">Ejercicios</h3>
    <CatalogList
      :items="ejerciciosItems"
      label="Ejercicios"
      placeholder="Buscar ejercicio"
      empty-label="No hay ejercicios"
      @edit="editarEjercicioPorId"
      @remove="gym.borrarEjercicio"
    />
    <label class="field">
      Nombre
      <input
        v-model="ejercicioNombre"
        class="field-input"
        type="text"
        maxlength="60"
        placeholder="Press banca"
      />
    </label>
    <label class="field">
      Grupo muscular
      <select v-model="ejercicioGrupo">
        <option v-for="g in gruposOrden" :key="g.id" :value="g.id">{{ g.nombre }}</option>
      </select>
    </label>
    <button
      class="btn-ghost"
      type="button"
      :disabled="!ejercicioNombre.trim() || !ejercicioGrupo"
      @click="addEjercicio"
    >
      Añadir ejercicio
    </button>

    <h3 class="pt-1">Grupos musculares</h3>
    <CatalogList
      :items="gruposItems"
      label="Grupos musculares"
      placeholder="Buscar grupo"
      empty-label="No hay grupos"
      @edit="editarGrupoPorId"
      @remove="gym.borrarGrupo"
    />
    <label class="field">
      Nombre
      <input
        v-model="grupoNombre"
        class="field-input"
        type="text"
        maxlength="40"
        placeholder="Core"
      />
    </label>
    <button class="btn-ghost" type="button" :disabled="!grupoNombre.trim()" @click="addGrupo">
      Añadir grupo
    </button>
  </article>

  <div v-if="editando" class="overlay" @click.self="editando = null">
    <div class="sheet" role="dialog" aria-label="Editar catálogo">
      <h2>Editar</h2>
      <template v-if="editando.kind === 'equipo'">
        <label class="field">
          Nombre
          <input v-model="editando.nombre" class="field-input" type="text" maxlength="60" />
        </label>
        <label class="field">
          Descripción
          <input v-model="editando.descripcion" class="field-input" type="text" maxlength="80" />
        </label>
      </template>
      <template v-else-if="editando.kind === 'ejercicio'">
        <label class="field">
          Nombre
          <input v-model="editando.nombre" class="field-input" type="text" maxlength="60" />
        </label>
        <label class="field">
          Grupo muscular
          <select v-model="editando.grupoId">
            <option v-for="g in gruposOrden" :key="g.id" :value="g.id">{{ g.nombre }}</option>
          </select>
        </label>
      </template>
      <template v-else>
        <label class="field">
          Nombre
          <input v-model="editando.nombre" class="field-input" type="text" maxlength="40" />
        </label>
      </template>
      <button class="btn-primary" type="button" @click="guardarEdicion">Guardar</button>
      <button class="btn-ghost" type="button" @click="editando = null">Cerrar</button>
    </div>
  </div>
</template>
