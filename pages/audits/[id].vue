<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="py-24 text-center">
      <div class="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4"></div>
      <h3 class="text-base font-bold text-slate-800">Cargando informe de auditoría...</h3>
      <p class="text-xs text-slate-400 mt-1">Recuperando métricas y plan de acción</p>
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
      <NuxtLink to="/dashboard" class="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
        Volver al Dashboard
      </NuxtLink>
    </div>

    <!-- Audit Content -->
    <div v-else class="space-y-8">
      <!-- Breadcrumb & Actions Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <NuxtLink to="/dashboard" class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Mis Auditorías
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
            <span>Descargar Plan de Acción</span>
          </button>
        </div>
      </div>

      <!-- Hero Summary Card -->
      <div class="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex-1 text-center md:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Auditoría Finalizada · {{ formatDate(audit.createdAt) }}
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

          <p class="mt-4 text-sm text-slate-600 max-w-xl">
            Puntuación ponderada calculada sobre <span class="font-bold text-slate-800">SEO (30%)</span>, <span class="font-bold text-slate-800">Rendimiento (25%)</span>, <span class="font-bold text-slate-800">Seguridad (25%)</span> y <span class="font-bold text-slate-800">Dominio (20%)</span>.
          </p>
        </div>

        <div class="flex-shrink-0 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puntuación Global</span>
          <ScoreGauge :score="audit.overallScore" size="xl" />
        </div>
      </div>

      <!-- Modular Tabs Navigation -->
      <div class="border-b border-slate-200 overflow-x-auto">
        <div class="flex items-center gap-2 pb-px min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              'px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2',
              currentTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            ]"
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.badge !== undefined"
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- SEO Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.seoScore" size="md" label="SEO" sublabel="Meta, encabezados y SERP" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>H1: {{ details.seo.headings.h1Count }}</span>
              <span>Alt faltantes: {{ details.seo.images.withoutAlt }}</span>
            </div>
          </div>

          <!-- Rendimiento Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.performanceScore" size="md" label="Rendimiento" sublabel="TTFB y optimización" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>TTFB: {{ details.performance.ttfbMs }}ms</span>
              <span>Gzip/Br: {{ details.performance.compression.enabled ? 'Sí' : 'No' }}</span>
            </div>
          </div>

          <!-- Seguridad Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.securityScore" size="md" label="Seguridad" sublabel="SSL y cabeceras HTTP" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>SSL: {{ details.security.ssl.valid ? 'Válido' : 'No' }}</span>
              <span>Días: {{ details.security.ssl.daysRemaining }}d</span>
            </div>
          </div>

          <!-- Dominio Card -->
          <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ScoreGauge :score="audit.domainScore" size="md" label="Dominio" sublabel="DNS y disponibilidad" />
            <div class="mt-4 pt-4 border-t border-slate-100 w-full text-xs text-slate-500 flex justify-between">
              <span>IP A: {{ details.domainData.records.a.length }}</span>
              <span>MX: {{ details.domainData.records.mx.length }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Action Plan Preview -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-bold text-slate-900">Resumen de Recomendaciones Prioritarias</h3>
              <p class="text-xs text-slate-500">Se detectaron {{ details.actionPlan.length }} acciones de optimización para este sitio.</p>
            </div>
            <button @click="currentTab = 'action-plan'" class="text-xs font-bold text-blue-600 hover:underline">
              Ver Plan Completo →
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="item in details.actionPlan.slice(0, 3)"
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
              {{ details.seo.title.text || 'Sin título configurado' }}
            </div>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              {{ details.seo.description.text || 'Sin meta descripción encontrada. Google generará un fragmento automático.' }}
            </p>
          </div>
        </div>

        <!-- SEO Details Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Análisis Técnico SEO</h3>
          </div>
          <div class="divide-y divide-slate-100">
            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Título de la Página</span>
                <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ details.seo.title.text || 'No configurado' }}</p>
                <span class="text-xs text-slate-400">Longitud: {{ details.seo.title.length }} caracteres (Recomendado: 30-65)</span>
              </div>
              <StatusBadge :status="details.seo.title.status">{{ details.seo.title.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Meta Descripción</span>
                <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ details.seo.description.text || 'No configurada' }}</p>
                <span class="text-xs text-slate-400">Longitud: {{ details.seo.description.length }} caracteres (Recomendado: 120-160)</span>
              </div>
              <StatusBadge :status="details.seo.description.status">{{ details.seo.description.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Jerarquía de Encabezados</span>
                <div class="flex items-center gap-4 mt-1 text-sm font-bold text-slate-800">
                  <span>H1: {{ details.seo.headings.h1Count }}</span>
                  <span>H2: {{ details.seo.headings.h2Count }}</span>
                  <span>H3: {{ details.seo.headings.h3Count }}</span>
                </div>
                <div v-if="details.seo.headings.h1Texts.length > 0" class="mt-2 text-xs text-slate-500">
                  <span class="font-semibold">H1 encontrado:</span> "{{ details.seo.headings.h1Texts[0] }}"
                </div>
              </div>
              <StatusBadge :status="details.seo.headings.status">{{ details.seo.headings.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Imágenes y Atributos Alt</span>
                <p class="text-sm font-semibold text-slate-800 mt-0.5">
                  {{ details.seo.images.withoutAlt }} de {{ details.seo.images.total }} imágenes sin descripción ALT.
                </p>
              </div>
              <StatusBadge :status="details.seo.images.status">{{ details.seo.images.status }}</StatusBadge>
            </div>

            <div class="p-4 flex items-start justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase">Archivos Robots.txt y Sitemap.xml</span>
                <div class="flex items-center gap-4 mt-1 text-xs font-semibold">
                  <span :class="details.seo.robotsTxt.exists ? 'text-emerald-600' : 'text-slate-400'">
                    {{ details.seo.robotsTxt.message }}
                  </span>
                  <span :class="details.seo.sitemap.exists ? 'text-emerald-600' : 'text-slate-400'">
                    {{ details.seo.sitemap.message }}
                  </span>
                </div>
              </div>
              <StatusBadge :status="details.seo.sitemap.exists ? 'good' : 'warning'">
                {{ details.seo.sitemap.exists ? 'Correcto' : 'Parcial' }}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: RENDIMIENTO -->
      <div v-if="currentTab === 'performance'" class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">TTFB (Time To First Byte)</span>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">{{ details.performance.ttfbMs }} ms</div>
            <span class="text-xs text-emerald-600 font-semibold" v-if="details.performance.ttfbMs < 300">Excelente velocidad</span>
            <span class="text-xs text-amber-600 font-semibold" v-else-if="details.performance.ttfbMs < 800">Aceptable</span>
            <span class="text-xs text-rose-600 font-semibold" v-else>Servidor lento</span>
          </div>

          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Compresión Activa</span>
            <div class="text-3xl font-extrabold text-slate-900 mt-1 uppercase">
              {{ details.performance.compression.encoding || 'Ninguna' }}
            </div>
            <span class="text-xs text-emerald-600 font-semibold" v-if="details.performance.compression.enabled">Habilitada correctamente</span>
            <span class="text-xs text-rose-600 font-semibold" v-else>Inactiva (optimizar)</span>
          </div>

          <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tamaño HTML</span>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">
              {{ Math.round(details.performance.pageSizeBytes / 1024) }} KB
            </div>
            <span class="text-xs text-slate-400">Peso transferido de la página</span>
          </div>
        </div>

        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-base font-bold text-slate-900 mb-4">Cabeceras de Caché y Recursos</h3>
          <div class="space-y-3">
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">Cache-Control / ETag</span>
              <span class="text-xs font-mono text-slate-600">{{ details.performance.cacheHeaders.details }}</span>
            </div>

            <div class="grid grid-cols-3 gap-3 pt-2">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span class="text-xl font-bold text-slate-900">{{ details.performance.assetCounts.scripts }}</span>
                <span class="block text-[10px] uppercase font-bold text-slate-400">Scripts JS</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span class="text-xl font-bold text-slate-900">{{ details.performance.assetCounts.styles }}</span>
                <span class="block text-[10px] uppercase font-bold text-slate-400">Hojas CSS</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span class="text-xl font-bold text-slate-900">{{ details.performance.assetCounts.images }}</span>
                <span class="block text-[10px] uppercase font-bold text-slate-400">Imágenes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: SEGURIDAD -->
      <div v-if="currentTab === 'security'" class="space-y-6">
        <!-- SSL Card -->
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificado SSL / TLS</span>
            <h4 class="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              {{ details.security.ssl.issuer }}
            </h4>
            <p class="text-xs text-slate-500 mt-1">
              Válido hasta: {{ details.security.ssl.validTo || 'N/A' }} ({{ details.security.ssl.daysRemaining }} días restantes)
            </p>
          </div>
          <StatusBadge :status="details.security.ssl.valid ? 'good' : 'critical'">
            {{ details.security.ssl.valid ? 'SSL Válido' : 'Certificado Inválido' }}
          </StatusBadge>
        </div>

        <!-- Security Headers Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Cabeceras HTTP de Seguridad</h3>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="h in details.security.headers"
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

      <!-- TAB 5: DOMINIO -->
      <div v-if="currentTab === 'domain'" class="space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-200">
            <h3 class="text-base font-bold text-slate-900">Registros DNS de {{ audit.domain }}</h3>
            <p class="text-xs text-slate-500">Resolución activa de registros del sistema de nombres de dominio.</p>
          </div>

          <div class="p-6 space-y-6">
            <!-- A Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Registros A (Dirección IPv4)</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="ip in details.domainData.records.a"
                  :key="ip"
                  class="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                >
                  {{ ip }}
                </span>
                <span v-if="details.domainData.records.a.length === 0" class="text-xs text-slate-400 italic">
                  No se encontraron registros A
                </span>
              </div>
            </div>

            <!-- MX Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Registros MX (Servidores de Correo)</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="mx in details.domainData.records.mx"
                  :key="mx.exchange"
                  class="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                >
                  [{{ mx.priority }}] {{ mx.exchange }}
                </span>
                <span v-if="details.domainData.records.mx.length === 0" class="text-xs text-slate-400 italic">
                  Sin registros MX configurados
                </span>
              </div>
            </div>

            <!-- NS Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Servidores de Nombres (NS)</span>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="ns in details.domainData.records.ns"
                  :key="ns"
                  class="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                >
                  {{ ns }}
                </span>
              </div>
            </div>

            <!-- TXT Records -->
            <div>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Registros TXT (SPF / Verificaciones)</span>
              <div class="mt-2 space-y-1.5">
                <div
                  v-for="(txt, idx) in details.domainData.records.txt"
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

      <!-- TAB 6: TECNOLOGÍA -->
      <div v-if="currentTab === 'tech'" class="space-y-6">
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-base font-bold text-slate-900 mb-1">Stack Tecnológico Detectado</h3>
          <p class="text-xs text-slate-500 mb-6">Herramientas, plataformas, frameworks y servicios identificados en este sitio.</p>

          <div v-if="details.tech.length === 0" class="p-8 text-center text-slate-400 text-sm">
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

      <!-- TAB 7: PLAN DE ACCIÓN -->
      <div v-if="currentTab === 'action-plan'" class="space-y-6">
        <div class="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-extrabold text-slate-900">Plan de Acción Técnico Priorizado</h3>
            <p class="text-xs text-slate-500">Tareas y recomendaciones ordenadas por impacto y facilidad de resolución.</p>
          </div>

          <button
            @click="exportPlan"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimir / Exportar Reporte</span>
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="item in details.actionPlan"
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

definePageMeta({
  middleware: 'auth'
})

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
