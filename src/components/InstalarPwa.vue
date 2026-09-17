<script setup lang="ts">
import { Share } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

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
  <article class="card gap-2.5">
    <h2 class="flex items-center gap-2">
      <AppIcon :icon="Share" />
      En el iPhone
    </h2>
    <p v-if="instalada" class="m-0 font-bold text-success">
      FitCheck ya está en la pantalla de inicio.
    </p>
    <template v-else>
      <p class="m-0 text-[0.85rem] leading-snug text-muted-foreground">
        Así se siente como app, a pantalla completa, sin la barra de Safari.
      </p>
      <ol class="m-0 grid list-decimal gap-1.5 pl-5 leading-snug text-muted-foreground">
        <li v-if="esIos">Toca <strong>Compartir</strong> (el cuadrado con flecha).</li>
        <li v-else>Abre el menú del navegador.</li>
        <li>Toca <strong>Añadir a pantalla de inicio</strong>.</li>
        <li>Confirma el nombre <strong>FitCheck</strong>.</li>
      </ol>
    </template>
  </article>
</template>
