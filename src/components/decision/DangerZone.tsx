'use client'

interface DangerZoneProps {
    isDeleting: boolean
    onDelete: () => void
}

export function DangerZone({ isDeleting, onDelete }: DangerZoneProps) {
    return (
        <section className="mt-8" aria-labelledby="danger-heading">
            <h2 id="danger-heading" className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
            <div className="border border-red-500/30 rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-(--bg-card) gap-4 sm:gap-0">
                    <div>
                        <h3 className="font-medium text-foreground">Delete this decision</h3>
                        <p className="text-sm text-(--text-muted)">
                            Once you delete a decision, there is no going back. Please be certain.
                        </p>
                    </div>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg border border-red-500/50 text-red-400 
                            hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </section>
    )
}
