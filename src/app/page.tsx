'use client'

import { useEffect, useState } from 'react'
import { Plus, Brain, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Decision } from '@/types/decision'
import { DecisionCard } from '@/components/DecisionCard'
import { CreateDecisionForm } from '@/components/CreateDecisionForm'
import { calculateCurrentConfidence, determineLifecycleState } from '@/lib/decision-intelligence'

export default function Dashboard() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [signalsCounts, setSignalsCounts] = useState<Record<string, number>>({})
  const [conflictsCounts, setConflictsCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const supabase = createClient()

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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[var(--accent)]" />
            <h1 className="text-2xl font-bold">Decivue</h1>
            <span className="text-xs text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-secondary)]">
              Decision Intelligence
            </span>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] 
              text-white font-medium transition-colors"
          >
            <Plus size={18} />
            New Decision
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-3xl font-bold">{decisions.length}</span>
              <span className="text-[var(--text-muted)] ml-2">Total Decisions</span>
            </div>
            {atRiskCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
                <span className="text-red-400 font-bold">{atRiskCount}</span>
                <span className="text-red-400 text-sm">Need Review</span>
              </div>
            )}
          </div>
          <button
            onClick={loadDecisions}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--text-secondary)] 
              hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Decisions grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-20">
            <Brain className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
            <h2 className="text-xl font-semibold mb-2">No decisions yet</h2>
            <p className="text-[var(--text-muted)] mb-6">
              Start tracking your team&apos;s decisions to maintain awareness over time.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] 
                hover:bg-[var(--accent-hover)] text-white font-medium transition-colors"
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
