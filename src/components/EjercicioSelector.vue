<script setup lang="ts">
import { ChevronDown, SearchX } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { Ejercicio } from '@/types/models'
import { cn } from '@/lib/cn'

const props = defineProps<{
  ejercicios: Ejercicio[]
  grupoDeEjercicio: (id: string) => string
}>()

const model = defineModel<string>({ required: true })

const root = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')
const abierto = ref(false)
const pointerStartY = ref<number | null>(null)
const fueScroll = ref(false)
let ignoreToggleUntil = 0

const filtered = computed(() => {
  const q = query.value.trim().toLocaleLowerCase('es')
  if (!q) return props.ejercicios
  return props.ejercicios.filter((ej) => ej.nombre.toLocaleLowerCase('es').includes(q))
})

const seleccionado = computed(() => {
  return props.ejercicios.find((ej) => ej.id === model.value)
})

function abrir() {
  query.value = ''
  abierto.value = true
  fueScroll.value = false
  pointerStartY.value = null
}

function cerrar() {
  abierto.value = false
  query.value = ''
  fueScroll.value = false
  pointerStartY.value = null
  ignoreToggleUntil = Date.now() + 350
}

function toggle(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (Date.now() < ignoreToggleUntil) return
  if (abierto.value) cerrar()
  else abrir()
}

function seleccionar(id: string) {
  model.value = id
  cerrar()
}

function isInsideRoot(event: Event) {
  const rootEl = root.value
  if (!rootEl) return false
  if (event.composedPath().includes(rootEl)) return true
  const target = event.target
  return target instanceof Node && rootEl.contains(target)
}

function onDocPointerDown(event: PointerEvent) {
  if (!abierto.value) return
  if (isInsideRoot(event)) return
  cerrar()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && abierto.value) cerrar()
}

function marcarScroll() {
  fueScroll.value = true
}

function onListaPointerDown(event: PointerEvent) {
  pointerStartY.value = event.clientY
  fueScroll.value = false
  if (event.target !== searchInput.value) {
    searchInput.value?.blur()
  }
}

function onListaPointerMove(event: PointerEvent) {
  if (pointerStartY.value == null) return
  if (Math.abs(event.clientY - pointerStartY.value) > 8) marcarScroll()
}

function onOpcionPointerUp(id: string, event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (fueScroll.value) return
  if (pointerStartY.value != null && Math.abs(event.clientY - pointerStartY.value) > 8) return
  seleccionar(id)
}

function onOpcionClick(id: string, event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (!abierto.value || fueScroll.value) return
  seleccionar(id)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="relative" data-testid="ejercicio-selector">
    <button
      type="button"
      class="grid min-h-tap w-full grid-cols-[1fr_28px] items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-2 text-left text-foreground"
      data-testid="ejercicio-selector-trigger"
      aria-label="Ejercicio"
      aria-haspopup="listbox"
      :aria-expanded="abierto"
      @click="toggle"
    >
      <span v-if="seleccionado" class="grid min-w-0 gap-0.5">
        <strong class="block truncate text-[0.95rem]">{{ seleccionado.nombre }}</strong>
        <small class="block truncate text-xs font-medium text-muted-foreground">
          {{ grupoDeEjercicio(seleccionado.id) }}
        </small>
      </span>
      <span v-else class="text-[0.95rem] text-muted-foreground">Selecciona un ejercicio</span>
      <AppIcon
        :icon="ChevronDown"
        size="sm"
        :class="
          cn(
            'justify-self-center text-accent transition-transform duration-150',
            abierto ? 'rotate-0' : '-rotate-90',
          )
        "
      />
    </button>

    <div
      v-if="abierto"
      class="absolute top-[calc(100%+4px)] right-0 left-0 z-10 grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-sm border border-border bg-card shadow-card"
      role="listbox"
      aria-label="Lista de ejercicios"
      @pointerdown.stop
      @click.stop
      @wheel.stop
    >
      <input
        ref="searchInput"
        v-model="query"
        class="m-0 min-h-tap w-full appearance-none rounded-t-sm border-0 border-b border-border bg-background px-3 text-foreground outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
        type="search"
        placeholder="Buscar ejercicio"
        aria-label="Buscar ejercicio"
        autocomplete="off"
        enterkeyhint="search"
      />
      <div
        class="max-h-[280px] min-h-0 overflow-y-auto overscroll-contain touch-pan-y"
        @pointerdown="onListaPointerDown"
        @pointermove="onListaPointerMove"
        @scroll.passive="marcarScroll"
        @wheel.stop
      >
        <p
          v-if="filtered.length === 0"
          class="m-0 grid min-h-[100px] place-items-center gap-2 p-4 text-center text-[0.85rem] font-semibold text-muted-foreground"
        >
          <AppIcon :icon="SearchX" class="text-muted-foreground" />
          Nada coincide
        </p>
        <ul v-else class="m-0 list-none p-0">
          <li v-for="ej in filtered" :key="ej.id" class="border-b border-border last:border-b-0">
            <button
              type="button"
              class="grid min-h-tap w-full touch-pan-y gap-0.5 border-0 bg-card px-3 py-2 text-left text-inherit hover:bg-muted focus:bg-muted"
              role="option"
              :aria-selected="ej.id === model"
              @pointerup="onOpcionPointerUp(ej.id, $event)"
              @click="onOpcionClick(ej.id, $event)"
            >
              <strong class="block truncate text-[0.92rem]">{{ ej.nombre }}</strong>
              <small class="block truncate text-xs font-medium text-muted-foreground">
                {{ grupoDeEjercicio(ej.id) }}
              </small>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
