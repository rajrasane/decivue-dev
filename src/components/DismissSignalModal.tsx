'use client'

import { Spinner } from '@/components/Spinner'

interface DismissSignalModalProps {
    isDismissing: boolean
    onClose: () => void
    onConfirm: () => void
}

export function DismissSignalModal({
    isDismissing,
    onClose,
    onConfirm,
}: DismissSignalModalProps) {
    return (
        <div className="fixed inset-0 bg-[var(--overlay)] flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-sm p-6
                border border-[var(--border)] shadow-2xl">
                <h2 className="text-lg font-semibold mb-1">Dismiss Signal?</h2>
                <p className="text-sm text-(--text-muted) mb-6">
                    This will remove the signal from this decision.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-foreground font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDismissing}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-600 border border-red-500/20 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isDismissing ? (
                            <>
                                <Spinner size={16} />
                                Removing…
                            </>
                        ) : 'Remove'}
                    </button>
                </div>
            </div>
        </div>
    )
}
