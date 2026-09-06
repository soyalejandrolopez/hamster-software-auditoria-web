<template>
  <div class="relative overflow-hidden bg-slate-50 min-h-[calc(100vh-4rem)]">
    <!-- Background subtle grid -->
    <div class="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
      <!-- Hero Header -->
      <div class="text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Auditoría Web Integral · Modo Claro
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Evalúa y optimiza tu sitio web con un <span class="text-blue-600">Plan de Acción</span> técnico.
        </h1>

        <p class="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Analiza al instante <span class="font-semibold text-slate-800">SEO</span>, <span class="font-semibold text-slate-800">Rendimiento (TTFB)</span>, <span class="font-semibold text-slate-800">Seguridad SSL & Cabeceras</span>, <span class="font-semibold text-slate-800">Registros DNS</span> y <span class="font-semibold text-slate-800">Tecnologías</span> con recomendaciones priorizadas paso a paso.
        </p>

        <!-- CTA Bar -->
        <div class="mt-10 max-w-xl mx-auto">
          <div class="p-2 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1 flex items-center">
              <span class="absolute left-4 text-slate-400 font-semibold text-sm">https://</span>
              <input
                v-model="quickUrl"
                type="text"
                placeholder="ejemplo.com"
                @keyup.enter="handleStart"
                class="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            <button
              @click="handleStart"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Auditar Ahora</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          <p class="mt-2.5 text-xs text-slate-500 text-center">
            Incluye panel para clientes y vista de control global para administrador.
          </p>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Feature 1: SEO -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Auditoría SEO On-Page</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Inspección de títulos, meta descripción, etiquetas canonical, estructura H1-H6, imágenes sin alt y vista previa simulada en Google SERP.
          </p>
        </div>

        <!-- Feature 2: Performance -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Rendimiento y TTFB Real</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Medición del tiempo al primer byte (TTFB), compresión Gzip/Brotli, cabeceras de caché del navegador y peso total del DOM.
          </p>
        </div>

        <!-- Feature 3: Security -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Seguridad SSL y Cabeceras</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Validación de certificado SSL, cálculo de días hasta expiración, detección de contenido mixto y verificación de cabeceras HSTS, CSP y XFO.
          </p>
        </div>

        <!-- Feature 4: Domain -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Dominio y Registros DNS</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Resolución instantánea de registros A, AAAA, MX (correo), NS (servidores de nombres) y TXT (validación de registros SPF / DMARC).
          </p>
        </div>

        <!-- Feature 5: Tech Stack -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Detección de Tecnologías</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Identifica el CMS (WordPress, Shopify), servidor web (Nginx, Apache, Cloudflare), frameworks frontend (Vue, React, Nuxt) y herramientas de analítica.
          </p>
        </div>

        <!-- Feature 6: Action Plan -->
        <div class="p-6 bg-white rounded-2xl border border-blue-200/80 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-b from-white to-blue-50/30">
          <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Plan de Acción Priorizado</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Recomendaciones ordenadas por severidad e impacto con pasos técnicos de resolución y botón de exportación para clientes o clientes finales.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const quickUrl = ref('')
const { isAuthenticated } = useAuth()

const handleStart = () => {
  const target = quickUrl.value.trim()
  if (isAuthenticated.value) {
    if (target) {
      navigateTo(`/dashboard?url=${encodeURIComponent(target)}`)
    } else {
      navigateTo('/dashboard')
    }
  } else {
    if (target) {
      navigateTo(`/login?url=${encodeURIComponent(target)}`)
    } else {
      navigateTo('/login')
    }
  }
}
</script>
