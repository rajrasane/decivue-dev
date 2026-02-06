'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Decision } from '@/types/decision'

interface EditDecisionModalProps {
    decision: Decision
    onClose: () => void
    onSuccess: () => void
}

export function EditDecisionModal({ decision, onClose, onSuccess }: EditDecisionModalProps) {
    const [statement, setStatement] = useState(decision.statement)
    const [confidence, setConfidence] = useState(decision.initial_confidence)
    const [risk, setRisk] = useState<Decision['perceived_risk']>(decision.perceived_risk)
    const [assumptions, setAssumptions] = useState<string[]>(
        decision.logic.length > 0 ? decision.logic : ['']
    )
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

    const addAssumption = () => setAssumptions([...assumptions, ''])

    const updateAssumption = (index: number, value: string) => {
        const updated = [...assumptions]
        updated[index] = value
        setAssumptions(updated)
    }

    const removeAssumption = (index: number) => {
        setAssumptions(assumptions.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!statement.trim()) return

        setIsSubmitting(true)

        const filteredAssumptions = assumptions.filter(a => a.trim())

        // Determine what changed for the summary
        const changes: string[] = []
        if (statement !== decision.statement) changes.push('statement')
        if (confidence !== decision.initial_confidence) changes.push('confidence')
        if (risk !== decision.perceived_risk) changes.push('risk level')
        if (JSON.stringify(filteredAssumptions) !== JSON.stringify(decision.logic)) {
            const added = filteredAssumptions.filter(a => !decision.logic.includes(a))
            const removed = decision.logic.filter(a => !filteredAssumptions.includes(a))

            if (added.length > 0) changes.push(`added ${added.length} assumption${added.length > 1 ? 's' : ''}`)
            if (removed.length > 0) changes.push(`removed ${removed.length} assumption${removed.length > 1 ? 's' : ''}`)

            // If just editing text (same count but different content implies modification)
            if (added.length === 0 && removed.length === 0) {
                changes.push('modified assumptions')
            }
        }

        const changeSummary = changes.length > 0
            ? `Updated ${changes.join(', ')}`
            : 'Reviewed without changes'

        try {
            // Create history entry first
            await supabase.from('decision_history').insert({
                decision_id: decision.id,
                action_type: 'edited',
                previous_state: {
                    statement: decision.statement,
                    initial_confidence: decision.initial_confidence,
                    perceived_risk: decision.perceived_risk,
                    logic: decision.logic,
                },
                new_state: {
                    statement: statement.trim(),
                    initial_confidence: confidence,
                    perceived_risk: risk,
                    logic: filteredAssumptions,
                },
                change_summary: changeSummary,
            })

            // Update the decision
            const { error } = await supabase
                .from('decisions')
                .update({
                    statement: statement.trim(),
                    initial_confidence: confidence,
                    perceived_risk: risk,
                    logic: filteredAssumptions,
                    last_reviewed_at: new Date().toISOString(),
                })
                .eq('id', decision.id)

            if (error) throw error

            onSuccess()
        } catch (error) {
            console.error('Error updating decision:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Check if there are actual changes
    const hasChanges = (() => {
        const filteredCurrentAssumptions = assumptions.filter(a => a.trim())
        // Simple JSON comparison for arrays works here as order matters
        return (
            statement.trim() !== decision.statement ||
            confidence !== decision.initial_confidence ||
            risk !== decision.perceived_risk ||
            JSON.stringify(filteredCurrentAssumptions) !== JSON.stringify(decision.logic)
        )
    })()

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-(--bg-card) rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Header - matches CreateDecisionForm */}
                <div className="flex items-center justify-between p-6 border-b border-(--bg-secondary)">
                    <h2 className="text-xl font-semibold">Revise Decision</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close form"
                        className="p-2 rounded-lg hover:bg-(--bg-secondary) transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Statement */}
                    <div>
                        <label htmlFor="edit-statement" className="block text-sm font-medium text-(--text-secondary) mb-2">
                            Decision Statement
                        </label>
                        <textarea
                            id="edit-statement"
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                            placeholder="What decision was made?…"
                            autoComplete="off"
                            className="w-full px-4 py-3 rounded-xl bg-(--bg-secondary) border border-transparent 
                focus:border-white focus:outline-none focus:ring-0 resize-none text-foreground
                placeholder:text-(--text-muted)"
                            rows={3}
                            required
                        />
                    </div>

                    {/* Confidence slider */}
                    <div>
                        <label htmlFor="edit-confidence" className="block text-sm font-medium text-(--text-secondary) mb-2">
                            Confidence Level: <span className="text-white">{confidence}%</span>
                        </label>
                        <input
                            id="edit-confidence"
                            type="range"
                            min="0"
                            max="100"
                            value={confidence}
                            onChange={(e) => setConfidence(Number(e.target.value))}
                            className="w-full accent-white"
                        />
                        <div className="flex justify-between text-xs text-(--text-muted) mt-1">
                            <span>0% Uncertain</span>
                            <span>100% Certain</span>
                        </div>
                    </div>

                    {/* Risk level */}
                    <div>
                        <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                            Perceived Risk
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setRisk(level)}
                                    className={`
                    py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all
                    ${risk === level
                                            ? level === 'low' ? 'bg-emerald-500/90 text-white'
                                                : level === 'medium' ? 'bg-amber-500/90 text-white'
                                                    : level === 'high' ? 'bg-orange-500/90 text-white'
                                                        : 'bg-red-500/90 text-white'
                                            : 'bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-card-hover)'
                                        }
                  `}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assumptions */}
                    <div>
                        <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                            Key Assumptions
                        </label>
                        <div className="space-y-2">
                            {assumptions.map((assumption, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={assumption}
                                        onChange={(e) => updateAssumption(index, e.target.value)}
                                        placeholder={`Assumption ${index + 1}`}
                                        className="flex-1 px-4 py-2 rounded-lg bg-(--bg-secondary) border border-transparent 
                      focus:border-white focus:outline-none text-foreground
                      placeholder:text-(--text-muted)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAssumption(index)}
                                        aria-label={`Remove assumption ${index + 1}`}
                                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addAssumption}
                                className="flex items-center gap-2 text-sm text-white hover:underline"
                            >
                                <Plus size={16} /> Add assumption
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !statement.trim() || !hasChanges}
                        className="w-auto px-8 py-2 rounded-xl bg-white hover:bg-gray-200 block mx-auto
              text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saving changes…
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
