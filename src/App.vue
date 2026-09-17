<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { CircleAlert } from '@lucide/vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import AppNav from '@/components/AppNav.vue'
import { useAuthStore } from '@/stores/auth'
import { useFitcheckStore } from '@/stores/fitcheck'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const theme = useThemeStore()
const auth = useAuthStore()
const gym = useFitcheckStore()

onMounted(() => theme.init())

watch(
  () => [auth.ready, auth.user?.id] as const,
  async ([ready, id]) => {
    if (!ready) return
    if (!id) {
      gym.reset()
      return
    }
    await gym.load()
  },
  { immediate: true },
)
</script>

<template>
  <div class="relative mx-auto grid min-h-dvh max-w-[520px] grid-rows-[1fr_auto] bg-background">
    <main class="px-4 pt-[calc(12px+var(--safe-top))] pb-4">
      <RouterView />
    </main>
    <div
      v-if="gym.error"
      class="toast sticky bottom-0 z-30 mx-4 mb-2 grid gap-2 rounded-sm border border-danger p-3 shadow-card bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface))]"
      role="alert"
    >
      <p class="m-0 flex items-start gap-2 text-[0.95rem] font-bold leading-snug text-danger">
        <AppIcon :icon="CircleAlert" class="mt-0.5 text-danger" />
        <span>{{ gym.error }}</span>
      </p>
      <button
        type="button"
        class="btn-ghost min-h-10 rounded-[10px] bg-card"
        @click="gym.limpiarError()"
      >
        Cerrar
      </button>
    </div>
    <AppNav v-if="route.name !== 'login'" />
  </div>
</template>
