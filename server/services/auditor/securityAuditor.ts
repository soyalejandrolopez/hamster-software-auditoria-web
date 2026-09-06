import * as cheerio from 'cheerio'
import type { SecurityAuditResult, CookieAuditItem, ActionPlanItem } from './types'

export interface SecurityAuditOptions {
  url: string
  headers: Record<string, string>
  sslInfo: {
    valid: boolean
    issuer: string
    validTo: string
    daysRemaining: number
  }
  sslDetails?: {
    protocol: string
    cipher: string
    keySize: number
  }
  html: string
  cookies?: string[]
}

export function auditSecurity(options: SecurityAuditOptions): SecurityAuditResult {
  const { url, headers, sslInfo, html, cookies = [], sslDetails } = options
  const isHttps = url.toLowerCase().startsWith('https://')
  const issues: ActionPlanItem[] = []

  let score = 100

  // ─── 1. HTTPS & SSL ───
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
        'Instala un certificado SSL gratuito mediante Let\'s Encrypt o habilita Cloudflare SSL.',
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

  // ─── 2. TLS Version Check (NEW) ───
  const tlsProtocol = sslDetails?.protocol || 'unknown'
  if (tlsProtocol.includes('TLSv1') && !tlsProtocol.includes('TLSv1.2') && !tlsProtocol.includes('TLSv1.3')) {
    score -= 15
    issues.push({
      id: 'sec_old_tls',
      category: 'security',
      severity: 'critical',
      title: 'Protocolo TLS obsoleto detectado',
      description: `El servidor usa ${tlsProtocol}, que es vulnerable. TLS 1.0 y 1.1 están descontinuados desde 2020.`,
      impact: 'high',
      effort: 'medium',
      steps: ['Actualiza la configuración del servidor para soportar solo TLS 1.2 y TLS 1.3.']
    })
  }

  // ─── 3. Security Headers Checklist ───
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

  // ─── 4. Mixed Content Check ───
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

  // ─── 5. Cookie Security Audit (NEW) ───
  const insecureCookies: CookieAuditItem[] = []
  for (const cookieStr of cookies) {
    const parts = cookieStr.split(';').map(p => p.trim())
    const nameValue = parts[0] || ''
    const cookieName = nameValue.split('=')[0] || 'unknown'
    const lowerParts = parts.map(p => p.toLowerCase())

    const hasSecure = lowerParts.some(p => p === 'secure')
    const hasHttpOnly = lowerParts.some(p => p === 'httponly')
    const sameSitePart = lowerParts.find(p => p.startsWith('samesite='))
    const sameSite = sameSitePart ? sameSitePart.split('=')[1] : null

    const cookieIssues: string[] = []
    if (isHttps && !hasSecure) cookieIssues.push('Falta flag Secure')
    if (!hasHttpOnly) cookieIssues.push('Falta flag HttpOnly')
    if (!sameSite || sameSite === 'none') cookieIssues.push('SameSite no configurado o es None')

    if (cookieIssues.length > 0) {
      insecureCookies.push({
        name: cookieName,
        secure: hasSecure,
        httpOnly: hasHttpOnly,
        sameSite,
        issues: cookieIssues
      })
    }
  }

  if (insecureCookies.length > 0) {
    score -= Math.min(10, insecureCookies.length * 3)
    issues.push({
      id: 'sec_insecure_cookies',
      category: 'security',
      severity: 'warning',
      title: `${insecureCookies.length} cookie(s) sin flags de seguridad`,
      description: 'Las cookies sin HttpOnly, Secure o SameSite son vulnerables a robo por XSS o CSRF.',
      impact: 'medium',
      effort: 'low',
      steps: [
        'Configura todas las cookies con los flags: Secure, HttpOnly, SameSite=Lax.',
        'Las cookies de sesión deben tener HttpOnly obligatoriamente.'
      ]
    })
  }

  // ─── 6. Server Info Disclosure (NEW) ───
  const serverHeader = headers['server'] || null
  const xPoweredBy = headers['x-powered-by'] || null
  const serverDisclosed = Boolean(serverHeader || xPoweredBy)
  const serverValue = serverHeader || xPoweredBy || null

  // Check if version numbers are exposed
  const versionPattern = /\d+\.\d+/
  const exposesVersion = (serverHeader && versionPattern.test(serverHeader)) || (xPoweredBy && versionPattern.test(xPoweredBy))

  if (exposesVersion) {
    score -= 5
    issues.push({
      id: 'sec_server_disclosure',
      category: 'security',
      severity: 'info',
      title: 'El servidor revela información de versión',
      description: `El encabezado Server/X-Powered-By expone "${serverValue}", lo que facilita a atacantes buscar vulnerabilidades conocidas.`,
      impact: 'low',
      effort: 'low',
      steps: [
        'Configura server_tokens off en Nginx o ServerTokens Prod en Apache.',
        'Elimina el encabezado X-Powered-By en la configuración del servidor.'
      ]
    })
  }

  // ─── 7. CORS Misconfiguration (NEW) ───
  const corsHeader = headers['access-control-allow-origin'] || null
  const hasWildcardCors = corsHeader === '*'
  if (hasWildcardCors) {
    score -= 5
    issues.push({
      id: 'sec_cors_wildcard',
      category: 'security',
      severity: 'info',
      title: 'CORS con Access-Control-Allow-Origin: * (wildcard)',
      description: 'Cualquier dominio puede hacer peticiones a tu API, lo que puede ser un riesgo si hay datos sensibles.',
      impact: 'low',
      effort: 'low',
      steps: ['Restringe Access-Control-Allow-Origin a los dominios específicos que necesiten acceso.']
    })
  }

  // ─── 8. Subresource Integrity (SRI) Check (NEW) ───
  const $ = cheerio.load(html)
  let scriptsWithoutSri = 0
  let linksWithoutSri = 0

  $('script[src]').each((_, el) => {
    const src = $(el).attr('src') || ''
    const integrity = $(el).attr('integrity')
    // Only check external CDN scripts (not same-origin)
    if ((src.startsWith('http://') || src.startsWith('https://')) && !integrity) {
      scriptsWithoutSri++
    }
  })

  $('link[rel="stylesheet"][href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const integrity = $(el).attr('integrity')
    if ((href.startsWith('http://') || href.startsWith('https://')) && !integrity) {
      linksWithoutSri++
    }
  })

  const totalWithoutSri = scriptsWithoutSri + linksWithoutSri
  if (totalWithoutSri > 3) {
    score -= 3
    issues.push({
      id: 'sec_missing_sri',
      category: 'security',
      severity: 'info',
      title: `${totalWithoutSri} recursos CDN sin Subresource Integrity (SRI)`,
      description: 'Sin SRI, si un CDN es comprometido, scripts maliciosos podrían ejecutarse en tu página.',
      impact: 'medium',
      effort: 'medium',
      steps: ['Añade atributos integrity="sha384-..." y crossorigin="anonymous" a scripts y estilos externos.']
    })
  }

  // ─── 9. CSP Detailed Analysis (NEW) ───
  const cspHeader = headers['content-security-policy'] || ''
  let hasUnsafeInline = false
  let hasUnsafeEval = false
  let cspDetails = 'No se detectó Content-Security-Policy.'

  if (cspHeader) {
    hasUnsafeInline = cspHeader.includes("'unsafe-inline'")
    hasUnsafeEval = cspHeader.includes("'unsafe-eval'")
    cspDetails = cspHeader.substring(0, 200)

    if (hasUnsafeInline) {
      score -= 3
      issues.push({
        id: 'sec_csp_unsafe_inline',
        category: 'security',
        severity: 'info',
        title: "CSP permite 'unsafe-inline'",
        description: "La directiva unsafe-inline en CSP reduce significativamente la protección contra XSS.",
        impact: 'medium',
        effort: 'high',
        steps: [
          "Reemplaza 'unsafe-inline' con nonces (nonce-xxx) o hashes para scripts y estilos.",
          'Usa strict-dynamic para adopción incremental.'
        ]
      })
    }

    if (hasUnsafeEval) {
      score -= 3
      issues.push({
        id: 'sec_csp_unsafe_eval',
        category: 'security',
        severity: 'warning',
        title: "CSP permite 'unsafe-eval'",
        description: "La directiva unsafe-eval permite eval() y new Function(), facilitando la ejecución de código malicioso.",
        impact: 'high',
        effort: 'high',
        steps: ["Elimina 'unsafe-eval' de la CSP y refactoriza el código que usa eval()."]
      })
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    https: { isHttps, redirectsToHttps: isHttps },
    ssl: sslInfo,
    sslDetails: sslDetails || { protocol: 'unknown', cipher: 'unknown', keySize: 0 },
    headers: headerResults,
    mixedContent: { detected: mixedContentDetected, count: mixedContentCount },
    cookies: { total: cookies.length, insecure: insecureCookies, allSecure: insecureCookies.length === 0 },
    serverDisclosure: {
      disclosed: serverDisclosed,
      value: serverValue,
      message: exposesVersion
        ? `Se expone versión: ${serverValue}`
        : serverDisclosed
          ? `Servidor detectado: ${serverValue} (sin versión expuesta)`
          : 'No se revela información del servidor'
    },
    cors: { hasWildcard: hasWildcardCors, value: corsHeader },
    sri: {
      scriptsWithoutSri,
      linksWithoutSri,
      message: totalWithoutSri > 0 ? `${totalWithoutSri} recurso(s) CDN sin SRI` : 'Todos los recursos CDN tienen SRI'
    },
    cspAnalysis: { hasUnsafeInline, hasUnsafeEval, details: cspDetails },
    issues
  }
}
