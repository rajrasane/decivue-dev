'use client'

import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Decision } from '@/types/decision'
import { ConfidenceGauge } from './ConfidenceGauge'
import {
    calculateCurrentConfidence,
    determineLifecycleState,
    generateInsight
} from '@/lib/decision-intelligence'
import { differenceInDays } from 'date-fns'
import { AlertTriangle, Clock, GitCompare } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

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

const stateDescriptions = {
    fresh: 'Recently reviewed (<7 days) with high confidence (≥70%)',
    stable: 'Reviewed within 14 days with good confidence (≥50%)',
    at_risk: 'Confidence dropping (<50%) or review overdue (>14 days)',
    stale: 'Low confidence or not reviewed in >30 days',
    invalidated: 'Confidence is critically low (<15%)',
}

const stateColors = {
    fresh: 'bg-(--bg-secondary) text-(--text-secondary) border-white/5',
    stable: 'bg-(--bg-secondary) text-(--text-secondary) border-white/5',
    at_risk: 'bg-(--bg-secondary) text-(--text-secondary) border-white/5',
    stale: 'bg-(--bg-secondary) text-(--text-secondary) border-white/5',
    invalidated: 'bg-(--bg-secondary) text-(--text-secondary) border-white/5',
}

export function DecisionCard({
    decision,
    signalsCount = 0,
    conflictsCount = 0,
    onClick
}: DecisionCardProps) {
    const router = useRouter()
    const currentConfidence = calculateCurrentConfidence(decision, signalsCount, conflictsCount)
    const daysSinceReview = differenceInDays(new Date(), new Date(decision.last_reviewed_at))
    const lifecycleState = determineLifecycleState(currentConfidence, daysSinceReview, signalsCount, conflictsCount)
    const insight = generateInsight(decision, currentConfidence, signalsCount, conflictsCount)

    const handleClick = () => {
        if (onClick) onClick()
        router.push(`/decision/${decision.id}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
        }
    }

    return (
        <article
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View decision: ${decision.statement}`}
            className={cn(
                "relative rounded-2xl border cursor-pointer bg-(--bg-card) hover:bg-(--bg-card-hover) transition-all duration-300 p-4 sm:p-6 mb-2 focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2",
                (lifecycleState === 'at_risk' || lifecycleState === 'invalidated')
                    ? "border-red-500/40 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]"
                    : "border-(--bg-secondary)"
            )}
        >
            <div className="flex gap-4 sm:gap-6">
                {/* Confidence Gauge */}
                <div className="shrink-0 flex flex-col items-center gap-8">
                    <ConfidenceGauge value={currentConfidence} size="md" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className={`
                                sm:hidden px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider
                                border ${stateColors[lifecycleState]} cursor-default
                            `}>
                                {stateLabels[lifecycleState]}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{stateDescriptions[lifecycleState]}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header with state badge */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                            {decision.statement}
                        </h3>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={`
                                    hidden sm:inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                                    border ${stateColors[lifecycleState]} cursor-default
                                `}>
                                    {stateLabels[lifecycleState]}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{stateDescriptions[lifecycleState]}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Insight message */}
                    <p className="text-sm text-(--text-secondary) mb-4 line-clamp-2">
                        {insight}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-x-3 sm:gap-x-4 text-xs text-(--text-muted)">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Clock size={14} />
                            {daysSinceReview === 0
                                ? <>
                                    <span className="sm:hidden">Today</span>
                                    <span className="hidden sm:inline">Reviewed today</span>
                                </>
                                : <>
                                    <span className="sm:hidden">{daysSinceReview}d ago</span>
                                    <span className="hidden sm:inline">{daysSinceReview}d since review</span>
                                </>
                            }
                        </div>

                        {signalsCount > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 shrink-0 text-amber-400">
                                        <AlertTriangle size={14} />
                                        {/* On mobile: hide text if conflicts also exist, show otherwise */}
                                        <span className={conflictsCount > 0 ? 'hidden sm:inline' : ''}>
                                            {signalsCount} signal{signalsCount > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="sm:hidden">
                                    <p>{signalsCount} signal{signalsCount > 1 ? 's' : ''}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {conflictsCount > 0 && (
                            <div className="flex items-center gap-1 shrink-0 text-red-400">
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
                                    className={`
                                        px-2 py-0.5 rounded bg-(--bg-secondary) text-xs text-(--text-muted) truncate 
                                        max-w-37.5 sm:max-w-50
                                        ${i >= 1 ? 'hidden sm:inline-block' : ''}
                                    `}
                                >
                                    {assumption}
                                </span>
                            ))}
                            {/* Mobile "+ more" */}
                            <span className="sm:hidden px-1 py-0.5 text-xs text-(--text-muted)">
                                {decision.logic.length > 1 && `+${decision.logic.length - 1}`}
                            </span>
                            {/* Desktop "+ more" */}
                            <span className="hidden sm:inline px-1 py-0.5 text-xs text-(--text-muted)">
                                {decision.logic.length > 3 && `+${decision.logic.length - 3} more`}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </article>
    )
}
