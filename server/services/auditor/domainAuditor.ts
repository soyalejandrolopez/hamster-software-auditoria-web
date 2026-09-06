import dns from 'node:dns/promises'
import type { DomainAuditResult, WhoisInfo, ActionPlanItem } from './types'

async function resolveViaDoH(name: string, type: string): Promise<string[]> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(3500)
    })
    if (!res.ok) return []
    const json: any = await res.json()
    if (!json.Answer || !Array.isArray(json.Answer)) return []
    return json.Answer.map((a: any) => String(a.data || '').trim().replace(/^"|"$/g, '')).filter(Boolean)
  } catch {
    return []
  }
}

export async function auditDomain(domain: string): Promise<DomainAuditResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase()

  const records: DomainAuditResult['records'] = {
    a: [],
    aaaa: [],
    mx: [],
    ns: [],
    txt: [],
    caa: []
  }

  const issues: ActionPlanItem[] = []
  let score = 100

  // ─── Resolve A ───
  try {
    records.a = await dns.resolve4(cleanDomain)
  } catch {
    // Fallback to Cloudflare DoH
    records.a = await resolveViaDoH(cleanDomain, 'A')
  }

  // ─── Resolve AAAA ───
  try {
    records.aaaa = await dns.resolve6(cleanDomain)
  } catch {
    // Fallback to Cloudflare DoH
    records.aaaa = await resolveViaDoH(cleanDomain, 'AAAA')
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

  // ─── Resolve MX ───
  try {
    const mxRecords = await dns.resolveMx(cleanDomain)
    records.mx = mxRecords.map(m => ({ exchange: m.exchange, priority: m.priority }))
  } catch {
    // Fallback to DoH
    const dohMx = await resolveViaDoH(cleanDomain, 'MX')
    records.mx = dohMx.map(entry => {
      const parts = entry.split(/\s+/)
      return {
        priority: parseInt(parts[0], 10) || 10,
        exchange: parts[1] || parts[0]
      }
    })
  }

  // ─── Resolve NS ───
  try {
    records.ns = await dns.resolveNs(cleanDomain)
  } catch {
    // Fallback to DoH
    records.ns = await resolveViaDoH(cleanDomain, 'NS')
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

  // ─── Resolve TXT (SPF / DMARC) ───
  try {
    const txtRecords = await dns.resolveTxt(cleanDomain)
    records.txt = txtRecords.map(arr => arr.join(''))
  } catch {
    // Fallback to DoH
    records.txt = await resolveViaDoH(cleanDomain, 'TXT')
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

  // ─── Resolve CAA (NEW) ───
  try {
    const caaRecords = await dns.resolveCaa(cleanDomain)
    records.caa = caaRecords.map(c => `${c.critical ? 'critical' : '0'} ${c.tag || 'issue'} "${c.value || ''}"`)
  } catch {
    // No CAA records
  }

  // ─── DMARC Check (NEW) ───
  let dmarcFound = false
  let dmarcRecord: string | null = null
  try {
    const dmarcResults = await dns.resolveTxt(`_dmarc.${cleanDomain}`)
    const dmarcTxt = dmarcResults.map(arr => arr.join('')).find(t => t.startsWith('v=DMARC1'))
    if (dmarcTxt) {
      dmarcFound = true
      dmarcRecord = dmarcTxt
    }
  } catch {
    // Fallback to DoH
    const dohDmarc = await resolveViaDoH(`_dmarc.${cleanDomain}`, 'TXT')
    const dmarcTxt = dohDmarc.find(t => t.startsWith('v=DMARC1'))
    if (dmarcTxt) {
      dmarcFound = true
      dmarcRecord = dmarcTxt
    }
  }

  if (!dmarcFound && records.mx.length > 0) {
    score -= 10
    issues.push({
      id: 'domain_missing_dmarc',
      category: 'domain',
      severity: 'warning',
      title: 'Falta registro DMARC',
      description: 'DMARC complementa a SPF y DKIM para prevenir la suplantación de correo electrónico y phishing.',
      impact: 'medium',
      effort: 'low',
      steps: [
        'Añade un registro TXT en _dmarc.tudominio.com',
        'Ejemplo: v=DMARC1; p=quarantine; rua=mailto:dmarc@tudominio.com'
      ]
    })
  }

  // ─── IPv6 Support (NEW) ───
  const ipv6Support = records.aaaa.length > 0
  if (!ipv6Support) {
    issues.push({
      id: 'domain_no_ipv6',
      category: 'domain',
      severity: 'info',
      title: 'Sin soporte IPv6 (registro AAAA)',
      description: 'El dominio solo es accesible mediante IPv4. IPv6 mejora la conectividad y preparación para el futuro.',
      impact: 'low',
      effort: 'medium',
      steps: ['Configura un registro AAAA en tu DNS apuntando a la dirección IPv6 de tu servidor.']
    })
  }

  // ─── Reverse DNS (NEW) ───
  const reverseDns: Array<{ ip: string; hostname: string | null }> = []
  for (const ip of records.a.slice(0, 3)) {
    try {
      const hostnames = await dns.reverse(ip)
      reverseDns.push({ ip, hostname: hostnames[0] || null })
    } catch {
      reverseDns.push({ ip, hostname: null })
    }
  }

  // ─── WHOIS Lookup (NEW) ───
  let whois: WhoisInfo = { registrar: null, createdDate: null, expiryDate: null, daysUntilExpiry: null }
  try {
    const whoisJson = await import('whois-json')
    const whoisLookup = whoisJson.default || whoisJson
    const result = await whoisLookup(cleanDomain)
    if (result) {
      const data = Array.isArray(result) ? result[0] : result
      whois = {
        registrar: data.registrar || data.registrarName || null,
        createdDate: data.creationDate || data.createdDate || data.registrationDate || null,
        expiryDate: data.registrarRegistrationExpirationDate || data.expiryDate || data.registryExpiryDate || null,
        daysUntilExpiry: null
      }

      // Calculate days until expiry
      if (whois.expiryDate) {
        try {
          const expiryDate = new Date(whois.expiryDate)
          if (!isNaN(expiryDate.getTime())) {
            const now = new Date()
            whois.daysUntilExpiry = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (whois.daysUntilExpiry < 30) {
              score -= 15
              issues.push({
                id: 'domain_expiring_soon',
                category: 'domain',
                severity: 'critical',
                title: `El dominio expira en ${whois.daysUntilExpiry} días`,
                description: 'Si el dominio expira, el sitio web dejará de ser accesible y podría ser registrado por terceros.',
                impact: 'high',
                effort: 'low',
                steps: ['Renueva el dominio inmediatamente con tu registrador.']
              })
            } else if (whois.daysUntilExpiry < 90) {
              score -= 5
              issues.push({
                id: 'domain_expiring_warning',
                category: 'domain',
                severity: 'warning',
                title: `El dominio expira en ${whois.daysUntilExpiry} días`,
                description: 'Considera renovar el dominio pronto para evitar interrupciones.',
                impact: 'medium',
                effort: 'low',
                steps: ['Renueva el dominio y activa la renovación automática.']
              })
            }
          }
        } catch {
          // Invalid date format
        }
      }
    }
  } catch {
    // WHOIS lookup failed (network, unsupported TLD, etc.)
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    domain: cleanDomain,
    records,
    whois,
    dmarc: { found: dmarcFound, record: dmarcRecord },
    ipv6Support,
    reverseDns,
    issues
  }
}
