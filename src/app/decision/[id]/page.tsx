'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useDecision } from '@/hooks/useDecision'
import { stateLabels, stateDescriptions, getRiskColor } from '@/lib/decision-constants'
import { DecisionSignal } from '@/types/decision'
import { ConfidenceGauge } from '@/components/ConfidenceGauge'
import { HistoryTimeline } from '@/components/HistoryTimeline'

import { ConflictsSection, SignalsSection, InfoCards, DecisionDetails, DangerZone } from '@/components/decision'
import { Spinner } from '@/components/Spinner'
import { ArrowLeft, CheckCircle, Edit2, AlertTriangle, History } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const EditDecisionModal = dynamic(
    () => import('@/components/EditDecisionModal').then(m => ({ default: m.EditDecisionModal })),
    { loading: () => null }
)

const AddSignalModal = dynamic(
    () => import('@/components/AddSignalModal').then(m => ({ default: m.AddSignalModal })),
    { loading: () => null }
)

const DeleteConfirmModal = dynamic(
    () => import('@/components/DeleteConfirmModal').then(m => ({ default: m.DeleteConfirmModal })),
    { loading: () => null }
)

const DismissSignalModal = dynamic(
    () => import('@/components/DismissSignalModal').then(m => ({ default: m.DismissSignalModal })),
    { loading: () => null }
)

export default function DecisionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const {
        decision, signals, conflicts, history,
        isLoading, isReaffirming, isDeleting, isDismissing,
        currentConfidence, daysSinceReview, lifecycleState, insight,
        reaffirm, deleteDecision, dismissSignal, dismissConflict, reload,
    } = useDecision(id)

    // Scroll to top when opening a decision — prevents dashboard scroll bleeding into this page
    useEffect(() => { window.scrollTo(0, 0) }, [])

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showAddSignal, setShowAddSignal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [signalToDismiss, setSignalToDismiss] = useState<DecisionSignal | null>(null)

    // Lock body scroll when modal is open
    useEffect(() => {
        const isModalOpen = showDeleteConfirm || showAddSignal || showEditModal || !!signalToDismiss
        document.body.classList.toggle('modal-open', isModalOpen)
        return () => document.body.classList.remove('modal-open')
    }, [showDeleteConfirm, showAddSignal, showEditModal, signalToDismiss])

    const handleDelete = async () => {
        await deleteDecision()
        router.push('/')
    }

    const handleDismissSignal = async () => {
        if (signalToDismiss) {
            await dismissSignal(signalToDismiss)
            setSignalToDismiss(null)
        }
    }

    if (isLoading) {
        return (
            <div className="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] bg-background flex items-center justify-center">
                <Spinner size={32} />
            </div>
        )
    }

    if (!decision) {
        return (
            <div className="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] bg-background flex items-center justify-center">
                <p className="text-(--text-muted)">Decision not found</p>
            </div>
        )
    }

    return (
        <div className="min-h-dvh bg-background">
            <main className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-(--text-secondary) hover:text-foreground transition-colors mb-4 md:mb-6"
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                    Back to Dashboard
                </button>

                {/* Hero section */}
                <section className="bg-(--bg-card) rounded-2xl p-8 mb-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        <div className="shrink-0">
                            <ConfidenceGauge
                                value={currentConfidence}
                                size="lg"
                                customColor={currentConfidence >= 70 ? 'var(--fresh)' : undefined}
                            />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border bg-(--bg-secondary) text-(--text-secondary) border-[var(--border)] cursor-default">
                                            {stateLabels[lifecycleState]}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{stateDescriptions[lifecycleState]}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <span className="text-(--text-muted) text-sm">
                                    Risk: <span className={getRiskColor(decision.perceived_risk)}>{decision.perceived_risk}</span>
                                </span>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold mb-4">{decision.statement}</h1>

                            <p className="text-sm px-3 py-2 rounded-lg mb-4 bg-(--bg-secondary) text-(--text-secondary)">
                                {insight}
                            </p>

                            {/* Action buttons */}
                            <div className="grid grid-cols-3 gap-2 md:flex md:gap-3 justify-center md:justify-start w-full md:w-auto">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={reaffirm}
                                            disabled={isReaffirming || daysSinceReview === 0}
                                            aria-label="Reaffirm decision"
                                            className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-2 rounded-xl bg-foreground text-background hover:opacity-90 transition-colors disabled:opacity-50 font-medium text-xs md:text-base"
                                        >
                                            {isReaffirming ? <Spinner size={16} color="var(--bg-primary)" /> : <CheckCircle size={16} aria-hidden="true" />}
                                            Reaffirm
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Reset confidence decay by confirming this decision is still valid today.</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            aria-label="Revise decision"
                                            className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-2 rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-secondary)/80 transition-colors font-medium border border-(--border-primary) text-xs md:text-base"
                                        >
                                            <Edit2 size={16} aria-hidden="true" />
                                            Revise
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Edit statement or assumptions</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setShowAddSignal(true)}
                                            aria-label="Add signal"
                                            className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-2 rounded-xl bg-amber-500/10 text-[var(--signal)] hover:bg-amber-500/20 transition-colors font-medium border border-amber-500/10 text-xs md:text-base"
                                        >
                                            <AlertTriangle size={16} aria-hidden="true" />
                                            Signal
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Report external change or risk</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </section>

                <ConflictsSection conflicts={conflicts} onDismiss={dismissConflict} />
                <SignalsSection signals={signals} onDismiss={setSignalToDismiss} />
                <InfoCards daysSinceReview={daysSinceReview} initialConfidence={decision.initial_confidence} />
                <DecisionDetails decision={decision} />

                {/* History Timeline */}
                <section className="mt-6 bg-(--bg-card) rounded-xl p-6" aria-labelledby="history-heading">
                    <h2 id="history-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <History size={18} className="text-(--accent)" aria-hidden="true" />
                        Decision History
                    </h2>
                    <HistoryTimeline history={history} />
                </section>

                <hr className="border-(--bg-secondary) my-12" />

                <DangerZone isDeleting={isDeleting} onDelete={() => setShowDeleteConfirm(true)} />
            </main>

            {/* Modals */}
            {showAddSignal && (
                <AddSignalModal
                    decisionId={decision.id}
                    onClose={() => setShowAddSignal(false)}
                    onSuccess={() => { setShowAddSignal(false); reload() }}
                />
            )}

            {showDeleteConfirm && (
                <DeleteConfirmModal
                    decisionStatement={decision.statement}
                    isDeleting={isDeleting}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={() => { setShowDeleteConfirm(false); handleDelete() }}
                />
            )}

            {showEditModal && (
                <EditDecisionModal
                    decision={decision}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => { setShowEditModal(false); reload() }}
                />
            )}

            {signalToDismiss && (
                <DismissSignalModal
                    isDismissing={isDismissing}
                    onClose={() => setSignalToDismiss(null)}
                    onConfirm={handleDismissSignal}
                />
            )}
        </div>
    )
}

