<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export type CatalogListItem = {
  id: string
  title: string
  subtitle?: string
}

const props = withDefaults(
  defineProps<{
    items: CatalogListItem[]
    placeholder?: string
    emptyLabel?: string
    label?: string
  }>(),
  {
    placeholder: 'Buscar',
    emptyLabel: 'Aún no hay ítems',
  },
)

const emit = defineEmits<{
  edit: [id: string]
  remove: [id: string]
}>()

const query = ref('')
const confirmId = ref<string | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLocaleLowerCase('es')
  if (!q) return props.items
  return props.items.filter((item) => item.title.toLocaleLowerCase('es').includes(q))
})

const emptyMessage = computed(() => {
  if (props.items.length === 0) return props.emptyLabel
  return 'Nada coincide'
})

watch(query, () => {
  confirmId.value = null
})

watch(
  () => props.items,
  () => {
    confirmId.value = null
  },
)

function onEdit(id: string) {
  confirmId.value = null
  emit('edit', id)
}

function onRemove(id: string) {
  if (confirmId.value !== id) {
    confirmId.value = id
    return
  }
  confirmId.value = null
  emit('remove', id)
}
</script>

<template>
  <div class="catalog-list">
    <input
      v-model="query"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      autocomplete="off"
      enterkeyhint="search"
    />
    <div class="viewport">
      <p v-if="filtered.length === 0" class="empty">{{ emptyMessage }}</p>
      <ul v-else :aria-label="label">
        <li v-for="item in filtered" :key="item.id">
          <div class="text">
            <strong>{{ item.title }}</strong>
            <small v-if="item.subtitle">{{ item.subtitle }}</small>
          </div>
          <div class="actions">
            <button type="button" class="act" @click="onEdit(item.id)">Editar</button>
            <button type="button" class="act danger" @click="onRemove(item.id)">
              {{ confirmId === item.id ? 'Confirmar' : 'Quitar' }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.catalog-list {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
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
  height: var(--catalog-list-h);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: var(--tap);
  padding: 6px 8px 6px 12px;
  border-bottom: 1px solid var(--border);
}

li:last-child {
  border-bottom: 0;
}

.text {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

strong,
small {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

strong {
  font-size: 0.92rem;
}

small {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.act {
  min-height: var(--tap);
  min-width: var(--tap);
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font-weight: 700;
  font-size: 0.8rem;
}

.act.danger {
  color: var(--danger);
}

.empty {
  margin: 0;
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}
</style>
