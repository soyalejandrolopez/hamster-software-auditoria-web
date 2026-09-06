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
  sslDetails: {
    protocol: string
    cipher: string
    keySize: number
  }
  cookies: string[]
  redirectChain: string[]
}

export async function fetchTarget(targetUrl: string): Promise<TargetFetchResult> {
  const urlObj = new URL(targetUrl)
  const isHttps = urlObj.protocol === 'https:'

  const startTime = performance.now()
  let ttfbMs = 0

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  // Track redirects manually for the chain
  const redirectChain: string[] = [targetUrl]

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 HamsterSoftware-AuditoriaWeb/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      signal: controller.signal,
      redirect: 'follow'
    })
    ttfbMs = Math.round(performance.now() - startTime)

    // If the final URL differs, a redirect occurred
    if (response.url !== targetUrl) {
      redirectChain.push(response.url)
    }
  } finally {
    clearTimeout(timeout)
  }

  const html = await response.text()
  const responseTimeMs = Math.round(performance.now() - startTime)
  const pageSizeBytes = Buffer.byteLength(html, 'utf8')

  const headers: Record<string, string> = {}
  const cookies: string[] = []
  response.headers.forEach((val, key) => {
    const lk = key.toLowerCase()
    if (lk === 'set-cookie') {
      cookies.push(val)
    }
    headers[lk] = val
  })

  // Check robots.txt, sitemap.xml, and SSL in parallel
  const [robotsTxtExists, sitemapExists, sslInfo, sslDetails] = await Promise.all([
    checkHeadExists(`${urlObj.origin}/robots.txt`),
    checkHeadExists(`${urlObj.origin}/sitemap.xml`),
    isHttps ? inspectSslCertificate(urlObj.hostname, urlObj.port ? parseInt(urlObj.port) : 443) : Promise.resolve({ valid: false, issuer: 'None', validTo: '', daysRemaining: 0 }),
    isHttps ? inspectSslDetails(urlObj.hostname, urlObj.port ? parseInt(urlObj.port) : 443) : Promise.resolve({ protocol: 'none', cipher: 'none', keySize: 0 })
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
    sslInfo,
    sslDetails,
    cookies,
    redirectChain
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

function inspectSslDetails(hostname: string, port = 443): Promise<{ protocol: string; cipher: string; keySize: number }> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        { host: hostname, port, servername: hostname, timeout: 5000 },
        () => {
          const protocol = socket.getProtocol() || 'unknown'
          const cipherInfo = socket.getCipher()
          socket.destroy()
          resolve({
            protocol,
            cipher: cipherInfo?.name || 'unknown',
            keySize: cipherInfo?.version ? 256 : 0
          })
        }
      )

      socket.on('error', () => {
        socket.destroy()
        resolve({ protocol: 'error', cipher: 'error', keySize: 0 })
      })

      socket.on('timeout', () => {
        socket.destroy()
        resolve({ protocol: 'timeout', cipher: 'timeout', keySize: 0 })
      })
    } catch {
      resolve({ protocol: 'unknown', cipher: 'unknown', keySize: 0 })
    }
  })
}
