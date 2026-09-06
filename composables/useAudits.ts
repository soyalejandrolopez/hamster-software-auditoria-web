import type { Audit, AuditDetail } from '../server/db/schema'
import type { SeoAuditResult, PerformanceAuditResult, SecurityAuditResult, DomainAuditResult, DetectedTech, ActionPlanItem } from '../server/services/auditor/types'

export interface FullAuditDetails {
  seo: SeoAuditResult
  performance: PerformanceAuditResult
  security: SecurityAuditResult
  domainData: DomainAuditResult
  tech: DetectedTech[]
  actionPlan: ActionPlanItem[]
}

export const useAudits = () => {
  const audits = useState<Audit[]>('audits_list', () => [])
  const currentAudit = useState<Audit | null>('current_audit', () => null)
  const currentDetails = useState<FullAuditDetails | null>('current_details', () => null)
  const isScanning = useState<boolean>('audit_is_scanning', () => false)
  const scanStep = useState<string>('audit_scan_step', () => '')
  const error = useState<string | null>('audit_error', () => null)

  const loadAudits = async () => {
    try {
      const data = await $fetch<{ audits: Audit[] }>('/api/audits')
      audits.value = data.audits
    } catch (err: any) {
      error.value = err.data?.error || err.message
    }
  }

  const scanUrl = async (url: string) => {
    isScanning.value = true
    error.value = null
    scanStep.value = 'Iniciando conexión con el servidor...'

    const stepInterval = setInterval(() => {
      if (scanStep.value.includes('Iniciando')) {
        scanStep.value = 'Resolviendo registros DNS y evaluando certificado SSL...'
      } else if (scanStep.value.includes('DNS')) {
        scanStep.value = 'Midiendo TTFB y descargando estructura HTML...'
      } else if (scanStep.value.includes('TTFB')) {
        scanStep.value = 'Analizando etiquetas SEO, imágenes y encabezados...'
      } else if (scanStep.value.includes('SEO')) {
        scanStep.value = 'Generando Plan de Acción y cálculo de puntuaciones...'
      }
    }, 1200)

    try {
      const data = await $fetch<{ audit: Audit; details: FullAuditDetails }>('/api/audits/scan', {
        method: 'POST',
        body: { url }
      })

      // Add to list
      audits.value = [data.audit, ...audits.value.filter(a => a.id !== data.audit.id)]
      currentAudit.value = data.audit
      currentDetails.value = data.details
      return { success: true, audit: data.audit }
    } catch (err: any) {
      const msg = err.data?.error || err.message || 'Error al realizar el análisis'
      error.value = msg
      return { success: false, error: msg }
    } finally {
      clearInterval(stepInterval)
      isScanning.value = false
      scanStep.value = ''
    }
  }

  const loadAuditById = async (id: string) => {
    try {
      const data = await $fetch<{ audit: Audit; details: FullAuditDetails }>(`/api/audits/${id}`)
      currentAudit.value = data.audit
      currentDetails.value = data.details
      return data
    } catch (err: any) {
      error.value = err.data?.error || err.message
      return null
    }
  }

  const deleteAudit = async (id: string) => {
    try {
      await $fetch(`/api/audits/${id}`, { method: 'DELETE' })
      audits.value = audits.value.filter(a => a.id !== id)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.data?.error || err.message }
    }
  }

  const loadDomainHistory = async (domain: string) => {
    try {
      const data = await $fetch<{ domain: string; history: Audit[] }>(`/api/audits/history/${domain}`)
      return data.history
    } catch {
      return []
    }
  }

  return {
    audits,
    currentAudit,
    currentDetails,
    isScanning,
    scanStep,
    error,
    loadAudits,
    scanUrl,
    loadAuditById,
    deleteAudit,
    loadDomainHistory
  }
}
