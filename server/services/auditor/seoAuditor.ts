import * as cheerio from 'cheerio'
import type { SeoAuditResult, ActionPlanItem } from './types'

export interface SeoAuditOptions {
  html: string
  url: string
  robotsTxtExists: boolean
  sitemapExists: boolean
}

export function auditSeo(options: SeoAuditOptions): SeoAuditResult {
  const { html, url, robotsTxtExists, sitemapExists } = options
  const $ = cheerio.load(html)
  const issues: ActionPlanItem[] = []

  let score = 100

  // 1. Title
  const titleText = $('title').first().text().trim()
  const titleLength = titleText.length
  let titleStatus: 'good' | 'warning' | 'error' = 'good'
  let titleMessage = 'Título optimizado correctamente.'

  if (!titleText) {
    titleStatus = 'error'
    titleMessage = 'Falta la etiqueta <title> en el documento.'
    score -= 20
    issues.push({
      id: 'seo_missing_title',
      category: 'seo',
      severity: 'critical',
      title: 'Falta etiqueta de título (<title>)',
      description: 'El título es el factor SEO en la página más importante para los motores de búsqueda y la tasa de clics.',
      impact: 'high',
      effort: 'low',
      steps: [
        'Añade una etiqueta <title> descriptiva dentro de la sección <head>.',
        'Mantén la longitud entre 50 y 60 caracteres e incluye tu palabra clave principal.'
      ]
    })
  } else if (titleLength < 30) {
    titleStatus = 'warning'
    titleMessage = `El título es demasiado corto (${titleLength} caracteres). Recomendado: 30-65.`
    score -= 7
    issues.push({
      id: 'seo_short_title',
      category: 'seo',
      severity: 'warning',
      title: 'Título demasiado breve',
      description: `El título actual tiene solo ${titleLength} caracteres, desaprovechando espacio en los resultados de Google.`,
      impact: 'medium',
      effort: 'low',
      steps: ['Amplía el título a entre 40 y 60 caracteres con palabras clave relevantes.']
    })
  } else if (titleLength > 65) {
    titleStatus = 'warning'
    titleMessage = `El título es demasiado largo (${titleLength} caracteres) y podría truncarse en Google.`
    score -= 5
  }

  // 2. Meta Description
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || ''
  const descLength = metaDesc.length
  let descStatus: 'good' | 'warning' | 'error' = 'good'
  let descMessage = 'Meta descripción óptima.'

  if (!metaDesc) {
    descStatus = 'error'
    descMessage = 'No se encontró la etiqueta <meta name="description">.'
    score -= 15
    issues.push({
      id: 'seo_missing_desc',
      category: 'seo',
      severity: 'critical',
      title: 'Falta la meta descripción',
      description: 'Sin meta descripción, los motores de búsqueda generan fragmentos automáticos que suelen reducir el CTR.',
      impact: 'high',
      effort: 'low',
      steps: [
        'Añade <meta name="description" content="..."> en el <head>.',
        'Redacta un texto convincente de entre 120 y 160 caracteres.'
      ]
    })
  } else if (descLength < 70) {
    descStatus = 'warning'
    descMessage = `La meta descripción es muy corta (${descLength} caracteres). Recomendado: 120-160.`
    score -= 5
  } else if (descLength > 165) {
    descStatus = 'warning'
    descMessage = `La meta descripción es demasiado larga (${descLength} caracteres) y se cortará en los SERP.`
    score -= 4
  }

  // 3. Canonical Tag
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null
  let canonicalStatus: 'good' | 'warning' | 'error' = 'good'
  let canonicalMessage = 'Etiqueta canónica configurada.'

  if (!canonicalUrl) {
    canonicalStatus = 'warning'
    canonicalMessage = 'No se encontró etiqueta canónica (<link rel="canonical">).'
    score -= 8
    issues.push({
      id: 'seo_missing_canonical',
      category: 'seo',
      severity: 'warning',
      title: 'Falta etiqueta canonical',
      description: 'Ayuda a prevenir problemas de contenido duplicado indicando a Google la URL preferida.',
      impact: 'medium',
      effort: 'low',
      steps: [`Añade <link rel="canonical" href="${url}"> dentro del <head>.`]
    })
  }

  // 4. Headings
  const h1Elements = $('h1')
  const h1Count = h1Elements.length
  const h2Count = $('h2').length
  const h3Count = $('h3').length
  const h1Texts: string[] = []
  h1Elements.each((_, el) => {
    const txt = $(el).text().trim()
    if (txt) h1Texts.push(txt)
  })

  let headingStatus: 'good' | 'warning' | 'error' = 'good'
  let headingMessage = 'Estructura de encabezados adecuada.'

  if (h1Count === 0) {
    headingStatus = 'error'
    headingMessage = 'No se encontró ningún encabezado <h1> en la página.'
    score -= 15
    issues.push({
      id: 'seo_missing_h1',
      category: 'seo',
      severity: 'critical',
      title: 'Falta encabezado principal (H1)',
      description: 'El encabezado H1 define el tema central de la página para usuarios y motores de búsqueda.',
      impact: 'high',
      effort: 'low',
      steps: ['Agrega un único encabezado <h1> que describa el propósito principal de la página.']
    })
  } else if (h1Count > 1) {
    headingStatus = 'warning'
    headingMessage = `Se encontraron ${h1Count} encabezados <h1>. Se recomienda utilizar un solo H1 principal.`
    score -= 5
    issues.push({
      id: 'seo_multiple_h1',
      category: 'seo',
      severity: 'info',
      title: 'Múltiples etiquetas H1 detectadas',
      description: 'Tener múltiples H1 puede diluir la relevancia temática. Es mejor estructurar con un H1 y múltiples H2/H3.',
      impact: 'low',
      effort: 'low',
      steps: ['Conserva un único <h1> y convierte los demás en <h2>.']
    })
  }

  // 5. Images with Alt
  const imgElements = $('img')
  const totalImages = imgElements.length
  let withoutAlt = 0

  imgElements.each((_, el) => {
    const alt = $(el).attr('alt')
    if (alt === undefined || alt === null || alt.trim() === '') {
      withoutAlt++
    }
  })

  let imgStatus: 'good' | 'warning' | 'error' = 'good'
  let imgMessage = 'Todas las imágenes tienen atributo alt descriptivo.'

  if (withoutAlt > 0) {
    const percentage = Math.round((withoutAlt / (totalImages || 1)) * 100)
    imgStatus = percentage > 40 ? 'error' : 'warning'
    imgMessage = `${withoutAlt} de ${totalImages} imágenes no tienen atributo alt.`
    score -= Math.min(15, withoutAlt * 3)
    issues.push({
      id: 'seo_missing_alt',
      category: 'seo',
      severity: percentage > 40 ? 'critical' : 'warning',
      title: 'Imágenes sin atributo ALT',
      description: `${withoutAlt} imagen(es) carecen de texto alternativo, afectando el SEO en Google Imágenes y la accesibilidad.`,
      impact: 'medium',
      effort: 'low',
      steps: ['Revisa las imágenes del sitio y añade el atributo alt="descripción relevante".']
    })
  }

  // 6. Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content') || null
  const ogImage = $('meta[property="og:image"]').attr('content') || null
  const ogDescription = $('meta[property="og:description"]').attr('content') || null

  const hasOg = Boolean(ogTitle && ogImage)
  if (!hasOg) {
    score -= 5
    issues.push({
      id: 'seo_missing_og',
      category: 'seo',
      severity: 'info',
      title: 'Configurar etiquetas Open Graph',
      description: 'Permite que tu contenido se comparta con imagen, título y descripción atractiva en WhatsApp, LinkedIn y Twitter.',
      impact: 'medium',
      effort: 'low',
      steps: [
        'Añade <meta property="og:title" content="...">',
        'Añade <meta property="og:description" content="...">',
        'Añade <meta property="og:image" content="https://.../imagen-destacada.jpg">'
      ]
    })
  }

  // 7. Viewport & Lang
  const hasViewport = $('meta[name="viewport"]').length > 0
  if (!hasViewport) {
    score -= 10
    issues.push({
      id: 'seo_missing_viewport',
      category: 'seo',
      severity: 'critical',
      title: 'Falta etiqueta meta viewport',
      description: 'Es fundamental para que la página sea reconocida como adaptable (responsive) en móviles.',
      impact: 'high',
      effort: 'low',
      steps: ['Añade <meta name="viewport" content="width=device-width, initial-scale=1.0"> en el <head>.']
    })
  }

  const lang = $('html').attr('lang') || null
  if (!lang) {
    score -= 5
    issues.push({
      id: 'seo_missing_lang',
      category: 'seo',
      severity: 'info',
      title: 'Declarar idioma en etiqueta HTML',
      description: 'Indica a navegadores y motores de búsqueda el idioma principal de la web.',
      impact: 'low',
      effort: 'low',
      steps: ['Añade el atributo lang="es" (o tu idioma) en <html lang="es">.']
    })
  }

  // 8. Robots & Sitemap
  if (!robotsTxtExists) {
    score -= 4
    issues.push({
      id: 'seo_missing_robots',
      category: 'seo',
      severity: 'info',
      title: 'Crear archivo robots.txt',
      description: 'Guía a los rastreadores de búsqueda sobre qué partes del sitio rastrear.',
      impact: 'low',
      effort: 'low',
      steps: ['Crea un archivo /robots.txt en la raíz de tu dominio con directivas User-agent y Sitemap.']
    })
  }

  if (!sitemapExists) {
    score -= 5
    issues.push({
      id: 'seo_missing_sitemap',
      category: 'seo',
      severity: 'warning',
      title: 'Crear archivo sitemap.xml',
      description: 'Un mapa del sitio XML facilita a los motores de búsqueda descubrir e indexar todas tus páginas.',
      impact: 'medium',
      effort: 'low',
      steps: ['Genera un archivo sitemap.xml con las URLs del sitio y referéncialo en robots.txt.']
    })
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    title: { text: titleText, length: titleLength, status: titleStatus, message: titleMessage },
    description: { text: metaDesc, length: descLength, status: descStatus, message: descMessage },
    canonical: { url: canonicalUrl, status: canonicalStatus, message: canonicalMessage },
    headings: { h1Count, h2Count, h3Count, h1Texts, status: headingStatus, message: headingMessage },
    images: { total: totalImages, withoutAlt, status: imgStatus, message: imgMessage },
    openGraph: { ogTitle, ogImage, ogDescription, status: hasOg ? 'good' : 'warning' },
    robotsTxt: { exists: robotsTxtExists, message: robotsTxtExists ? 'robots.txt detectado' : 'No se detectó /robots.txt' },
    sitemap: { exists: sitemapExists, message: sitemapExists ? 'sitemap.xml detectado' : 'No se detectó /sitemap.xml' },
    viewport: { hasViewport, message: hasViewport ? 'Viewport móvil configurado' : 'Sin viewport móvil' },
    lang: { lang, message: lang ? `Idioma declarado: ${lang}` : 'No se ha declarado el atributo lang' },
    issues
  }
}
