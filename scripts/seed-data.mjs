import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import fs from 'node:fs'

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/webauditor.sqlite')
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const client = createClient({ url: `file:${dbPath}` })

console.log('🔄 Conectando a la base de datos con @libsql/client en:', dbPath)

async function seed() {
  // Asegurar tablas
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('admin', 'client')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      domain TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      seo_score INTEGER NOT NULL,
      performance_score INTEGER NOT NULL,
      security_score INTEGER NOT NULL,
      domain_score INTEGER NOT NULL,
      accessibility_score INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_details (
      id TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
      seo_data TEXT NOT NULL,
      performance_data TEXT NOT NULL,
      security_data TEXT NOT NULL,
      domain_data TEXT NOT NULL,
      tech_data TEXT NOT NULL,
      accessibility_data TEXT,
      links_data TEXT,
      action_plan TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
    CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain);
    CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
  `)

  try { await client.execute('ALTER TABLE audits ADD COLUMN accessibility_score INTEGER;') } catch {}
  try { await client.execute('ALTER TABLE audit_details ADD COLUMN accessibility_data TEXT;') } catch {}
  try { await client.execute('ALTER TABLE audit_details ADD COLUMN links_data TEXT;') } catch {}

  const now = Math.floor(Date.now() / 1000)
  const passwordHash = await bcrypt.hash('Admin123!*', 10)
  const clientPasswordHash = await bcrypt.hash('Cliente123!*', 10)

  // 1. Usuarios a poblar
  const usersToInsert = [
    {
      id: 'usr_admin_principal',
      name: 'Administrador Hamster Software',
      email: 'admin@monitor.local',
      passwordHash: passwordHash,
      role: 'admin',
      createdAt: now - 30 * 24 * 3600,
      updatedAt: now
    },
    {
      id: 'usr_client_carlos',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@empresa.com',
      passwordHash: clientPasswordHash,
      role: 'client',
      createdAt: now - 15 * 24 * 3600,
      updatedAt: now
    },
    {
      id: 'usr_client_laura',
      name: 'Laura Gómez',
      email: 'laura.tech@startup.io',
      passwordHash: clientPasswordHash,
      role: 'client',
      createdAt: now - 10 * 24 * 3600,
      updatedAt: now
    },
    {
      id: 'usr_client_david',
      name: 'David Morales',
      email: 'david.seo@agencia.es',
      passwordHash: clientPasswordHash,
      role: 'client',
      createdAt: now - 5 * 24 * 3600,
      updatedAt: now
    },
    {
      id: 'usr_client_ana',
      name: 'Ana López',
      email: 'ana.lopez@digital.com',
      passwordHash: clientPasswordHash,
      role: 'client',
      createdAt: now - 2 * 24 * 3600,
      updatedAt: now
    }
  ]

  for (const user of usersToInsert) {
    await client.execute({
      sql: `
        INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          password_hash = excluded.password_hash,
          role = excluded.role,
          updated_at = excluded.updated_at
      `,
      args: [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt]
    })
    console.log(`👤 Usuario insertado/actualizado: ${user.name} (${user.email}) - Rol: [${user.role}]`)
  }

  // Obtenemos los IDs reales de los usuarios
  const adminRes = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: ['admin@monitor.local'] })
  const adminId = adminRes.rows[0]?.id
  const carlosRes = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: ['carlos.mendoza@empresa.com'] })
  const carlosId = carlosRes.rows[0]?.id
  const lauraRes = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: ['laura.tech@startup.io'] })
  const lauraId = lauraRes.rows[0]?.id
  const davidRes = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: ['david.seo@agencia.es'] })
  const davidId = davidRes.rows[0]?.id

  const sampleAudits = [
    {
      id: 'aud_seed_stripe',
      userId: adminId,
      url: 'https://stripe.com',
      domain: 'stripe.com',
      overallScore: 95,
      seoScore: 96,
      performanceScore: 92,
      securityScore: 98,
      domainScore: 95,
      createdAt: now - 1 * 3600,
      details: {
        seo: {
          score: 96,
          title: { text: 'Stripe | Financial Infrastructure for the Internet', length: 50, status: 'good', message: 'Título optimizado' },
          description: { text: 'Stripe is a suite of APIs powering online payment processing and commerce solutions for internet businesses of every size.', length: 128, status: 'good', message: 'Meta descripción óptima' },
          canonical: { url: 'https://stripe.com', status: 'good', message: 'Canónica válida' },
          headings: { h1Count: 1, h2Count: 6, h3Count: 12, h1Texts: ['Financial infrastructure to grow your revenue'], status: 'good', message: 'Estructura H1 correcta' },
          images: { total: 18, withoutAlt: 0, status: 'good', message: 'Todas las imágenes tienen ALT' },
          openGraph: { ogTitle: 'Stripe', ogImage: 'https://stripe.com/img/og.png', ogDescription: 'Financial APIs', status: 'good' },
          robotsTxt: { exists: true, message: 'robots.txt detectado' },
          sitemap: { exists: true, message: 'sitemap.xml detectado' },
          viewport: { hasViewport: true, message: 'Viewport configurado' },
          lang: { lang: 'en', message: 'Idioma declarado: en' }
        },
        performance: {
          score: 92,
          ttfbMs: 110,
          responseTimeMs: 240,
          pageSizeBytes: 85000,
          compression: { enabled: true, encoding: 'br' },
          cacheHeaders: { hasCacheControl: true, hasETag: true, details: 'public, max-age=31536000' },
          assetCounts: { scripts: 8, styles: 3, images: 18 }
        },
        security: {
          score: 98,
          https: { isHttps: true, redirectsToHttps: true },
          ssl: { valid: true, issuer: 'DigiCert Global Root G2', validTo: '2027-04-15', daysRemaining: 340 },
          headers: [
            { name: 'Strict-Transport-Security', present: true, value: 'max-age=63072000; includeSubDomains; preload', recommended: 'max-age=31536000' },
            { name: 'Content-Security-Policy', present: true, value: "default-src 'self'", recommended: "default-src 'self'" },
            { name: 'X-Frame-Options', present: true, value: 'DENY', recommended: 'DENY' },
            { name: 'X-Content-Type-Options', present: true, value: 'nosniff', recommended: 'nosniff' },
            { name: 'Referrer-Policy', present: true, value: 'strict-origin-when-cross-origin', recommended: 'strict-origin-when-cross-origin' },
            { name: 'Permissions-Policy', present: true, value: 'camera=(), microphone=()', recommended: 'camera=()' }
          ],
          mixedContent: { detected: false, count: 0 }
        },
        domainData: {
          score: 95,
          domain: 'stripe.com',
          records: {
            a: ['54.148.82.10', '52.39.22.40'],
            aaaa: ['2600:1f18:2489:8200::'],
            mx: [{ exchange: 'aspmx.l.google.com', priority: 1 }],
            ns: ['ns-102.awsdns-12.com', 'ns-1234.awsdns-26.org'],
            txt: ['v=spf1 include:_spf.google.com include:stripe.com ~all']
          }
        },
        tech: [
          { name: 'React', category: 'Frontend Framework', confidence: 95 },
          { name: 'Next.js', category: 'Frontend Framework', confidence: 95 },
          { name: 'Cloudflare', category: 'CDN', confidence: 100 },
          { name: 'Nginx', category: 'Web Server', confidence: 100 }
        ],
        actionPlan: [
          {
            id: 'sec_subresource_integrity',
            category: 'security',
            severity: 'info',
            title: 'Verificar Subresource Integrity (SRI)',
            description: 'Añadir atributos integrity en scripts cargados desde orígenes externos.',
            impact: 'low',
            effort: 'low',
            steps: ['Añadir hashes sha384 a las etiquetas <script src="...">']
          }
        ]
      }
    },
    {
      id: 'aud_seed_modamujer_2',
      userId: carlosId,
      url: 'https://tienda-modamujer.es',
      domain: 'tienda-modamujer.es',
      overallScore: 72,
      seoScore: 78,
      performanceScore: 65,
      securityScore: 74,
      domainScore: 70,
      createdAt: now - 2 * 3600,
      details: {
        seo: {
          score: 78,
          title: { text: 'Tienda Moda Mujer Online - Ropa y Accesorios de Temporada', length: 58, status: 'good', message: 'Título adecuado' },
          description: { text: 'Descubre nuestra colección de ropa para mujer, vestidos, calzado y accesorios con envío gratuito a toda la península.', length: 115, status: 'good', message: 'Meta descripción adecuada' },
          canonical: { url: 'https://tienda-modamujer.es', status: 'good', message: 'Canónica configurada' },
          headings: { h1Count: 1, h2Count: 4, h3Count: 8, h1Texts: ['Nueva Colección Primavera Verano'], status: 'good', message: 'H1 único' },
          images: { total: 42, withoutAlt: 6, status: 'warning', message: '6 imágenes sin atributo alt' },
          openGraph: { ogTitle: 'Tienda Moda Mujer', ogImage: 'https://tienda-modamujer.es/img/banner.jpg', ogDescription: 'Catálogo online', status: 'good' },
          robotsTxt: { exists: true, message: 'robots.txt detectado' },
          sitemap: { exists: true, message: 'sitemap.xml detectado' },
          viewport: { hasViewport: true, message: 'Viewport configurado' },
          lang: { lang: 'es', message: 'Idioma: es' }
        },
        performance: {
          score: 65,
          ttfbMs: 620,
          responseTimeMs: 1100,
          pageSizeBytes: 380000,
          compression: { enabled: true, encoding: 'gzip' },
          cacheHeaders: { hasCacheControl: false, hasETag: true, details: 'ETag configurado' },
          assetCounts: { scripts: 19, styles: 8, images: 42 }
        },
        security: {
          score: 74,
          https: { isHttps: true, redirectsToHttps: true },
          ssl: { valid: true, issuer: "Let's Encrypt Authority X3", validTo: '2026-11-20', daysRemaining: 74 },
          headers: [
            { name: 'Strict-Transport-Security', present: true, value: 'max-age=31536000', recommended: 'max-age=31536000' },
            { name: 'Content-Security-Policy', present: false, recommended: "default-src 'self'" },
            { name: 'X-Frame-Options', present: true, value: 'SAMEORIGIN', recommended: 'SAMEORIGIN' },
            { name: 'X-Content-Type-Options', present: true, value: 'nosniff', recommended: 'nosniff' },
            { name: 'Referrer-Policy', present: false, recommended: 'strict-origin-when-cross-origin' },
            { name: 'Permissions-Policy', present: false, recommended: 'camera=()' }
          ],
          mixedContent: { detected: false, count: 0 }
        },
        domainData: {
          score: 70,
          domain: 'tienda-modamujer.es',
          records: {
            a: ['185.120.45.12'],
            aaaa: [],
            mx: [{ exchange: 'mail.tienda-modamujer.es', priority: 10 }],
            ns: ['ns1.hostingdns.es', 'ns2.hostingdns.es'],
            txt: ['v=spf1 include:spf.hostingdns.es ~all']
          }
        },
        tech: [
          { name: 'WordPress', category: 'CMS', confidence: 95 },
          { name: 'WooCommerce', category: 'CMS', confidence: 90 },
          { name: 'Nginx', category: 'Web Server', confidence: 100 },
          { name: 'Google Analytics / GTM', category: 'Analytics', confidence: 95 }
        ],
        actionPlan: [
          {
            id: 'perf_slow_ttfb',
            category: 'performance',
            severity: 'warning',
            title: 'Optimizar tiempo de respuesta del servidor (TTFB: 620ms)',
            description: 'El servidor tarda más de 600ms en emitir el primer byte, lo que penaliza la experiencia en móviles.',
            impact: 'high',
            effort: 'medium',
            steps: [
              'Instala un plugin de caché de página como WP Rocket o LiteSpeed Cache.',
              'Habilita Redis Object Cache para reducir las consultas a la base de datos MySQL de WooCommerce.'
            ]
          },
          {
            id: 'sec_missing_csp',
            category: 'security',
            severity: 'warning',
            title: 'Falta cabecera Content-Security-Policy (CSP)',
            description: 'Evita la inyección no autorizada de scripts maliciosos y ataques XSS en la pasarela de pagos.',
            impact: 'high',
            effort: 'low',
            steps: [
              'Añade la cabecera en Nginx: add_header Content-Security-Policy "default-src \'self\' https:;";'
            ]
          },
          {
            id: 'seo_missing_alt',
            category: 'seo',
            severity: 'warning',
            title: 'Añadir textos descriptivos ALT a 6 productos',
            description: '6 imágenes de vestidos y accesorios carecen de texto alternativo en la ficha técnica.',
            impact: 'medium',
            effort: 'low',
            steps: [
              'Entra a la biblioteca de medios y escribe un texto claro con el nombre de la prenda en cada imagen.'
            ]
          }
        ]
      }
    },
    {
      id: 'aud_seed_modamujer_1',
      userId: carlosId,
      url: 'https://tienda-modamujer.es',
      domain: 'tienda-modamujer.es',
      overallScore: 56,
      seoScore: 60,
      performanceScore: 48,
      securityScore: 62,
      domainScore: 60,
      createdAt: now - 14 * 24 * 3600,
      details: {
        seo: { score: 60, title: { text: 'Inicio', length: 6, status: 'warning', message: 'Corto' }, description: { text: '', length: 0, status: 'error', message: 'Falta' }, canonical: { url: null, status: 'warning', message: 'Falta' }, headings: { h1Count: 2, h2Count: 1, h3Count: 0, h1Texts: ['Bienvenido', 'Ofertas'], status: 'warning', message: 'Múltiple H1' }, images: { total: 30, withoutAlt: 15, status: 'warning', message: '15 sin ALT' }, openGraph: { ogTitle: null, ogImage: null, ogDescription: null, status: 'warning' }, robotsTxt: { exists: false, message: 'Sin robots.txt' }, sitemap: { exists: false, message: 'Sin sitemap' }, viewport: { hasViewport: true, message: 'Con viewport' }, lang: { lang: null, message: 'Sin lang' } },
        performance: { score: 48, ttfbMs: 1250, responseTimeMs: 2400, pageSizeBytes: 890000, compression: { enabled: false, encoding: null }, cacheHeaders: { hasCacheControl: false, hasETag: false, details: 'Sin caché' }, assetCounts: { scripts: 24, styles: 12, images: 30 } },
        security: { score: 62, https: { isHttps: true, redirectsToHttps: true }, ssl: { valid: true, issuer: "Let's Encrypt", validTo: '2026-11-20', daysRemaining: 88 }, headers: [], mixedContent: { detected: true, count: 3 } },
        domainData: { score: 60, domain: 'tienda-modamujer.es', records: { a: ['185.120.45.12'], aaaa: [], mx: [], ns: ['ns1.hostingdns.es'], txt: [] } },
        tech: [{ name: 'WordPress', category: 'CMS', confidence: 95 }],
        actionPlan: [{ id: 'h1', category: 'seo', severity: 'critical', title: 'Corregir H1', description: 'Duplicado', impact: 'high', effort: 'low', steps: ['Corregir H1'] }]
      }
    },
    {
      id: 'aud_seed_saascloud',
      userId: lauraId,
      url: 'https://saascloud-app.io',
      domain: 'saascloud-app.io',
      overallScore: 88,
      seoScore: 90,
      performanceScore: 84,
      securityScore: 92,
      domainScore: 86,
      createdAt: now - 3 * 3600,
      details: {
        seo: { score: 90, title: { text: 'SaaS Cloud - Scalable Database Monitoring', length: 42, status: 'good', message: 'Óptimo' }, description: { text: 'Real-time telemetry and database analytics for high-concurrency microservices.', length: 77, status: 'good', message: 'Óptimo' }, canonical: { url: 'https://saascloud-app.io', status: 'good', message: 'Válido' }, headings: { h1Count: 1, h2Count: 5, h3Count: 7, h1Texts: ['Modern Database Observability'], status: 'good', message: 'H1 único' }, images: { total: 10, withoutAlt: 0, status: 'good', message: 'Imágenes completas' }, openGraph: { ogTitle: 'SaaS Cloud', ogImage: 'https://saascloud-app.io/og.png', ogDescription: 'Database Observability', status: 'good' }, robotsTxt: { exists: true, message: 'Detectado' }, sitemap: { exists: true, message: 'Detectado' }, viewport: { hasViewport: true, message: 'Móvil OK' }, lang: { lang: 'en', message: 'en' } },
        performance: { score: 84, ttfbMs: 240, responseTimeMs: 450, pageSizeBytes: 110000, compression: { enabled: true, encoding: 'br' }, cacheHeaders: { hasCacheControl: true, hasETag: true, details: 'public, max-age=3600' }, assetCounts: { scripts: 7, styles: 2, images: 10 } },
        security: { score: 92, https: { isHttps: true, redirectsToHttps: true }, ssl: { valid: true, issuer: 'Cloudflare Inc ECC CA-3', validTo: '2027-01-10', daysRemaining: 240 }, headers: [{ name: 'Strict-Transport-Security', present: true, value: 'max-age=31536000', recommended: 'max-age=31536000' }, { name: 'X-Frame-Options', present: true, value: 'DENY', recommended: 'DENY' }], mixedContent: { detected: false, count: 0 } },
        domainData: { score: 86, domain: 'saascloud-app.io', records: { a: ['104.21.45.12', '172.67.180.99'], aaaa: [], mx: [{ exchange: 'mx.zoho.com', priority: 10 }], ns: ['eva.ns.cloudflare.com', 'luke.ns.cloudflare.com'], txt: ['v=spf1 include:zoho.com ~all'] } },
        tech: [{ name: 'Vue.js', category: 'Frontend Framework', confidence: 95 }, { name: 'Nuxt', category: 'Frontend Framework', confidence: 95 }, { name: 'Tailwind CSS', category: 'CSS Framework', confidence: 90 }, { name: 'Cloudflare', category: 'CDN', confidence: 100 }],
        actionPlan: [{ id: 'sec_csp', category: 'security', severity: 'warning', title: 'Implementar Content Security Policy estricto', description: 'Protege las sesiones de los clientes del panel.', impact: 'high', effort: 'low', steps: ['Configurar directivas CSP en la cabecera del reverse proxy.'] }]
      }
    },
    {
      id: 'aud_seed_portalnoticias',
      userId: davidId,
      url: 'https://portal-noticias.com',
      domain: 'portal-noticias.com',
      overallScore: 43,
      seoScore: 45,
      performanceScore: 36,
      securityScore: 42,
      domainScore: 55,
      createdAt: now - 5 * 3600,
      details: {
        seo: { score: 45, title: { text: '', length: 0, status: 'error', message: 'Falta etiqueta title' }, description: { text: '', length: 0, status: 'error', message: 'Falta meta description' }, canonical: { url: null, status: 'warning', message: 'Falta canónica' }, headings: { h1Count: 0, h2Count: 8, h3Count: 15, h1Texts: [], status: 'error', message: 'Sin H1' }, images: { total: 54, withoutAlt: 38, status: 'critical', message: '38 de 54 imágenes sin atributo ALT' }, openGraph: { ogTitle: null, ogImage: null, ogDescription: null, status: 'warning' }, robotsTxt: { exists: false, message: 'No detectado' }, sitemap: { exists: false, message: 'No detectado' }, viewport: { hasViewport: true, message: 'Con viewport' }, lang: { lang: null, message: 'Sin lang' } },
        performance: { score: 36, ttfbMs: 1420, responseTimeMs: 3800, pageSizeBytes: 1200000, compression: { enabled: false, encoding: null }, cacheHeaders: { hasCacheControl: false, hasETag: false, details: 'Sin caché' }, assetCounts: { scripts: 48, styles: 14, images: 54 } },
        security: { score: 42, https: { isHttps: true, redirectsToHttps: true }, ssl: { valid: true, issuer: 'cPanel, Inc.', validTo: '2026-09-18', daysRemaining: 12 }, headers: [], mixedContent: { detected: true, count: 9 } },
        domainData: { score: 55, domain: 'portal-noticias.com', records: { a: ['82.223.100.45'], aaaa: [], mx: [{ exchange: 'mail.portal-noticias.com', priority: 0 }], ns: ['ns1.midns.es'], txt: [] } },
        tech: [{ name: 'Apache', category: 'Web Server', confidence: 100 }, { name: 'jQuery', category: 'JavaScript Library', confidence: 95 }, { name: 'Bootstrap', category: 'CSS Framework', confidence: 85 }],
        actionPlan: [
          {
            id: 'seo_no_title',
            category: 'seo',
            severity: 'critical',
            title: 'Falta título en la página principal (<title>)',
            description: 'El portal no cuenta con título configurado, perdiendo la totalidad del ranking orgánico en búsquedas.',
            impact: 'high',
            effort: 'low',
            steps: ['Añade la etiqueta <title>Portal de Noticias en Directo e Información de Actualidad</title>']
          },
          {
            id: 'perf_no_gzip',
            category: 'performance',
            severity: 'critical',
            title: 'Activar compresión Gzip en Apache',
            description: 'El HTML pesa 1.2 MB sin comprimir, lo que ralentiza enormemente la descarga en conexiones móviles.',
            impact: 'high',
            effort: 'low',
            steps: ['Habilita mod_deflate en el archivo .htaccess de Apache.']
          },
          {
            id: 'sec_ssl_expiring',
            category: 'security',
            severity: 'critical',
            title: 'Certificado SSL a punto de caducar (12 días restantes)',
            description: 'Si expira, los usuarios verán una pantalla roja de advertencia que bloqueará el tráfico.',
            impact: 'high',
            effort: 'low',
            steps: ['Accede a cPanel > SSL/TLS y renueva el certificado AutoSSL.']
          },
          {
            id: 'sec_mixed_content',
            category: 'security',
            severity: 'critical',
            title: 'Corregir 9 recursos cargados mediante HTTP inseguro',
            description: 'Se detectaron scripts de publicidad y banners cargando mediante enlaces http:// no seguros.',
            impact: 'high',
            effort: 'low',
            steps: ['Cambiar las URLs de los recursos a https://']
          }
        ]
      }
    }
  ]

  for (const item of sampleAudits) {
    const accScore = item.details.accessibility?.score ?? 90
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO audits (id, user_id, url, domain, overall_score, seo_score, performance_score, security_score, domain_score, accessibility_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        item.id,
        item.userId,
        item.url,
        item.domain,
        item.overallScore,
        item.seoScore,
        item.performanceScore,
        item.securityScore,
        item.domainScore,
        accScore,
        item.createdAt
      ]
    })

    await client.execute({
      sql: `
        INSERT OR REPLACE INTO audit_details (id, audit_id, seo_data, performance_data, security_data, domain_data, tech_data, accessibility_data, links_data, action_plan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        'dtl_' + item.id,
        item.id,
        JSON.stringify(item.details.seo),
        JSON.stringify(item.details.performance),
        JSON.stringify(item.details.security),
        JSON.stringify(item.details.domainData),
        JSON.stringify(item.details.tech),
        JSON.stringify(item.details.accessibility || {
          score: 92,
          violations: [],
          passes: 28,
          totalRules: 28,
          summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
          issues: []
        }),
        JSON.stringify(item.details.links || {
          score: 100,
          totalLinks: 24,
          checkedCount: 20,
          broken: [],
          redirects: [],
          issues: []
        }),
        JSON.stringify(item.details.actionPlan)
      ]
    })

    console.log(`📊 Auditoría insertada: ${item.domain} (Score: ${item.overallScore}) -> Usuario: ${item.userId}`)
  }

  console.log('\n✅ ¡Base de datos poblada exitosamente!')
  console.log('───────────────────────────────────────────────────────')
  console.log('🔑 Credenciales del Administrador:')
  console.log('   Email:    admin@monitor.local')
  console.log('   Password: Admin123!*\n')
  console.log('👥 Credenciales de Clientes de Prueba:')
  console.log('   Email:    carlos.mendoza@empresa.com | Password: Cliente123!*')
  console.log('   Email:    laura.tech@startup.io      | Password: Cliente123!*')
  console.log('   Email:    david.seo@agencia.es       | Password: Cliente123!*')
  console.log('   Email:    ana.lopez@digital.com      | Password: Cliente123!*')
  console.log('───────────────────────────────────────────────────────')
}

seed().catch(err => {
  console.error('❌ Error poblando la base de datos:', err)
  process.exit(1)
})
