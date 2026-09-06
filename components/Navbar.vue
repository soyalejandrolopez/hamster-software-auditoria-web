<template>
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2.5 group">
          <img
            src="/logo.jpg"
            alt="Hamster Software"
            class="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200/90 shadow-sm group-hover:scale-105 transition-transform"
          />
          <div class="flex flex-col">
            <span class="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight flex items-center gap-1">
              Hamster<span class="text-blue-600">Software</span>
            </span>
            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Auditoría Web</span>
          </div>
        </NuxtLink>

        <!-- Navigation Links -->
        <nav v-if="isAuthenticated" class="hidden md:flex items-center gap-1">
          <NuxtLink
            to="/dashboard"
            class="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            active-class="bg-blue-50 text-blue-700 font-semibold"
          >
            Dashboard
          </NuxtLink>
        </nav>

        <!-- User Controls / Auth Buttons -->
        <div class="flex items-center gap-3">
          <template v-if="isAuthenticated && user">
            <!-- User Pill -->
            <div class="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/80 rounded-full border border-slate-200">
              <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                {{ user.name.charAt(0) }}
              </div>
              <div class="flex flex-col text-left pr-1">
                <span class="text-xs font-semibold text-slate-800 leading-tight">{{ user.name }}</span>
                <span class="text-[10px] text-slate-500 capitalize">{{ user.role === 'admin' ? 'Administrador' : 'Cliente' }}</span>
              </div>
              <StatusBadge :status="user.role" class="ml-0.5">
                {{ user.role === 'admin' ? 'Admin' : 'Cliente' }}
              </StatusBadge>
            </div>

            <!-- Logout Button -->
            <button
              @click="logout"
              title="Cerrar sesión"
              class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </template>

          <template v-else>
            <NuxtLink
              to="/login"
              class="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Iniciar sesión
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:shadow"
            >
              Registrarse
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, isAuthenticated, logout } = useAuth()
</script>
