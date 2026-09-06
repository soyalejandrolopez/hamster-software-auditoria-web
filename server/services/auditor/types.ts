// =====================================================
// Core Issue Type
// =====================================================
export interface ActionPlanItem {
  id: string
  category: 'seo' | 'performance' | 'security' | 'domain' | 'tech' | 'accessibility' | 'links'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  steps: string[]
}

// =====================================================
// SEO
// =====================================================
export interface SeoAuditResult {
  score: number
  title: { text: string; length: number; status: 'good' | 'warning' | 'error'; message: string }
  description: { text: string; length: number; status: 'good' | 'warning' | 'error'; message: string }
  canonical: { url: string | null; status: 'good' | 'warning' | 'error'; message: string }
  headings: { h1Count: number; h2Count: number; h3Count: number; h1Texts: string[]; status: 'good' | 'warning' | 'error'; message: string }
  images: { total: number; withoutAlt: number; status: 'good' | 'warning' | 'error'; message: string }
  openGraph: { ogTitle: string | null; ogImage: string | null; ogDescription: string | null; status: 'good' | 'warning' }
  twitterCards: { card: string | null; title: string | null; image: string | null; status: 'good' | 'warning' }
  structuredData: { found: boolean; types: string[]; count: number; status: 'good' | 'warning' }
  hreflang: { tags: Array<{ lang: string; href: string }>; status: 'good' | 'info' }
  metaRobots: { content: string | null; isIndexable: boolean; isFollowable: boolean }
  favicon: { found: boolean; href: string | null }
  wordCount: number
  readingTimeMinutes: number
  links: { internal: number; external: number; total: number }
  robotsTxt: { exists: boolean; message: string }
  sitemap: { exists: boolean; message: string }
  viewport: { hasViewport: boolean; message: string }
  lang: { lang: string | null; message: string }
  issues: ActionPlanItem[]
}

// =====================================================
// Performance
// =====================================================
export interface CoreWebVitals {
  fcp?: string      // First Contentful Paint
  lcp?: string      // Largest Contentful Paint
  cls?: string      // Cumulative Layout Shift
  tbt?: string      // Total Blocking Time
  si?: string       // Speed Index
  inp?: string      // Interaction to Next Paint
  performanceScore?: number
}

export interface PerformanceAuditResult {
  score: number
  ttfbMs: number
  responseTimeMs: number
  pageSizeBytes: number
  compression: { enabled: boolean; encoding: string | null }
  cacheHeaders: { hasCacheControl: boolean; hasETag: boolean; details: string }
  assetCounts: { scripts: number; styles: number; images: number }
  coreWebVitals?: CoreWebVitals
  renderBlocking: { scripts: number; stylesheets: number }
  http2: { supported: boolean; protocol: string }
  imageAnalysis: { totalImages: number; withoutDimensions: number; heavyFormats: number; lazyLoaded: number }
  domStats: { totalNodes: number; maxDepth: number }
  inlineSizes: { inlineCssBytes: number; inlineJsBytes: number }
  issues: ActionPlanItem[]
}

// =====================================================
// Security
// =====================================================
export interface CookieAuditItem {
  name: string
  secure: boolean
  httpOnly: boolean
  sameSite: string | null
  issues: string[]
}

export interface SecurityAuditResult {
  score: number
  https: { isHttps: boolean; redirectsToHttps: boolean }
  ssl: { valid: boolean; issuer: string; validTo: string; daysRemaining: number }
  sslDetails: { protocol: string; cipher: string; keySize: number }
  headers: Array<{ name: string; present: boolean; value?: string; recommended: string }>
  mixedContent: { detected: boolean; count: number }
  cookies: { total: number; insecure: CookieAuditItem[]; allSecure: boolean }
  serverDisclosure: { disclosed: boolean; value: string | null; message: string }
  cors: { hasWildcard: boolean; value: string | null }
  sri: { scriptsWithoutSri: number; linksWithoutSri: number; message: string }
  cspAnalysis: { hasUnsafeInline: boolean; hasUnsafeEval: boolean; details: string }
  issues: ActionPlanItem[]
}

// =====================================================
// Domain
// =====================================================
export interface WhoisInfo {
  registrar: string | null
  createdDate: string | null
  expiryDate: string | null
  daysUntilExpiry: number | null
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
    caa: string[]
  }
  whois: WhoisInfo
  dmarc: { found: boolean; record: string | null }
  ipv6Support: boolean
  reverseDns: Array<{ ip: string; hostname: string | null }>
  issues: ActionPlanItem[]
}

// =====================================================
// Technology Detection
// =====================================================
export type TechCategory =
  | 'CMS'
  | 'Web Server'
  | 'Frontend Framework'
  | 'Analytics'
  | 'CDN'
  | 'CSS Framework'
  | 'JavaScript Library'
  | 'E-commerce'
  | 'Font Provider'
  | 'Tag Manager'
  | 'Chat'
  | 'Security Tool'
  | 'Payment'
  | 'Hosting'

export interface DetectedTech {
  name: string
  category: TechCategory
  confidence: number
  version?: string
  icon?: string
}

export interface TechAuditResult {
  detected: DetectedTech[]
}

// =====================================================
// Accessibility (NEW)
// =====================================================
export interface AccessibilityViolation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  description: string
  helpUrl: string
  nodes: number
  tags: string[]
}

export interface AccessibilityAuditResult {
  score: number
  violations: AccessibilityViolation[]
  passes: number
  totalRules: number
  summary: { critical: number; serious: number; moderate: number; minor: number }
  issues: ActionPlanItem[]
}

// =====================================================
// Link Checker (NEW)
// =====================================================
export interface CheckedLink {
  url: string
  type: 'internal' | 'external'
  status: number | null
  ok: boolean
  error?: string
}

export interface LinkCheckResult {
  score: number
  totalLinks: number
  checkedCount: number
  broken: CheckedLink[]
  redirects: CheckedLink[]
  issues: ActionPlanItem[]
}

// =====================================================
// Full Audit Result
// =====================================================
export interface AuditResult {
  url: string
  domain: string
  overallScore: number
  seo: SeoAuditResult
  performance: PerformanceAuditResult
  security: SecurityAuditResult
  domainData: DomainAuditResult
  tech: TechAuditResult
  accessibility: AccessibilityAuditResult
  linkCheck: LinkCheckResult
  actionPlan: ActionPlanItem[]
  createdAt: number
}
