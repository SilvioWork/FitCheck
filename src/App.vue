<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
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
    if (ready && id) await gym.load()
  },
  { immediate: true },
)
</script>

<template>
  <div class="shell">
    <main class="main">
      <RouterView />
    </main>
    <AppNav v-if="route.name !== 'login'" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: 1fr auto;
  background: var(--bg);
  max-width: 520px;
  margin: 0 auto;
}

.main {
  padding: calc(12px + var(--safe-top)) 16px 16px;
}
</style>
