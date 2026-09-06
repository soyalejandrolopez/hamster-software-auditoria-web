<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Role Tab Switcher (For Admin) -->
    <div v-if="isAdmin" class="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
      <button
        @click="activeTab = 'client'"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
          activeTab === 'client'
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Mi Panel de Auditorías</span>
      </button>

      <button
        @click="switchToAdminTab"
        :class="[
          'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
          activeTab === 'admin'
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Gestión de Administrador</span>
        <span class="px-2 py-0.5 text-[10px] bg-indigo-500 text-white rounded-full">Admin</span>
      </button>
    </div>

    <!-- CLIENT TAB CONTENT -->
    <div v-if="activeTab === 'client'" class="space-y-8">
      <!-- Top Scan Bar -->
      <ScanBar :initial-url="urlFromQuery" />

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Auditorías</span>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">{{ audits.length }}</div>
            <span class="text-[11px] text-slate-400">En tu cuenta</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Puntuación Promedio</span>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">{{ averageScore }}<span class="text-sm font-normal text-slate-400">/100</span></div>
            <span class="text-[11px] text-emerald-600 font-semibold" v-if="averageScore >= 80">Rendimiento Saludable</span>
            <span class="text-[11px] text-amber-600 font-semibold" v-else-if="averageScore >= 50">Oportunidades de mejora</span>
            <span class="text-[11px] text-slate-400" v-else>Sin auditorías aún</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modo Visual</span>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">Modo Claro</div>
            <span class="text-[11px] text-slate-500">Diseño limpio y profesional</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- History Table / Audits List -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-slate-900">Historial de Auditorías</h3>
            <p class="text-xs text-slate-500">Consulta los resultados de tus análisis anteriores y accede a los planes de acción.</p>
          </div>
          <div class="w-full sm:w-64">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por dominio..."
              class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div v-if="filteredAudits.length === 0" class="p-12 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 class="text-sm font-bold text-slate-700">No hay auditorías registradas</h4>
          <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Introduce una URL en la barra superior para ejecutar tu primera auditoría web completa.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-4">Sitio / Dominio</th>
                <th class="py-3.5 px-4 text-center">Puntuación Global</th>
                <th class="py-3.5 px-4 text-center hidden md:table-cell">SEO</th>
                <th class="py-3.5 px-4 text-center hidden md:table-cell">Rendimiento</th>
                <th class="py-3.5 px-4 text-center hidden md:table-cell">Seguridad</th>
                <th class="py-3.5 px-4 text-center hidden lg:table-cell">Dominio</th>
                <th class="py-3.5 px-4">Fecha</th>
                <th class="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in filteredAudits" :key="item.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4">
                  <div class="flex flex-col">
                    <NuxtLink :to="`/audits/${item.id}`" class="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      {{ item.domain }}
                    </NuxtLink>
                    <span class="text-xs text-slate-400 truncate max-w-xs">{{ item.url }}</span>
                  </div>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold',
                      item.overallScore >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.overallScore >= 75 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      item.overallScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    ]"
                  >
                    {{ item.overallScore }} / 100
                  </span>
                </td>
                <td class="py-3.5 px-4 text-center hidden md:table-cell font-medium text-slate-700">
                  {{ item.seoScore }}%
                </td>
                <td class="py-3.5 px-4 text-center hidden md:table-cell font-medium text-slate-700">
                  {{ item.performanceScore }}%
                </td>
                <td class="py-3.5 px-4 text-center hidden md:table-cell font-medium text-slate-700">
                  {{ item.securityScore }}%
                </td>
                <td class="py-3.5 px-4 text-center hidden lg:table-cell font-medium text-slate-700">
                  {{ item.domainScore }}%
                </td>
                <td class="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-2">
                    <NuxtLink
                      :to="`/audits/${item.id}`"
                      class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Ver Informe
                    </NuxtLink>
                    <NuxtLink
                      :to="`/audits/history/${item.domain}`"
                      class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                      title="Historial de este dominio"
                    >
                      Evolución
                    </NuxtLink>
                    <button
                      @click="handleDelete(item.id)"
                      class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Eliminar auditoría"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ADMIN MANAGEMENT TAB CONTENT -->
    <div v-if="isAdmin && activeTab === 'admin'" class="space-y-8">
      <!-- Admin Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Usuarios</span>
          <div class="text-3xl font-extrabold text-slate-900 mt-1">{{ adminStats.totalUsers }}</div>
          <span class="text-xs text-slate-400">Clientes + Administradores</span>
        </div>
        <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Auditorías Totales</span>
          <div class="text-3xl font-extrabold text-slate-900 mt-1">{{ adminStats.totalAudits }}</div>
          <span class="text-xs text-slate-400">Escaneos en el sistema</span>
        </div>
        <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Puntuación Media Global</span>
          <div class="text-3xl font-extrabold text-indigo-600 mt-1">{{ adminStats.averages?.overall || 0 }}<span class="text-sm font-normal text-slate-400">/100</span></div>
          <span class="text-xs text-slate-400">Promedio de toda la plataforma</span>
        </div>
        <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Base de Datos</span>
          <div class="text-2xl font-extrabold text-slate-900 mt-1">SQLite / D1</div>
          <span class="text-xs text-emerald-600 font-semibold">● Conectada y Activa</span>
        </div>
      </div>

      <!-- Settings Panel: Google PageSpeed API Key -->
      <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900">Configuración del Sistema</h3>
            <p class="text-xs text-slate-500">Configura integraciones y variables globales del monitor.</p>
          </div>
          <span class="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full font-semibold">
            Solo Administrador
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Google PageSpeed Insights API Key (Opcional)
            </label>
            <input
              v-model="pageSpeedKey"
              type="password"
              placeholder="AIzaSy..."
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <button
              @click="savePageSpeedKey"
              :disabled="savingSettings"
              class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{{ savingSettings ? 'Guardando...' : 'Guardar Clave' }}</span>
            </button>
          </div>
        </div>
        <p v-if="settingsMessage" class="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
          ✓ {{ settingsMessage }}
        </p>
      </div>

      <!-- Users Management Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-200">
          <h3 class="text-base font-bold text-slate-900">Gestión de Usuarios</h3>
          <p class="text-xs text-slate-500">Listado de cuentas registradas en el sistema.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-4">Usuario</th>
                <th class="py-3.5 px-4">Correo</th>
                <th class="py-3.5 px-4">Rol</th>
                <th class="py-3.5 px-4 text-center">Auditorías Realizadas</th>
                <th class="py-3.5 px-4">Fecha de Registro</th>
                <th class="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="u in adminUsers" :key="u.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 font-bold text-slate-900">{{ u.name }}</td>
                <td class="py-3.5 px-4 text-slate-600">{{ u.email }}</td>
                <td class="py-3.5 px-4">
                  <StatusBadge :status="u.role">{{ u.role === 'admin' ? 'Administrador' : 'Cliente' }}</StatusBadge>
                </td>
                <td class="py-3.5 px-4 text-center font-bold text-slate-800">{{ u.auditsCount }}</td>
                <td class="py-3.5 px-4 text-xs text-slate-500">{{ formatDate(u.createdAt) }}</td>
                <td class="py-3.5 px-4 text-right">
                  <button
                    v-if="u.role !== 'admin'"
                    @click="deleteUser(u.id)"
                    class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Eliminar usuario"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <span v-else class="text-xs text-slate-400 italic">Protegido</span>
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
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const { user, isAdmin } = useAuth()
const { audits, loadAudits, deleteAudit } = useAudits()
const route = useRoute()

const urlFromQuery = computed(() => (route.query.url as string) || '')
const activeTab = ref<'client' | 'admin'>('client')
const searchQuery = ref('')

// Admin state
const adminStats = ref<any>({ totalUsers: 0, totalAudits: 0, averages: {} })
const adminUsers = ref<any[]>([])
const pageSpeedKey = ref('')
const savingSettings = ref(false)
const settingsMessage = ref('')

onMounted(async () => {
  await loadAudits()
  if (isAdmin.value) {
    loadAdminData()
  }
})

const switchToAdminTab = () => {
  activeTab.value = 'admin'
  loadAdminData()
}

const loadAdminData = async () => {
  try {
    const stats = await $fetch('/api/admin/stats')
    adminStats.value = stats

    const usersData = await $fetch<any>('/api/admin/users')
    adminUsers.value = usersData.users

    const settingsData = await $fetch<any>('/api/admin/settings')
    if (settingsData.settings?.pagespeed_api_key) {
      pageSpeedKey.value = settingsData.settings.pagespeed_api_key
    }
  } catch (err) {
    console.error('Error cargando datos de admin:', err)
  }
}

const savePageSpeedKey = async () => {
  savingSettings.value = true
  settingsMessage.value = ''
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { key: 'pagespeed_api_key', value: pageSpeedKey.value }
    })
    settingsMessage.value = 'Clave guardada exitosamente.'
    setTimeout(() => { settingsMessage.value = '' }, 3000)
  } catch {
    settingsMessage.value = 'Error al guardar configuración.'
  } finally {
    savingSettings.value = false
  }
}

const deleteUser = async (id: string) => {
  if (!confirm('¿Seguro que deseas eliminar este usuario y todas sus auditorías?')) return
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    adminUsers.value = adminUsers.value.filter(u => u.id !== id)
  } catch (err: any) {
    alert(err.data?.error || 'Error al eliminar usuario')
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('¿Deseas eliminar esta auditoría del historial?')) return
  await deleteAudit(id)
}

const averageScore = computed(() => {
  if (!audits.value || audits.value.length === 0) return 0
  const sum = audits.value.reduce((acc, a) => acc + a.overallScore, 0)
  return Math.round(sum / audits.value.length)
})

const filteredAudits = computed(() => {
  if (!searchQuery.value.trim()) return audits.value
  const q = searchQuery.value.toLowerCase()
  return audits.value.filter(a => a.domain.toLowerCase().includes(q) || a.url.toLowerCase().includes(q))
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
