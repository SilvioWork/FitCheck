<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const nombre = ref('')
const email = ref('')
const enviando = ref(false)

async function enviar() {
  if (!nombre.value.trim() || !email.value.trim()) return
  enviando.value = true
  await auth.sendMagicLink(email.value, nombre.value)
  enviando.value = false
}
</script>

<template>
  <section class="page">
    <header>
      <p class="eyebrow">FitCheck</p>
      <h1>Entrar</h1>
      <p>Te enviamos un enlace al correo. Sin contraseña.</p>
    </header>

    <article class="card">
      <label>
        Nombre
        <input v-model="nombre" type="text" maxlength="40" autocomplete="name" />
      </label>
      <label>
        Email
        <input v-model="email" type="email" autocomplete="email" placeholder="tu@correo.com" />
      </label>
      <button
        class="primary"
        type="button"
        :disabled="enviando || !nombre.trim() || !email.trim()"
        @click="enviar"
      >
        {{ enviando ? 'Enviando…' : 'Enviar enlace' }}
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

header p:last-child {
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
