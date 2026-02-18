'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ConfidenceSlider } from '@/components/ConfidenceSlider'

interface CreateDecisionModalProps {
    onClose: () => void
    onSuccess: () => void
}

export function CreateDecisionModal({ onClose, onSuccess }: CreateDecisionModalProps) {
    const [statement, setStatement] = useState('')
    const [confidence, setConfidence] = useState(85)
    const [risk, setRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
    const [assumptions, setAssumptions] = useState<string[]>([''])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [conflictWarning, setConflictWarning] = useState<string | null>(null)

    const supabase = createClient()

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
        setConflictWarning(null)

        const filteredAssumptions = assumptions.filter(a => a.trim())

        try {
            const conflictRes = await fetch('/api/detect-conflicts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newDecisionStatement: statement,
                    newDecisionLogic: filteredAssumptions,
                }),
            })

            const { conflicts } = await conflictRes.json()

            const { data: newDecision, error } = await supabase
                .from('decisions')
                .insert({
                    statement: statement.trim(),
                    initial_confidence: confidence,
                    logic: filteredAssumptions,
                    perceived_risk: risk,
                })
                .select()
                .single()

            if (error) throw error

            if (conflicts && conflicts.length > 0) {
                for (const conflict of conflicts) {
                    await supabase.from('decision_conflicts').insert({
                        decision_a: newDecision.id,
                        decision_b: conflict.decision_id,
                        conflict_explanation: conflict.explanation,
                    })
                }
                setConflictWarning(`${conflicts.length} potential conflict(s) detected with existing decisions.`)
            }

            onSuccess()
        } catch (error) {
            console.error('Error creating decision:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-linear-to-b from-[#1a1a1a] to-[#141414] rounded-2xl w-full max-w-lg
                h-[82vh] sm:h-[85vh] lg:h-[90vh] flex flex-col overflow-hidden
                border border-white/5 shadow-2xl shadow-black/50">

                {/* Fixed Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/5 shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold">New Decision</h2>
                        <p className="text-xs sm:text-sm text-(--text-muted) mt-0.5">Document a decision to track over time</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close form"
                        className="p-2 rounded-lg hover:bg-white/5 text-(--text-muted) hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col">
                    {/* Scroll container */}
                    <div className="flex-1 min-h-0 relative">
                        <div className="absolute inset-0 overflow-y-auto scrollbar-thin px-5 sm:px-6 py-5">
                            <form id="create-decision-form" onSubmit={handleSubmit} className="space-y-0">
                                {/* Statement */}
                                <div>
                                    <label htmlFor="decision-statement" className="block text-sm font-medium text-(--text-secondary) mb-2">
                                        Decision Statement
                                    </label>
                                    <textarea
                                        id="decision-statement"
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

                                <div className="border-t border-white/[0.05] my-5 -mx-5 sm:-mx-6" />

                                {/* Confidence slider */}
                                <div>
                                    <ConfidenceSlider
                                        id="confidence-slider"
                                        value={confidence}
                                        onChange={setConfidence}
                                    />
                                </div>

                                <div className="border-t border-white/[0.05] my-5 -mx-5 sm:-mx-6" />

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
                                                    py-2 px-3 rounded-lg text-xs sm:text-sm font-medium capitalize transition-colors
                                                    outline-none focus-visible:outline-none
                                                    ${risk === level
                                                        ? level === 'low' ? 'bg-emerald-500/90 text-white'
                                                            : level === 'medium' ? 'bg-amber-500/90 text-white'
                                                                : level === 'high' ? 'bg-orange-500/90 text-white'
                                                                    : 'bg-red-500/90 text-white'
                                                        : 'bg-white/[0.06] text-(--text-secondary) hover:bg-white/[0.1]'
                                                    }
                                                `}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/[0.05] my-5 -mx-5 sm:-mx-6" />

                                {/* Assumptions */}
                                <div>
                                    <label className="block text-sm font-medium text-(--text-secondary) mb-2">
                                        Key Assumptions
                                    </label>
                                    <div className="space-y-2">
                                        {assumptions.map((assumption, index) => (
                                            <div key={index} className="flex gap-2 group/assumption">
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
                                                    className="p-1.5 rounded-md text-(--text-muted) hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addAssumption}
                                            className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.1] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-white/20 hover:text-white cursor-pointer"
                                        >
                                            <Plus size={14} /> Add assumption
                                        </button>
                                    </div>
                                </div>

                                {/* Conflict warning */}
                                {conflictWarning && (
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-3">
                                        <span className="text-lg">⚠️</span>
                                        <span>{conflictWarning}</span>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <div className="border-t border-white/5 shrink-0 px-5 sm:px-6 py-4">
                        <button
                            type="submit"
                            form="create-decision-form"
                            disabled={isSubmitting || !statement.trim()}
                            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10
                                text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
                                flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Checking for conflicts…
                                </>
                            ) : (
                                'Create Decision'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
