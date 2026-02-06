'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Decision, DecisionSignal, DecisionConflict, DecisionHistory } from '@/types/decision'
import { ConfidenceGauge } from '@/components/ConfidenceGauge'
import { HistoryTimeline } from '@/components/HistoryTimeline'
import {
    calculateCurrentConfidence,
    determineLifecycleState,
    generateInsight,
} from '@/lib/decision-intelligence'
import { differenceInCalendarDays, format } from 'date-fns'
import {
    ArrowLeft,
    Clock,
    AlertTriangle,
    GitCompare,
    RefreshCw,
    Plus,
    CheckCircle,
    X,
    Trash2,
    Pencil,
    Edit2,
    History,
    ChevronDown,
} from 'lucide-react'
import { Spinner } from '@/components/Spinner'

const EditDecisionModal = dynamic(
    () => import('@/components/EditDecisionModal').then(m => ({ default: m.EditDecisionModal })),
    { loading: () => null }
)

const stateLabels = {
    fresh: 'Fresh',
    stable: 'Stable',
    at_risk: 'At Risk',
    stale: 'Stale',
    invalidated: 'Invalidated',
}

const stateColors = {
    fresh: 'bg-green-500/20 text-green-400 border-green-500/30',
    stable: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    at_risk: 'bg-red-500/20 text-red-400 border-red-500/30',
    stale: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    invalidated: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
}

export default function DecisionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [decision, setDecision] = useState<Decision | null>(null)
    const [signals, setSignals] = useState<DecisionSignal[]>([])
    const [conflicts, setConflicts] = useState<(DecisionConflict & { other_decision?: Decision })[]>([])
    const [history, setHistory] = useState<DecisionHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isReaffirming, setIsReaffirming] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showAddSignal, setShowAddSignal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    const [signalToDismiss, setSignalToDismiss] = useState<DecisionSignal | null>(null)
    const [isDismissing, setIsDismissing] = useState(false)

    const supabase = createClient()

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showDeleteConfirm || showAddSignal || showEditModal || signalToDismiss) {
            document.body.classList.add('modal-open')
        } else {
            document.body.classList.remove('modal-open')
        }
        return () => document.body.classList.remove('modal-open')
    }, [showDeleteConfirm, showAddSignal, showEditModal, signalToDismiss])

    const loadDecision = async () => {
        const id = params.id as string

        const { data: decisionData } = await supabase
            .from('decisions')
            .select('*')
            .eq('id', id)
            .single()

        if (decisionData) {
            setDecision(decisionData)

            // Load signals
            const { data: signalsData } = await supabase
                .from('decision_signals')
                .select('*')
                .eq('decision_id', id)
                .order('created_at', { ascending: false })

            setSignals(signalsData || [])

            // Load conflicts
            const { data: conflictsData } = await supabase
                .from('decision_conflicts')
                .select('*')
                .or(`decision_a.eq.${id},decision_b.eq.${id}`)

            if (conflictsData) {
                // Get the other decision details
                const enrichedConflicts = await Promise.all(
                    conflictsData.map(async (conflict) => {
                        const otherId = conflict.decision_a === id ? conflict.decision_b : conflict.decision_a
                        const { data: otherDecision } = await supabase
                            .from('decisions')
                            .select('*')
                            .eq('id', otherId)
                            .single()
                        return { ...conflict, other_decision: otherDecision }
                    })
                )
                setConflicts(enrichedConflicts)
            }

            // Load history
            const { data: historyData } = await supabase
                .from('decision_history')
                .select('*')
                .eq('decision_id', id)
                .order('created_at', { ascending: false })

            setHistory(historyData || [])
        }

        setIsLoading(false)
    }

    useEffect(() => {
        loadDecision()
    }, [params.id])

    const handleReaffirm = async () => {
        if (!decision) return
        setIsReaffirming(true)

        // Reaffirming only updates the timestamp (freshness), verifying the current confidence is still valid.
        // It does NOT artificially boost the score anymore.

        await supabase.from('decision_history').insert({
            decision_id: decision.id,
            action_type: 'reaffirm',
            previous_state: {
                last_reviewed_at: decision.last_reviewed_at,
            },
            new_state: {
                last_reviewed_at: new Date().toISOString(),
            },
            change_summary: `Decision reaffirmed. Freshness confirmed.`,
        })

        await supabase
            .from('decisions')
            .update({
                last_reviewed_at: new Date().toISOString(),
            })
            .eq('id', decision.id)

        await loadDecision()
        setIsReaffirming(false)
    }

    const handleDelete = async () => {
        if (!decision) return

        setIsDeleting(true)

        // Delete related signals and conflicts first
        await supabase.from('decision_signals').delete().eq('decision_id', decision.id)
        await supabase.from('decision_conflicts').delete().or(`decision_a.eq.${decision.id},decision_b.eq.${decision.id}`)
        await supabase.from('decisions').delete().eq('id', decision.id)

        router.push('/')
    }

    const handleDismissSignal = async () => {
        if (!signalToDismiss || !decision || isDismissing) return

        setIsDismissing(true)
        try {
            // Create history entry
            await supabase.from('decision_history').insert({
                decision_id: decision.id,
                action_type: 'signal_dismissed', // Changed from 'signal_added' to 'signal_dismissed' for accuracy
                previous_state: { signal_type: signalToDismiss.signal_type, description: signalToDismiss.description },
                new_state: null,
                change_summary: `Dismissed signal: ${signalToDismiss.description}`,
            })

            // Delete the signal
            await supabase.from('decision_signals').delete().eq('id', signalToDismiss.id)

            setSignalToDismiss(null)
            await loadDecision()
        } catch (error) {
            console.error('Error dismissing signal:', error)
        } finally {
            setIsDismissing(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Spinner size={32} />
            </div>
        )
    }

    if (!decision) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-(--text-muted)">Decision not found</p>
            </div>
        )
    }

    const currentConfidence = calculateCurrentConfidence(decision)
    const daysSinceReview = differenceInCalendarDays(new Date(), new Date(decision.last_reviewed_at))
    const lifecycleState = determineLifecycleState(currentConfidence, daysSinceReview)
    const insight = generateInsight(decision, currentConfidence, signals.length, conflicts.length)
    const daysSinceCreated = differenceInCalendarDays(new Date(), new Date(decision.created_at))

    // Calculate sub-gauges
    const timeHealth = Math.max(0, 100 - daysSinceReview * 5)
    const assumptionHealth = decision.logic.length >= 3 ? 100 : decision.logic.length > 0 ? 75 : 50
    const conflictRisk = conflicts.length > 0 ? Math.max(20, 100 - conflicts.length * 30) : 100

    return (
        <div className="min-h-screen bg-background">


            <main className="max-w-6xl mx-auto px-6 py-8">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-(--text-secondary) hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>
                {/* Hero section with main gauge */}
                <div className="bg-(--bg-card) rounded-2xl p-8 mb-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Main gauge */}
                        <div className="shrink-0">
                            <ConfidenceGauge
                                value={currentConfidence}
                                size="lg"
                                customColor={currentConfidence >= 70 ? 'var(--fresh)' : undefined}
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border ${stateColors[lifecycleState]}`}
                                >
                                    {stateLabels[lifecycleState]}
                                </span>
                                <span className="text-(--text-muted) text-sm">
                                    Risk: {decision.perceived_risk}
                                </span>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold mb-4">{decision.statement}</h1>

                            {/* Insight alert */}
                            <div
                                className={`p-4 rounded-xl mb-4 ${lifecycleState === 'at_risk'
                                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                    : lifecycleState === 'stale'
                                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                        : 'bg-(--bg-secondary) text-(--text-secondary)'
                                    }`}
                            >
                                {insight}
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <button
                                    onClick={handleReaffirm}
                                    disabled={isReaffirming || currentConfidence === 100}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background 
                    hover:bg-white/90 transition-colors disabled:opacity-50 font-medium"
                                >
                                    {isReaffirming ? (
                                        <Spinner size={16} color="var(--bg-primary)" />
                                    ) : (
                                        <CheckCircle size={16} />
                                    )}
                                    Reaffirm
                                </button>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--bg-secondary) text-(--text-secondary) 
                    hover:bg-(--bg-secondary)/80 transition-colors font-medium border border-(--border-primary)"
                                >
                                    <Edit2 size={16} />
                                    Revise
                                </button>

                                <button
                                    onClick={() => setShowAddSignal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 
                    hover:bg-amber-500/20 transition-colors font-medium border border-amber-500/10"
                                >
                                    <Plus size={16} />
                                    Add Signal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conflicts section - prominently placed after hero */}
                {conflicts.length > 0 && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
                            <GitCompare size={18} />
                            Conflicts Detected ({conflicts.length})
                        </h2>
                        <p className="text-sm text-(--text-muted) mb-4">
                            These decisions may contradict each other. Review and resolve as needed.
                        </p>
                        <div className="space-y-3">
                            {conflicts.map((conflict) => (
                                <div
                                    key={conflict.id}
                                    className="p-4 rounded-lg bg-(--bg-card) border border-red-500/20"
                                >
                                    <p className="font-medium text-foreground mb-1">
                                        {conflict.other_decision?.statement || 'Unknown decision'}
                                    </p>
                                    <p className="text-sm text-(--text-secondary) mb-3">
                                        {conflict.conflict_explanation}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                await supabase.from('decision_conflicts').delete().eq('id', conflict.id)
                                                loadDecision()
                                            }}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-card-hover) transition-colors"
                                        >
                                            Dismiss (Keep Both)
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (conflict.other_decision) {
                                                    window.open(`/decision/${conflict.other_decision.id}`, '_blank')
                                                }
                                            }}
                                            className="px-3 py-1.5 text-xs rounded-lg border border-(--text-muted) text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
                                        >
                                            View Other Decision
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sub-gauges row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-(--bg-card) rounded-xl p-4 text-center">
                        <ConfidenceGauge
                            value={timeHealth}
                            size="sm"
                            showLabel={false}
                            customColor={timeHealth >= 70 ? 'var(--text-muted)' : undefined}
                        />
                        <p className="text-sm font-medium mt-2">{timeHealth}%</p>
                        <p className="text-xs text-(--text-muted)">Time Health</p>
                    </div>
                    <div className="bg-(--bg-card) rounded-xl p-4 text-center">
                        <ConfidenceGauge
                            value={assumptionHealth}
                            size="sm"
                            showLabel={false}
                            customColor={assumptionHealth >= 70 ? 'var(--text-muted)' : undefined}
                        />
                        <p className="text-sm font-medium mt-2">{assumptionHealth}%</p>
                        <p className="text-xs text-(--text-muted)">Assumptions</p>
                    </div>
                    <div className="bg-(--bg-card) rounded-xl p-4 text-center">
                        <ConfidenceGauge
                            value={conflictRisk}
                            size="sm"
                            showLabel={false}
                            customColor={conflictRisk >= 70 ? 'var(--text-muted)' : undefined}
                        />
                        <p className="text-sm font-medium mt-2">{conflictRisk}%</p>
                        <p className="text-xs text-(--text-muted)">Conflict Health</p>
                    </div>
                    <div className="bg-(--bg-card) rounded-xl p-4 text-center">
                        <ConfidenceGauge
                            value={decision.initial_confidence}
                            size="sm"
                            showLabel={false}
                            customColor={decision.initial_confidence >= 70 ? 'var(--text-muted)' : undefined}
                        />
                        <p className="text-sm font-medium mt-2">{decision.initial_confidence}%</p>
                        <p className="text-xs text-(--text-muted)">Initial Conf.</p>
                    </div>
                </div>

                {/* Details grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Assumptions */}
                    <div className="bg-(--bg-card) rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Key Assumptions</h2>
                        {decision.logic.length > 0 ? (
                            <ul className="space-y-2">
                                {decision.logic.map((assumption, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-(--text-secondary)"
                                    >
                                        <span className="text-(--accent)">•</span>
                                        {assumption}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-(--text-muted)">No assumptions recorded</p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-(--bg-card) rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Timeline</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Clock size={16} className="text-(--text-muted)" />
                                <span className="text-(--text-muted)">Created:</span>
                                <span>{format(new Date(decision.created_at), 'MMM d, yyyy')}</span>
                                <span className="text-(--text-muted)">
                                    {daysSinceCreated === 0 ? '(Today)' : daysSinceCreated === 1 ? '(Yesterday)' : `(${daysSinceCreated} days ago)`}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <RefreshCw size={16} className="text-(--text-muted)" />
                                <span className="text-(--text-muted)">Last reviewed:</span>
                                <span>{format(new Date(decision.last_reviewed_at), 'MMM d, yyyy')}</span>
                                <span className="text-(--text-muted)">
                                    {daysSinceReview === 0 ? '(Today)' : daysSinceReview === 1 ? '(Yesterday)' : `(${daysSinceReview} days ago)`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Signals section */}
                {signals.length > 0 && (
                    <div className="mt-6 bg-(--bg-card) rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-400" />
                            Signals ({signals.length})
                        </h2>
                        <div className="space-y-3">
                            {signals.map((signal) => (
                                <div
                                    key={signal.id}
                                    className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 group"
                                >
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
                                        onClick={() => setSignalToDismiss(signal)}
                                        className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500/60 hover:text-amber-500 transition-all shrink-0"
                                        aria-label="Dismiss signal"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Decision History Timeline */}
                <div className="mt-6 bg-(--bg-card) rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <History size={18} className="text-(--accent)" />
                        Decision History
                    </h2>
                    <div className="">
                        <HistoryTimeline history={history} />
                    </div>
                </div>

                <hr className="border-(--bg-secondary) my-12" />

                {/* Danger Zone */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
                    <div className="border border-red-500/30 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-(--bg-card)">
                            <div>
                                <h3 className="font-medium text-foreground">Delete this decision</h3>
                                <p className="text-sm text-(--text-muted)">
                                    Once you delete a decision, there is no going back. Please be certain.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 
                                    hover:bg-red-500/20 transition-colors text-sm font-medium
                                    disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting…' : 'Delete this decision'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Signal Modal */}
            {showAddSignal && (
                <AddSignalModal
                    decisionId={decision.id}
                    onClose={() => setShowAddSignal(false)}
                    onSuccess={() => {
                        setShowAddSignal(false)
                        loadDecision()
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <DeleteConfirmModal
                    decisionStatement={decision.statement}
                    isDeleting={isDeleting}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={() => {
                        setShowDeleteConfirm(false)
                        handleDelete()
                    }}
                />
            )}

            {/* Edit Decision Modal */}
            {showEditModal && (
                <EditDecisionModal
                    decision={decision}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false)
                        loadDecision()
                    }}
                />
            )}

            {/* Dismiss Signal Confirmation */}
            {signalToDismiss && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-(--bg-card) rounded-2xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-semibold mb-2">Dismiss Signal?</h2>
                        <p className="text-sm text-(--text-secondary) mb-6">
                            This will remove the signal from this decision.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSignalToDismiss(null)}
                                className="flex-1 py-2.5 rounded-lg bg-(--bg-secondary) hover:bg-(--bg-card-hover) text-foreground font-medium transition-colors"
                            >
                                No
                            </button>
                            <button
                                onClick={handleDismissSignal}
                                disabled={isDismissing}
                                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDismissing ? 'Removing...' : 'Yes, remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function AddSignalModal({
    decisionId,
    onClose,
    onSuccess,
}: {
    decisionId: string
    onClose: () => void
    onSuccess: () => void
}) {
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
        const typeLabel = signalType.replace(/_/g, ' ')
        await supabase.from('decision_history').insert({
            decision_id: decisionId,
            action_type: 'signal_added',
            previous_state: null,
            new_state: { signal_type: signalType, description: description.trim() },
            change_summary: `${typeLabel}: ${description.trim()}`,
        })

        onSuccess()
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-(--bg-card) rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-(--bg-secondary)">
                    <h2 className="text-lg font-semibold">Add Signal</h2>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-lg hover:bg-(--bg-secondary)">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                    border border-transparent focus:border-white/10 focus:outline-none appearance-none cursor-pointer"
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
                focus:border-(--accent) focus:outline-none resize-none"
                            rows={3}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !description.trim()}
                        className="w-full py-3 rounded-xl bg-foreground hover:bg-white/90 
                            text-background font-semibold transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <Spinner size={20} color="var(--bg-primary)" />
                                <span>Adding...</span>
                            </div>
                        ) : 'Add Signal'}
                    </button>
                </form>
            </div>
        </div>
    )
}

function DeleteConfirmModal({
    decisionStatement,
    isDeleting,
    onClose,
    onConfirm,
}: {
    decisionStatement: string
    isDeleting: boolean
    onClose: () => void
    onConfirm: () => void
}) {
    const [confirmText, setConfirmText] = useState('')

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    // Get first few words of decision as confirmation text (max 5 words, max 40 chars)
    const confirmKeyword = decisionStatement
        .split(' ')
        .slice(0, 5)
        .join(' ')
        .slice(0, 40)

    const isConfirmed = confirmText.toLowerCase() === confirmKeyword.toLowerCase()

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-(--bg-card) rounded-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-(--bg-secondary)">
                    <h2 className="font-semibold">Delete Decision</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="p-1 rounded hover:bg-(--bg-secondary) transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-foreground font-medium text-center mb-6">
                        {decisionStatement}
                    </p>

                    <p id="delete-instruction" className="text-(--text-secondary) text-sm mb-3">
                        To confirm, type <span className="font-medium text-foreground">&ldquo;{confirmKeyword}&rdquo;</span> in the box below
                    </p>

                    <input
                        id="delete-confirm"
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        aria-describedby="delete-instruction"
                        autoComplete="off"
                        className="w-full px-4 py-2 rounded-lg bg-(--bg-secondary) border border-red-500/50 
                            focus:border-red-500 focus:outline-none text-foreground mb-4"
                        autoFocus
                    />

                    <button
                        onClick={onConfirm}
                        disabled={!isConfirmed || isDeleting}
                        className="w-full py-2.5 rounded-lg bg-(--bg-secondary) text-(--text-muted)
                            transition-colors disabled:cursor-not-allowed
                            enabled:bg-red-500 enabled:text-white enabled:hover:bg-red-600"
                    >
                        {isDeleting ? 'Deleting…' : 'Delete this decision'}
                    </button>
                </div>
            </div>
        </div>
    )
}

