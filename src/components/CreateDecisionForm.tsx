'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CreateDecisionFormProps {
    onClose: () => void
    onSuccess: () => void
}

export function CreateDecisionForm({ onClose, onSuccess }: CreateDecisionFormProps) {
    const [statement, setStatement] = useState('')
    const [confidence, setConfidence] = useState(85)
    const [risk, setRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
    const [assumptions, setAssumptions] = useState<string[]>([''])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [conflictWarning, setConflictWarning] = useState<string | null>(null)

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
        setConflictWarning(null)

        const filteredAssumptions = assumptions.filter(a => a.trim())

        try {
            // Check for conflicts using Gemini
            const conflictRes = await fetch('/api/detect-conflicts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newDecisionStatement: statement,
                    newDecisionLogic: filteredAssumptions,
                }),
            })

            const { conflicts } = await conflictRes.json()

            // Insert decision
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

            // If conflicts detected, save them
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-(--bg-card) rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-(--bg-secondary)">
                    <h2 className="text-xl font-semibold">New Decision</h2>
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

                    {/* Confidence slider */}
                    <div>
                        <label htmlFor="confidence-slider" className="block text-sm font-medium text-(--text-secondary) mb-2">
                            Initial Confidence: <span className="text-white">{confidence}%</span>
                        </label>
                        <input
                            id="confidence-slider"
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

                    {/* Conflict warning */}
                    {conflictWarning && (
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                            ⚠️ {conflictWarning}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !statement.trim()}
                        className="w-auto px-8 py-2 rounded-xl bg-white hover:bg-gray-200 block mx-auto
              text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
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
                </form>
            </div >
        </div >
    )
}
