<template>
  <div class="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        <div class="text-center mb-8">
          <img
            src="/logo.jpg"
            alt="Hamster Software"
            class="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-200/90 mx-auto mb-3 shadow-md shadow-blue-500/10"
          />
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Crear Cuenta de Cliente</h2>
          <p class="text-xs text-slate-500 mt-1">Hamster Software Auditoría Web · Monitoreo y Análisis</p>
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
              Nombre Completo
            </label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="Ej. Juan Gómez"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

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
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              placeholder="Mínimo 6 caracteres"
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
            <span>{{ loading ? 'Creando cuenta...' : 'Crear Cuenta Gratis' }}</span>
          </button>
        </form>

        <p class="mt-6 text-center text-xs text-slate-500">
          ¿Ya tienes cuenta?
          <NuxtLink to="/login" class="font-bold text-blue-600 hover:underline">
            Inicia sesión aquí
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const { register, loading } = useAuth()

const handleSubmit = async () => {
  errorMessage.value = ''
  const res = await register(name.value, email.value, password.value)
  if (res.success) {
    navigateTo('/dashboard')
  } else {
    errorMessage.value = res.error || 'Error al registrarse'
  }
}
</script>
