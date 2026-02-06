import { Decision } from '@/types/decision'
import { differenceInDays } from 'date-fns'

// Decay rates: low 0.5%, medium 1%, high 2%, critical 3% per day
const DECAY_RATES = {
    low: 0.5,
    medium: 1,
    high: 2,
    critical: 3,
}

export function calculateCurrentConfidence(decision: Decision): number {
    const daysSinceReview = differenceInDays(
        new Date(),
        new Date(decision.last_reviewed_at)
    )

    const decay = daysSinceReview * DECAY_RATES[decision.perceived_risk]
    const confidence = decision.initial_confidence - decay

    return Math.max(0, Math.round(confidence))
}

export function determineLifecycleState(
    currentConfidence: number,
    daysSinceReview: number
): Decision['lifecycle_state'] {
    if (currentConfidence < 15) return 'invalidated'
    if (daysSinceReview <= 7 && currentConfidence >= 70) return 'fresh'
    if (daysSinceReview <= 14 && currentConfidence >= 50) return 'stable'
    if (currentConfidence >= 15 && daysSinceReview <= 60) return 'at_risk'
    
    return 'stale'
}

export function generateInsight(
    decision: Decision,
    currentConfidence: number,
    signalsCount: number,
    conflictsCount: number
): string {
    const daysSinceReview = differenceInDays(
        new Date(),
        new Date(decision.last_reviewed_at)
    )

    if (currentConfidence < 40) {
        return `Critical: Confidence has dropped to ${currentConfidence}%. Recommended action: Revise this decision with updated assumptions.`
    }

    if (conflictsCount > 0) {
        return `Warning: ${conflictsCount} conflicting decision${conflictsCount > 1 ? 's' : ''} detected. Recommended action: Review for contradictions and consider revising.`
    }

    if (daysSinceReview > 14) {
        return `Attention: No review in ${daysSinceReview} days. Original assumptions may no longer hold. Recommended action: Review and Reaffirm if still valid.`
    }

    if (signalsCount > 0) {
        return `${signalsCount} signal${signalsCount > 1 ? 's' : ''} detected. External changes may affect this decision. Recommended action: Review the signals and Revise if needed.`
    }

    if (currentConfidence < 60) {
        return `Confidence has decayed to ${currentConfidence}%. Recommended action: Reaffirm to reset freshness, or Revise if conditions changed.`
    }

    return `Decision is ${currentConfidence}% confident and stable. No action needed.`
}
