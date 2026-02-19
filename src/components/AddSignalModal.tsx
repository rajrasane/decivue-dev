'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DecisionSignal } from '@/types/decision'
import { Spinner } from '@/components/Spinner'

interface AddSignalModalProps {
    decisionId: string
    onClose: () => void
    onSuccess: () => void
}

export function AddSignalModal({
    decisionId,
    onClose,
    onSuccess,
}: AddSignalModalProps) {
    const [signalType, setSignalType] = useState<DecisionSignal['signal_type']>('external_change')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const supabase = createClient()

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description.trim()) return

        setIsSubmitting(true)

        await supabase.from('decision_signals').insert({
            decision_id: decisionId,
            signal_type: signalType,
            description: description.trim(),
        })

        // Create history entry for the signal
        const typeLabel = signalType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        await supabase.from('decision_history').insert({
            decision_id: decisionId,
            action_type: 'signal_added',
            previous_state: null,
            new_state: { signal_type: signalType, description: description.trim() },
            change_summary: `Signal added: ${typeLabel} - ${description.trim()}`,
        })

        onSuccess()
    }

    return (
        <div className="fixed inset-0 bg-[var(--overlay)] flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md
                max-h-[82vh] sm:max-h-[85vh] flex flex-col overflow-hidden
                border border-[var(--border)] shadow-2xl">

                {/* Fixed Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border)] shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold">Add Signal</h2>
                        <p className="text-xs text-(--text-muted) mt-0.5">Flag a change that may affect this decision</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-(--text-muted) hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto scrollbar-thin px-5 sm:px-6 py-5">
                    <form id="add-signal-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="signal-type" className="block text-sm font-medium text-(--text-secondary) mb-2">
                                Signal Type
                            </label>
                            <div className="relative">
                                <select
                                    id="signal-type"
                                    value={signalType}
                                    onChange={(e) => setSignalType(e.target.value as DecisionSignal['signal_type'])}
                                    className="w-full px-4 py-3 rounded-xl bg-(--bg-secondary) text-foreground
                                        border border-transparent focus:border-[var(--text-muted)] focus:outline-none appearance-none cursor-pointer"
                                >
                                    <option value="external_change">External Change</option>
                                    <option value="assumption_broken">Assumption Broken</option>
                                    <option value="team_feedback">Team Feedback</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="signal-description" className="block text-sm font-medium text-(--text-secondary) mb-2">
                                Description
                            </label>
                            <textarea
                                id="signal-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What changed or happened?…"
                                autoComplete="off"
                                className="w-full px-4 py-3 rounded-lg bg-(--bg-secondary) border border-transparent 
                                    focus:border-[var(--text-muted)] focus:outline-none resize-none text-foreground
                                    placeholder:text-(--text-muted)"
                                rows={3}
                                required
                            />
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="border-t border-[var(--border)] shrink-0 px-5 sm:px-6 py-4">
                    <button
                        type="submit"
                        form="add-signal-form"
                        disabled={isSubmitting || !description.trim()}
                        className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] border border-[var(--border)]
                            text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <Spinner size={20} color="white" />
                                <span>Adding…</span>
                            </div>
                        ) : 'Add Signal'}
                    </button>
                </div>
            </div>
        </div>
    )
}
