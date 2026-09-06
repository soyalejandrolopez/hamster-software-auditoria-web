<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="py-24 text-center">
      <div class="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4"></div>
      <h3 class="text-base font-bold text-slate-800">Cargando informe de auditoría profunda...</h3>
      <p class="text-xs text-slate-400 mt-1">Recuperando métricas, accesibilidad WCAG, enlaces y plan de acción</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!audit || !details" class="py-24 text-center">
      <div class="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-slate-800">No se pudo cargar la auditoría</h2>
      <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">La auditoría solicitada no existe o no cuentas con los permisos necesarios para verla.</p>
      <NuxtLink to="/dashboard" class="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700">
        Volver al Dashboard
      </NuxtLink>
    </div>

    <!-- Audit Content -->
    <div v-else class="space-y-8">
      <!-- Guest Welcome Banner -->
      <div v-if="!isAuthenticated" class="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900">Estás visualizando este informe como invitado</h4>
            <p class="text-[11px] sm:text-xs text-slate-600">Crea una cuenta gratis para guardar tus auditorías, comparar la evolución y recibir alertas automáticas.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <NuxtLink to="/register" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105">
            Registrarse Gratis
          </NuxtLink>
          <NuxtLink to="/login" class="px-3 py-2 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            Iniciar Sesión
          </NuxtLink>
        </div>
      </div>

      <!-- Breadcrumb & Actions Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <NuxtLink :to="isAuthenticated ? '/dashboard' : '/'" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>{{ isAuthenticated ? 'Volver a Mis Auditorías' : 'Volver al Inicio' }}</span>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <NuxtLink
            :to="`/audits/history/${audit.domain}`"
            class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Ver Evolución</span>
          </NuxtLink>

          <button
            @click="exportPlan"
            class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Imprimir / Exportar Reporte</span>
          </button>
        </div>
      </div>

      <!-- Hero Summary Card -->
      <div class="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex-1 text-center md:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Auditoría Profunda Finalizada · {{ formatDate(audit.createdAt) }}
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
            <span>{{ audit.domain }}</span>
          </h1>
          <a :href="audit.url" target="_blank" rel="noopener noreferrer" class="mt-1 text-xs text-blue-600 hover:underline flex items-center justify-center md:justify-start gap-1">
            <span>{{ audit.url }}</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <p class="mt-4 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Diagnóstico integral y exhaustivo que evalúa <span class="font-bold text-slate-800">SEO Técnico</span>, <span class="font-bold text-slate-800">Rendimiento y Core Web Vitals</span>, <span class="font-bold text-slate-800">Seguridad y Certificados</span>, <span class="font-bold text-slate-800">Accesibilidad WCAG 2.1</span>, <span class="font-bold text-slate-800">Verificación de Enlaces</span> y <span class="font-bold text-slate-800">Infraestructura DNS</span>.
          </p>
        </div>

        <div class="flex-shrink-0 p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puntuación Global</span>
          <ScoreGauge :score="audit.overallScore" size="xl" />
        </div>
      </div>

      <!-- Modular Tabs Navigation -->
      <div class="border-b border-slate-200 overflow-x-auto">
        <div class="flex items-center gap-1 pb-px min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              'px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2',
              currentTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            ]"
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.badge !== undefined && tab.badge !== null"
              :class="[
                'px-2 py-0.5 text-[10px] font-extrabold rounded-full',
                currentTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              ]"
            >
              {{ tab.badge }}
            </span>
          </button>
        </div>
      </div>

      <!-- TAB 1: RESUMEN -->
      <div v-if="currentTab === 'summary'" class="space-y-8">
        <!-- 6 Metrics Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- SEO Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.seoScore" size="md" label="SEO" sublabel="Meta, indexación y contenido" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>H1: {{ details.seo?.headings?.h1Count ?? 0 }}</span>
              <span>Alt faltantes: {{ details.seo?.images?.withoutAlt ?? 0 }}</span>
            </div>
          </div>

          <!-- Rendimiento Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.performanceScore" size="md" label="Rendimiento" sublabel="Velocidad y optimización" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>TTFB: {{ details.performance?.ttfbMs ?? 0 }}ms</span>
              <span>HTTP/2: {{ details.performance?.http2?.enabled ? 'Sí' : 'No' }}</span>
            </div>
          </div>

          <!-- Seguridad Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.securityScore" size="md" label="Seguridad" sublabel="SSL, cookies y headers" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>TLS: {{ details.security?.sslDetails?.protocol || 'Válido' }}</span>
              <span>Cookies seguras: {{ (details.security?.cookies?.insecureCount ?? 0) === 0 ? 'Sí' : 'Revisar' }}</span>
            </div>
          </div>

          <!-- Accesibilidad WCAG Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="details.accessibility?.score ?? audit.accessibilityScore ?? 90" size="md" label="Accesibilidad" sublabel="WCAG 2.1 A/AA" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>Violaciones: {{ details.accessibility?.violations?.length ?? 0 }}</span>
              <span>Reglas OK: {{ details.accessibility?.passes ?? 0 }}</span>
            </div>
          </div>

          <!-- Enlaces Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="details.linkCheck?.score ?? 100" size="md" label="Enlaces" sublabel="Salud de hipervínculos" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>Revisados: {{ details.linkCheck?.checkedCount ?? 0 }}</span>
              <span :class="(details.linkCheck?.broken?.length ?? 0) > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'">
                Rotos: {{ details.linkCheck?.broken?.length ?? 0 }}
              </span>
            </div>
          </div>

          <!-- Dominio Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.domainScore" size="md" label="Dominio" sublabel="DNS, WHOIS y correo" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>DMARC: {{ details.domainData?.dmarc?.exists ? 'Activo' : 'Inactivo' }}</span>
              <span>IPv6: {{ details.domainData?.ipv6Support?.supported ? 'Sí' : 'No' }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Action Plan Preview -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900">Resumen de Recomendaciones Prioritarias</h3>
              <p class="text-xs text-slate-500">Se detectaron {{ details.actionPlan?.length ?? 0 }} acciones de optimización para este sitio.</p>
            </div>
            <button @click="currentTab = 'action-plan'" class="text-xs font-bold text-blue-600 hover:underline">
              Ver Plan Completo →
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="item in (details.actionPlan || []).slice(0, 4)"
              :key="item.id"
              class="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-4"
            >
              <div class="flex items-start gap-3">
                <span
                  :class="[
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
                    item.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                    item.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  ]"
                >
                  {{ item.severity === 'critical' ? '!' : '•' }}
                </span>
                <div>
                  <h4 class="text-sm font-bold text-slate-900">{{ item.title }}</h4>
                  <p class="text-xs text-slate-600 mt-0.5">{{ item.description }}</p>
                </div>
              </div>
              <StatusBadge :status="item.severity">{{ item.severity }}</StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: SEO -->
      <div v-if="currentTab === 'seo'" class="space-y-6">
        <!-- Google SERP Simulator -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Vista Previa en Google SERP (Simulador)
          </h3>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-2xl font-sans">
            <div class="flex items-center gap-2 text-xs text-slate-600 mb-1">
              <span class="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold">G</span>
              <span class="truncate">{{ audit.url }}</span>
            </div>
            <div class="text-base font-semibold text-blue-800 hover:underline cursor-pointer leading-tight">
              {{ details.seo?.title?.text || 'Sin título configurado' }}
            </div>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              {{ details.seo?.description?.text || 'Sin meta descripción encontrada. Google generará un fragmento automático.' }}
            </p>
          </div>
        </div>

        <!-- Social Media / Twitter Cards & OpenGraph -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Open Graph Preview -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Graph (Facebook / LinkedIn)</span>
              <StatusBadge :status="details.seo?.openGraph?.ogTitle ? 'good' : 'warning'">
                {{ details.seo?.openGraph?.ogTitle ? 'Configurado' : 'Incompleto' }}
              </StatusBadge>
            </div>
            <div class="text-sm font-bold text-slate-800">{{ details.seo?.openGraph?.ogTitle || 'og:title no detectado' }}</div>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ details.seo?.openGraph?.ogDescription || 'Sin og:description' }}</p>
            <div v-if="details.seo?.openGraph?.ogImage" class="mt-3 text-[11px] font-mono text-slate-400 truncate">
              Imagen: {{ details.seo?.openGraph?.ogImage }}
            </div>
          </div>

          <!-- Twitter Cards -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Twitter Cards</span>
              <StatusBadge :status="details.seo?.twitterCards?.hasCards ? 'good' : 'warning'">
                {{ details.seo?.twitterCards?.hasCards ? 'Detectado' : 'Ausente' }}
              </StatusBadge>
            </div>
            <div class="text-sm font-bold text-slate-800">
              Tipo: {{ details.seo?.twitterCards?.cardType || 'summary' }}
            </div>
            <p class="text-xs text-slate-500 mt-1">
              {{ details.seo?.twitterCards?.title || details.seo?.title?.text || 'Sin título de tarjeta' }}
            </p>
            <div v-if="details.seo?.twitterCards?.site" class="mt-2 text-xs text-blue-600 font-semibold">
              Cuenta: {{ details.seo?.twitterCards?.site }}
            </div>
          </div>
        </div>

        <!-- Structured Data & Content Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Structured Data (Schema.org / JSON-LD) -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Datos Estructurados (JSON-LD / Schema.org)</span>
              <StatusBadge :status="details.seo?.structuredData?.detected ? 'good' : 'warning'">
                {{ details.seo?.structuredData?.detected ? `${details.seo?.structuredData?.count} esquemas` : 'No detectado' }}
              </StatusBadge>
            </div>
            <div v-if="details.seo?.structuredData?.types?.length > 0" class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="st in details.seo?.structuredData?.types"
                :key="st"
                class="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-700"
              >
                @type: {{ st }}
              </span>
            </div>
            <p v-else class="text-xs text-slate-500 mt-1">
              No se detectaron etiquetas &lt;script type="application/ld+json"&gt;. Añadir datos estructurados mejora la aparición de Rich Snippets en Google.
            </p>
          </div>

          <!-- Content & Reading Metrics -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Métricas de Contenido y Enlaces</span>
            <div class="grid grid-cols-3 gap-2 mt-3 text-center">
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-lg font-bold text-slate-800">{{ details.seo?.content?.wordCount ?? 'N/A' }}</span>
                <span class="block text-[10px] text-slate-400 uppercase font-semibold">Palabras</span>
              </div>
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-lg font-bold text-slate-800">{{ details.seo?.linksSummary?.internalCount ?? 'N/A' }}</span>
                <span class="block text-[10px] text-slate-400 uppercase font-semibold">Internos</span>
              </div>
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-lg font-bold text-slate-800">{{ details.seo?.linksSummary?.externalCount ?? 'N/A' }}</span>
                <span class="block text-[10px] text-slate-400 uppercase font-semibold">Externos</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SEO Details Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Análisis Técnico SEO Detallado</h3>
          </div>
          <div class="divide-y divide-slate-100">
            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Título de la Página</span>
                <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ details.seo?.title?.text || 'No configurado' }}</p>
                <span class="text-xs text-slate-400">Longitud: {{ details.seo?.title?.length }} caracteres (Recomendado: 30-65)</span>
              </div>
              <StatusBadge :status="details.seo?.title?.status">{{ details.seo?.title?.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Meta Descripción</span>
                <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ details.seo?.description?.text || 'No configurada' }}</p>
                <span class="text-xs text-slate-400">Longitud: {{ details.seo?.description?.length }} caracteres (Recomendado: 120-160)</span>
              </div>
              <StatusBadge :status="details.seo?.description?.status">{{ details.seo?.description?.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Jerarquía de Encabezados</span>
                <div class="flex items-center gap-4 mt-1 text-sm font-bold text-slate-800">
                  <span>H1: {{ details.seo?.headings?.h1Count }}</span>
                  <span>H2: {{ details.seo?.headings?.h2Count }}</span>
                  <span>H3: {{ details.seo?.headings?.h3Count }}</span>
                </div>
                <div v-if="details.seo?.headings?.h1Texts?.length > 0" class="mt-2 text-xs text-slate-500">
                  <span class="font-semibold">H1 principal:</span> "{{ details.seo?.headings?.h1Texts[0] }}"
                </div>
              </div>
              <StatusBadge :status="details.seo?.headings?.status">{{ details.seo?.headings?.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Imágenes y Atributos Alt</span>
                <p class="text-sm font-semibold text-slate-800 mt-0.5">
                  {{ details.seo?.images?.withoutAlt }} de {{ details.seo?.images?.total }} imágenes sin descripción ALT.
                </p>
              </div>
              <StatusBadge :status="details.seo?.images?.status">{{ details.seo?.images?.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Archivos Robots.txt y Sitemap.xml</span>
                <div class="flex items-center gap-4 mt-1 text-xs font-semibold">
                  <span :class="details.seo?.robotsTxt?.exists ? 'text-emerald-600' : 'text-slate-400'">
                    {{ details.seo?.robotsTxt?.message }}
                  </span>
                  <span :class="details.seo?.sitemap?.exists ? 'text-emerald-600' : 'text-slate-400'">
                    {{ details.seo?.sitemap?.message }}
                  </span>
                </div>
              </div>
              <StatusBadge :status="details.seo?.sitemap?.exists ? 'good' : 'warning'">
                {{ details.seo?.sitemap?.exists ? 'Correcto' : 'Parcial' }}
              </StatusBadge>
            </div>

            <div v-if="details.seo?.metaRobots" class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Directiva Meta Robots</span>
                <p class="text-sm font-semibold text-slate-800 mt-0.5">
                  {{ details.seo?.metaRobots?.content || 'Indexable por motores de búsqueda (por defecto)' }}
                </p>
              </div>
              <StatusBadge :status="details.seo?.metaRobots?.isNoindex ? 'critical' : 'good'">
                {{ details.seo?.metaRobots?.isNoindex ? 'Noindex (Bloqueado)' : 'Indexable' }}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: RENDIMIENTO & CORE WEB VITALS -->
      <div v-if="currentTab === 'performance'" class="space-y-6">
        <!-- Core Web Vitals Panel -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Core Web Vitals & Métricas Reales</span>
                <span v-if="details.performance?.coreWebVitals" class="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                  PageSpeed Insights
                </span>
              </h3>
              <p class="text-xs text-slate-500">Métricas clave de experiencia de usuario definidas por Google.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500">Protocolo:</span>
              <span :class="['px-2.5 py-1 text-xs font-bold rounded-lg border', details.performance?.http2?.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200']">
                {{ details.performance?.http2?.protocol || (details.performance?.http2?.enabled ? 'HTTP/2' : 'HTTP/1.1') }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span class="text-xs font-bold text-slate-500 uppercase block">TTFB</span>
              <span class="text-xl font-black text-slate-800 mt-1 block">{{ details.performance?.ttfbMs }}ms</span>
              <span class="text-[10px] text-emerald-600 font-semibold" v-if="details.performance?.ttfbMs < 300">Rápido</span>
              <span class="text-[10px] text-amber-600 font-semibold" v-else>Mejorable</span>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span class="text-xs font-bold text-slate-500 uppercase block">FCP</span>
              <span class="text-xl font-black text-slate-800 mt-1 block">
                {{ details.performance?.coreWebVitals?.fcpMs ? (details.performance.coreWebVitals.fcpMs / 1000).toFixed(2) + 's' : 'Estimado' }}
              </span>
              <span class="text-[10px] text-slate-400">First Contentful Paint</span>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span class="text-xs font-bold text-slate-500 uppercase block">LCP</span>
              <span class="text-xl font-black text-slate-800 mt-1 block">
                {{ details.performance?.coreWebVitals?.lcpMs ? (details.performance.coreWebVitals.lcpMs / 1000).toFixed(2) + 's' : 'Estimado' }}
              </span>
              <span class="text-[10px] text-slate-400">Largest Contentful Paint</span>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span class="text-xs font-bold text-slate-500 uppercase block">CLS</span>
              <span class="text-xl font-black text-slate-800 mt-1 block">
                {{ details.performance?.coreWebVitals?.cls !== undefined ? details.performance.coreWebVitals.cls.toFixed(3) : '0.00' }}
              </span>
              <span class="text-[10px] text-slate-400">Cumulative Layout Shift</span>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span class="text-xs font-bold text-slate-500 uppercase block">TBT</span>
              <span class="text-xl font-black text-slate-800 mt-1 block">
                {{ details.performance?.coreWebVitals?.tbtMs !== undefined ? details.performance.coreWebVitals.tbtMs + 'ms' : 'Bajo' }}
              </span>
              <span class="text-[10px] text-slate-400">Total Blocking Time</span>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span class="text-xs font-bold text-slate-500 uppercase block">Velocidad</span>
              <span class="text-xl font-black text-slate-800 mt-1 block">{{ details.performance?.responseTimeMs }}ms</span>
              <span class="text-[10px] text-slate-400">Descarga Completa</span>
            </div>
          </div>
        </div>

        <!-- Render Blocking & Image Analysis -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <!-- Render Blocking -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Recursos que Bloquean el Renderizado</span>
              <StatusBadge :status="(details.performance?.renderBlocking?.total ?? 0) === 0 ? 'good' : 'warning'">
                {{ details.performance?.renderBlocking?.total ?? 0 }} recursos
              </StatusBadge>
            </div>
            <p class="text-xs text-slate-600 mb-3">
              Scripts y estilos cargados sincrónicamente en el head sin atributos async/defer o media.
            </p>
            <div class="flex items-center gap-4 text-xs font-bold text-slate-700">
              <span>Scripts bloqueantes: {{ details.performance?.renderBlocking?.scriptsCount ?? 0 }}</span>
              <span>Hojas CSS bloqueantes: {{ details.performance?.renderBlocking?.stylesCount ?? 0 }}</span>
            </div>
          </div>

          <!-- Image Analysis -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Análisis de Optimización de Imágenes</span>
              <StatusBadge :status="(details.performance?.imageAnalysis?.unoptimizedCount ?? 0) === 0 ? 'good' : 'warning'">
                {{ (details.performance?.imageAnalysis?.unoptimizedCount ?? 0) === 0 ? 'Optimizado' : 'Mejorable' }}
              </StatusBadge>
            </div>
            <p class="text-xs text-slate-600 mb-3">
              Uso de formatos modernos (WebP/AVIF), atributos loading="lazy" y dimensiones explícitas.
            </p>
            <div class="flex items-center gap-4 text-xs font-bold text-slate-700">
              <span>Sin optimizar: {{ details.performance?.imageAnalysis?.unoptimizedCount ?? 0 }}</span>
              <span>Sin dimensiones: {{ details.performance?.imageAnalysis?.missingDimensionsCount ?? 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Cache Headers & DOM Stats -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-base font-bold text-slate-900 mb-4">Caché HTTP y Estructura del DOM</h3>
          <div class="space-y-3">
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span class="text-xs font-bold text-slate-700">Cabecera Cache-Control / ETag:</span>
              <span class="text-xs font-mono text-slate-600 truncate max-w-lg">{{ details.performance?.cacheHeaders?.details }}</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span class="text-xl font-bold text-slate-900">{{ details.performance?.assetCounts?.scripts }}</span>
                <span class="block text-[10px] uppercase font-bold text-slate-400">Scripts JS</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span class="text-xl font-bold text-slate-900">{{ details.performance?.assetCounts?.styles }}</span>
                <span class="block text-[10px] uppercase font-bold text-slate-400">Hojas CSS</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span class="text-xl font-bold text-slate-900">{{ details.performance?.assetCounts?.images }}</span>
                <span class="block text-[10px] uppercase font-bold text-slate-400">Imágenes</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span class="text-xl font-bold text-slate-900">{{ details.performance?.domStats?.totalNodes ?? 'N/A' }}</span>
                <span class="block text-[10px] uppercase font-bold text-slate-400">Nodos DOM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: SEGURIDAD & SSL -->
      <div v-if="currentTab === 'security'" class="space-y-6">
        <!-- SSL Card -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificado SSL / TLS</span>
            <h4 class="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span :class="['w-3 h-3 rounded-full', details.security?.ssl?.valid ? 'bg-emerald-500' : 'bg-rose-500']"></span>
              {{ details.security?.ssl?.issuer || 'Emisor no identificado' }}
            </h4>
            <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Válido hasta: {{ details.security?.ssl?.validTo || 'N/A' }}</span>
              <span>({{ details.security?.ssl?.daysRemaining }} días restantes)</span>
              <span v-if="details.security?.sslDetails?.protocol" class="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold text-slate-700">
                {{ details.security?.sslDetails?.protocol }} ({{ details.security?.sslDetails?.cipher }})
              </span>
            </div>
          </div>
          <StatusBadge :status="details.security?.ssl?.valid ? 'good' : 'critical'">
            {{ details.security?.ssl?.valid ? 'SSL Válido' : 'Certificado Inválido' }}
          </StatusBadge>
        </div>

        <!-- Security Disclosure & Cookies Alert -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Server Disclosure -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Divulgación de Software del Servidor</span>
              <StatusBadge :status="details.security?.serverDisclosure?.versionExposed ? 'warning' : 'good'">
                {{ details.security?.serverDisclosure?.versionExposed ? 'Versión Expuesta' : 'Protegido' }}
              </StatusBadge>
            </div>
            <p class="text-xs text-slate-600 mt-1">
              {{ details.security?.serverDisclosure?.serverHeader ? `Encabezado Server: ${details.security.serverDisclosure.serverHeader}` : 'El servidor no revela detalles técnicos en cabeceras.' }}
            </p>
          </div>

          <!-- Cookie Security Audit -->
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seguridad de Cookies (HttpOnly / Secure)</span>
              <StatusBadge :status="(details.security?.cookies?.insecureCount ?? 0) === 0 ? 'good' : 'warning'">
                {{ (details.security?.cookies?.insecureCount ?? 0) === 0 ? 'Seguras' : `${details.security?.cookies?.insecureCount} inseguras` }}
              </StatusBadge>
            </div>
            <p class="text-xs text-slate-600 mt-1">
              Total cookies emitidas: {{ details.security?.cookies?.total ?? 0 }}. Las cookies sin flags HttpOnly o Secure pueden ser interceptadas o leídas por scripts maliciosos.
            </p>
          </div>
        </div>

        <!-- Security Headers Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Cabeceras HTTP de Seguridad Evaluadas</h3>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="h in (details.security?.headers || [])"
              :key="h.name"
              class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span class="font-mono text-sm font-bold text-slate-800">{{ h.name }}</span>
                <span v-if="h.value" class="block text-xs font-mono text-slate-500 truncate max-w-xl">
                  {{ h.value }}
                </span>
                <span v-else class="block text-xs text-slate-400">
                  Recomendado: {{ h.recommended }}
                </span>
              </div>
              <StatusBadge :status="h.present ? 'good' : 'warning'">
                {{ h.present ? 'Presente' : 'Ausente' }}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: ACCESIBILIDAD WCAG 2.1 (NEW) -->
      <div v-if="currentTab === 'accessibility'" class="space-y-6">
        <!-- Accessibility Score Banner -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Auditoría de Accesibilidad Web (WCAG 2.1)</span>
            <h3 class="text-xl font-extrabold text-slate-900 mt-1">
              Cumplimiento de Estándares Deque axe-core & WCAG AA
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Se evaluaron {{ details.accessibility?.totalRules ?? 0 }} reglas de accesibilidad para personas con discapacidad visual o motriz.
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-center">
              <span class="text-2xl font-black text-slate-800 block">{{ details.accessibility?.passes ?? 0 }}</span>
              <span class="text-[10px] text-emerald-600 font-bold uppercase">Reglas Aprobadas</span>
            </div>
            <div class="text-center">
              <span class="text-2xl font-black text-rose-600 block">{{ details.accessibility?.violations?.length ?? 0 }}</span>
              <span class="text-[10px] text-rose-600 font-bold uppercase">Violaciones</span>
            </div>
          </div>
        </div>

        <!-- Violations Severity Summary -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
            <span class="text-2xl font-black text-rose-700 block">{{ details.accessibility?.summary?.critical ?? 0 }}</span>
            <span class="text-xs font-bold text-rose-700 uppercase">Críticas</span>
          </div>
          <div class="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <span class="text-2xl font-black text-amber-700 block">{{ details.accessibility?.summary?.serious ?? 0 }}</span>
            <span class="text-xs font-bold text-amber-700 uppercase">Serias</span>
          </div>
          <div class="p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
            <span class="text-2xl font-black text-yellow-700 block">{{ details.accessibility?.summary?.moderate ?? 0 }}</span>
            <span class="text-xs font-bold text-yellow-700 uppercase">Moderadas</span>
          </div>
          <div class="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <span class="text-2xl font-black text-blue-700 block">{{ details.accessibility?.summary?.minor ?? 0 }}</span>
            <span class="text-xs font-bold text-blue-700 uppercase">Menores</span>
          </div>
        </div>

        <!-- Violations Detailed List -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900">Violaciones Detectadas</h3>
            <span class="text-xs text-slate-500">{{ details.accessibility?.violations?.length ?? 0 }} problemas encontrados</span>
          </div>

          <div v-if="(details.accessibility?.violations?.length ?? 0) === 0" class="p-12 text-center text-slate-500">
            <svg class="w-12 h-12 text-emerald-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 class="text-base font-bold text-slate-800">¡Excelente trabajo de accesibilidad!</h4>
            <p class="text-xs text-slate-400 mt-1">No se encontraron violaciones a las pautas WCAG 2.1 analizadas.</p>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="v in details.accessibility.violations"
              :key="v.id"
              class="p-5 hover:bg-slate-50 transition-colors"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase',
                      v.impact === 'critical' ? 'bg-rose-100 text-rose-800' :
                      v.impact === 'serious' ? 'bg-amber-100 text-amber-800' :
                      v.impact === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    ]"
                  >
                    {{ v.impact }}
                  </span>
                  <span class="font-mono text-xs font-bold text-slate-700">{{ v.id }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-slate-500 font-semibold">{{ v.nodes }} elementos afectados</span>
                  <a
                    v-if="v.helpUrl"
                    :href="v.helpUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Documentación WCAG</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              <p class="text-sm font-semibold text-slate-800 mt-1">{{ v.description }}</p>
              <div v-if="v.tags?.length > 0" class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="tag in v.tags"
                  :key="tag"
                  class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 6: ENLACES & SALUD HTTP (NEW) -->
      <div v-if="currentTab === 'links'" class="space-y-6">
        <!-- Links Summary Card -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Verificación de Hipervínculos</span>
            <h3 class="text-xl font-extrabold text-slate-900 mt-1">
              Detección de Enlaces Rotos y Redirecciones
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Se extrajeron {{ details.linkCheck?.totalLinks ?? 0 }} enlaces de la página y se comprobaron concurrentemente.
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-center">
              <span class="text-2xl font-black text-slate-800 block">{{ details.linkCheck?.checkedCount ?? 0 }}</span>
              <span class="text-[10px] text-slate-400 font-bold uppercase">Verificados</span>
            </div>
            <div class="text-center">
              <span :class="['text-2xl font-black block', (details.linkCheck?.broken?.length ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600']">
                {{ details.linkCheck?.broken?.length ?? 0 }}
              </span>
              <span class="text-[10px] text-rose-600 font-bold uppercase">Rotos (404/5xx)</span>
            </div>
          </div>
        </div>

        <!-- Broken Links Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Enlaces Rotos Detectados</h3>
          </div>

          <div v-if="(details.linkCheck?.broken?.length ?? 0) === 0" class="p-12 text-center text-slate-500">
            <svg class="w-12 h-12 text-emerald-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <h4 class="text-base font-bold text-slate-800">¡Ningún enlace roto detectado!</h4>
            <p class="text-xs text-slate-400 mt-1">Todos los enlaces analizados respondieron con códigos HTTP válidos (200 OK).</p>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="(lnk, idx) in details.linkCheck.broken"
              :key="idx"
              class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                    HTTP {{ lnk.status || 'ERROR' }}
                  </span>
                  <span class="text-xs text-slate-400 font-medium capitalize">{{ lnk.type }}</span>
                </div>
                <a :href="lnk.url" target="_blank" rel="noopener noreferrer" class="text-xs font-mono text-slate-700 hover:text-blue-600 hover:underline truncate block">
                  {{ lnk.url }}
                </a>
              </div>
              <StatusBadge status="critical">Roto</StatusBadge>
            </div>
          </div>
        </div>

        <!-- Redirects Table -->
        <div v-if="(details.linkCheck?.redirects?.length ?? 0) > 0" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Enlaces con Redirecciones (301/302)</h3>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="(lnk, idx) in details.linkCheck.redirects"
              :key="idx"
              class="p-4 flex items-center justify-between gap-3"
            >
              <div class="truncate flex-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 mr-2">
                  HTTP {{ lnk.status }}
                </span>
                <span class="text-xs font-mono text-slate-700">{{ lnk.url }}</span>
              </div>
              <StatusBadge status="warning">Redirección</StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 7: DOMINIO & WHOIS -->
      <div v-if="currentTab === 'domain'" class="space-y-6">
        <!-- WHOIS Card -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Información de Registro WHOIS</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Registrador</span>
              <span class="text-sm font-bold text-slate-800 mt-0.5 block truncate">
                {{ details.domainData?.whois?.registrar || 'N/D' }}
              </span>
            </div>
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Fecha Creación</span>
              <span class="text-sm font-bold text-slate-800 mt-0.5 block">
                {{ details.domainData?.whois?.createdDate || 'N/D' }}
              </span>
            </div>
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Expiración</span>
              <span class="text-sm font-bold text-slate-800 mt-0.5 block">
                {{ details.domainData?.whois?.expiryDate || 'N/D' }}
              </span>
            </div>
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Días Restantes</span>
              <span :class="['text-sm font-bold mt-0.5 block', (details.domainData?.whois?.daysUntilExpiry ?? 365) < 30 ? 'text-rose-600' : 'text-emerald-600']">
                {{ details.domainData?.whois?.daysUntilExpiry !== undefined ? details.domainData.whois.daysUntilExpiry + ' días' : 'N/D' }}
              </span>
            </div>
          </div>
        </div>

        <!-- DMARC & Email Security -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">DMARC (Protección Antispoofing)</span>
              <StatusBadge :status="details.domainData?.dmarc?.exists ? 'good' : 'warning'">
                {{ details.domainData?.dmarc?.exists ? 'Habilitado' : 'Ausente' }}
              </StatusBadge>
            </div>
            <p class="text-xs text-slate-600 mt-1">
              {{ details.domainData?.dmarc?.record || 'No se encontró registro _dmarc. Tu dominio podría ser vulnerable a suplantación de identidad (phishing).' }}
            </p>
          </div>

          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Soporte IPv6 (Registros AAAA)</span>
              <StatusBadge :status="details.domainData?.ipv6Support?.supported ? 'good' : 'info'">
                {{ details.domainData?.ipv6Support?.supported ? 'Compatible IPv6' : 'Solo IPv4' }}
              </StatusBadge>
            </div>
            <p class="text-xs text-slate-600 mt-1">
              {{ details.domainData?.ipv6Support?.supported ? `Direcciones: ${details.domainData.ipv6Support.addresses.join(', ')}` : 'No tiene registros AAAA configurados para la nueva generación de Internet.' }}
            </p>
          </div>
        </div>

        <!-- DNS Records -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Registros DNS de {{ audit.domain }}</h3>
          </div>

          <div class="p-6 space-y-6">
            <!-- A Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Registros A (IPv4)</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="ip in (details.domainData?.records?.a || [])"
                  :key="ip"
                  class="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                >
                  {{ ip }}
                </span>
                <span v-if="(details.domainData?.records?.a?.length ?? 0) === 0" class="text-xs text-slate-400 italic">
                  No se encontraron registros A
                </span>
              </div>
            </div>

            <!-- MX Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Registros MX (Servidores de Correo)</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="mx in (details.domainData?.records?.mx || [])"
                  :key="mx.exchange"
                  class="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                >
                  [{{ mx.priority }}] {{ mx.exchange }}
                </span>
                <span v-if="(details.domainData?.records?.mx?.length ?? 0) === 0" class="text-xs text-slate-400 italic">
                  Sin registros MX configurados
                </span>
              </div>
            </div>

            <!-- NS Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Servidores de Nombres (NS)</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="ns in (details.domainData?.records?.ns || [])"
                  :key="ns"
                  class="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                >
                  {{ ns }}
                </span>
              </div>
            </div>

            <!-- TXT Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Registros TXT (SPF / Autenticación)</span>
              <div class="mt-2 space-y-1.5">
                <div
                  v-for="(txt, idx) in (details.domainData?.records?.txt || [])"
                  :key="idx"
                  class="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 truncate"
                >
                  {{ txt }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 8: TECNOLOGÍA -->
      <div v-if="currentTab === 'tech'" class="space-y-6">
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-base font-bold text-slate-900 mb-1">Stack Tecnológico Detectado</h3>
          <p class="text-xs text-slate-500 mb-6">Herramientas, CMS, plataformas de comercio, librerías y scripts identificados.</p>

          <div v-if="(details.tech?.length ?? 0) === 0" class="p-8 text-center text-slate-400 text-sm">
            No se identificaron firmas tecnológicas específicas en la respuesta.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="t in details.tech"
              :key="t.name"
              class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
            >
              <div>
                <span class="text-sm font-bold text-slate-900">{{ t.name }}</span>
                <span class="block text-[11px] text-slate-500">{{ t.category }}</span>
              </div>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                {{ t.confidence }}% confianza
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 9: PLAN DE ACCIÓN COMPLETO -->
      <div v-if="currentTab === 'action-plan'" class="space-y-6">
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-extrabold text-slate-900">Plan de Acción Técnico Priorizado</h3>
            <p class="text-xs text-slate-500">Recomendaciones ordenadas automáticamente por severidad, impacto y facilidad de resolución.</p>
          </div>

          <button
            @click="exportPlan"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimir Reporte</span>
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in (details.actionPlan || [])"
            :key="item.id"
            class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div class="flex items-center gap-2.5">
                <StatusBadge :status="item.severity">{{ item.severity }}</StatusBadge>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Categoría: {{ item.category }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  Impacto: <strong class="capitalize">{{ item.impact }}</strong>
                </span>
                <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  Esfuerzo: <strong class="capitalize">{{ item.effort }}</strong>
                </span>
              </div>
            </div>

            <h4 class="text-base font-bold text-slate-900 mb-1.5">{{ item.title }}</h4>
            <p class="text-sm text-slate-600 mb-4 leading-relaxed">{{ item.description }}</p>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Pasos para resolver este problema:
              </span>
              <ul class="space-y-2">
                <li
                  v-for="(step, sIdx) in item.steps"
                  :key="sIdx"
                  class="text-xs text-slate-700 flex items-start gap-2"
                >
                  <span class="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {{ sIdx + 1 }}
                  </span>
                  <span>{{ step }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const { isAuthenticated } = useAuth()
const route = useRoute()
const { loadAuditById } = useAudits()

const auditId = computed(() => route.params.id as string)
const audit = ref<any>(null)
const details = ref<any>(null)
const loading = ref(true)

const currentTab = ref('summary')

const tabs = computed(() => [
  { id: 'summary', label: 'Resumen' },
  { id: 'seo', label: 'SEO', badge: audit.value?.seoScore },
  { id: 'performance', label: 'Rendimiento', badge: audit.value?.performanceScore },
  { id: 'security', label: 'Seguridad', badge: audit.value?.securityScore },
  { id: 'accessibility', label: 'Accesibilidad', badge: details.value?.accessibility?.score ?? audit.value?.accessibilityScore },
  { id: 'links', label: 'Enlaces', badge: details.value?.linkCheck?.broken?.length ? `${details.value.linkCheck.broken.length} rotos` : 'OK' },
  { id: 'domain', label: 'Dominio', badge: audit.value?.domainScore },
  { id: 'tech', label: 'Tecnología', badge: details.value?.tech?.length },
  { id: 'action-plan', label: 'Plan de Acción', badge: details.value?.actionPlan?.length }
])

onMounted(async () => {
  loading.value = true
  const res = await loadAuditById(auditId.value)
  if (res) {
    audit.value = res.audit
    details.value = res.details
  }
  loading.value = false
})

const formatDate = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportPlan = () => {
  window.print()
}
</script>
