'use client'

import { DecisionHistory } from '@/types/decision'
import { formatDistanceToNow } from 'date-fns'

interface HistoryTimelineProps {
    history: DecisionHistory[]
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
    if (history.length === 0) {
        return (
            <p className="text-(--text-muted) text-sm py-4">No changes recorded yet.</p>
        )
    }

    return (
        <div className="relative pl-6">
            {/* Vertical git-style line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-(--bg-secondary)" />

            <div className="space-y-4">
                {history.map((entry, index) => (
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
        </div>
    )
}
