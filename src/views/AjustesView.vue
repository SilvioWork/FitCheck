<script setup lang="ts">
import { useRouter } from 'vue-router'
import CatalogoPanel from '@/components/CatalogoPanel.vue'
import InstalarPwa from '@/components/InstalarPwa.vue'
import { useThemeStore, type ThemePreference } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useFitcheckStore } from '@/stores/fitcheck'

const router = useRouter()

const theme = useThemeStore()
const auth = useAuthStore()
const gym = useFitcheckStore()

const options: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Auto' },
]

async function salir() {
  await auth.signOut()
  await router.push({ name: 'login' })
}
</script>

<template>
  <section class="page">
    <header>
      <h1>Ajustes</h1>
      <p>
        Sesión de Supabase{{ gym.enVivo ? ' · en vivo' : '' }} y catálogo del grupo.
      </p>
    </header>

    <article class="card">
      <h2>Tu perfil</h2>
      <p class="hint">{{ gym.miembroActivo?.nombre }} · {{ gym.miembroActivo?.email }}</p>
      <p class="hint">Los compañeros entran con su propio correo en su iPhone.</p>
      <ul>
        <li v-for="miembro in gym.miembros" :key="miembro.id">
          <span :class="{ on: gym.miembroActivoId === miembro.id }">{{ miembro.nombre }}</span>
        </li>
      </ul>
      <button class="ghost" type="button" @click="salir">Cerrar sesión</button>
    </article>

    <InstalarPwa />

    <CatalogoPanel />

    <article class="card">
      <h2>Apariencia</h2>
      <div class="segment" role="group" aria-label="Tema">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="seg-btn"
          :class="{ active: theme.preference === option.value }"
          @click="theme.setPreference(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

h1 {
  margin: 0 0 8px;
  font-size: 2rem;
}

header p,
.hint,
h2 {
  margin: 0;
}

header p,
.hint {
  color: var(--text-muted);
  line-height: 1.45;
}

.hint {
  font-size: 0.85rem;
}

.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
}

h2 {
  font-size: 1.05rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

ul span {
  min-height: var(--tap);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 700;
  display: grid;
  align-items: center;
  padding: 0 12px;
}

ul span.on {
  background: var(--accent-soft);
  color: var(--text);
}

.ghost {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
}

.segment {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 4px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.seg-btn {
  min-height: var(--tap);
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-weight: 700;
}

.seg-btn.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}
</style>
