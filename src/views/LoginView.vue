<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usuarioValido } from '@/lib/usuario'

const router = useRouter()
const auth = useAuthStore()
const vacio = ref<boolean | null>(null)
const modo = ref<'entrar' | 'crear'>('entrar')
const nombre = ref('')
const usuario = ref('')
const password = ref('')
const enviando = ref(false)

onMounted(async () => {
  try {
    vacio.value = await auth.grupoEstaVacio()
    if (vacio.value) modo.value = 'crear'
  } catch (err) {
    auth.error = err instanceof Error ? err.message : 'No se pudo comprobar el grupo'
    vacio.value = false
  }
})

const puedeEnviar = () => {
  if (!usuarioValido(usuario.value) || password.value.length < 8) return false
  if (modo.value === 'crear' && !nombre.value.trim()) return false
  return true
}

async function enviar() {
  if (!puedeEnviar()) return
  enviando.value = true
  const ok =
    modo.value === 'crear'
      ? await auth.crearGrupo({
          nombre: nombre.value,
          usuario: usuario.value,
          password: password.value,
        })
      : await auth.signIn(usuario.value, password.value)
  enviando.value = false
  if (ok) await router.replace({ name: 'hoy' })
}
</script>

<template>
  <section class="grid gap-4">
    <header>
      <p class="m-0 text-xs font-bold tracking-wide text-accent uppercase">FitCheck</p>
      <h1>{{ modo === 'crear' ? 'Crear el grupo' : 'Entrar' }}</h1>
      <p v-if="modo === 'crear'" class="m-0 text-muted-foreground">
        El primero da de alta la cuenta. Luego invita al resto en Ajustes.
      </p>
      <p v-else class="m-0 text-muted-foreground">Usuario y contraseña. Sin correo.</p>
    </header>

    <article v-if="vacio === null" class="card">
      <p class="m-0 text-muted-foreground">Comprobando el grupo…</p>
    </article>

    <article v-else class="card">
      <label v-if="modo === 'crear'" class="field">
        Tu nombre
        <input
          v-model="nombre"
          class="field-input"
          type="text"
          maxlength="40"
          autocomplete="name"
        />
      </label>
      <label class="field">
        Usuario
        <input
          v-model="usuario"
          class="field-input"
          type="text"
          maxlength="24"
          autocapitalize="off"
          autocomplete="username"
          placeholder="silvio"
        />
      </label>
      <label class="field">
        Contraseña
        <input
          v-model="password"
          class="field-input"
          type="password"
          autocomplete="current-password"
        />
      </label>
      <button
        class="btn-primary"
        type="button"
        :disabled="enviando || !puedeEnviar()"
        @click="enviar"
      >
        {{ enviando ? 'Un momento…' : modo === 'crear' ? 'Crear grupo' : 'Entrar' }}
      </button>
      <p v-if="auth.aviso" class="m-0 font-bold text-success">{{ auth.aviso }}</p>
      <p v-if="auth.error" class="m-0 text-danger">{{ auth.error }}</p>
    </article>
  </section>
</template>
