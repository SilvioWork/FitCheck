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
  <section class="page">
    <header>
      <p class="eyebrow">FitCheck</p>
      <h1>{{ modo === 'crear' ? 'Crear el grupo' : 'Entrar' }}</h1>
      <p v-if="modo === 'crear'">
        El primero da de alta la cuenta. Luego invita al resto en Ajustes.
      </p>
      <p v-else>Usuario y contraseña. Sin correo.</p>
    </header>

    <article v-if="vacio === null" class="card">
      <p>Comprobando el grupo…</p>
    </article>

    <article v-else class="card">
      <label v-if="modo === 'crear'">
        Tu nombre
        <input v-model="nombre" type="text" maxlength="40" autocomplete="name" />
      </label>
      <label>
        Usuario
        <input
          v-model="usuario"
          type="text"
          maxlength="24"
          autocapitalize="off"
          autocomplete="username"
          placeholder="silvio"
        />
      </label>
      <label>
        Contraseña
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>
      <button class="primary" type="button" :disabled="enviando || !puedeEnviar()" @click="enviar">
        {{ enviando ? 'Un momento…' : modo === 'crear' ? 'Crear grupo' : 'Entrar' }}
      </button>
      <p v-if="auth.aviso" class="ok">{{ auth.aviso }}</p>
      <p v-if="auth.error" class="err">{{ auth.error }}</p>
    </article>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.eyebrow {
  margin: 0;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

h1 {
  margin: 4px 0 8px;
  font-size: 2rem;
}

header p:last-child,
.card p {
  margin: 0;
  color: var(--text-muted);
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

.primary {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--accent);
  color: #06210f;
  font-weight: 700;
}

.primary:disabled {
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
}
</style>
