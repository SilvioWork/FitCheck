<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/', label: 'Hoy' },
  { to: '/historial', label: 'Historial' },
  { to: '/ajustes', label: 'Ajustes' },
] as const

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <nav class="nav" aria-label="Principal">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tab"
      :class="{ 'tab-active': isActive(tab.to) }"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px 12px calc(8px + var(--safe-bottom));
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.tab {
  min-height: var(--tap);
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
}

.tab-active {
  color: var(--text);
  background: var(--accent-soft);
}
</style>
