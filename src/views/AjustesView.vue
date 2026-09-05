<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import CatalogoPanel from '@/components/CatalogoPanel.vue'
import InstalarPwa from '@/components/InstalarPwa.vue'
import { usuarioValido } from '@/lib/usuario'
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

const alta = reactive({ nombre: '', usuario: '', password: '' })
const reset = reactive({ usuario: '', password: '' })
const nuevaPassword = ref('')
const enviando = ref(false)

async function salir() {
  await auth.signOut()
  await router.push({ name: 'login' })
}

async function invitar() {
  enviando.value = true
  const ok = await auth.invitar({ ...alta })
  if (ok) {
    alta.nombre = ''
    alta.usuario = ''
    alta.password = ''
    await gym.refresh()
  }
  enviando.value = false
}

async function resetear() {
  enviando.value = true
  const ok = await auth.resetPassword(reset.usuario, reset.password)
  if (ok) {
    reset.usuario = ''
    reset.password = ''
  }
  enviando.value = false
}

async function cambiarPassword() {
  enviando.value = true
  const ok = await auth.cambiarPassword(nuevaPassword.value)
  if (ok) nuevaPassword.value = ''
  enviando.value = false
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
      <p class="hint">{{ gym.miembroActivo?.nombre }} · @{{ gym.miembroActivo?.usuario }}</p>
      <p class="hint">Cada uno entra con su usuario y contraseña en su iPhone.</p>
      <ul>
        <li v-for="miembro in gym.miembros" :key="miembro.id">
          <span :class="{ on: gym.miembroActivoId === miembro.id }">
            {{ miembro.nombre }} · @{{ miembro.usuario }}
          </span>
        </li>
      </ul>
      <label>
        Nueva contraseña
        <input v-model="nuevaPassword" type="password" autocomplete="new-password" />
      </label>
      <button
        class="ghost"
        type="button"
        :disabled="enviando || nuevaPassword.length < 8"
        @click="cambiarPassword"
      >
        Cambiar mi contraseña
      </button>
      <button class="ghost" type="button" @click="salir">Cerrar sesión</button>
    </article>

    <article v-if="gym.miembros.length < 5" class="card">
      <h2>Invitar compañero</h2>
      <p class="hint">Se lo dices en persona. Tope de 5. {{ gym.miembros.length }}/5.</p>
      <label>
        Nombre
        <input v-model="alta.nombre" type="text" maxlength="40" />
      </label>
      <label>
        Usuario
        <input v-model="alta.usuario" type="text" maxlength="24" autocapitalize="off" />
      </label>
      <label>
        Contraseña inicial
        <input v-model="alta.password" type="password" autocomplete="new-password" />
      </label>
      <button
        class="ghost"
        type="button"
        :disabled="enviando || !alta.nombre.trim() || !usuarioValido(alta.usuario) || alta.password.length < 8"
        @click="invitar"
      >
        Crear cuenta
      </button>
    </article>

    <article class="card">
      <h2>Resetear contraseña</h2>
      <p class="hint">Si alguien olvida la suya, otro miembro puede ponerle una nueva.</p>
      <label>
        Usuario
        <input v-model="reset.usuario" type="text" maxlength="24" autocapitalize="off" />
      </label>
      <label>
        Nueva contraseña
        <input v-model="reset.password" type="password" autocomplete="new-password" />
      </label>
      <button
        class="ghost"
        type="button"
        :disabled="enviando || !usuarioValido(reset.usuario) || reset.password.length < 8"
        @click="resetear"
      >
        Actualizar contraseña
      </button>
    </article>

    <p v-if="auth.aviso" class="ok">{{ auth.aviso }}</p>
    <p v-if="auth.error" class="err">{{ auth.error }}</p>

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

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9rem;
}

input {
  min-height: var(--tap);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  padding: 0 12px;
}

.ghost {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
}

.ghost:disabled {
  opacity: 0.45;
}

.ok {
  margin: 0;
  color: var(--success);
  font-weight: 700;
}

.err {
  margin: 0;
  color: var(--danger);
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
