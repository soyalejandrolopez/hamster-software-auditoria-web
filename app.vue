<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
    <Navbar />

    <main class="flex-1">
      <NuxtPage />
    </main>

    <footer class="border-t border-slate-200 bg-white py-8 mt-12 text-center text-sm text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800">WebAuditor</span>
          <span class="text-xs text-slate-400">· Modo Claro Profesional</span>
        </div>
        <p class="text-xs text-slate-400">
          Evaluador de SEO, Rendimiento, Seguridad, Dominio, Tecnologías y Planes de Acción.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const { fetchMe } = useAuth()

onMounted(async () => {
  await fetchMe()
})
</script>
