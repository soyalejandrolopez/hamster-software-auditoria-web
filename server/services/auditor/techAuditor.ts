import * as cheerio from 'cheerio'
import type { TechAuditResult, DetectedTech, TechCategory } from './types'

export interface TechAuditOptions {
  html: string
  headers: Record<string, string>
}

function addTech(detected: DetectedTech[], name: string, category: TechCategory, confidence: number, version?: string) {
  detected.push({ name, category, confidence, version })
}

export function auditTech(options: TechAuditOptions): TechAuditResult {
  const { html, headers } = options
  const $ = cheerio.load(html)
  const detected: DetectedTech[] = []

  const htmlLower = html.toLowerCase()
  const serverHeader = (headers['server'] || '').toLowerCase()
  const poweredBy = (headers['x-powered-by'] || '').toLowerCase()

  // ═══════════════════════════════════════
  // 1. Web Servers & CDNs from headers
  // ═══════════════════════════════════════
  if (serverHeader.includes('cloudflare') || headers['cf-ray']) {
    addTech(detected, 'Cloudflare', 'CDN', 100)
  }
  if (serverHeader.includes('nginx')) {
    const vMatch = serverHeader.match(/nginx\/([\d.]+)/)
    addTech(detected, 'Nginx', 'Web Server', 100, vMatch?.[1])
  }
  if (serverHeader.includes('apache')) {
    const vMatch = serverHeader.match(/apache\/([\d.]+)/)
    addTech(detected, 'Apache', 'Web Server', 100, vMatch?.[1])
  }
  if (serverHeader.includes('caddy')) {
    addTech(detected, 'Caddy', 'Web Server', 100)
  }
  if (serverHeader.includes('litespeed')) {
    addTech(detected, 'LiteSpeed', 'Web Server', 100)
  }
  if (serverHeader.includes('iis')) {
    addTech(detected, 'Microsoft IIS', 'Web Server', 100)
  }
  if (headers['x-vercel-id']) {
    addTech(detected, 'Vercel', 'Hosting', 100)
  }
  if (headers['x-nf-request-id']) {
    addTech(detected, 'Netlify', 'Hosting', 100)
  }
  if (headers['x-amz-cf-id'] || headers['x-amz-cf-pop']) {
    addTech(detected, 'Amazon CloudFront', 'CDN', 100)
  }
  if (serverHeader.includes('gws') || serverHeader.includes('google')) {
    addTech(detected, 'Google Cloud', 'Hosting', 90)
  }
  if (headers['x-github-request-id']) {
    addTech(detected, 'GitHub Pages', 'Hosting', 100)
  }
  if (serverHeader.includes('fly') || headers['fly-request-id']) {
    addTech(detected, 'Fly.io', 'Hosting', 95)
  }

  // ═══════════════════════════════════════
  // 2. CMS
  // ═══════════════════════════════════════
  const generator = ($('meta[name="generator"]').attr('content') || '').toLowerCase()
  if (generator.includes('wordpress') || htmlLower.includes('wp-content') || htmlLower.includes('wp-includes')) {
    const wpMatch = generator.match(/wordpress\s+([\d.]+)/)
    addTech(detected, 'WordPress', 'CMS', 95, wpMatch?.[1])
  }
  if (generator.includes('shopify') || htmlLower.includes('cdn.shopify.com')) {
    addTech(detected, 'Shopify', 'E-commerce', 95)
  }
  if (generator.includes('webflow') || htmlLower.includes('w-layout-grid')) {
    addTech(detected, 'Webflow', 'CMS', 95)
  }
  if (generator.includes('ghost') || htmlLower.includes('ghost-portal')) {
    addTech(detected, 'Ghost', 'CMS', 90)
  }
  if (generator.includes('drupal') || htmlLower.includes('/sites/default/files')) {
    addTech(detected, 'Drupal', 'CMS', 90)
  }
  if (htmlLower.includes('wix.com') || htmlLower.includes('static.parastorage.com')) {
    addTech(detected, 'Wix', 'CMS', 90)
  }
  if (generator.includes('joomla') || htmlLower.includes('/media/jui/')) {
    addTech(detected, 'Joomla', 'CMS', 90)
  }
  if (htmlLower.includes('squarespace.com') || htmlLower.includes('sqsp')) {
    addTech(detected, 'Squarespace', 'CMS', 90)
  }

  // ═══════════════════════════════════════
  // 3. E-commerce Platforms (NEW)
  // ═══════════════════════════════════════
  if (htmlLower.includes('woocommerce') || htmlLower.includes('wc-blocks')) {
    addTech(detected, 'WooCommerce', 'E-commerce', 90)
  }
  if (htmlLower.includes('magento') || htmlLower.includes('mage/cookies')) {
    addTech(detected, 'Magento', 'E-commerce', 90)
  }
  if (htmlLower.includes('prestashop') || htmlLower.includes('prestablog') || generator.includes('prestashop')) {
    addTech(detected, 'PrestaShop', 'E-commerce', 90)
  }
  if (htmlLower.includes('bigcommerce') || htmlLower.includes('bigcommerce.com')) {
    addTech(detected, 'BigCommerce', 'E-commerce', 85)
  }

  // ═══════════════════════════════════════
  // 4. Frontend Frameworks
  // ═══════════════════════════════════════
  if (poweredBy.includes('next.js') || htmlLower.includes('/_next/static') || $('script#__NEXT_DATA__').length > 0) {
    addTech(detected, 'Next.js', 'Frontend Framework', 95)
  }
  if (poweredBy.includes('nuxt') || htmlLower.includes('/_nuxt/') || $('script#__NUXT__').length > 0) {
    addTech(detected, 'Nuxt', 'Frontend Framework', 95)
  }
  if (htmlLower.includes('data-reactroot') || htmlLower.includes('react-dom') || $('div[data-reactroot]').length > 0) {
    addTech(detected, 'React', 'Frontend Framework', 85)
  }
  if (htmlLower.includes('vue.js') || htmlLower.includes('vue.global') || $('[data-v-]').length > 0) {
    addTech(detected, 'Vue.js', 'Frontend Framework', 85)
  }
  if (htmlLower.includes('ng-version') || htmlLower.includes('angular.js') || $('[ng-app]').length > 0) {
    const ngVersion = $('[ng-version]').attr('ng-version')
    addTech(detected, 'Angular', 'Frontend Framework', 85, ngVersion || undefined)
  }
  if (htmlLower.includes('svelte') || htmlLower.includes('__svelte')) {
    addTech(detected, 'Svelte', 'Frontend Framework', 85)
  }
  if (htmlLower.includes('__sveltekit') || htmlLower.includes('sveltekit')) {
    addTech(detected, 'SvelteKit', 'Frontend Framework', 85)
  }
  if (htmlLower.includes('gatsby') || htmlLower.includes('gatsby-image')) {
    addTech(detected, 'Gatsby', 'Frontend Framework', 85)
  }
  if (htmlLower.includes('astro') || $('astro-island').length > 0) {
    addTech(detected, 'Astro', 'Frontend Framework', 90)
  }

  // ═══════════════════════════════════════
  // 5. CSS Frameworks & UI
  // ═══════════════════════════════════════
  if (htmlLower.includes('tailwindcss') || htmlLower.includes('cdn.tailwindcss.com') || $('link[href*="tailwind"]').length > 0) {
    addTech(detected, 'Tailwind CSS', 'CSS Framework', 85)
  }
  if (htmlLower.includes('bootstrap') || $('link[href*="bootstrap"]').length > 0) {
    const bsMatch = htmlLower.match(/bootstrap[\/v@]*([\d.]+)/)
    addTech(detected, 'Bootstrap', 'CSS Framework', 85, bsMatch?.[1])
  }
  if (htmlLower.includes('bulma') || $('link[href*="bulma"]').length > 0) {
    addTech(detected, 'Bulma', 'CSS Framework', 85)
  }
  if (htmlLower.includes('materialize') || $('link[href*="materialize"]').length > 0) {
    addTech(detected, 'Materialize CSS', 'CSS Framework', 85)
  }

  // ═══════════════════════════════════════
  // 6. JavaScript Libraries (NEW)
  // ═══════════════════════════════════════
  if (htmlLower.includes('jquery') || $('script[src*="jquery"]').length > 0) {
    const jqMatch = htmlLower.match(/jquery[.\-/v]*([\d.]+)/)
    addTech(detected, 'jQuery', 'JavaScript Library', 90, jqMatch?.[1])
  }
  if (htmlLower.includes('lodash') || $('script[src*="lodash"]').length > 0) {
    addTech(detected, 'Lodash', 'JavaScript Library', 85)
  }
  if (htmlLower.includes('moment.js') || htmlLower.includes('moment.min.js') || $('script[src*="moment"]').length > 0) {
    addTech(detected, 'Moment.js', 'JavaScript Library', 85)
  }
  if (htmlLower.includes('gsap') || htmlLower.includes('greensock') || $('script[src*="gsap"]').length > 0) {
    addTech(detected, 'GSAP', 'JavaScript Library', 85)
  }
  if (htmlLower.includes('three.js') || htmlLower.includes('three.min.js') || $('script[src*="three"]').length > 0) {
    addTech(detected, 'Three.js', 'JavaScript Library', 85)
  }
  if (htmlLower.includes('alpine') || $('script[src*="alpine"]').length > 0) {
    addTech(detected, 'Alpine.js', 'JavaScript Library', 85)
  }
  if (htmlLower.includes('htmx') || $('script[src*="htmx"]').length > 0) {
    addTech(detected, 'htmx', 'JavaScript Library', 85)
  }

  // ═══════════════════════════════════════
  // 7. Analytics
  // ═══════════════════════════════════════
  if (htmlLower.includes('googletagmanager.com/gtm') || htmlLower.includes('gtm.js')) {
    addTech(detected, 'Google Tag Manager', 'Tag Manager', 95)
  }
  if (htmlLower.includes('google-analytics.com') || htmlLower.includes('gtag(') || htmlLower.includes('ga(')) {
    addTech(detected, 'Google Analytics', 'Analytics', 95)
  }
  if (htmlLower.includes('hotjar.com') || htmlLower.includes('static.hotjar.com')) {
    addTech(detected, 'Hotjar', 'Analytics', 90)
  }
  if (htmlLower.includes('connect.facebook.net') || htmlLower.includes('fbq(')) {
    addTech(detected, 'Meta Pixel', 'Analytics', 90)
  }
  if (htmlLower.includes('plausible.io')) {
    addTech(detected, 'Plausible Analytics', 'Analytics', 90)
  }
  if (htmlLower.includes('matomo') || htmlLower.includes('piwik')) {
    addTech(detected, 'Matomo', 'Analytics', 85)
  }
  if (htmlLower.includes('clarity.ms') || htmlLower.includes('clarity.js')) {
    addTech(detected, 'Microsoft Clarity', 'Analytics', 90)
  }
  if (htmlLower.includes('segment.io') || htmlLower.includes('segment.com') || htmlLower.includes('analytics.js')) {
    addTech(detected, 'Segment', 'Tag Manager', 85)
  }

  // ═══════════════════════════════════════
  // 8. Font Providers (NEW)
  // ═══════════════════════════════════════
  if (htmlLower.includes('fonts.googleapis.com') || htmlLower.includes('fonts.gstatic.com')) {
    addTech(detected, 'Google Fonts', 'Font Provider', 95)
  }
  if (htmlLower.includes('use.typekit.net') || htmlLower.includes('typekit')) {
    addTech(detected, 'Adobe Fonts', 'Font Provider', 90)
  }
  if (htmlLower.includes('fontawesome') || htmlLower.includes('font-awesome') || $('link[href*="fontawesome"]').length > 0) {
    addTech(detected, 'Font Awesome', 'Font Provider', 90)
  }

  // ═══════════════════════════════════════
  // 9. Chat & Support (NEW)
  // ═══════════════════════════════════════
  if (htmlLower.includes('intercom') || htmlLower.includes('widget.intercom.io')) {
    addTech(detected, 'Intercom', 'Chat', 90)
  }
  if (htmlLower.includes('zendesk') || htmlLower.includes('zdassets.com')) {
    addTech(detected, 'Zendesk', 'Chat', 90)
  }
  if (htmlLower.includes('drift.com') || htmlLower.includes('js.driftt.com')) {
    addTech(detected, 'Drift', 'Chat', 90)
  }
  if (htmlLower.includes('crisp.chat') || htmlLower.includes('client.crisp.chat')) {
    addTech(detected, 'Crisp', 'Chat', 90)
  }
  if (htmlLower.includes('tawk.to') || htmlLower.includes('embed.tawk.to')) {
    addTech(detected, 'Tawk.to', 'Chat', 90)
  }
  if (htmlLower.includes('livechat') || htmlLower.includes('cdn.livechatinc.com')) {
    addTech(detected, 'LiveChat', 'Chat', 85)
  }
  if (htmlLower.includes('hubspot.com') || htmlLower.includes('js.hs-scripts.com')) {
    addTech(detected, 'HubSpot', 'Chat', 85)
  }

  // ═══════════════════════════════════════
  // 10. Security Tools (NEW)
  // ═══════════════════════════════════════
  if (htmlLower.includes('recaptcha') || htmlLower.includes('google.com/recaptcha')) {
    addTech(detected, 'Google reCAPTCHA', 'Security Tool', 95)
  }
  if (htmlLower.includes('hcaptcha.com') || htmlLower.includes('hcaptcha')) {
    addTech(detected, 'hCaptcha', 'Security Tool', 90)
  }
  if (htmlLower.includes('challenges.cloudflare.com') || htmlLower.includes('turnstile')) {
    addTech(detected, 'Cloudflare Turnstile', 'Security Tool', 90)
  }

  // ═══════════════════════════════════════
  // 11. Payment (NEW)
  // ═══════════════════════════════════════
  if (htmlLower.includes('stripe.com') || htmlLower.includes('js.stripe.com')) {
    addTech(detected, 'Stripe', 'Payment', 95)
  }
  if (htmlLower.includes('paypal.com') || htmlLower.includes('paypalobjects.com')) {
    addTech(detected, 'PayPal', 'Payment', 90)
  }
  if (htmlLower.includes('braintree') || htmlLower.includes('braintreegateway.com')) {
    addTech(detected, 'Braintree', 'Payment', 85)
  }

  // ═══════════════════════════════════════
  // 12. A/B Testing (NEW)
  // ═══════════════════════════════════════
  if (htmlLower.includes('optimizely') || htmlLower.includes('cdn.optimizely.com')) {
    addTech(detected, 'Optimizely', 'Analytics', 90)
  }
  if (htmlLower.includes('vwo') || htmlLower.includes('dev.visualwebsiteoptimizer.com')) {
    addTech(detected, 'VWO', 'Analytics', 85)
  }

  // ═══════════════════════════════════════
  // Deduplicate by name
  // ═══════════════════════════════════════
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
