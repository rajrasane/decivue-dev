'use client'

import { Decision } from '@/types/decision'
import { Clock, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

interface DecisionDetailsProps {
    decision: Decision
}

export function DecisionDetails({ decision }: DecisionDetailsProps) {
    return (
        <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-(--bg-card) rounded-xl p-6" aria-labelledby="assumptions-heading">
                <h2 id="assumptions-heading" className="text-lg font-semibold mb-4">Key Assumptions</h2>
                {decision.logic.length > 0 ? (
                    <ul className="space-y-2">
                        {decision.logic.map((assumption, i) => (
                            <li key={i} className="flex items-start gap-2 text-(--text-secondary)">
                                <span className="text-(--accent)" aria-hidden="true">•</span>
                                {assumption}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-(--text-muted)">No assumptions recorded</p>
                )}
            </section>

            <section className="bg-(--bg-card) rounded-xl p-6" aria-labelledby="timeline-heading">
                <h2 id="timeline-heading" className="text-lg font-semibold mb-4">Timeline</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <Clock size={16} className="text-(--text-muted)" aria-hidden="true" />
                        <span className="text-(--text-muted)">Created:</span>
                        <time dateTime={decision.created_at}>{format(new Date(decision.created_at), 'MMM d, yyyy')}</time>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <RefreshCw size={16} className="text-(--text-muted)" aria-hidden="true" />
                        <span className="text-(--text-muted)">Last reviewed:</span>
                        <time dateTime={decision.last_reviewed_at}>{format(new Date(decision.last_reviewed_at), 'MMM d, yyyy')}</time>
                    </div>
                </div>
            </section>
        </div>
    )
}
