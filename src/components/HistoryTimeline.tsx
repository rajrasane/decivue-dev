'use client'

import { useState } from 'react'
import { DecisionHistory } from '@/types/decision'
import { formatDistanceToNow } from 'date-fns'

interface HistoryTimelineProps {
    history: DecisionHistory[]
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const MAX_ITEMS = 3

    if (history.length === 0) {
        return (
            <p className="text-(--text-muted) text-sm py-4">No changes recorded yet.</p>
        )
    }

    const displayedHistory = isExpanded ? history : history.slice(0, MAX_ITEMS)
    const hasMore = history.length > MAX_ITEMS

    return (
        <div className="relative pl-6">
            {/* Vertical git-style line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-(--bg-secondary)" />

            <div className="space-y-4">
                {displayedHistory.map((entry) => (
                    <div key={entry.id} className="relative">
                        {/* Commit dot */}
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-(--text-muted) bg-(--bg-card)" />

                        {/* Content */}
                        <div>
                            <p className="text-sm text-foreground">
                                {entry.change_summary}
                            </p>
                            <p className="text-xs text-(--text-muted) mt-0.5">
                                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label={isExpanded ? 'Show fewer history entries' : `Show ${history.length - MAX_ITEMS} more history entries`}
                    aria-expanded={isExpanded}
                    className="mt-4 text-xs text-(--text-muted) hover:text-foreground transition-colors flex items-center gap-1"
                >
                    {isExpanded ? 'Show less' : `Show ${history.length - MAX_ITEMS} more changes`}
                </button>
            )}
        </div>
    )
}
