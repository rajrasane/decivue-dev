'use client'

import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface InfoCardsProps {
    daysSinceReview: number
    initialConfidence: number
}

export function InfoCards({ daysSinceReview, initialConfidence }: InfoCardsProps) {
    const reviewColor = daysSinceReview > 30 ? 'text-red-400' : daysSinceReview > 14 ? 'text-amber-400' : 'text-foreground'
    const iconColor = daysSinceReview > 30 ? 'text-red-400' : daysSinceReview > 14 ? 'text-amber-400' : 'text-(--text-muted)'

    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-(--bg-card) border border-(--bg-secondary) p-5 rounded-xl flex flex-col justify-between h-24">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Review</span>
                    <Clock size={16} aria-hidden="true" className={cn("transition-colors", iconColor)} />
                </div>
                <div className="flex items-end gap-2">
                    <span className={cn("text-2xl font-bold tabular-nums tracking-tight", reviewColor)}>
                        {daysSinceReview === 0 ? 'Today' : `${daysSinceReview}d`}
                    </span>
                    {daysSinceReview > 0 && <span className="text-xs text-(--text-muted) mb-1">ago</span>}
                </div>
            </div>

            <div className="bg-(--bg-card) border border-(--bg-secondary) p-5 rounded-xl flex flex-col justify-between h-24">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Baseline</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--text-muted)" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="2" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{initialConfidence}%</span>
                    <span className="text-xs text-(--text-muted) mb-1">start</span>
                </div>
            </div>
        </div>
    )
}
