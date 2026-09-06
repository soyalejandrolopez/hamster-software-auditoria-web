<template>
  <div class="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Iniciar Sesión</h2>
          <p class="text-xs text-slate-500 mt-1">Accede a tu panel de auditorías y monitoreo web</p>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
          <svg class="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="tu@correo.com"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contraseña
              </label>
            </div>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ loading ? 'Iniciando sesión...' : 'Entrar a la plataforma' }}</span>
          </button>
        </form>

        <!-- Quick Demo Autofill -->
        <div class="mt-6 pt-5 border-t border-slate-100">
          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Acceso Rápido de Prueba
          </p>
          <button
            type="button"
            @click="fillAdminCredentials"
            class="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            Usar Administrador (admin@monitor.local)
          </button>
        </div>

        <p class="mt-6 text-center text-xs text-slate-500">
          ¿No tienes una cuenta aún?
          <NuxtLink to="/register" class="font-bold text-blue-600 hover:underline">
            Regístrate aquí
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const { login, loading } = useAuth()
const route = useRoute()

const fillAdminCredentials = () => {
  email.value = 'admin@monitor.local'
  password.value = 'Admin123!*'
}

const handleSubmit = async () => {
  errorMessage.value = ''
  const res = await login(email.value, password.value)
  if (res.success) {
    const redirectUrl = (route.query.redirect as string) || (route.query.url ? `/dashboard?url=${encodeURIComponent(route.query.url as string)}` : '/dashboard')
    navigateTo(redirectUrl)
  } else {
    errorMessage.value = res.error || 'Error al iniciar sesión'
  }
}
</script>
