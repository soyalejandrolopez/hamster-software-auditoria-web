import { describe, it, expect } from 'vitest'
import { runAuditOnHtmlAndHeaders } from '../server/services/auditor'
import { generateActionPlan } from '../server/services/auditor/actionPlanGenerator'
import { auditSeo } from '../server/services/auditor/seoAuditor'
import { auditPerformance } from '../server/services/auditor/performanceAuditor'
import { auditSecurity } from '../server/services/auditor/securityAuditor'
import { auditTech } from '../server/services/auditor/techAuditor'

describe('Audit Engine Submodules', () => {
  const sampleGoodHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Empresa de Tecnología - Auditorías Web Profesionales</title>
      <meta name="description" content="Servicios líderes de optimización y auditoría técnica de sitios web para mejorar el rendimiento, SEO, seguridad y presencia digital en buscadores.">
      <link rel="canonical" href="https://ejemplo.com">
      <meta property="og:title" content="Empresa de Tecnología">
      <meta property="og:description" content="Servicios líderes de optimización...">
      <meta property="og:image" content="https://ejemplo.com/og.jpg">
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <h1>Soluciones Web Avanzadas</h1>
      <h2>Nuestros Servicios</h2>
      <img src="/logo.png" alt="Logo de la empresa">
      <script src="/app.js"></script>
    </body>
    </html>
  `

  const sampleHeaders = {
    'content-encoding': 'gzip',
    'cache-control': 'public, max-age=31536000',
    'etag': '"123456"',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'content-security-policy': "default-src 'self'",
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'server': 'nginx/1.24.0',
    'x-powered-by': 'Next.js'
  }

  it('should calculate high SEO score on well-optimized HTML', () => {
    const seo = auditSeo({
      html: sampleGoodHtml,
      url: 'https://ejemplo.com',
      robotsTxtExists: true,
      sitemapExists: true
    })

    expect(seo.score).toBeGreaterThanOrEqual(85)
    expect(seo.title.status).toBe('good')
    expect(seo.description.status).toBe('good')
    expect(seo.canonical.status).toBe('good')
    expect(seo.headings.h1Count).toBe(1)
    expect(seo.images.withoutAlt).toBe(0)
  })

  it('should penalize SEO when title, description and alt are missing', () => {
    const badHtml = `<html><body><img src="/test.jpg"></body></html>`
    const seo = auditSeo({
      html: badHtml,
      url: 'https://ejemplo.com',
      robotsTxtExists: false,
      sitemapExists: false
    })

    expect(seo.score).toBeLessThan(50)
    expect(seo.title.status).toBe('error')
    expect(seo.description.status).toBe('error')
    expect(seo.headings.h1Count).toBe(0)
    expect(seo.images.withoutAlt).toBe(1)
  })

  it('should evaluate performance metrics and compression', () => {
    const perf = auditPerformance({
      html: sampleGoodHtml,
      headers: sampleHeaders,
      ttfbMs: 120,
      responseTimeMs: 250,
      pageSizeBytes: 15000
    })

    expect(perf.score).toBeGreaterThanOrEqual(85)
    expect(perf.compression.enabled).toBe(true)
    expect(perf.compression.encoding).toBe('gzip')
    expect(perf.cacheHeaders.hasCacheControl).toBe(true)
  })

  it('should evaluate security headers and SSL', () => {
    const sec = auditSecurity({
      url: 'https://ejemplo.com',
      headers: sampleHeaders,
      sslInfo: {
        valid: true,
        issuer: "Let's Encrypt",
        validTo: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 80
      },
      html: sampleGoodHtml
    })

    expect(sec.score).toBeGreaterThanOrEqual(80)
    expect(sec.https.isHttps).toBe(true)
    expect(sec.ssl.valid).toBe(true)
    expect(sec.headers.find(h => h.name === 'Strict-Transport-Security')?.present).toBe(true)
  })

  it('should detect technologies from headers and HTML', () => {
    const tech = auditTech({
      html: sampleGoodHtml,
      headers: sampleHeaders
    })

    const names = tech.detected.map(t => t.name)
    expect(names).toContain('Nginx')
    expect(names).toContain('Next.js')
  })

  it('should generate prioritized Action Plan with critical items and quick wins', () => {
    const plan = generateActionPlan({
      seoScore: 40,
      performanceScore: 55,
      securityScore: 30,
      domainScore: 60,
      seoIssues: [
        { id: 'missing_title', category: 'seo', severity: 'critical', title: 'Agregar etiqueta de título', description: 'El sitio no tiene título.', impact: 'high', effort: 'low', steps: ['Agregar <title> en el <head>'] },
        { id: 'missing_alt', category: 'seo', severity: 'warning', title: 'Faltan atributos ALT', description: 'Imágenes sin descripción.', impact: 'medium', effort: 'low', steps: ['Añadir alt="" a las imágenes'] }
      ],
      performanceIssues: [
        { id: 'slow_ttfb', category: 'performance', severity: 'critical', title: 'TTFB elevado (>800ms)', description: 'El servidor tarda mucho en responder.', impact: 'high', effort: 'medium', steps: ['Optimizar base de datos o habilitar CDN'] }
      ],
      securityIssues: [
        { id: 'missing_hsts', category: 'security', severity: 'critical', title: 'Falta cabecera HSTS', description: 'Permite ataques man-in-the-middle.', impact: 'high', effort: 'low', steps: ['Configurar Strict-Transport-Security'] }
      ],
      domainIssues: []
    })

    expect(plan.length).toBeGreaterThanOrEqual(4)
    // Critical issues should come first
    expect(plan[0].severity).toBe('critical')
    expect(plan.some(p => p.id === 'missing_title')).toBe(true)
  })
})
