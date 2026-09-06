<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
    <Navbar />

    <main class="flex-1">
      <NuxtPage />
    </main>

    <footer class="border-t border-slate-200 bg-white py-8 mt-12 text-center text-sm text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <img src="/logo.jpg" alt="Hamster Software" class="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-xs" />
          <div class="flex flex-col text-left">
            <span class="font-bold text-slate-800 leading-tight">Hamster Software Auditoría Web</span>
            <span class="text-xs text-slate-400">Modo Claro Profesional</span>
          </div>
        </div>
        <p class="text-xs text-slate-400">
          Evaluador integral de SEO, Core Web Vitals, Accesibilidad WCAG 2.1, Seguridad y Enlaces.
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
