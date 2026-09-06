import * as cheerio from 'cheerio'
import { URL } from 'node:url'
import type { LinkCheckResult, CheckedLink, ActionPlanItem } from './types'

export interface LinkCheckOptions {
  html: string
  url: string
  maxChecks?: number // Limit concurrent checks to avoid overloading
}

/**
 * Link Checker — Extracts all <a href> links from HTML and verifies them.
 * Checks up to maxChecks links (default: 30) to keep audit fast.
 */
export async function checkLinks(options: LinkCheckOptions): Promise<LinkCheckResult> {
  const { html, url, maxChecks = 30 } = options
  const $ = cheerio.load(html)
  const issues: ActionPlanItem[] = []

  const urlObj = (() => {
    try { return new URL(url) } catch { return null }
  })()
  const targetDomain = urlObj?.hostname?.replace(/^www\./, '') || ''

  // Extract all unique links
  const linkSet = new Set<string>()
  const linkTypes = new Map<string, 'internal' | 'external'>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return

    try {
      const resolved = new URL(href, url)
      const fullUrl = resolved.href
      if (!linkSet.has(fullUrl)) {
        linkSet.add(fullUrl)
        const linkDomain = resolved.hostname.replace(/^www\./, '')
        linkTypes.set(fullUrl, linkDomain === targetDomain ? 'internal' : 'external')
      }
    } catch {
      // Invalid URL, skip
    }
  })

  const totalLinks = linkSet.size
  const linksToCheck = Array.from(linkSet).slice(0, maxChecks)

  // Check links in parallel batches of 10
  const broken: CheckedLink[] = []
  const redirects: CheckedLink[] = []
  const batchSize = 10

  for (let i = 0; i < linksToCheck.length; i += batchSize) {
    const batch = linksToCheck.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(linkUrl => checkSingleLink(linkUrl, linkTypes.get(linkUrl) || 'external'))
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const checked = result.value
        if (!checked.ok) {
          broken.push(checked)
        } else if (checked.status && (checked.status === 301 || checked.status === 302 || checked.status === 307 || checked.status === 308)) {
          redirects.push(checked)
        }
      }
    }
  }

  // Generate issues
  if (broken.length > 0) {
    const severity = broken.length > 5 ? 'critical' : broken.length > 2 ? 'warning' : 'info'
    issues.push({
      id: 'links_broken',
      category: 'links',
      severity,
      title: `${broken.length} enlace(s) rotos detectados`,
      description: `Se encontraron ${broken.length} enlaces que devuelven error (404, 5xx o timeout) de ${totalLinks} enlaces totales.`,
      impact: broken.length > 5 ? 'high' : 'medium',
      effort: 'low',
      steps: [
        'Revisa y actualiza o elimina los enlaces rotos del contenido.',
        'Configura redirecciones 301 para URLs que han cambiado.',
        ...broken.slice(0, 5).map(b => `• ${b.url} → ${b.status || b.error}`)
      ]
    })
  }

  if (redirects.length > 5) {
    issues.push({
      id: 'links_excessive_redirects',
      category: 'links',
      severity: 'info',
      title: `${redirects.length} enlaces con redirección`,
      description: 'Muchos enlaces con redirección ralentizan la navegación y consumen crawl budget.',
      impact: 'low',
      effort: 'low',
      steps: ['Actualiza los enlaces para apuntar directamente a la URL final.']
    })
  }

  // Calculate score
  const brokenRatio = totalLinks > 0 ? broken.length / Math.min(totalLinks, maxChecks) : 0
  const score = Math.max(0, Math.min(100, Math.round(100 - brokenRatio * 100)))

  return {
    score,
    totalLinks,
    checkedCount: linksToCheck.length,
    broken,
    redirects,
    issues
  }
}

async function checkSingleLink(url: string, type: 'internal' | 'external'): Promise<CheckedLink> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
          'User-Agent': 'Mozilla/5.0 HamsterSoftware-AuditoriaWeb/1.0 LinkChecker',
        'Accept': '*/*'
      },
      signal: controller.signal,
      redirect: 'manual' // Don't follow redirects to detect them
    })

    clearTimeout(timeout)

    const status = response.status
    const ok = status >= 200 && status < 400

    return { url, type, status, ok }
  } catch (err: any) {
    // If HEAD fails, try GET (some servers block HEAD requests)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 HamsterSoftware-AuditoriaWeb/1.0 LinkChecker',
          'Accept': '*/*'
        },
        signal: controller.signal,
        redirect: 'manual'
      })

      clearTimeout(timeout)

      // Consume and discard body
      await response.text().catch(() => {})

      const status = response.status
      const ok = status >= 200 && status < 400

      return { url, type, status, ok }
    } catch {
      return {
        url,
        type,
        status: null,
        ok: false,
        error: err.name === 'AbortError' ? 'Timeout' : 'Error de conexión'
      }
    }
  }
}
