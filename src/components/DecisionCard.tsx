'use client'

import { useRouter } from 'next/navigation'
import { Decision } from '@/types/decision'
import { ConfidenceGauge } from './ConfidenceGauge'
import {
    calculateCurrentConfidence,
    determineLifecycleState,
    generateInsight
} from '@/lib/decision-intelligence'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Clock, GitCompare, MessageSquare } from 'lucide-react'

interface DecisionCardProps {
    decision: Decision
    signalsCount?: number
    conflictsCount?: number
    onClick?: () => void
}

const stateLabels = {
    fresh: 'Fresh',
    stable: 'Stable',
    at_risk: 'At Risk',
    stale: 'Stale',
    invalidated: 'Invalidated',
}

const stateColors = {
    fresh: 'bg-green-500/20 text-green-400 border-green-500/30',
    stable: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    at_risk: 'bg-red-500/20 text-red-400 border-red-500/30',
    stale: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    invalidated: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
}

export function DecisionCard({
    decision,
    signalsCount = 0,
    conflictsCount = 0,
    onClick
}: DecisionCardProps) {
    const router = useRouter()
    const currentConfidence = calculateCurrentConfidence(decision)
    const daysSinceReview = differenceInDays(new Date(), new Date(decision.last_reviewed_at))
    const lifecycleState = determineLifecycleState(currentConfidence, daysSinceReview)
    const insight = generateInsight(decision, currentConfidence, signalsCount, conflictsCount)

    const cardClass = lifecycleState === 'at_risk'
        ? 'card-at-risk pulse-risk'
        : `card-${lifecycleState}`

    const handleClick = () => {
        if (onClick) onClick()
        router.push(`/decision/${decision.id}`)
    }

    return (
        <div
            onClick={handleClick}
            className={`
        relative p-6 rounded-2xl border cursor-pointer
        bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]
        transition-all duration-300 ${cardClass}
      `}
        >
            <div className="flex gap-6">
                {/* Confidence Gauge */}
                <div className="flex-shrink-0">
                    <ConfidenceGauge value={currentConfidence} size="md" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header with state badge */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] line-clamp-2">
                            {decision.statement}
                        </h3>
                        <span className={`
              px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
              border ${stateColors[lifecycleState]}
            `}>
                            {stateLabels[lifecycleState]}
                        </span>
                    </div>

                    {/* Insight message */}
                    <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                        {insight}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>
                                {daysSinceReview === 0
                                    ? 'Reviewed today'
                                    : `${daysSinceReview}d since review`}
                            </span>
                        </div>

                        {signalsCount > 0 && (
                            <div className="flex items-center gap-1.5 text-amber-400">
                                <AlertTriangle size={14} />
                                <span>{signalsCount} signal{signalsCount > 1 ? 's' : ''}</span>
                            </div>
                        )}

                        {conflictsCount > 0 && (
                            <div className="flex items-center gap-1.5 text-red-400">
                                <GitCompare size={14} />
                                <span>{conflictsCount} conflict{conflictsCount > 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>

                    {/* Assumptions preview */}
                    {decision.logic.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {decision.logic.slice(0, 3).map((assumption, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]"
                                >
                                    {assumption}
                                </span>
                            ))}
                            {decision.logic.length > 3 && (
                                <span className="px-2 py-0.5 text-xs text-[var(--text-muted)]">
                                    +{decision.logic.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
