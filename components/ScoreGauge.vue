<template>
  <div class="flex flex-col items-center justify-center text-center">
    <div class="relative flex items-center justify-center" :style="{ width: `${dim}px`, height: `${dim}px` }">
      <svg :width="dim" :height="dim" class="transform -rotate-90">
        <!-- Background Track -->
        <circle
          :cx="dim / 2"
          :cy="dim / 2"
          :r="radius"
          stroke="#e2e8f0"
          :stroke-width="strokeWidth"
          fill="transparent"
        />
        <!-- Progress Arc -->
        <circle
          :cx="dim / 2"
          :cy="dim / 2"
          :r="radius"
          :stroke="colorHex"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          fill="transparent"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeOffset"
          class="transition-all duration-1000 ease-out"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span :class="['font-extrabold tracking-tight', fontSizeClass, colorTextClass]">
          {{ safeScore }}
        </span>
        <span v-if="size === 'lg' || size === 'xl'" class="text-[10px] uppercase font-semibold text-slate-400">
          / 100
        </span>
      </div>
    </div>
    <div v-if="label" class="mt-2 font-semibold text-slate-800 text-sm">
      {{ label }}
    </div>
    <div v-if="sublabel" class="text-xs text-slate-500">
      {{ sublabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    score: number
    size?: 'sm' | 'md' | 'lg' | 'xl'
    label?: string
    sublabel?: string
  }>(),
  {
    size: 'md'
  }
)

const safeScore = computed(() => Math.max(0, Math.min(100, Math.round(props.score || 0))))

const dimensions = {
  sm: { dim: 56, stroke: 5, radius: 23, text: 'text-base' },
  md: { dim: 88, stroke: 8, radius: 36, text: 'text-2xl' },
  lg: { dim: 128, stroke: 10, radius: 52, text: 'text-4xl' },
  xl: { dim: 160, stroke: 12, radius: 66, text: 'text-5xl' }
}

const dim = computed(() => dimensions[props.size].dim)
const strokeWidth = computed(() => dimensions[props.size].stroke)
const radius = computed(() => dimensions[props.size].radius)
const fontSizeClass = computed(() => dimensions[props.size].text)

const circumference = computed(() => 2 * Math.PI * radius.value)
const strokeOffset = computed(() => circumference.value - (safeScore.value / 100) * circumference.value)

const colorHex = computed(() => {
  if (safeScore.value >= 90) return '#10b981' // emerald
  if (safeScore.value >= 75) return '#3b82f6' // blue
  if (safeScore.value >= 50) return '#f59e0b' // amber
  return '#ef4444' // rose
})

const colorTextClass = computed(() => {
  if (safeScore.value >= 90) return 'text-emerald-600'
  if (safeScore.value >= 75) return 'text-blue-600'
  if (safeScore.value >= 50) return 'text-amber-600'
  return 'text-rose-600'
})
</script>
