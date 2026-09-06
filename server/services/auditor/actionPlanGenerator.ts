import type { ActionPlanItem } from './types'

export interface ActionPlanGeneratorInput {
  seoScore: number
  performanceScore: number
  securityScore: number
  domainScore: number
  accessibilityScore?: number
  linkCheckScore?: number
  seoIssues?: ActionPlanItem[]
  performanceIssues?: ActionPlanItem[]
  securityIssues?: ActionPlanItem[]
  domainIssues?: ActionPlanItem[]
  accessibilityIssues?: ActionPlanItem[]
  linkCheckIssues?: ActionPlanItem[]
}

export function generateActionPlan(input: ActionPlanGeneratorInput): ActionPlanItem[] {
  const allIssues: ActionPlanItem[] = [
    ...(input.securityIssues || []),
    ...(input.accessibilityIssues || []),
    ...(input.seoIssues || []),
    ...(input.performanceIssues || []),
    ...(input.domainIssues || []),
    ...(input.linkCheckIssues || [])
  ]

  // Deduplicate by ID
  const seenIds = new Set<string>()
  const uniqueIssues: ActionPlanItem[] = []

  for (const item of allIssues) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id)
      uniqueIssues.push(item)
    }
  }

  // Sorting priority:
  // 1. Severity: critical > warning > info
  // 2. Quick wins: high impact + low effort first
  const severityRank: Record<string, number> = {
    critical: 3,
    warning: 2,
    info: 1
  }

  const impactRank: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1
  }

  const effortRank: Record<string, number> = {
    low: 3,     // Lowest effort is highest priority for quick wins
    medium: 2,
    high: 1
  }

  return uniqueIssues.sort((a, b) => {
    const sevDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
    if (sevDiff !== 0) return sevDiff

    const impactDiff = (impactRank[b.impact] || 0) - (impactRank[a.impact] || 0)
    if (impactDiff !== 0) return impactDiff

    return (effortRank[b.effort] || 0) - (effortRank[a.effort] || 0)
  })
}
