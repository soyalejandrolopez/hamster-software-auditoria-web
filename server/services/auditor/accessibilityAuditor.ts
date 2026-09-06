import * as cheerio from 'cheerio'
import type { AccessibilityAuditResult, AccessibilityViolation, ActionPlanItem } from './types'

/**
 * WCAG 2.1 Accessibility Auditor
 * Analyzes DOM structure, landmarks, form labels, image alternatives,
 * heading hierarchy, and viewport zoom configurations.
 */
export async function auditAccessibility(html: string): Promise<AccessibilityAuditResult> {
  const $ = cheerio.load(html)
  const violations: AccessibilityViolation[] = []
  const issues: ActionPlanItem[] = []
  const summary = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  let passes = 0

  function recordViolation(params: {
    id: string
    impact: 'critical' | 'serious' | 'moderate' | 'minor'
    description: string
    helpUrl: string
    nodes: number
    tags: string[]
    actionTitle: string
    actionDesc: string
    actionSteps: string[]
  }) {
    summary[params.impact]++
    violations.push({
      id: params.id,
      impact: params.impact,
      description: params.description,
      helpUrl: params.helpUrl,
      nodes: params.nodes,
      tags: params.tags
    })

    const severity = params.impact === 'critical' || params.impact === 'serious' ? 'critical' : params.impact === 'moderate' ? 'warning' : 'info'
    const impactVal = params.impact === 'critical' || params.impact === 'serious' ? 'high' : params.impact === 'moderate' ? 'medium' : 'low'

    issues.push({
      id: `a11y_${params.id}`,
      category: 'accessibility',
      severity,
      title: params.actionTitle,
      description: params.actionDesc,
      impact: impactVal,
      effort: 'low',
      steps: params.actionSteps
    })
  }

  // 1. Language attribute on <html>
  const lang = $('html').attr('lang')?.trim()
  if (!lang || lang.length < 2) {
    recordViolation({
      id: 'html-has-lang',
      impact: 'serious',
      description: 'El elemento <html> debe tener un atributo lang válido para lectores de pantalla.',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/html-has-lang',
      nodes: 1,
      tags: ['wcag2a', 'wcag311'],
      actionTitle: 'Declarar el idioma principal del documento en <html lang="...">',
      actionDesc: 'Los lectores de pantalla necesitan conocer el idioma para seleccionar la síntesis de voz y pronunciación correctas.',
      actionSteps: ['Añade el atributo lang a la etiqueta <html>, por ejemplo: <html lang="es"> o <html lang="en">.']
    })
  } else {
    passes++
  }

  // 2. Document title
  const title = $('title').text().trim()
  if (!title) {
    recordViolation({
      id: 'document-title',
      impact: 'serious',
      description: 'El documento no tiene un título (<title>) o está vacío.',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/document-title',
      nodes: 1,
      tags: ['wcag2a', 'wcag242'],
      actionTitle: 'Definir un título descriptivo en la etiqueta <title>',
      actionDesc: 'El título de la página es lo primero que leen los usuarios de tecnologías de asistencia para contextualizarse.',
      actionSteps: ['Añade un elemento <title> conciso y descriptivo en el <head>.']
    })
  } else {
    passes++
  }

  // 3. Image alternative text
  let imagesWithoutAlt = 0
  $('img').each((_, el) => {
    const alt = $(el).attr('alt')
    if (alt === undefined) {
      imagesWithoutAlt++
    }
  })
  if (imagesWithoutAlt > 0) {
    recordViolation({
      id: 'image-alt',
      impact: 'critical',
      description: `${imagesWithoutAlt} imagen(es) carecen del atributo alt.`,
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
      nodes: imagesWithoutAlt,
      tags: ['wcag2a', 'wcag111'],
      actionTitle: 'Añadir atributos alt a todas las imágenes',
      actionDesc: 'Las imágenes sin descripción textual son invisibles para personas ciegas o con deficiencias visuales.',
      actionSteps: [
        'Añade un texto alternativo conciso que describa la imagen.',
        'Para imágenes puramente decorativas, usa alt="" para que los lectores de pantalla las ignoren.'
      ]
    })
  } else {
    passes++
  }

  // 4. Buttons have accessible text
  let emptyButtons = 0
  $('button').each((_, el) => {
    const text = $(el).text().trim()
    const ariaLabel = $(el).attr('aria-label')?.trim()
    const ariaLabelledby = $(el).attr('aria-labelledby')?.trim()
    const titleAttr = $(el).attr('title')?.trim()
    const hasImgAlt = $(el).find('img[alt]').length > 0
    const hasSvgAria = $(el).find('svg[aria-label], svg[role="img"]').length > 0

    if (!text && !ariaLabel && !ariaLabelledby && !titleAttr && !hasImgAlt && !hasSvgAria) {
      emptyButtons++
    }
  })
  if (emptyButtons > 0) {
    recordViolation({
      id: 'button-name',
      impact: 'critical',
      description: `${emptyButtons} botón(es) no tienen texto accesible identificable.`,
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/button-name',
      nodes: emptyButtons,
      tags: ['wcag2a', 'wcag412'],
      actionTitle: 'Proporcionar nombres accesibles a los botones',
      actionDesc: 'Los botones que contienen solo iconos (como lupas o menús de hamburguesa) necesitan texto o aria-label para ser inteligibles.',
      actionSteps: ['Añade aria-label="Descripción de la acción" o texto visible dentro del botón.']
    })
  } else {
    passes++
  }

  // 5. Links have discernible text
  let emptyLinks = 0
  $('a[href]').each((_, el) => {
    const text = $(el).text().trim()
    const ariaLabel = $(el).attr('aria-label')?.trim()
    const titleAttr = $(el).attr('title')?.trim()
    const hasImgAlt = $(el).find('img[alt]:not([alt=""])').length > 0

    if (!text && !ariaLabel && !titleAttr && !hasImgAlt) {
      emptyLinks++
    }
  })
  if (emptyLinks > 0) {
    recordViolation({
      id: 'link-name',
      impact: 'serious',
      description: `${emptyLinks} enlace(s) no tienen texto discernible ni etiqueta de accesibilidad.`,
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/link-name',
      nodes: emptyLinks,
      tags: ['wcag2a', 'wcag244', 'wcag412'],
      actionTitle: 'Añadir texto descriptivo a los enlaces',
      actionDesc: 'Los enlaces sin texto no pueden ser interpretados por lectores de pantalla ni por rastreadores web.',
      actionSteps: ['Añade texto dentro del enlace o utiliza el atributo aria-label.']
    })
  } else {
    passes++
  }

  // 6. Form inputs have labels
  let unlabelledInputs = 0
  $('input, select, textarea').each((_, el) => {
    const type = $(el).attr('type')?.toLowerCase() || 'text'
    if (['hidden', 'submit', 'reset', 'button', 'image'].includes(type)) return

    const id = $(el).attr('id')
    const ariaLabel = $(el).attr('aria-label')?.trim()
    const ariaLabelledby = $(el).attr('aria-labelledby')?.trim()
    const placeholder = $(el).attr('placeholder')?.trim()
    const hasLabelFor = id ? $(`label[for="${id}"]`).length > 0 : false
    const isWrappedInLabel = $(el).closest('label').length > 0

    if (!ariaLabel && !ariaLabelledby && !hasLabelFor && !isWrappedInLabel) {
      unlabelledInputs++
    }
  })
  if (unlabelledInputs > 0) {
    recordViolation({
      id: 'label',
      impact: 'critical',
      description: `${unlabelledInputs} campo(s) de formulario no tienen una etiqueta <label> asociada.`,
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
      nodes: unlabelledInputs,
      tags: ['wcag2a', 'wcag131', 'wcag412'],
      actionTitle: 'Asociar etiquetas <label> a todos los campos de formulario',
      actionDesc: 'El atributo placeholder no sustituye a una etiqueta <label>; desaparece al escribir y confunde a los usuarios.',
      actionSteps: [
        'Usa <label for="input-id">Texto</label> enlazado al id del campo.',
        'Alternativamente, añade aria-label="Nombre del campo" al elemento <input>.'
      ]
    })
  } else {
    passes++
  }

  // 7. Headings order & structure
  const h1Count = $('h1').length
  if (h1Count === 0) {
    recordViolation({
      id: 'page-has-heading-one',
      impact: 'moderate',
      description: 'La página no tiene ningún encabezado principal <h1>.',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/page-has-heading-one',
      nodes: 1,
      tags: ['best-practice'],
      actionTitle: 'Incluir un encabezado <h1> principal',
      actionDesc: 'El <h1> comunica el tema central de la página y estructura el árbol jerárquico del documento.',
      actionSteps: ['Añade un <h1> único y descriptivo al inicio del contenido principal.']
    })
  } else if (h1Count > 1) {
    recordViolation({
      id: 'page-has-multiple-h1',
      impact: 'minor',
      description: `La página contiene ${h1Count} encabezados <h1>. Se recomienda un único <h1> por página.`,
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/page-has-heading-one',
      nodes: h1Count,
      tags: ['best-practice'],
      actionTitle: 'Estructurar un único <h1> principal por página',
      actionDesc: 'Tener múltiples H1 puede diluir la jerarquía temática del contenido.',
      actionSteps: ['Convierte los <h1> secundarios en <h2> según la sección correspondiente.']
    })
  } else {
    passes++
  }

  // 8. Main landmark
  const mainCount = $('main, [role="main"]').length
  if (mainCount === 0) {
    recordViolation({
      id: 'landmark-one-main',
      impact: 'moderate',
      description: 'No se detectó un landmark <main> o role="main" para el contenido principal.',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/landmark-one-main',
      nodes: 1,
      tags: ['best-practice'],
      actionTitle: 'Definir el contenedor de contenido con la etiqueta semántica <main>',
      actionDesc: 'Permite a los usuarios de lectores de pantalla saltar directamente al contenido relevante omitiendo cabeceras.',
      actionSteps: ['Envuelve el cuerpo de la página en una etiqueta <main>.']
    })
  } else {
    passes++
  }

  // 9. Viewport scaling allowed
  const viewportMeta = $('meta[name="viewport"]').attr('content') || ''
  if (viewportMeta.includes('user-scalable=no') || viewportMeta.includes('maximum-scale=1.0') || viewportMeta.includes('maximum-scale=1,')) {
    recordViolation({
      id: 'meta-viewport',
      impact: 'critical',
      description: 'La etiqueta viewport bloquea el zoom del usuario (user-scalable=no o maximum-scale=1).',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/meta-viewport',
      nodes: 1,
      tags: ['wcag2aa', 'wcag144'],
      actionTitle: 'Permitir el zoom del usuario en dispositivos móviles',
      actionDesc: 'Bloquear el zoom impide que personas con dificultades visuales amplíen el texto para leerlo cómodamente.',
      actionSteps: ['Elimina user-scalable=no y maximum-scale=1 de la etiqueta <meta name="viewport">.']
    })
  } else {
    passes++
  }

  // 10. Frame titles
  let framesWithoutTitle = 0
  $('iframe').each((_, el) => {
    const titleAttr = $(el).attr('title')?.trim()
    if (!titleAttr) {
      framesWithoutTitle++
    }
  })
  if (framesWithoutTitle > 0) {
    recordViolation({
      id: 'frame-title',
      impact: 'moderate',
      description: `${framesWithoutTitle} <iframe> carecen del atributo title.`,
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/frame-title',
      nodes: framesWithoutTitle,
      tags: ['wcag2a', 'wcag241', 'wcag412'],
      actionTitle: 'Añadir atributo title a los elementos <iframe>',
      actionDesc: 'El atributo title describe el propósito del marco incrustado a usuarios de lectores de pantalla.',
      actionSteps: ['Añade title="Descripción del contenido del iframe", por ejemplo: title="Mapa de ubicación".']
    })
  } else {
    passes++
  }

  // 11. Navigation landmark
  const navCount = $('nav, [role="navigation"]').length
  if (navCount === 0 && $('a[href]').length > 5) {
    recordViolation({
      id: 'landmark-navigation',
      impact: 'minor',
      description: 'El sitio cuenta con enlaces de navegación pero no utiliza el elemento <nav>.',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/region',
      nodes: 1,
      tags: ['best-practice'],
      actionTitle: 'Agrupar la navegación principal en un elemento <nav>',
      actionDesc: 'Ayuda a los lectores de pantalla a reconocer los menús de navegación del sitio.',
      actionSteps: ['Envuelve los menús de navegación en etiquetas <nav aria-label="Menú principal">.']
    })
  } else {
    passes++
  }

  // Calculate score
  const totalViolationWeight = summary.critical * 12 + summary.serious * 8 + summary.moderate * 4 + summary.minor * 2
  const score = Math.max(0, Math.min(100, 100 - totalViolationWeight))
  const totalRules = passes + violations.length

  return {
    score,
    violations,
    passes,
    totalRules,
    summary,
    issues
  }
}
