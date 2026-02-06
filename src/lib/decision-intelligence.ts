import { Decision } from '@/types/decision'
import { differenceInDays } from 'date-fns'

/**
 * Calculate current confidence based on time decay
 * Formula: initial_confidence - (days_old × decay_rate)
 * 
 * Decay rates based on risk:
 * - low: 0.5% per day
 * - medium: 1% per day
 * - high: 2% per day
 * - critical: 3% per day
 */
export function calculateCurrentConfidence(decision: Decision): number {
    const daysSinceReview = differenceInDays(
        new Date(),
        new Date(decision.last_reviewed_at)
    )

    const decayRates = {
        low: 0.5,
        medium: 1,
        high: 2,
        critical: 3,
    }

    const decayRate = decayRates[decision.perceived_risk]
    const decayAmount = daysSinceReview * decayRate

    const currentConfidence = Math.max(
        0,
        decision.initial_confidence - decayAmount
    )

    return Math.round(currentConfidence)
}

/**
 * Determine lifecycle state based on current confidence AND time
 * - Fresh: Recently reviewed (within 7 days) AND confidence >= 70%
 * - Stable: Reviewed within 14 days AND confidence >= 50%
 * - At Risk: Confidence 30-49% OR reviewed 14-30 days ago
 * - Stale: Confidence < 30% OR not reviewed in 30+ days
 * - Invalidated: Confidence < 15%
 */
export function determineLifecycleState(
    currentConfidence: number,
    daysSinceReview: number
): Decision['lifecycle_state'] {
    // Invalidated - very low confidence
    if (currentConfidence < 15) return 'invalidated'

    // Fresh - recently reviewed with good confidence
    if (daysSinceReview <= 7 && currentConfidence >= 70) return 'fresh'

    // Stable - reasonably recent with decent confidence
    if (daysSinceReview <= 14 && currentConfidence >= 50) return 'stable'

    // At Risk - starting to age or confidence dropping
    if (currentConfidence >= 30 && daysSinceReview <= 30) return 'at_risk'

    // Stale - old or low confidence
    return 'stale'
}

/**
 * Generate insight message based on decision state
 */
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

    // High priority alerts
    if (currentConfidence < 40) {
        return `Critical: Confidence has dropped to ${currentConfidence}%. This decision urgently needs review.`
    }

    if (conflictsCount > 0) {
        return `Warning: ${conflictsCount} conflicting decision${conflictsCount > 1 ? 's' : ''} detected. Review for potential contradictions.`
    }

    // Medium priority
    if (daysSinceReview > 14) {
        return `Attention: No review in ${daysSinceReview} days. Original assumptions may no longer hold.`
    }

    if (signalsCount > 0) {
        return `${signalsCount} signal${signalsCount > 1 ? 's' : ''} detected. External changes may affect this decision.`
    }

    if (currentConfidence < 60) {
        return `Confidence has decayed to ${currentConfidence}%. Consider reviewing soon.`
    }

    // All good
    return `Decision is ${currentConfidence}% confident and stable.`
}
