<template>
  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Nueva Auditoría Web
        </h2>
        <p class="text-xs text-slate-500">Introduce la URL completa del sitio web que deseas evaluar.</p>
      </div>
      <span class="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
        Modo Claro · Análisis 360°
      </span>
    </div>

    <!-- Error message -->
    <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
      <svg class="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Input Box -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <span class="absolute left-4 top-3.5 text-slate-400 font-semibold text-sm select-none">
          https://
        </span>
        <input
          v-model="inputUrl"
          :disabled="isScanning"
          type="text"
          placeholder="ejemplo.com"
          @keyup.enter="startScan"
          class="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
        />
      </div>

      <button
        @click="startScan"
        :disabled="isScanning || !inputUrl.trim()"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
      >
        <svg v-if="isScanning" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span>{{ isScanning ? 'Analizando...' : 'Auditar Sitio' }}</span>
      </button>
    </div>

    <!-- Scanning Live Progress Indicator -->
    <div v-if="isScanning" class="mt-5 pt-4 border-t border-slate-100">
      <div class="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          {{ scanStep || 'Procesando auditoría...' }}
        </span>
        <span class="text-blue-600 font-bold">En progreso</span>
      </div>
      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-blue-600 rounded-full animate-pulse transition-all duration-500 w-3/4"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  initialUrl?: string
}>()

const inputUrl = ref(props.initialUrl || '')
const { scanUrl, isScanning, scanStep, error } = useAudits()

onMounted(() => {
  if (props.initialUrl) {
    inputUrl.value = props.initialUrl
  }
})

const startScan = async () => {
  if (!inputUrl.value.trim() || isScanning.value) return
  let url = inputUrl.value.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  const res = await scanUrl(url)
  if (res.success && res.audit) {
    navigateTo(`/audits/${res.audit.id}`)
  }
}
</script>
