import type { Audit, AuditDetail } from '../server/db/schema'
import type {
  SeoAuditResult,
  PerformanceAuditResult,
  SecurityAuditResult,
  DomainAuditResult,
  DetectedTech,
  ActionPlanItem,
  AccessibilityAuditResult,
  LinkCheckResult
} from '../server/services/auditor/types'

export interface FullAuditDetails {
  seo: SeoAuditResult
  performance: PerformanceAuditResult
  security: SecurityAuditResult
  domainData: DomainAuditResult
  tech: DetectedTech[]
  accessibility?: AccessibilityAuditResult | null
  linkCheck?: LinkCheckResult | null
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
      const fetch = useRequestFetch()
      const data = await fetch<{ audits: Audit[] }>('/api/audits')
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
        scanStep.value = 'Resolviendo registros DNS, WHOIS y certificado TLS...'
      } else if (scanStep.value.includes('DNS')) {
        scanStep.value = 'Midiendo TTFB, descarga y Core Web Vitals...'
      } else if (scanStep.value.includes('TTFB')) {
        scanStep.value = 'Analizando SEO, cookies y cabeceras de seguridad...'
      } else if (scanStep.value.includes('SEO')) {
        scanStep.value = 'Verificando reglas de accesibilidad WCAG 2.1...'
      } else if (scanStep.value.includes('accesibilidad')) {
        scanStep.value = 'Comprobando enlaces rotos y estado HTTP...'
      } else if (scanStep.value.includes('enlaces')) {
        scanStep.value = 'Generando Plan de Acción y cálculo de puntuaciones...'
      }
    }, 1100)

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
      const fetch = useRequestFetch()
      const data = await fetch<{ audit: Audit; details: FullAuditDetails }>(`/api/audits/${id}`)
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
      const fetch = useRequestFetch()
      const data = await fetch<{ domain: string; history: Audit[] }>(`/api/audits/history/${domain}`)
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
