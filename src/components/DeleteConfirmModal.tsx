'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface DeleteConfirmModalProps {
    decisionStatement: string
    isDeleting: boolean
    onClose: () => void
    onConfirm: () => void
}

export function DeleteConfirmModal({
    decisionStatement,
    isDeleting,
    onClose,
    onConfirm,
}: DeleteConfirmModalProps) {
    const [confirmText, setConfirmText] = useState('')

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    const confirmKeyword = "yes I agree to delete"
    const isConfirmed = confirmText === confirmKeyword

    return (
        <div className="fixed inset-0 bg-[var(--overlay)] flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md
                border border-[var(--border)] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div>
                        <h2 className="font-semibold">Delete Decision</h2>
                        <p className="text-xs text-(--text-muted) mt-0.5">This action cannot be undone</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-(--text-muted) hover:text-[var(--text-primary)] transition-colors"
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
                        className="w-full py-3 rounded-xl bg-[var(--bg-secondary)] text-(--text-muted) border border-[var(--border)]
                            transition-all disabled:cursor-not-allowed
                            enabled:bg-red-500/90 enabled:text-white enabled:border-red-500/20 enabled:hover:bg-red-600"
                    >
                        {isDeleting ? 'Deleting…' : 'Delete permanently'}
                    </button>
                </div>
            </div>
        </div>
    )
}
