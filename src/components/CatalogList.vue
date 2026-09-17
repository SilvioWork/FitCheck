<script setup lang="ts">
import { Inbox, Pencil, SearchX, Trash2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

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
  <div
    class="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-sm border border-border bg-muted"
  >
    <input
      v-model="query"
      class="m-0 min-h-tap w-full appearance-none rounded-t-sm border-0 border-b border-border bg-background px-3 text-foreground outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      autocomplete="off"
      enterkeyhint="search"
    />
    <div class="h-catalog overflow-y-auto overscroll-contain">
      <p
        v-if="filtered.length === 0"
        class="m-0 grid min-h-full place-items-center gap-2 p-4 text-center text-[0.85rem] font-semibold text-muted-foreground"
      >
        <AppIcon :icon="props.items.length === 0 ? Inbox : SearchX" class="text-muted-foreground" />
        {{ emptyMessage }}
      </p>
      <ul v-else class="m-0 list-none p-0" :aria-label="label">
        <li
          v-for="item in filtered"
          :key="item.id"
          class="flex min-h-tap items-center justify-between gap-2 border-b border-border py-1.5 pr-2 pl-3 last:border-b-0"
        >
          <div class="grid min-w-0 flex-1 gap-px">
            <strong class="block truncate text-[0.92rem]">{{ item.title }}</strong>
            <small
              v-if="item.subtitle"
              class="block truncate text-xs font-medium text-muted-foreground"
            >
              {{ item.subtitle }}
            </small>
          </div>
          <div class="flex shrink-0 gap-1">
            <button
              type="button"
              class="inline-flex min-h-tap min-w-tap items-center justify-center rounded-[10px] border-0 bg-card px-2.5 text-[0.8rem] font-bold text-foreground"
              aria-label="Editar"
              @click="onEdit(item.id)"
            >
              <AppIcon :icon="Pencil" size="sm" />
              <span class="sr-only">Editar</span>
            </button>
            <button
              type="button"
              class="inline-flex min-h-tap min-w-tap items-center justify-center rounded-[10px] border-0 bg-card px-2.5 text-[0.8rem] font-bold text-danger"
              :aria-label="confirmId === item.id ? 'Confirmar' : 'Quitar'"
              @click="onRemove(item.id)"
            >
              <template v-if="confirmId === item.id">Confirmar</template>
              <template v-else>
                <AppIcon :icon="Trash2" size="sm" />
                <span class="sr-only">Quitar</span>
              </template>
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
