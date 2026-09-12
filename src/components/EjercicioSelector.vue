<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Ejercicio } from '@/types/models'

const props = defineProps<{
  ejercicios: Ejercicio[]
  grupoDeEjercicio: (id: string) => string
}>()

const model = defineModel<string>({ required: true })

const query = ref('')
const abierto = ref(false)

const filtered = computed(() => {
  const q = query.value.trim().toLocaleLowerCase('es')
  if (!q) return props.ejercicios
  return props.ejercicios.filter((ej) => ej.nombre.toLocaleLowerCase('es').includes(q))
})

const seleccionado = computed(() => {
  return props.ejercicios.find((ej) => ej.id === model.value)
})

watch(abierto, (open) => {
  if (open) {
    query.value = ''
  }
})

function seleccionar(id: string) {
  model.value = id
  abierto.value = false
  query.value = ''
}

function toggle() {
  abierto.value = !abierto.value
}
</script>

<template>
  <div class="ejercicio-selector">
    <button type="button" class="trigger" @click="toggle">
      <span v-if="seleccionado" class="seleccion">
        <strong>{{ seleccionado.nombre }}</strong>
        <small>{{ grupoDeEjercicio(seleccionado.id) }}</small>
      </span>
      <span v-else class="placeholder">Selecciona un ejercicio</span>
      <span class="chev" :class="{ open: abierto }" aria-hidden="true">▾</span>
    </button>

    <div v-if="abierto" class="dropdown">
      <input
        v-model="query"
        type="search"
        placeholder="Buscar ejercicio"
        aria-label="Buscar ejercicio"
        autocomplete="off"
        enterkeyhint="search"
      />
      <div class="viewport">
        <p v-if="filtered.length === 0" class="empty">Nada coincide</p>
        <ul v-else aria-label="Lista de ejercicios">
          <li v-for="ej in filtered" :key="ej.id">
            <button type="button" class="opcion" @click="seleccionar(ej.id)">
              <strong>{{ ej.nombre }}</strong>
              <small>{{ grupoDeEjercicio(ej.id) }}</small>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="abierto" class="backdrop" @click="abierto = false" />
  </div>
</template>

<style scoped>
.ejercicio-selector {
  position: relative;
}

.trigger {
  width: 100%;
  min-height: var(--tap);
  display: grid;
  grid-template-columns: 1fr 28px;
  gap: 8px;
  align-items: center;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  padding: 8px 10px;
}

.seleccion {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.seleccion strong,
.seleccion small {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seleccion strong {
  font-size: 0.95rem;
}

.seleccion small {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.placeholder {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.chev {
  justify-self: center;
  color: var(--accent);
  font-size: 0.85rem;
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}

.chev.open {
  transform: rotate(0deg);
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 9;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
}

input {
  width: 100%;
  min-height: var(--tap);
  margin: 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  appearance: none;
  background: var(--bg);
  color: var(--text);
  padding: 0 12px;
  outline: none;
}

input:focus,
input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.viewport {
  max-height: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.opcion {
  width: 100%;
  display: grid;
  gap: 2px;
  text-align: left;
  min-height: var(--tap);
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
}

li:last-child .opcion {
  border-bottom: 0;
}

.opcion:hover,
.opcion:focus {
  background: var(--surface-2);
}

.opcion strong,
.opcion small {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.opcion strong {
  font-size: 0.92rem;
}

.opcion small {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.empty {
  margin: 0;
  min-height: 100px;
  display: grid;
  place-items: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}
</style>
