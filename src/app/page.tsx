'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Decision } from '@/types/decision'
import { DecisionCard } from '@/components/DecisionCard'
import { calculateCurrentConfidence, determineLifecycleState } from '@/lib/decision-intelligence'

const CreateDecisionForm = dynamic(
  () => import('@/components/CreateDecisionForm').then(m => ({ default: m.CreateDecisionForm })),
  { loading: () => null }
)

export default function Dashboard() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [signalsCounts, setSignalsCounts] = useState<Record<string, number>>({})
  const [conflictsCounts, setConflictsCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const supabase = createClient()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCreateForm) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
  }, [showCreateForm])

  const loadDecisions = async () => {
    setIsLoading(true)

    // Get decisions
    const { data: decisionsData } = await supabase
      .from('decisions')
      .select('*')
      .order('created_at', { ascending: false })

    if (decisionsData) {
      setDecisions(decisionsData)

      // Get signal counts
      const { data: signals } = await supabase
        .from('decision_signals')
        .select('decision_id')

      const signalsMap: Record<string, number> = {}
      signals?.forEach(s => {
        signalsMap[s.decision_id] = (signalsMap[s.decision_id] || 0) + 1
      })
      setSignalsCounts(signalsMap)

      // Get conflict counts
      const { data: conflicts } = await supabase
        .from('decision_conflicts')
        .select('decision_a, decision_b')

      const conflictsMap: Record<string, number> = {}
      conflicts?.forEach(c => {
        conflictsMap[c.decision_a] = (conflictsMap[c.decision_a] || 0) + 1
        conflictsMap[c.decision_b] = (conflictsMap[c.decision_b] || 0) + 1
      })
      setConflictsCounts(conflictsMap)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadDecisions()
  }, [])

  // Sort decisions by risk (at_risk first, then by confidence)
  const sortedDecisions = [...decisions].sort((a, b) => {
    const confA = calculateCurrentConfidence(a)
    const confB = calculateCurrentConfidence(b)
    const daysA = Math.floor((Date.now() - new Date(a.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
    const daysB = Math.floor((Date.now() - new Date(b.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
    const stateA = determineLifecycleState(confA, daysA)
    const stateB = determineLifecycleState(confB, daysB)

    const priority = { at_risk: 0, stale: 1, stable: 2, fresh: 3, invalidated: 4 }
    if (priority[stateA] !== priority[stateB]) {
      return priority[stateA] - priority[stateB]
    }
    return confA - confB
  })

  // Stats
  const atRiskCount = decisions.filter(d => {
    const conf = calculateCurrentConfidence(d)
    const days = Math.floor((Date.now() - new Date(d.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
    return determineLifecycleState(conf, days) === 'at_risk'
  }).length

  return (
    <div className="min-h-screen bg-background">


      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold mb-1 text-foreground">Overview</h2>
            <div className="flex items-center gap-4 text-sm text-(--text-muted)">
              <span>{decisions.length} Decision{decisions.length !== 1 ? 's' : ''}</span>
              {atRiskCount > 0 && (
                <span className="text-red-400 font-medium">{atRiskCount} Action Needed</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background hover:bg-white/90 
                font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              <Plus size={18} />
              New Decision
            </button>
            <button
              onClick={loadDecisions}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-(--text-secondary) 
                hover:bg-(--bg-secondary) transition-colors cursor-pointer"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Decisions grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-(--accent) border-t-transparent rounded-full" />
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-20">
            {/* Logo in empty state */}
            <svg viewBox="0 0 40 40" className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="emptyLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--text-muted)" />
                  <stop offset="100%" stopColor="var(--text-muted)" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="18" stroke="url(#emptyLogoGradient)" strokeWidth="2" fill="none" />
              <path
                d="M14 12 L14 28 M14 20 L22 12 M14 20 L22 28"
                stroke="var(--text-muted)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="22" cy="12" r="3" fill="var(--text-muted)" />
              <circle cx="22" cy="28" r="3" fill="var(--text-muted)" />
              <circle cx="14" cy="20" r="2.5" fill="var(--text-muted)" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No decisions yet</h2>
            <p className="text-(--text-muted) mb-6">
              Start tracking your team&apos;s decisions to maintain awareness over time.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-(--accent) 
                hover:bg-(--accent-hover) text-white font-medium transition-colors"
            >
              <Plus size={18} />
              Create First Decision
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDecisions.map(decision => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                signalsCount={signalsCounts[decision.id] || 0}
                conflictsCount={conflictsCounts[decision.id] || 0}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create form modal */}
      {showCreateForm && (
        <CreateDecisionForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            loadDecisions()
          }}
        />
      )}
    </div>
  )
}
