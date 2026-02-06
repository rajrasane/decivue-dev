'use client'

import { DecisionSignal } from '@/types/decision'
import { AlertTriangle, X } from 'lucide-react'
import { format } from 'date-fns'

interface SignalsSectionProps {
    signals: DecisionSignal[]
    onDismiss: (signal: DecisionSignal) => void
}

export function SignalsSection({ signals, onDismiss }: SignalsSectionProps) {
    if (signals.length === 0) return null

    return (
        <section className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-6" aria-labelledby="signals-heading">
            <h2 id="signals-heading" className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-400">
                <AlertTriangle size={18} aria-hidden="true" />
                Signals ({signals.length})
            </h2>
            <div className="space-y-3">
                {signals.map((signal) => (
                    <article key={signal.id} className="p-4 rounded-lg bg-(--bg-card) border border-amber-500/20 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest leading-none mb-1">
                                    {signal.signal_type.replace('_', ' ')}
                                </span>
                                <span className="text-sm text-(--text-secondary) leading-snug">
                                    {signal.description}
                                </span>
                            </div>
                            <span className="text-[10px] text-(--text-muted) whitespace-nowrap pt-3">
                                {format(new Date(signal.created_at), 'MMM d')}
                            </span>
                        </div>
                        <button
                            onClick={() => onDismiss(signal)}
                            className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500/60 hover:text-amber-500 transition-colors shrink-0"
                            aria-label={`Dismiss signal: ${signal.description}`}
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    </article>
                ))}
            </div>
        </section>
    )
}
