import { Decision, DecisionSignal, DecisionConflict } from '@/types/decision'
import { differenceInDays } from 'date-fns'

// Decay rates: low 0.5%, medium 1%, high 2%, critical 3% per day
const DECAY_RATES = {
    low: 0.5,
    medium: 1,
    high: 2,
    critical: 3,
}

// Confidence penalties for structural issues
const SIGNAL_PENALTY = 5      // Each active signal reduces confidence by 5%
const CONFLICT_PENALTY = 10   // Each active conflict reduces confidence by 10%

// Human-readable labels for signal types
const SIGNAL_TYPE_LABELS: Record<DecisionSignal['signal_type'], string> = {
    aging: 'time-based decay',
    external_change: 'an external change',
    assumption_broken: 'a broken assumption',
    team_feedback: 'team feedback',
}

/**
 * Calculates the current confidence of a decision.
 * 
 * Confidence is affected by:
 * 1. Time decay - based on days since last review and perceived risk
 * 2. Signal penalties - each signal reduces confidence (structural issue)
 * 3. Conflict penalties - each conflict reduces confidence (structural issue)
 * 
 * When a user "Reaffirms", only time decay is reset (last_reviewed_at updated).
 * Signal/conflict penalties persist until those issues are resolved.
 */
export function calculateCurrentConfidence(
    decision: Decision,
    signalsCount: number = 0,
    conflictsCount: number = 0
): number {
    const daysSinceReview = differenceInDays(
        new Date(),
        new Date(decision.last_reviewed_at)
    )

    // Time-based decay (can be reset by reaffirming)
    const timeDecay = daysSinceReview * DECAY_RATES[decision.perceived_risk]
    
    // Structural penalties (cannot be reset by reaffirming - must resolve the issues)
    const signalPenalty = signalsCount * SIGNAL_PENALTY
    const conflictPenalty = conflictsCount * CONFLICT_PENALTY
    
    const totalDeduction = timeDecay + signalPenalty + conflictPenalty
    const confidence = decision.initial_confidence - totalDeduction

    return Math.max(0, Math.round(confidence))
}

/**
 * Determines the lifecycle state of a decision.
 * 
 * States reflect overall health combining confidence, time, and issues:
 * - fresh: High confidence (≥80%), recently reviewed, no unresolved issues
 * - stable: Good confidence (≥60%), minor issues only
 * - at_risk: Needs attention - multiple issues or confidence dropping
 * - stale: Significantly degraded, requires action
 * - invalidated: Confidence critically low, decision no longer reliable
 */
export function determineLifecycleState(
    currentConfidence: number,
    daysSinceReview: number,
    signalsCount: number = 0,
    conflictsCount: number = 0
): Decision['lifecycle_state'] {
    // Confidence below threshold = invalidated
    if (currentConfidence < 15) return 'invalidated'
    
    // Very low confidence or very stale = stale
    if (currentConfidence < 40 || daysSinceReview > 60) return 'stale'

    // Count total issues - conflicts are weighted more heavily
    const issueScore = signalsCount + (conflictsCount * 2)

    // Too many issues = at_risk regardless of confidence
    // (3+ signals, or 2+ conflicts, or combination)
    if (issueScore >= 3) return 'at_risk'

    // Fresh requires: high confidence, recent review, AND no issues
    if (issueScore === 0 && daysSinceReview <= 7 && currentConfidence >= 80) {
        return 'fresh'
    }

    // Stable: good confidence with minor issues (1-2 signals or 1 conflict)
    if (currentConfidence >= 60 && daysSinceReview <= 30) {
        return 'stable'
    }
    
    return 'at_risk'
}

/**
 * Context for generating insights - includes actual signal/conflict data for richer messages
 */
export type InsightContext = {
    decision: Decision
    currentConfidence: number
    signals?: DecisionSignal[]
    conflicts?: DecisionConflict[]
    conflictingDecisionStatements?: string[] // Statements of decisions that conflict with this one
}

/**
 * Generates a context-aware insight message for a decision.
 * 
 * Instead of generic count-based messages, this function examines the actual
 * signals and conflicts to provide specific, actionable guidance.
 */
export function generateInsight(context: InsightContext): string
export function generateInsight(
    decision: Decision,
    currentConfidence: number,
    signalsCount: number,
    conflictsCount: number
): string
export function generateInsight(
    decisionOrContext: Decision | InsightContext,
    currentConfidence?: number,
    signalsCount?: number,
    conflictsCount?: number
): string {
    // Handle both old signature (backward compatibility) and new context-based signature
    const isContext = isInsightContext(decisionOrContext)
    
    const decision = isContext ? decisionOrContext.decision : decisionOrContext
    const confidence = isContext ? decisionOrContext.currentConfidence : currentConfidence!
    const signals = isContext ? (decisionOrContext.signals ?? []) : []
    const conflicts = isContext ? (decisionOrContext.conflicts ?? []) : []
    const conflictStatements = isContext ? (decisionOrContext.conflictingDecisionStatements ?? []) : []
    
    // Use actual array lengths when available, otherwise fall back to passed counts
    const effectiveSignalsCount = signals.length > 0 ? signals.length : (signalsCount ?? 0)
    const effectiveConflictsCount = conflicts.length > 0 ? conflicts.length : (conflictsCount ?? 0)

    const daysSinceReview = differenceInDays(
        new Date(),
        new Date(decision.last_reviewed_at)
    )

    // Determine the primary issue and return a focused insight
    
    // 1. Critical confidence - highest priority
    if (confidence < 40) {
        return `Confidence critically low at ${confidence}%. Revise with updated assumptions.`
    }

    // 2. Has conflicts - needs resolution
    if (effectiveConflictsCount > 0) {
        // If we have detailed data, show the specific conflict
        if (conflictStatements.length > 0) {
            return `Conflicts with "${truncate(conflictStatements[0], 50)}". Review and revise to resolve.`
        }
        // Otherwise show generic conflict message
        return `${effectiveConflictsCount} conflict${effectiveConflictsCount > 1 ? 's' : ''} detected. Review and revise to resolve.`
    }

    // 3. Has signals - external factors detected
    if (effectiveSignalsCount > 0) {
        // If we have detailed data, show the specific signal
        if (signals.length > 0) {
            const recentSignal = getMostRecentSignal(signals)
            const signalDesc = recentSignal.description
                ? truncate(recentSignal.description, 60)
                : SIGNAL_TYPE_LABELS[recentSignal.signal_type]
            const moreText = signals.length > 1 ? ` (+${signals.length - 1} more)` : ''
            return `${signalDesc}${moreText}. Review and revise if needed.`
        }
        // Otherwise show generic signal message
        return `${effectiveSignalsCount} signal${effectiveSignalsCount > 1 ? 's' : ''} detected. Review and revise if needed.`
    }

    // 4. Aging without review
    if (daysSinceReview > 14) {
        return `Not reviewed in ${daysSinceReview} days. Reaffirm or revise.`
    }

    // 5. Moderate decay
    if (confidence < 60) {
        return `Confidence at ${confidence}%. Reaffirm to reset freshness.`
    }

    // All good
    return `Decision is ${confidence}% confident and stable. No action needed.`
}

// Helper functions

function isInsightContext(value: unknown): value is InsightContext {
    return (
        typeof value === 'object' &&
        value !== null &&
        'decision' in value &&
        'currentConfidence' in value
    )
}

function getMostRecentSignal(signals: DecisionSignal[]): DecisionSignal {
    return signals.reduce((latest, signal) =>
        new Date(signal.created_at) > new Date(latest.created_at) ? signal : latest
    )
}

function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
}
