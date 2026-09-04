<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()

const open = ref(false)
const confirm = ref(false)

function toggle() {
  open.value = !open.value
  confirm.value = false
}

function onEdit() {
  open.value = false
  confirm.value = false
  emit('edit')
}

function onRemove() {
  open.value = true
  if (!confirm.value) {
    confirm.value = true
    return
  }
  emit('remove')
  confirm.value = false
  open.value = false
}
</script>

<template>
  <div class="chip" :class="{ open }" @click="toggle">
    <span class="text">
      <strong>{{ title }}</strong>
      <small v-if="subtitle">{{ subtitle }}</small>
    </span>
    <div class="menu" @click.stop>
      <button type="button" class="act" @click="onEdit">Editar</button>
      <button type="button" class="act danger" @click="onRemove">
        {{ confirm ? 'Confirmar' : 'Quitar' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: var(--tap);
  max-width: 100%;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--text);
  cursor: pointer;
  z-index: 0;
}

.chip:hover,
.chip.open {
  z-index: 8;
}

.text {
  display: grid;
  gap: 1px;
  min-width: 0;
}

strong,
small {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

small {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.menu {
  position: absolute;
  left: 0;
  top: calc(100% - 2px);
  display: none;
  gap: 4px;
  padding: 8px 0 0;
  z-index: 9;
}

.chip:hover .menu,
.chip.open .menu {
  display: flex;
}

.act {
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-weight: 700;
  font-size: 0.8rem;
  box-shadow: var(--shadow);
  white-space: nowrap;
}

.act.danger {
  color: var(--danger);
}
</style>
