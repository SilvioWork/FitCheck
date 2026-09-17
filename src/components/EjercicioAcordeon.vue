<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import AppIcon from '@/components/AppIcon.vue'
import { cn } from '@/lib/cn'

defineProps<{
  abierto: boolean
  titulo: string
  subtitulo: string
  recuento: number
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div class="grid gap-2" role="region" :aria-label="`Series de ${titulo} · ${subtitulo}`">
    <button
      type="button"
      class="grid min-h-tap w-full grid-cols-[1fr_28px] items-center gap-2 rounded-sm border-0 bg-muted px-2.5 py-2 text-left text-inherit"
      :aria-expanded="abierto"
      :aria-label="`${titulo} · ${subtitulo}`"
      @click="$emit('toggle')"
    >
      <span>
        <strong class="block">{{ titulo }}</strong>
        <small class="block font-medium text-muted-foreground">
          {{ subtitulo }} · {{ recuento }} {{ recuento === 1 ? 'serie' : 'series' }}
        </small>
      </span>
      <AppIcon
        :icon="ChevronDown"
        size="sm"
        :class="
          cn(
            'justify-self-center text-accent transition-transform duration-150',
            abierto ? 'rotate-0' : '-rotate-90',
          )
        "
      />
    </button>
    <div v-show="abierto" class="grid gap-2 pl-0.5">
      <slot />
    </div>
  </div>
</template>
