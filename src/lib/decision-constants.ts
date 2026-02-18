import { Decision } from '@/types/decision'

export type LifecycleState = 'fresh' | 'stable' | 'at_risk' | 'stale' | 'invalidated'

export const stateLabels: Record<LifecycleState, string> = {
    fresh: 'Fresh',
    stable: 'Stable',
    at_risk: 'At Risk',
    stale: 'Stale',
    invalidated: 'Invalidated',
}

export const stateDescriptions: Record<LifecycleState, string> = {
    fresh: 'Recently reviewed (≤7 days) with high confidence (≥80%) and no issues',
    stable: 'Good confidence (≥60%) reviewed within 30 days',
    at_risk: 'Multiple issues (3+ score) or confidence declining',
    stale: 'Low confidence (<40%) or not reviewed in >60 days',
    invalidated: 'Confidence is critically low (<15%)',
}

export const getRiskColor = (risk: Decision['perceived_risk']) => {
    const colors = { low: 'text-green-400', medium: 'text-amber-400', high: 'text-red-400', critical: 'text-red-500' }
    return colors[risk]
}
