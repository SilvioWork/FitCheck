<script setup lang="ts">
import { computed, type FunctionalComponent, type SVGAttributes } from 'vue'

type LucideIcon = FunctionalComponent<
  Partial<SVGAttributes> & { size?: number; strokeWidth?: number | string }
>

const props = withDefaults(
  defineProps<{
    icon: LucideIcon
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

const px = computed(() => (props.size === 'sm' ? 16 : props.size === 'lg' ? 32 : 20))
</script>

<template>
  <component :is="icon" :size="px" :stroke-width="2" class="shrink-0" aria-hidden="true" />
</template>
