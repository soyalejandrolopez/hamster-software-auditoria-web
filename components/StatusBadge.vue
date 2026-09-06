<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors',
      badgeClasses
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full', dotClass]"></span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status?: 'good' | 'warning' | 'critical' | 'error' | 'info' | 'admin' | 'client'
    label?: string
  }>(),
  {
    status: 'info'
  }
)

const badgeClasses = computed(() => {
  switch (props.status) {
    case 'good':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
    case 'warning':
      return 'bg-amber-50 text-amber-700 border border-amber-200/60'
    case 'critical':
    case 'error':
      return 'bg-rose-50 text-rose-700 border border-rose-200/60'
    case 'admin':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
    case 'client':
      return 'bg-blue-50 text-blue-700 border border-blue-200/60'
    case 'info':
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
})

const dotClass = computed(() => {
  switch (props.status) {
    case 'good':
      return 'bg-emerald-500'
    case 'warning':
      return 'bg-amber-500'
    case 'critical':
    case 'error':
      return 'bg-rose-500'
    case 'admin':
      return 'bg-indigo-500'
    case 'client':
      return 'bg-blue-500'
    case 'info':
    default:
      return 'bg-slate-500'
  }
})
</script>
