<template>
  <div class="relative overflow-hidden bg-slate-50 min-h-[calc(100vh-4rem)]">
    <!-- Background subtle grid -->
    <div class="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
      <!-- Hero Header -->
      <div class="text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Hamster Software · Auditoría Web Gratuita
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          <span class="text-blue-600">Hamster Software</span> Auditoría Web
        </h1>

        <p class="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Audita gratis <span class="font-semibold text-slate-800">SEO</span>, <span class="font-semibold text-slate-800">Core Web Vitals</span>, <span class="font-semibold text-slate-800">Seguridad SSL & Cookies</span>, <span class="font-semibold text-slate-800">Accesibilidad WCAG 2.1</span>, <span class="font-semibold text-slate-800">Enlaces Rotos</span> y <span class="font-semibold text-slate-800">Dominio</span> sin necesidad de crear una cuenta.
        </p>

        <!-- CTA Bar -->
        <div class="mt-10 max-w-xl mx-auto">
          <div class="p-2 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1 flex items-center">
              <span class="absolute left-4 text-slate-400 font-semibold text-sm select-none">https://</span>
              <input
                v-model="quickUrl"
                :disabled="isScanning"
                type="text"
                placeholder="ejemplo.com"
                @keyup.enter="handleStart"
                class="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
            <button
              @click="handleStart"
              :disabled="isScanning || !quickUrl.trim()"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap disabled:cursor-not-allowed"
            >
              <svg v-if="isScanning" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>{{ isScanning ? 'Analizando...' : 'Auditar Ahora' }}</span>
            </button>
          </div>

          <!-- Error Alert -->
          <div v-if="error" class="mt-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 text-left shadow-sm">
            <svg class="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Live Scanning Progress -->
          <div v-if="isScanning" class="mt-4 p-4 bg-white rounded-2xl border border-blue-200 shadow-sm text-left animate-fadeIn">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                <span>{{ scanStep || 'Procesando auditoría técnica profunda...' }}</span>
              </span>
              <span class="text-blue-600 font-bold">En curso</span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse w-4/5"></div>
            </div>
            <p class="text-[11px] text-slate-400 mt-2">
              Extrayendo código HTML, verificando cabeceras, evaluando WCAG 2.1 y consultando servidores DNS.
            </p>
          </div>

          <p class="mt-3 text-xs text-slate-500 text-center">
            Prueba gratuita instantánea · Sin límites para invitados · Reporte completo en segundos.
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
            Simulador Google SERP, Twitter Cards, Schema.org (JSON-LD), recuento de palabras, jerarquía de encabezados e imágenes sin descripción alt.
          </p>
        </div>

        <!-- Feature 2: Performance -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Rendimiento & Core Web Vitals</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Medición de TTFB real, protocolo HTTP/2, recursos render-blocking, optimización de imágenes y métricas de velocidad FCP/LCP.
          </p>
        </div>

        <!-- Feature 3: Security -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Seguridad SSL, TLS & Cookies</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Certificados TLS 1.2/1.3, verificación de cookies inseguras (HttpOnly/Secure), 6 cabeceras HTTP defensivas y prevención de divulgación de software.
          </p>
        </div>

        <!-- Feature 4: Accessibility -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Accesibilidad WCAG 2.1</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Comprobación de normas de accesibilidad para lectores de pantalla: etiquetas en formularios, contraste, landmarks ARIA y zoom en móviles.
          </p>
        </div>

        <!-- Feature 5: Links -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Salud de Enlaces (404/301)</h3>
          <p class="text-sm text-slate-600 leading-relaxed">
            Detección de hipervínculos rotos, enlaces huérfanos y cadenas de redirección que perjudican la experiencia de navegación del usuario.
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
            Lista ordenada de tareas clasificadas por severidad, impacto y esfuerzo técnico, con pasos paso a paso y opción de exportación / impresión.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const quickUrl = ref('')
const { scanUrl, isScanning, scanStep, error } = useAudits()

const handleStart = async () => {
  const target = quickUrl.value.trim()
  if (!target || isScanning.value) return

  let url = target
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  const res = await scanUrl(url)
  if (res.success && res.audit) {
    navigateTo(`/audits/${res.audit.id}`)
  }
}
</script>
