<script setup lang="ts">
import { CalendarDays, History, Settings } from '@lucide/vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { cn } from '@/lib/cn'

const route = useRoute()

const tabs = [
  { to: '/', label: 'Hoy', icon: CalendarDays },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
] as const

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <nav
    class="grid grid-cols-3 gap-2 border-t border-border bg-card px-3 pt-2 pb-[calc(8px+var(--safe-bottom))]"
    aria-label="Principal"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      :class="
        cn(
          'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-sm px-1 text-[0.7rem] leading-none font-semibold whitespace-nowrap no-underline',
          isActive(tab.to) ? 'bg-accent-soft text-foreground' : 'text-muted-foreground',
        )
      "
    >
      <AppIcon :icon="tab.icon" />
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
