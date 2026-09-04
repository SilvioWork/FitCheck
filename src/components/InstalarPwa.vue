<script setup lang="ts">
import { onMounted, ref } from 'vue'

const instalada = ref(false)
const esIos = ref(false)

onMounted(() => {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  instalada.value =
    nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  esIos.value = /iPhone|iPad|iPod/i.test(nav.userAgent)
})
</script>

<template>
  <article class="card">
    <h2>En el iPhone</h2>
    <p v-if="instalada" class="ok">FitCheck ya está en la pantalla de inicio.</p>
    <template v-else>
      <p class="hint">Así se siente como app, a pantalla completa, sin la barra de Safari.</p>
      <ol>
        <li v-if="esIos">Toca <strong>Compartir</strong> (el cuadrado con flecha).</li>
        <li v-else>Abre el menú del navegador.</li>
        <li>Toca <strong>Añadir a pantalla de inicio</strong>.</li>
        <li>Confirma el nombre <strong>FitCheck</strong>.</li>
      </ol>
    </template>
  </article>
</template>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
  display: grid;
  gap: 10px;
}

h2,
.hint,
.ok {
  margin: 0;
}

h2 {
  font-size: 1.05rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

.ok {
  color: var(--success);
  font-weight: 700;
}

ol {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--text-muted);
  display: grid;
  gap: 6px;
  line-height: 1.4;
}
</style>
