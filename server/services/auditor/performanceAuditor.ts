import * as cheerio from 'cheerio'
import type { PerformanceAuditResult, ActionPlanItem } from './types'

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

  // 1. TTFB (Time to First Byte)
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
  } else if (ttfbMs < 200) {
    // Excellent bonus
  }

  // 2. Compression (Gzip / Brotli)
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

  // 3. Cache Headers
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

  // 4. Page Size
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

  // 5. Asset counts
  const scriptsCount = $('script[src]').length
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
    issues
  }
}
