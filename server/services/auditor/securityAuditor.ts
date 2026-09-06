import * as cheerio from 'cheerio'
import type { SecurityAuditResult, ActionPlanItem } from './types'

export interface SecurityAuditOptions {
  url: string
  headers: Record<string, string>
  sslInfo: {
    valid: boolean
    issuer: string
    validTo: string
    daysRemaining: number
  }
  html: string
}

export function auditSecurity(options: SecurityAuditOptions): SecurityAuditResult {
  const { url, headers, sslInfo, html } = options
  const isHttps = url.toLowerCase().startsWith('https://')
  const issues: ActionPlanItem[] = []

  let score = 100

  // 1. HTTPS & SSL
  if (!isHttps) {
    score -= 40
    issues.push({
      id: 'sec_no_https',
      category: 'security',
      severity: 'critical',
      title: 'El sitio no utiliza conexión segura HTTPS',
      description: 'Cualquier dato enviado entre el usuario y el servidor se transmite en texto plano sin cifrar.',
      impact: 'high',
      effort: 'low',
      steps: [
        'Instala un certificado SSL gratuito mediante Let’s Encrypt o habilita Cloudflare SSL.',
        'Configura una redirección forzada 301 de HTTP hacia HTTPS en tu servidor.'
      ]
    })
  } else if (!sslInfo.valid) {
    score -= 25
    issues.push({
      id: 'sec_invalid_ssl',
      category: 'security',
      severity: 'critical',
      title: 'Certificado SSL inválido o no verificado',
      description: 'Los visitantes verán una advertencia de seguridad en rojo que bloquea el acceso al sitio.',
      impact: 'high',
      effort: 'low',
      steps: ['Renueva o reexpide el certificado SSL con una autoridad certificadora confiable.']
    })
  } else if (sslInfo.daysRemaining < 15) {
    score -= 10
    issues.push({
      id: 'sec_expiring_ssl',
      category: 'security',
      severity: 'warning',
      title: `El certificado SSL expira en ${sslInfo.daysRemaining} días`,
      description: 'Si expira, los usuarios no podrán acceder de forma segura al sitio web.',
      impact: 'high',
      effort: 'low',
      steps: ['Renueva el certificado SSL o activa la renovación automática con Certbot.']
    })
  }

  // 2. Security Headers Checklist
  const securityHeaderDefs = [
    {
      name: 'Strict-Transport-Security',
      penalty: 15,
      severity: 'critical' as const,
      recommended: 'max-age=31536000; includeSubDomains',
      desc: 'Fuerza a los navegadores a conectarse únicamente mediante HTTPS, evitando ataques de degradación SSL y spoofing.'
    },
    {
      name: 'Content-Security-Policy',
      penalty: 15,
      severity: 'warning' as const,
      recommended: "default-src 'self'",
      desc: 'Protege contra ataques de Cross-Site Scripting (XSS) e inyecciones de datos no autorizadas.'
    },
    {
      name: 'X-Frame-Options',
      penalty: 10,
      severity: 'warning' as const,
      recommended: 'SAMEORIGIN o DENY',
      desc: 'Protege contra Clickjacking impidiendo que la web sea incrustada en un <iframe> malicioso.'
    },
    {
      name: 'X-Content-Type-Options',
      penalty: 8,
      severity: 'warning' as const,
      recommended: 'nosniff',
      desc: 'Evita que el navegador intente adivinar (MIME sniffing) tipos de contenido peligrosos.'
    },
    {
      name: 'Referrer-Policy',
      penalty: 5,
      severity: 'info' as const,
      recommended: 'strict-origin-when-cross-origin',
      desc: 'Controla qué información del remitente se envía cuando el usuario hace clic en enlaces externos.'
    },
    {
      name: 'Permissions-Policy',
      penalty: 5,
      severity: 'info' as const,
      recommended: 'camera=(), microphone=(), geolocation=()',
      desc: 'Restringe el acceso del navegador a funciones de hardware sensibles como cámara y micrófono.'
    }
  ]

  const headerResults: Array<{ name: string; present: boolean; value?: string; recommended: string }> = []

  for (const def of securityHeaderDefs) {
    const key = def.name.toLowerCase()
    const value = headers[key]
    const present = Boolean(value)
    headerResults.push({
      name: def.name,
      present,
      value: value || undefined,
      recommended: def.recommended
    })

    if (!present) {
      score -= def.penalty
      issues.push({
        id: `sec_missing_${key.replace(/-/g, '_')}`,
        category: 'security',
        severity: def.severity,
        title: `Falta cabecera de seguridad ${def.name}`,
        description: def.desc,
        impact: def.severity === 'critical' ? 'high' : 'medium',
        effort: 'low',
        steps: [`Añade la cabecera "${def.name}: ${def.recommended}" en la configuración de Nginx, Apache o Cloudflare Transform Rules.`]
      })
    }
  }

  // 3. Mixed Content Check
  let mixedContentDetected = false
  let mixedContentCount = 0
  if (isHttps) {
    const $ = cheerio.load(html)
    $('script[src], link[href], img[src], iframe[src]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href')
      if (src && src.startsWith('http://')) {
        mixedContentCount++
        mixedContentDetected = true
      }
    })

    if (mixedContentDetected) {
      score -= 15
      issues.push({
        id: 'sec_mixed_content',
        category: 'security',
        severity: 'critical',
        title: 'Contenido mixto detectado (HTTP en HTTPS)',
        description: `Se detectaron ${mixedContentCount} recursos externos cargados mediante HTTP inseguro dentro de una página segura HTTPS.`,
        impact: 'high',
        effort: 'low',
        steps: ['Actualiza las rutas de los scripts, imágenes y hojas de estilo para utilizar enlaces "https://" o relativos.']
      })
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    https: { isHttps, redirectsToHttps: isHttps },
    ssl: sslInfo,
    headers: headerResults,
    mixedContent: { detected: mixedContentDetected, count: mixedContentCount },
    issues
  }
}
