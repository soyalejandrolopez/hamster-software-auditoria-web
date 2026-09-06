export interface ActionPlanItem {
  id: string
  category: 'seo' | 'performance' | 'security' | 'domain' | 'tech'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  steps: string[]
}

export interface SeoAuditResult {
  score: number
  title: { text: string; length: number; status: 'good' | 'warning' | 'error'; message: string }
  description: { text: string; length: number; status: 'good' | 'warning' | 'error'; message: string }
  canonical: { url: string | null; status: 'good' | 'warning' | 'error'; message: string }
  headings: { h1Count: number; h2Count: number; h3Count: number; h1Texts: string[]; status: 'good' | 'warning' | 'error'; message: string }
  images: { total: number; withoutAlt: number; status: 'good' | 'warning' | 'error'; message: string }
  openGraph: { ogTitle: string | null; ogImage: string | null; ogDescription: string | null; status: 'good' | 'warning' }
  robotsTxt: { exists: boolean; message: string }
  sitemap: { exists: boolean; message: string }
  viewport: { hasViewport: boolean; message: string }
  lang: { lang: string | null; message: string }
  issues: ActionPlanItem[]
}

export interface PerformanceAuditResult {
  score: number
  ttfbMs: number
  responseTimeMs: number
  pageSizeBytes: number
  compression: { enabled: boolean; encoding: string | null }
  cacheHeaders: { hasCacheControl: boolean; hasETag: boolean; details: string }
  assetCounts: { scripts: number; styles: number; images: number }
  pageSpeed?: {
    performanceScore: number
    fcp?: string
    lcp?: string
    cls?: string
    speedIndex?: string
  }
  issues: ActionPlanItem[]
}

export interface SecurityAuditResult {
  score: number
  https: { isHttps: boolean; redirectsToHttps: boolean }
  ssl: { valid: boolean; issuer: string; validTo: string; daysRemaining: number }
  headers: Array<{ name: string; present: boolean; value?: string; recommended: string }>
  mixedContent: { detected: boolean; count: number }
  issues: ActionPlanItem[]
}

export interface DomainAuditResult {
  score: number
  domain: string
  records: {
    a: string[]
    aaaa: string[]
    mx: Array<{ exchange: string; priority: number }>
    ns: string[]
    txt: string[]
  }
  issues: ActionPlanItem[]
}

export interface DetectedTech {
  name: string
  category: 'CMS' | 'Web Server' | 'Frontend Framework' | 'Analytics' | 'CDN' | 'CSS Framework' | 'JavaScript Library'
  confidence: number
  icon?: string
}

export interface TechAuditResult {
  detected: DetectedTech[]
}

export interface AuditResult {
  url: string
  domain: string
  overallScore: number
  seo: SeoAuditResult
  performance: PerformanceAuditResult
  security: SecurityAuditResult
  domainData: DomainAuditResult
  tech: TechAuditResult
  actionPlan: ActionPlanItem[]
  createdAt: number
}
