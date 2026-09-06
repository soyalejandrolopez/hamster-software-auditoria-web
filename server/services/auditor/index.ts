import { URL } from 'node:url'
import { fetchTarget } from './fetchTarget'
import { auditSeo } from './seoAuditor'
import { auditPerformance } from './performanceAuditor'
import { auditSecurity } from './securityAuditor'
import { auditDomain } from './domainAuditor'
import { auditTech } from './techAuditor'
import { generateActionPlan } from './actionPlanGenerator'
import type { AuditResult } from './types'

export * from './types'
export { auditSeo } from './seoAuditor'
export { auditPerformance } from './performanceAuditor'
export { auditSecurity } from './securityAuditor'
export { auditDomain } from './domainAuditor'
export { auditTech } from './techAuditor'
export { generateActionPlan } from './actionPlanGenerator'

export interface RunAuditOptions {
  pageSpeedApiKey?: string
}

export function normalizeTargetUrl(inputUrl: string): { normalizedUrl: string; domain: string } {
  let trimmed = inputUrl.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed
  }
  const parsed = new URL(trimmed)
  return {
    normalizedUrl: parsed.href,
    domain: parsed.hostname
  }
}

export async function runAudit(targetUrl: string, options?: RunAuditOptions): Promise<AuditResult> {
  const { normalizedUrl, domain } = normalizeTargetUrl(targetUrl)

  // 1. Fetch network target and resolve DNS in parallel
  const [targetData, domainData] = await Promise.all([
    fetchTarget(normalizedUrl),
    auditDomain(domain)
  ])

  // 2. Run sub-auditors
  const seo = auditSeo({
    html: targetData.html,
    url: targetData.finalUrl,
    robotsTxtExists: targetData.robotsTxtExists,
    sitemapExists: targetData.sitemapExists
  })

  const performance = auditPerformance({
    html: targetData.html,
    headers: targetData.headers,
    ttfbMs: targetData.ttfbMs,
    responseTimeMs: targetData.responseTimeMs,
    pageSizeBytes: targetData.pageSizeBytes,
    pageSpeedApiKey: options?.pageSpeedApiKey,
    url: targetData.finalUrl
  })

  const security = auditSecurity({
    url: targetData.finalUrl,
    headers: targetData.headers,
    sslInfo: targetData.sslInfo,
    html: targetData.html
  })

  const tech = auditTech({
    html: targetData.html,
    headers: targetData.headers
  })

  // 3. Generate prioritized Action Plan
  const actionPlan = generateActionPlan({
    seoScore: seo.score,
    performanceScore: performance.score,
    securityScore: security.score,
    domainScore: domainData.score,
    seoIssues: seo.issues,
    performanceIssues: performance.issues,
    securityIssues: security.issues,
    domainIssues: domainData.issues
  })

  // 4. Calculate Overall Weighted Score
  const overallScore = Math.round(
    seo.score * 0.3 +
    performance.score * 0.25 +
    security.score * 0.25 +
    domainData.score * 0.2
  )

  return {
    url: targetData.finalUrl,
    domain,
    overallScore: Math.max(0, Math.min(100, overallScore)),
    seo,
    performance,
    security,
    domainData,
    tech,
    actionPlan,
    createdAt: Math.floor(Date.now() / 1000)
  }
}

export function runAuditOnHtmlAndHeaders(options: {
  html: string
  headers: Record<string, string>
  url: string
  domain: string
}): AuditResult {
  const seo = auditSeo({
    html: options.html,
    url: options.url,
    robotsTxtExists: true,
    sitemapExists: true
  })

  const performance = auditPerformance({
    html: options.html,
    headers: options.headers,
    ttfbMs: 150,
    responseTimeMs: 300,
    pageSizeBytes: options.html.length
  })

  const security = auditSecurity({
    url: options.url,
    headers: options.headers,
    sslInfo: { valid: true, issuer: "Let's Encrypt", validTo: '2027-01-01', daysRemaining: 180 },
    html: options.html
  })

  const domainData = {
    score: 85,
    domain: options.domain,
    records: {
      a: ['93.184.216.34'],
      aaaa: [],
      mx: [{ exchange: 'mail.example.com', priority: 10 }],
      ns: ['ns1.example.com', 'ns2.example.com'],
      txt: ['v=spf1 ~all']
    },
    issues: []
  }

  const tech = auditTech({
    html: options.html,
    headers: options.headers
  })

  const actionPlan = generateActionPlan({
    seoScore: seo.score,
    performanceScore: performance.score,
    securityScore: security.score,
    domainScore: domainData.score,
    seoIssues: seo.issues,
    performanceIssues: performance.issues,
    securityIssues: security.issues,
    domainIssues: domainData.issues
  })

  const overallScore = Math.round(
    seo.score * 0.3 +
    performance.score * 0.25 +
    security.score * 0.25 +
    domainData.score * 0.2
  )

  return {
    url: options.url,
    domain: options.domain,
    overallScore,
    seo,
    performance,
    security,
    domainData,
    tech,
    actionPlan,
    createdAt: Math.floor(Date.now() / 1000)
  }
}
