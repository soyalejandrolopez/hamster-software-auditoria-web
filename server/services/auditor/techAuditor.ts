import * as cheerio from 'cheerio'
import type { TechAuditResult, DetectedTech } from './types'

export interface TechAuditOptions {
  html: string
  headers: Record<string, string>
}

export function auditTech(options: TechAuditOptions): TechAuditResult {
  const { html, headers } = options
  const $ = cheerio.load(html)
  const detected: DetectedTech[] = []

  const htmlLower = html.toLowerCase()
  const serverHeader = (headers['server'] || '').toLowerCase()
  const poweredBy = (headers['x-powered-by'] || '').toLowerCase()

  // 1. Web Servers & CDNs from headers
  if (serverHeader.includes('cloudflare') || headers['cf-ray']) {
    detected.push({ name: 'Cloudflare', category: 'CDN', confidence: 100 })
  }
  if (serverHeader.includes('nginx')) {
    detected.push({ name: 'Nginx', category: 'Web Server', confidence: 100 })
  }
  if (serverHeader.includes('apache')) {
    detected.push({ name: 'Apache', category: 'Web Server', confidence: 100 })
  }
  if (serverHeader.includes('caddy')) {
    detected.push({ name: 'Caddy', category: 'Web Server', confidence: 100 })
  }
  if (serverHeader.includes('litespeed')) {
    detected.push({ name: 'LiteSpeed', category: 'Web Server', confidence: 100 })
  }
  if (serverHeader.includes('iis')) {
    detected.push({ name: 'Microsoft IIS', category: 'Web Server', confidence: 100 })
  }
  if (headers['x-vercel-id']) {
    detected.push({ name: 'Vercel', category: 'CDN', confidence: 100 })
  }
  if (headers['x-nf-request-id']) {
    detected.push({ name: 'Netlify', category: 'CDN', confidence: 100 })
  }

  // 2. CMS
  const generator = ($('meta[name="generator"]').attr('content') || '').toLowerCase()
  if (generator.includes('wordpress') || htmlLower.includes('wp-content') || htmlLower.includes('wp-includes')) {
    detected.push({ name: 'WordPress', category: 'CMS', confidence: 95 })
  }
  if (generator.includes('shopify') || htmlLower.includes('cdn.shopify.com')) {
    detected.push({ name: 'Shopify', category: 'CMS', confidence: 95 })
  }
  if (generator.includes('webflow') || htmlLower.includes('w-layout-grid')) {
    detected.push({ name: 'Webflow', category: 'CMS', confidence: 95 })
  }
  if (generator.includes('ghost') || htmlLower.includes('ghost-portal')) {
    detected.push({ name: 'Ghost', category: 'CMS', confidence: 90 })
  }
  if (generator.includes('drupal') || htmlLower.includes('/sites/default/files')) {
    detected.push({ name: 'Drupal', category: 'CMS', confidence: 90 })
  }
  if (htmlLower.includes('wix.com') || htmlLower.includes('static.parastorage.com')) {
    detected.push({ name: 'Wix', category: 'CMS', confidence: 90 })
  }

  // 3. Frontend Frameworks
  if (poweredBy.includes('next.js') || htmlLower.includes('/_next/static') || $('script#__NEXT_DATA__').length > 0) {
    detected.push({ name: 'Next.js', category: 'Frontend Framework', confidence: 95 })
  }
  if (poweredBy.includes('nuxt') || htmlLower.includes('/_nuxt/') || $('script#__NUXT__').length > 0) {
    detected.push({ name: 'Nuxt', category: 'Frontend Framework', confidence: 95 })
  }
  if (htmlLower.includes('data-reactroot') || htmlLower.includes('react-dom') || $('div[data-reactroot]').length > 0) {
    detected.push({ name: 'React', category: 'Frontend Framework', confidence: 85 })
  }
  if (htmlLower.includes('vue.js') || htmlLower.includes('vue.global') || $('[data-v-]').length > 0) {
    detected.push({ name: 'Vue.js', category: 'Frontend Framework', confidence: 85 })
  }
  if (htmlLower.includes('ng-version') || htmlLower.includes('angular.js')) {
    detected.push({ name: 'Angular', category: 'Frontend Framework', confidence: 85 })
  }

  // 4. CSS Frameworks & UI
  if (htmlLower.includes('tailwindcss') || htmlLower.includes('cdn.tailwindcss.com') || $('link[href*="tailwind"]').length > 0) {
    detected.push({ name: 'Tailwind CSS', category: 'CSS Framework', confidence: 85 })
  }
  if (htmlLower.includes('bootstrap') || $('link[href*="bootstrap"]').length > 0) {
    detected.push({ name: 'Bootstrap', category: 'CSS Framework', confidence: 85 })
  }

  // 5. Analytics
  if (htmlLower.includes('googletagmanager.com') || htmlLower.includes('gtag(') || htmlLower.includes('ga(')) {
    detected.push({ name: 'Google Analytics / GTM', category: 'Analytics', confidence: 95 })
  }
  if (htmlLower.includes('hotjar.com') || htmlLower.includes('static.hotjar.com')) {
    detected.push({ name: 'Hotjar', category: 'Analytics', confidence: 90 })
  }
  if (htmlLower.includes('connect.facebook.net') || htmlLower.includes('fbq(')) {
    detected.push({ name: 'Meta Pixel', category: 'Analytics', confidence: 90 })
  }
  if (htmlLower.includes('plausible.io')) {
    detected.push({ name: 'Plausible Analytics', category: 'Analytics', confidence: 90 })
  }

  // Deduplicate by name
  const uniqueDetected: DetectedTech[] = []
  const seen = new Set<string>()
  for (const item of detected) {
    if (!seen.has(item.name)) {
      seen.add(item.name)
      uniqueDetected.push(item)
    }
  }

  return { detected: uniqueDetected }
}
