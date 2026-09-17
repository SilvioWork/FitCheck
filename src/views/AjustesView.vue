<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import CatalogoPanel from '@/components/CatalogoPanel.vue'
import InstalarPwa from '@/components/InstalarPwa.vue'
import { usuarioValido } from '@/lib/usuario'
import { cn } from '@/lib/cn'
import { useThemeStore, type ThemePreference } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useFitcheckStore } from '@/stores/fitcheck'

const router = useRouter()
const route = useRoute()

const theme = useThemeStore()
const auth = useAuthStore()
const gym = useFitcheckStore()

const vista = computed(() => (route.query.vista === 'users' ? 'users' : 'catalogo'))

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Monitor },
]

const alta = reactive({ nombre: '', usuario: '', password: '' })
const reset = reactive({ usuario: '', password: '' })
const nuevaPassword = ref('')
const enviando = ref(false)

function setVista(next: 'catalogo' | 'users') {
  if (next === 'users') {
    void router.replace({ name: 'ajustes', query: { vista: 'users' } })
    return
  }
  void router.replace({ name: 'ajustes' })
}

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
  <section class="grid gap-4">
    <header>
      <h1>Ajustes</h1>
      <p class="m-0 leading-snug text-muted-foreground">
        <template v-if="vista === 'users'"
          >Cuentas del grupo{{ gym.enVivo ? ' · en vivo' : '' }}.</template
        >
        <template v-else
          >Catálogo del grupo y apariencia{{ gym.enVivo ? ' · en vivo' : '' }}.</template
        >
      </p>
    </header>

    <div
      class="grid grid-cols-2 gap-2 rounded-sm bg-muted p-1"
      role="tablist"
      aria-label="Sección de ajustes"
    >
      <button
        type="button"
        class="btn-seg"
        role="tab"
        :aria-selected="vista === 'catalogo'"
        :class="{ 'btn-seg-active': vista === 'catalogo' }"
        @click="setVista('catalogo')"
      >
        Catálogo
      </button>
      <button
        type="button"
        class="btn-seg"
        role="tab"
        :aria-selected="vista === 'users'"
        :class="{ 'btn-seg-active': vista === 'users' }"
        @click="setVista('users')"
      >
        Users
      </button>
    </div>

    <template v-if="vista === 'users'">
      <article class="card">
        <h2>Tu perfil</h2>
        <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
          {{ gym.miembroActivo?.nombre }} · @{{ gym.miembroActivo?.usuario }}
        </p>
        <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
          Cada uno entra con su usuario y contraseña en su iPhone.
        </p>
        <ul class="m-0 grid list-none gap-2 p-0">
          <li v-for="miembro in gym.miembros" :key="miembro.id">
            <span
              :class="
                cn(
                  'grid min-h-tap items-center rounded-sm px-3 font-bold',
                  gym.miembroActivoId === miembro.id
                    ? 'bg-accent-soft text-foreground'
                    : 'bg-muted text-muted-foreground',
                )
              "
            >
              {{ miembro.nombre }} · @{{ miembro.usuario }}
            </span>
          </li>
        </ul>
        <label class="field">
          Nueva contraseña
          <input
            v-model="nuevaPassword"
            class="field-input"
            type="password"
            autocomplete="new-password"
          />
        </label>
        <button
          class="btn-ghost"
          type="button"
          :disabled="enviando || nuevaPassword.length < 8"
          @click="cambiarPassword"
        >
          Cambiar mi contraseña
        </button>
        <button class="btn-ghost" type="button" @click="salir">Cerrar sesión</button>
      </article>

      <article v-if="gym.miembros.length < 5" class="card">
        <h2>Invitar compañero</h2>
        <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
          Se lo dices en persona. Tope de 5. {{ gym.miembros.length }}/5.
        </p>
        <label class="field">
          Nombre
          <input v-model="alta.nombre" class="field-input" type="text" maxlength="40" />
        </label>
        <label class="field">
          Usuario
          <input
            v-model="alta.usuario"
            class="field-input"
            type="text"
            maxlength="24"
            autocapitalize="off"
          />
        </label>
        <label class="field">
          Contraseña inicial
          <input
            v-model="alta.password"
            class="field-input"
            type="password"
            autocomplete="new-password"
          />
        </label>
        <button
          class="btn-ghost"
          type="button"
          :disabled="
            enviando ||
            !alta.nombre.trim() ||
            !usuarioValido(alta.usuario) ||
            alta.password.length < 8
          "
          @click="invitar"
        >
          Crear cuenta
        </button>
      </article>

      <article class="card">
        <h2>Resetear contraseña</h2>
        <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
          Si alguien olvida la suya, otro miembro puede ponerle una nueva.
        </p>
        <label class="field">
          Usuario
          <input
            v-model="reset.usuario"
            class="field-input"
            type="text"
            maxlength="24"
            autocapitalize="off"
          />
        </label>
        <label class="field">
          Nueva contraseña
          <input
            v-model="reset.password"
            class="field-input"
            type="password"
            autocomplete="new-password"
          />
        </label>
        <button
          class="btn-ghost"
          type="button"
          :disabled="enviando || !usuarioValido(reset.usuario) || reset.password.length < 8"
          @click="resetear"
        >
          Actualizar contraseña
        </button>
      </article>

      <p v-if="auth.aviso" class="m-0 font-bold text-success">{{ auth.aviso }}</p>
      <p v-if="auth.error" class="m-0 font-bold text-danger">{{ auth.error }}</p>
    </template>

    <template v-else>
      <InstalarPwa />

      <CatalogoPanel />

      <article class="card">
        <h2>Apariencia</h2>
        <div class="grid grid-cols-3 gap-2 rounded-sm bg-muted p-1" role="group" aria-label="Tema">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            :class="
              cn(
                'btn-seg inline-grid grid-flow-col items-center justify-center gap-1',
                theme.preference === option.value && 'btn-seg-active',
              )
            "
            @click="theme.setPreference(option.value)"
          >
            <AppIcon :icon="option.icon" size="sm" />
            {{ option.label }}
          </button>
        </div>
      </article>
    </template>
  </section>
</template>
