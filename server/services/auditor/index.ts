import { URL } from 'node:url'
import { fetchTarget } from './fetchTarget'
import { auditSeo } from './seoAuditor'
import { auditPerformance, fetchCoreWebVitals } from './performanceAuditor'
import { auditSecurity } from './securityAuditor'
import { auditDomain } from './domainAuditor'
import { auditTech } from './techAuditor'
import { auditAccessibility } from './accessibilityAuditor'
import { checkLinks } from './linkChecker'
import { generateActionPlan } from './actionPlanGenerator'
import type { AuditResult } from './types'

export * from './types'
export { auditSeo } from './seoAuditor'
export { auditPerformance, fetchCoreWebVitals } from './performanceAuditor'
export { auditSecurity } from './securityAuditor'
export { auditDomain } from './domainAuditor'
export { auditTech } from './techAuditor'
export { auditAccessibility } from './accessibilityAuditor'
export { checkLinks } from './linkChecker'
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

  // 2. Run synchronous sub-auditors
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
    sslDetails: targetData.sslDetails,
    html: targetData.html,
    cookies: targetData.cookies
  })

  const tech = auditTech({
    html: targetData.html,
    headers: targetData.headers
  })

  // 3. Run async auditors in parallel
  const [accessibility, linkCheck, coreWebVitals] = await Promise.all([
    auditAccessibility(targetData.html),
    checkLinks({ html: targetData.html, url: targetData.finalUrl, maxChecks: 30 }),
    options?.pageSpeedApiKey
      ? fetchCoreWebVitals(targetData.finalUrl, options.pageSpeedApiKey)
      : Promise.resolve(undefined)
  ])

  // Merge Core Web Vitals into performance result
  if (coreWebVitals && Object.keys(coreWebVitals).length > 0) {
    performance.coreWebVitals = coreWebVitals
  }

  // 4. Generate prioritized Action Plan
  const actionPlan = generateActionPlan({
    seoScore: seo.score,
    performanceScore: performance.score,
    securityScore: security.score,
    domainScore: domainData.score,
    accessibilityScore: accessibility.score,
    linkCheckScore: linkCheck.score,
    seoIssues: seo.issues,
    performanceIssues: performance.issues,
    securityIssues: security.issues,
    domainIssues: domainData.issues,
    accessibilityIssues: accessibility.issues,
    linkCheckIssues: linkCheck.issues
  })

  // 5. Calculate Overall Weighted Score
  // SEO 25%, Performance 20%, Security 20%, Domain 10%, Accessibility 15%, Links 5%, Tech 5% (not scored)
  const overallScore = Math.round(
    seo.score * 0.25 +
    performance.score * 0.20 +
    security.score * 0.20 +
    domainData.score * 0.10 +
    accessibility.score * 0.15 +
    linkCheck.score * 0.10
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
    accessibility,
    linkCheck,
    actionPlan,
    createdAt: Math.floor(Date.now() / 1000)
  }
}

/**
 * Quick audit from pre-fetched HTML and headers (used in tests and utilities)
 */
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
    sslDetails: { protocol: 'TLSv1.3', cipher: 'TLS_AES_256_GCM_SHA384', keySize: 256 },
    html: options.html,
    cookies: []
  })

  const domainData = {
    score: 85,
    domain: options.domain,
    records: {
      a: ['93.184.216.34'],
      aaaa: [],
      mx: [{ exchange: 'mail.example.com', priority: 10 }],
      ns: ['ns1.example.com', 'ns2.example.com'],
      txt: ['v=spf1 ~all'],
      caa: []
    },
    whois: { registrar: null, createdDate: null, expiryDate: null, daysUntilExpiry: null },
    dmarc: { found: false, record: null },
    ipv6Support: false,
    reverseDns: [],
    issues: []
  }

  const tech = auditTech({
    html: options.html,
    headers: options.headers
  })

  const accessibility = {
    score: 80,
    violations: [],
    passes: 0,
    totalRules: 0,
    summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    issues: []
  }

  const linkCheck = {
    score: 100,
    totalLinks: 0,
    checkedCount: 0,
    broken: [],
    redirects: [],
    issues: []
  }

  const actionPlan = generateActionPlan({
    seoScore: seo.score,
    performanceScore: performance.score,
    securityScore: security.score,
    domainScore: domainData.score,
    accessibilityScore: accessibility.score,
    linkCheckScore: linkCheck.score,
    seoIssues: seo.issues,
    performanceIssues: performance.issues,
    securityIssues: security.issues,
    domainIssues: domainData.issues,
    accessibilityIssues: accessibility.issues,
    linkCheckIssues: linkCheck.issues
  })

  const overallScore = Math.round(
    seo.score * 0.25 +
    performance.score * 0.20 +
    security.score * 0.20 +
    domainData.score * 0.10 +
    accessibility.score * 0.15 +
    linkCheck.score * 0.10
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
    accessibility,
    linkCheck,
    actionPlan,
    createdAt: Math.floor(Date.now() / 1000)
  }
}
