import tls from 'node:tls'
import { URL } from 'node:url'

export interface TargetFetchResult {
  html: string
  headers: Record<string, string>
  status: number
  ttfbMs: number
  responseTimeMs: number
  pageSizeBytes: number
  finalUrl: string
  robotsTxtExists: boolean
  sitemapExists: boolean
  sslInfo: {
    valid: boolean
    issuer: string
    validTo: string
    daysRemaining: number
  }
}

export async function fetchTarget(targetUrl: string): Promise<TargetFetchResult> {
  const urlObj = new URL(targetUrl)
  const isHttps = urlObj.protocol === 'https:'

  const startTime = performance.now()
  let ttfbMs = 0

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 WebAuditor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      signal: controller.signal,
      redirect: 'follow'
    })
    ttfbMs = Math.round(performance.now() - startTime)
  } finally {
    clearTimeout(timeout)
  }

  const html = await response.text()
  const responseTimeMs = Math.round(performance.now() - startTime)
  const pageSizeBytes = Buffer.byteLength(html, 'utf8')

  const headers: Record<string, string> = {}
  response.headers.forEach((val, key) => {
    headers[key.toLowerCase()] = val
  })

  // Check robots.txt and sitemap.xml in parallel
  const [robotsTxtExists, sitemapExists, sslInfo] = await Promise.all([
    checkHeadExists(`${urlObj.origin}/robots.txt`),
    checkHeadExists(`${urlObj.origin}/sitemap.xml`),
    isHttps ? inspectSslCertificate(urlObj.hostname, urlObj.port ? parseInt(urlObj.port) : 443) : Promise.resolve({ valid: false, issuer: 'None', validTo: '', daysRemaining: 0 })
  ])

  return {
    html,
    headers,
    status: response.status,
    ttfbMs,
    responseTimeMs,
    pageSizeBytes,
    finalUrl: response.url,
    robotsTxtExists,
    sitemapExists,
    sslInfo
  }
}

async function checkHeadExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
    return res.status >= 200 && res.status < 400
  } catch {
    return false
  }
}

function inspectSslCertificate(hostname: string, port = 443): Promise<{ valid: boolean; issuer: string; validTo: string; daysRemaining: number }> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        { host: hostname, port, servername: hostname, timeout: 5000 },
        () => {
          const cert = socket.getPeerCertificate()
          if (!cert || !cert.valid_to) {
            socket.destroy()
            return resolve({ valid: false, issuer: 'Unknown', validTo: '', daysRemaining: 0 })
          }

          const validToDate = new Date(cert.valid_to)
          const now = new Date()
          const daysRemaining = Math.max(0, Math.round((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          const issuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Verified CA') : 'Verified CA'

          socket.destroy()
          resolve({
            valid: socket.authorized,
            issuer: typeof issuer === 'string' ? issuer : 'Verified CA',
            validTo: validToDate.toISOString().split('T')[0],
            daysRemaining
          })
        }
      )

      socket.on('error', () => {
        socket.destroy()
        resolve({ valid: false, issuer: 'Error de conexión TLS', validTo: '', daysRemaining: 0 })
      })

      socket.on('timeout', () => {
        socket.destroy()
        resolve({ valid: false, issuer: 'Timeout SSL', validTo: '', daysRemaining: 0 })
      })
    } catch {
      resolve({ valid: false, issuer: 'Error desconocido', validTo: '', daysRemaining: 0 })
    }
  })
}
