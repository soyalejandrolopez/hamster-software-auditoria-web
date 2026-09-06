import dns from 'node:dns/promises'
import type { DomainAuditResult, ActionPlanItem } from './types'

export async function auditDomain(domain: string): Promise<DomainAuditResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase()

  const records: DomainAuditResult['records'] = {
    a: [],
    aaaa: [],
    mx: [],
    ns: [],
    txt: []
  }

  const issues: ActionPlanItem[] = []
  let score = 100

  // Resolve A
  try {
    records.a = await dns.resolve4(cleanDomain)
  } catch {
    // If no A record, check if AAAA exists
  }

  // Resolve AAAA
  try {
    records.aaaa = await dns.resolve6(cleanDomain)
  } catch {
    // AAAA optional
  }

  if (records.a.length === 0 && records.aaaa.length === 0) {
    score -= 40
    issues.push({
      id: 'domain_no_a_record',
      category: 'domain',
      severity: 'critical',
      title: 'Sin registros DNS de servidor (A o AAAA)',
      description: 'El dominio no tiene direcciones IP asignadas, impidiendo el acceso al sitio.',
      impact: 'high',
      effort: 'low',
      steps: ['Agrega un registro A apuntando a la dirección IP pública de tu servidor web en tu panel DNS.']
    })
  }

  // Resolve MX
  try {
    const mxRecords = await dns.resolveMx(cleanDomain)
    records.mx = mxRecords.map(m => ({ exchange: m.exchange, priority: m.priority }))
  } catch {
    // No MX
  }

  // Resolve NS
  try {
    records.ns = await dns.resolveNs(cleanDomain)
  } catch {
    // No NS
  }

  if (records.ns.length < 2) {
    score -= 10
    issues.push({
      id: 'domain_low_ns_redundancy',
      category: 'domain',
      severity: 'warning',
      title: 'Poca redundancia en servidores DNS (NS)',
      description: 'Se recomienda tener al menos 2 servidores de nombres (NS) independientes para garantizar alta disponibilidad.',
      impact: 'medium',
      effort: 'low',
      steps: ['Configura un proveedor DNS secundario o utiliza Cloudflare para obtener redundancia global Anycast.']
    })
  }

  // Resolve TXT (SPF / DMARC)
  try {
    const txtRecords = await dns.resolveTxt(cleanDomain)
    records.txt = txtRecords.map(arr => arr.join(''))
  } catch {
    // No TXT
  }

  const hasSpf = records.txt.some(t => t.includes('v=spf1'))
  if (!hasSpf && records.mx.length > 0) {
    score -= 15
    issues.push({
      id: 'domain_missing_spf',
      category: 'domain',
      severity: 'warning',
      title: 'Falta registro SPF en registros DNS TXT',
      description: 'El registro SPF previene la suplantación de identidad (spoofing) de correos electrónicos corporativos.',
      impact: 'medium',
      effort: 'low',
      steps: ['Añade un registro TXT con la directiva SPF de tu proveedor de correo (ej. "v=spf1 include:_spf.google.com ~all").']
    })
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    domain: cleanDomain,
    records,
    issues
  }
}
