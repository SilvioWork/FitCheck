<script setup lang="ts">
defineProps<{
  abierto: boolean
  titulo: string
  subtitulo: string
  recuento: number
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div class="acc" role="region" :aria-label="`Series de ${titulo} · ${subtitulo}`">
    <button
      type="button"
      class="head"
      :aria-expanded="abierto"
      :aria-label="`${titulo} · ${subtitulo}`"
      @click="$emit('toggle')"
    >
      <span>
        <strong>{{ titulo }}</strong>
        <small>{{ subtitulo }} · {{ recuento }} {{ recuento === 1 ? 'serie' : 'series' }}</small>
      </span>
      <span class="chev" :class="{ open: abierto }" aria-hidden="true">▾</span>
    </button>
    <div v-show="abierto" class="panel">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.acc {
  display: grid;
  gap: 8px;
}

.head {
  width: 100%;
  min-height: var(--tap);
  display: grid;
  grid-template-columns: 1fr 28px;
  gap: 8px;
  align-items: center;
  text-align: left;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: inherit;
  padding: 8px 10px;
}

.head strong,
.head small {
  display: block;
}

.head small {
  color: var(--text-muted);
  font-weight: 500;
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

.panel {
  display: grid;
  gap: 8px;
  padding-left: 2px;
}
</style>
