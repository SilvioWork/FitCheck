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
  <div class="shell">
    <main class="main">
      <RouterView />
    </main>
    <div v-if="gym.error" class="toast" role="alert">
      <p>{{ gym.error }}</p>
      <button type="button" class="toast-close" @click="gym.limpiarError()">Cerrar</button>
    </div>
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
  position: relative;
}

.main {
  padding: calc(12px + var(--safe-top)) 16px 16px;
}

.toast {
  position: sticky;
  bottom: 0;
  z-index: 30;
  margin: 0 16px 8px;
  padding: 12px 14px;
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--danger) 16%, var(--surface));
  color: var(--text);
  display: grid;
  gap: 8px;
  box-shadow: var(--shadow);
}

.toast p {
  margin: 0;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.35;
  color: var(--danger);
}

.toast-close {
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font-weight: 700;
}
</style>
