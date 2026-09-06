<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <NuxtLink to="/dashboard" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Mis Auditorías
      </NuxtLink>
    </div>

    <!-- Header -->
    <div class="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Historial y Evolución</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
          <span>{{ domain }}</span>
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          Evolución histórica de puntuaciones y auditorías realizadas para este dominio.
        </p>
      </div>

      <NuxtLink
        :to="`/dashboard?url=${encodeURIComponent('https://' + domain)}`"
        class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Re-auditar este sitio</span>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-24 text-center">
      <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500">Cargando evolución temporal...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="history.length === 0" class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <p class="text-sm font-bold text-slate-700">No se encontraron auditorías anteriores para este dominio.</p>
    </div>

    <!-- History Timeline Table -->
    <div v-else class="space-y-6">
      <!-- Visual Trend Bar -->
      <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Evolución de Puntuaciones</h3>
        <div class="flex items-end gap-3 h-40 pt-4 px-2 border-b border-slate-200 overflow-x-auto">
          <div
            v-for="(item, idx) in reversedHistory"
            :key="item.id"
            class="flex flex-col items-center gap-2 flex-1 min-w-[50px] group"
          >
            <span class="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {{ item.overallScore }}
            </span>
            <div
              :style="{ height: `${Math.max(10, item.overallScore * 1.2)}px` }"
              :class="[
                'w-full max-w-[36px] rounded-t-lg transition-all',
                item.overallScore >= 90 ? 'bg-emerald-500 hover:bg-emerald-600' :
                item.overallScore >= 75 ? 'bg-blue-500 hover:bg-blue-600' :
                item.overallScore >= 50 ? 'bg-amber-500 hover:bg-amber-600' :
                'bg-rose-500 hover:bg-rose-600'
              ]"
            ></div>
            <span class="text-[10px] text-slate-400 truncate w-full text-center">
              #{{ idx + 1 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-200">
          <h3 class="text-base font-bold text-slate-900">Histórico de Escaneos</h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-4">Fecha</th>
                <th class="py-3.5 px-4 text-center">Global</th>
                <th class="py-3.5 px-4 text-center">SEO</th>
                <th class="py-3.5 px-4 text-center">Rendimiento</th>
                <th class="py-3.5 px-4 text-center">Seguridad</th>
                <th class="py-3.5 px-4 text-center">Dominio</th>
                <th class="py-3.5 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in history" :key="item.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 text-xs font-medium text-slate-700">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold',
                      item.overallScore >= 90 ? 'bg-emerald-50 text-emerald-700' :
                      item.overallScore >= 75 ? 'bg-blue-50 text-blue-700' :
                      item.overallScore >= 50 ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    ]"
                  >
                    {{ item.overallScore }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-center text-xs font-medium">{{ item.seoScore }}%</td>
                <td class="py-3.5 px-4 text-center text-xs font-medium">{{ item.performanceScore }}%</td>
                <td class="py-3.5 px-4 text-center text-xs font-medium">{{ item.securityScore }}%</td>
                <td class="py-3.5 px-4 text-center text-xs font-medium">{{ item.domainScore }}%</td>
                <td class="py-3.5 px-4 text-right">
                  <NuxtLink
                    :to="`/audits/${item.id}`"
                    class="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    Ver Informe
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const { loadDomainHistory } = useAudits()

const domain = computed(() => route.params.domain as string)
const history = ref<any[]>([])
const loading = ref(true)

const reversedHistory = computed(() => [...history.value].reverse())

onMounted(async () => {
  loading.value = true
  history.value = await loadDomainHistory(domain.value)
  loading.value = false
})

const formatDate = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
