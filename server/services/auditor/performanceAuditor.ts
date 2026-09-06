import * as cheerio from 'cheerio'
import type { PerformanceAuditResult, CoreWebVitals, ActionPlanItem } from './types'

export interface PerformanceAuditOptions {
  html: string
  headers: Record<string, string>
  ttfbMs: number
  responseTimeMs: number
  pageSizeBytes: number
  pageSpeedApiKey?: string
  url?: string
}

export function auditPerformance(options: PerformanceAuditOptions): PerformanceAuditResult {
  const { html, headers, ttfbMs, responseTimeMs, pageSizeBytes } = options
  const $ = cheerio.load(html)
  const issues: ActionPlanItem[] = []

  let score = 100

  // ─── 1. TTFB (Time to First Byte) ───
  if (ttfbMs > 1000) {
    score -= 25
    issues.push({
      id: 'perf_very_slow_ttfb',
      category: 'performance',
      severity: 'critical',
      title: 'Tiempo de respuesta del servidor muy alto (TTFB > 1s)',
      description: `El servidor tardó ${ttfbMs}ms en enviar el primer byte. Google recomienda menos de 200-500ms.`,
      impact: 'high',
      effort: 'medium',
      steps: [
        'Utiliza una red CDN (como Cloudflare) para cachear páginas estáticas y dinámicas en el borde.',
        'Habilita caché de consultas a base de datos y optimiza llamadas lentas.',
        'Verifica el tamaño de la instancia o alojamiento web.'
      ]
    })
  } else if (ttfbMs > 500) {
    score -= 12
    issues.push({
      id: 'perf_slow_ttfb',
      category: 'performance',
      severity: 'warning',
      title: 'TTFB moderadamente lento (> 500ms)',
      description: `El tiempo al primer byte fue de ${ttfbMs}ms. Se puede mejorar con almacenamiento en caché.`,
      impact: 'medium',
      effort: 'low',
      steps: ['Configura un proxy inverso o CDN para acelerar la entrega.']
    })
  }

  // ─── 2. Compression (Gzip / Brotli) ───
  const contentEncoding = headers['content-encoding']?.toLowerCase() || null
  const isCompressed = Boolean(contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('br') || contentEncoding.includes('zstd')))

  if (!isCompressed) {
    score -= 20
    issues.push({
      id: 'perf_no_compression',
      category: 'performance',
      severity: 'critical',
      title: 'Compresión Gzip / Brotli no habilitada',
      description: 'El servidor no está comprimiendo los recursos de texto, lo que puede aumentar el tamaño de descarga hasta un 70%.',
      impact: 'high',
      effort: 'low',
      steps: [
        'Habilita compresión Gzip o Brotli en tu servidor web (Nginx, Apache o Caddy).',
        'Si usas Cloudflare u otra CDN, activa "Brotli compression" en el panel de control.'
      ]
    })
  }

  // ─── 3. Cache Headers ───
  const cacheControl = headers['cache-control'] || ''
  const etag = headers['etag'] || ''
  const hasCacheControl = cacheControl.length > 0
  const hasETag = etag.length > 0

  if (!hasCacheControl && !hasETag) {
    score -= 15
    issues.push({
      id: 'perf_no_cache',
      category: 'performance',
      severity: 'warning',
      title: 'Sin cabeceras de caché del navegador',
      description: 'No se detectaron cabeceras Cache-Control ni ETag, lo que obliga al navegador a descargar todo en cada visita.',
      impact: 'medium',
      effort: 'low',
      steps: [
        'Configura cabeceras Cache-Control para assets estáticos (ej: Cache-Control: public, max-age=31536000, immutable).',
        'Asegura que el servidor genere etiquetas ETag.'
      ]
    })
  }

  // ─── 4. Page Size ───
  const sizeKb = Math.round(pageSizeBytes / 1024)
  if (sizeKb > 500) {
    score -= 15
    issues.push({
      id: 'perf_large_html',
      category: 'performance',
      severity: 'warning',
      title: 'Documento HTML muy pesado',
      description: `El código HTML de la página pesa ${sizeKb} KB. Idealmente el HTML inicial debe ser inferior a 150 KB.`,
      impact: 'medium',
      effort: 'medium',
      steps: [
        'Evita incrustar imágenes en base64 de gran tamaño directamente en el HTML.',
        'Elimina scripts y CSS inline excesivos y muévelos a archivos externos cacheados.'
      ]
    })
  }

  // ─── 5. Asset counts ───
  const allScripts = $('script[src]')
  const scriptsCount = allScripts.length
  const stylesCount = $('link[rel="stylesheet"]').length
  const imagesCount = $('img').length

  if (scriptsCount > 25) {
    score -= 8
    issues.push({
      id: 'perf_too_many_scripts',
      category: 'performance',
      severity: 'info',
      title: 'Elevado número de scripts externos',
      description: `Se detectaron ${scriptsCount} scripts externos que bloquean el renderizado inicial.`,
      impact: 'medium',
      effort: 'medium',
      steps: [
        'Añade atributos defer o async a los scripts externos que no sean críticos.',
        'Combina o unifica paquetes JavaScript.'
      ]
    })
  }

  // ─── 6. Render-Blocking Resources (NEW) ───
  let blockingScripts = 0
  let blockingStylesheets = 0

  allScripts.each((_, el) => {
    const src = $(el).attr('src')
    const hasAsync = $(el).attr('async') !== undefined
    const hasDefer = $(el).attr('defer') !== undefined
    const hasType = $(el).attr('type')
    if (src && !hasAsync && !hasDefer && hasType !== 'module') {
      blockingScripts++
    }
  })

  $('link[rel="stylesheet"]').each((_, el) => {
    const media = $(el).attr('media')
    if (!media || media === 'all' || media === 'screen') {
      blockingStylesheets++
    }
  })

  if (blockingScripts > 5) {
    score -= 5
    issues.push({
      id: 'perf_render_blocking_scripts',
      category: 'performance',
      severity: 'warning',
      title: `${blockingScripts} scripts bloquean el renderizado`,
      description: 'Los scripts sin atributo async o defer bloquean el parser HTML, retrasando la primera pintura.',
      impact: 'medium',
      effort: 'low',
      steps: [
        'Añade el atributo defer a scripts que no necesitan ejecutarse inmediatamente.',
        'Usa type="module" para scripts modernos que soportan carga diferida nativa.'
      ]
    })
  }

  // ─── 7. Image Analysis (NEW) ───
  let withoutDimensions = 0
  let heavyFormats = 0
  let lazyLoaded = 0

  $('img').each((_, el) => {
    const width = $(el).attr('width')
    const height = $(el).attr('height')
    if (!width || !height) withoutDimensions++

    const src = ($(el).attr('src') || '').toLowerCase()
    if (src.endsWith('.bmp') || src.endsWith('.tiff') || src.endsWith('.tif')) {
      heavyFormats++
    }

    const loading = $(el).attr('loading')
    if (loading === 'lazy') lazyLoaded++
  })

  if (withoutDimensions > 5) {
    score -= 3
    issues.push({
      id: 'perf_images_no_dimensions',
      category: 'performance',
      severity: 'info',
      title: `${withoutDimensions} imágenes sin dimensiones explícitas`,
      description: 'Las imágenes sin width y height causan layout shifts (CLS) al cargarse.',
      impact: 'medium',
      effort: 'low',
      steps: ['Añade atributos width y height a las etiquetas <img> para reservar espacio en el layout.']
    })
  }

  if (heavyFormats > 0) {
    score -= 5
    issues.push({
      id: 'perf_heavy_image_formats',
      category: 'performance',
      severity: 'warning',
      title: `${heavyFormats} imagen(es) en formato no optimizado`,
      description: 'Formatos como BMP y TIFF son extremadamente pesados. Usa WebP, AVIF o JPEG.',
      impact: 'high',
      effort: 'low',
      steps: ['Convierte las imágenes a formatos modernos como WebP o AVIF para reducir el peso hasta un 80%.']
    })
  }

  if (imagesCount > 5 && lazyLoaded === 0) {
    score -= 3
    issues.push({
      id: 'perf_no_lazy_loading',
      category: 'performance',
      severity: 'info',
      title: 'Sin lazy loading en imágenes',
      description: `Se encontraron ${imagesCount} imágenes y ninguna usa loading="lazy". Esto descarga todas las imágenes de golpe.`,
      impact: 'medium',
      effort: 'low',
      steps: ['Añade loading="lazy" a las imágenes que están fuera del viewport inicial.']
    })
  }

  // ─── 8. Inline CSS/JS Size (NEW) ───
  let inlineCssBytes = 0
  let inlineJsBytes = 0

  $('style').each((_, el) => {
    const content = $(el).html()
    if (content) inlineCssBytes += Buffer.byteLength(content, 'utf8')
  })

  $('script:not([src])').each((_, el) => {
    const content = $(el).html()
    if (content) inlineJsBytes += Buffer.byteLength(content, 'utf8')
  })

  const inlineCssKb = Math.round(inlineCssBytes / 1024)
  const inlineJsKb = Math.round(inlineJsBytes / 1024)

  if (inlineCssKb > 50) {
    score -= 4
    issues.push({
      id: 'perf_large_inline_css',
      category: 'performance',
      severity: 'info',
      title: `CSS inline excesivo (${inlineCssKb} KB)`,
      description: 'El CSS inline muy grande no se puede cachear y aumenta el tamaño del HTML.',
      impact: 'medium',
      effort: 'medium',
      steps: ['Extrae el CSS inline a archivos externos cacheables.']
    })
  }

  if (inlineJsKb > 100) {
    score -= 4
    issues.push({
      id: 'perf_large_inline_js',
      category: 'performance',
      severity: 'info',
      title: `JavaScript inline excesivo (${inlineJsKb} KB)`,
      description: 'El JS inline muy grande bloquea el renderizado y no se puede cachear.',
      impact: 'medium',
      effort: 'medium',
      steps: ['Mueve el JavaScript inline a archivos externos con defer o async.']
    })
  }

  // ─── 9. DOM Stats (NEW) ───
  const allElements = $('*')
  const totalNodes = allElements.length

  // Calculate approximate max depth
  let maxDepth = 0
  function measureDepth(element: cheerio.Cheerio<cheerio.Element>, depth: number) {
    if (depth > maxDepth) maxDepth = depth
    if (depth > 32) return // limit recursion
    const children = element.children()
    if (children.length > 0) {
      children.each((_, child) => {
        measureDepth($(child), depth + 1)
      })
    }
  }
  // Sample first 5 top-level children to estimate depth without full traversal
  const bodyChildren = $('body').children()
  bodyChildren.slice(0, 5).each((_, child) => {
    measureDepth($(child), 1)
  })

  if (totalNodes > 1500) {
    score -= 5
    issues.push({
      id: 'perf_large_dom',
      category: 'performance',
      severity: 'warning',
      title: `DOM muy grande (${totalNodes} nodos)`,
      description: 'Un DOM excesivamente grande ralentiza las operaciones JavaScript, el layout y el painting del navegador.',
      impact: 'medium',
      effort: 'high',
      steps: [
        'Reduce el número de elementos DOM eliminando nodos innecesarios.',
        'Implementa virtualización o paginación para listas largas.',
        'Evita anidar componentes excesivamente.'
      ]
    })
  }

  // ─── 10. HTTP/2 Detection ───
  // HTTP/2 can be detected from headers or server behavior
  // The `alt-svc` header often indicates HTTP/2 or HTTP/3 support
  const altSvc = headers['alt-svc'] || ''
  const hasHttp2Hint = altSvc.includes('h2') || altSvc.includes('h3')
  const httpProtocol = hasHttp2Hint ? (altSvc.includes('h3') ? 'HTTP/3' : 'HTTP/2') : 'HTTP/1.1'

  return {
    score: Math.max(0, Math.min(100, score)),
    ttfbMs,
    responseTimeMs,
    pageSizeBytes,
    compression: { enabled: isCompressed, encoding: contentEncoding },
    cacheHeaders: {
      hasCacheControl,
      hasETag,
      details: cacheControl || (hasETag ? `ETag: ${etag}` : 'Sin cabeceras de caché')
    },
    assetCounts: { scripts: scriptsCount, styles: stylesCount, images: imagesCount },
    coreWebVitals: undefined, // Populated asynchronously if PageSpeed API key is available
    renderBlocking: { scripts: blockingScripts, stylesheets: blockingStylesheets },
    http2: { supported: hasHttp2Hint, protocol: httpProtocol },
    imageAnalysis: { totalImages: imagesCount, withoutDimensions, heavyFormats, lazyLoaded },
    domStats: { totalNodes, maxDepth },
    inlineSizes: { inlineCssBytes, inlineJsBytes },
    issues
  }
}

/**
 * Fetch Core Web Vitals from Google PageSpeed Insights API
 */
export async function fetchCoreWebVitals(url: string, apiKey: string): Promise<CoreWebVitals> {
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeedtest?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance`
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) })

    if (!response.ok) {
      return {}
    }

    const data: any = await response.json()
    const lighthouse = data?.lighthouseResult
    if (!lighthouse) return {}

    const audits = lighthouse.audits || {}
    const categories = lighthouse.categories || {}

    return {
      performanceScore: Math.round((categories?.performance?.score || 0) * 100),
      fcp: audits['first-contentful-paint']?.displayValue || undefined,
      lcp: audits['largest-contentful-paint']?.displayValue || undefined,
      cls: audits['cumulative-layout-shift']?.displayValue || undefined,
      tbt: audits['total-blocking-time']?.displayValue || undefined,
      si: audits['speed-index']?.displayValue || undefined,
      inp: audits['interaction-to-next-paint']?.displayValue || undefined
    }
  } catch {
    return {}
  }
}
