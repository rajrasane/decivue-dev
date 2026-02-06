'use client'

import { DecisionConflict, Decision } from '@/types/decision'
import { GitCompare } from 'lucide-react'

interface ConflictsSectionProps {
    conflicts: (DecisionConflict & { other_decision?: Decision })[]
    onDismiss: (id: string) => void
}

export function ConflictsSection({ conflicts, onDismiss }: ConflictsSectionProps) {
    if (conflicts.length === 0) return null

    return (
        <section className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6" aria-labelledby="conflicts-heading">
            <h2 id="conflicts-heading" className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
                <GitCompare size={18} aria-hidden="true" />
                Conflicts Detected ({conflicts.length})
            </h2>
            <p className="text-sm text-(--text-muted) mb-4">
                These decisions may contradict each other. Review and resolve as needed.
            </p>
            <div className="space-y-3">
                {conflicts.map((conflict) => (
                    <article key={conflict.id} className="p-4 rounded-lg bg-(--bg-card) border border-red-500/20">
                        <p className="font-medium text-foreground mb-1">
                            {conflict.other_decision?.statement || 'Unknown decision'}
                        </p>
                        <p className="text-sm text-(--text-secondary) mb-3">
                            {conflict.conflict_explanation}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onDismiss(conflict.id)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-card-hover) transition-colors"
                            >
                                Dismiss (Keep Both)
                            </button>
                            {conflict.other_decision && (
                                <button
                                    onClick={() => window.open(`/decision/${conflict.other_decision!.id}`, '_blank', 'noopener,noreferrer')}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-(--text-muted) text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
                                >
                                    View Other Decision
                                </button>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
