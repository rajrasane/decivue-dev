'use client'

import { useEffect, useState, useMemo, useDeferredValue } from 'react'
import dynamic from 'next/dynamic'
import { DecisionLanding } from '@/components/DecisionLanding'
import { useQueryClient } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'

import { Plus, RefreshCw, Search, X } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from '@/components/Spinner'
import { DecisionCard } from '@/components/DecisionCard'
import { calculateCurrentConfidence, determineLifecycleState, generateInsight } from '@/lib/decision-intelligence'
import { LifecycleState, stateLabels } from '@/lib/decision-constants'
import { useAuth } from '@/components/AuthProvider'
import { useDashboard } from '@/hooks/useDashboard'
import { decisionKeys } from '@/hooks/useDecision'

const CreateDecisionModal = dynamic(
  () => import('@/components/CreateDecisionModal').then(m => ({ default: m.CreateDecisionModal })),
  { loading: () => null }
)

/* ──────────────────────────────────────────── */
/*  Landing page (unauthenticated)              */
/* ──────────────────────────────────────────── */

/* ──────────────────────────────────────────── */
/*  Dashboard (authenticated)                   */
/* ──────────────────────────────────────────── */

function Dashboard() {
  const { data, isLoading, refetch, isFetching } = useDashboard()
  const decisions = useMemo(() => data?.decisions ?? [], [data?.decisions])
  const signalsCounts = useMemo(() => data?.signalsCounts ?? {}, [data?.signalsCounts])
  const conflictsCounts = useMemo(() => data?.conflictsCounts ?? {}, [data?.conflictsCounts])
  const queryClient = useQueryClient()

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [stateFilter, setStateFilter] = useState<LifecycleState | 'all'>('all')

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCreateForm) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
  }, [showCreateForm])

  // Memoized sorted and filtered decisions
  const sortedDecisions = useMemo(() => {
    return [...decisions]
      .map(d => {
        const signals = signalsCounts[d.id] || 0
        const conflicts = conflictsCounts[d.id] || 0
        const conf = calculateCurrentConfidence(d, signals, conflicts, new Date(now))
        const days = differenceInDays(new Date(now), new Date(d.last_reviewed_at))
        const state = determineLifecycleState(conf, days, signals, conflicts)
        return { decision: d, confidence: conf, state, daysSinceReview: days, insight: generateInsight(d, conf, signals, conflicts, new Date(now)) }
      })
      .filter(({ decision, state }) => {
        if (deferredSearch && !decision.statement.toLowerCase().includes(deferredSearch.toLowerCase())) return false
        if (stateFilter !== 'all' && state !== stateFilter) return false
        return true
      })
      .sort((a, b) => {
        const priority = { at_risk: 0, stale: 1, stable: 2, fresh: 3, invalidated: 4 } as const
        if (priority[a.state] !== priority[b.state]) {
          return priority[a.state] - priority[b.state]
        }
        return a.confidence - b.confidence
      })
    // Keep full computed shape — DecisionCard will consume these directly
  }, [decisions, signalsCounts, conflictsCounts, deferredSearch, stateFilter, now])

  // Memoized at-risk count
  const atRiskCount = useMemo(() => {
    return decisions.filter(d => {
      const signals = signalsCounts[d.id] || 0
      const conflicts = conflictsCounts[d.id] || 0
      const conf = calculateCurrentConfidence(d, signals, conflicts, new Date(now))
      const days = differenceInDays(new Date(now), new Date(d.last_reviewed_at))
      return determineLifecycleState(conf, days, signals, conflicts) === 'at_risk'
    }).length
  }, [decisions, signalsCounts, conflictsCounts, now])

  return (
    <div className="bg-background">
      {isLoading ? (
        <div className="fixed inset-0 flex items-center justify-center z-10">
          <Spinner size={32} />
        </div>
      ) : (
        <main className="decision-dashboard max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
          {/* Stats bar */}
          <div className="dashboard-topline flex flex-wrap gap-5 items-center justify-between mb-4 sm:mb-8">
            <div>
              <p className="eyebrow mb-2">YOUR DECISION LOG</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1 text-foreground">Overview</h2>
              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-(--text-muted)">
                <span>{decisions.length} Decision{decisions.length !== 1 ? 's' : ''}</span>
                {atRiskCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[var(--danger)] font-medium">
                        {atRiskCount} Action Needed
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Decisions currently in the At Risk lifecycle state.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-foreground text-background hover:opacity-90 
                text-sm font-semibold transition-colors min-h-11"
              >
                <Plus size={16} className="sm:w-4.5 sm:h-4.5" />
                <span className="inline sm:hidden">New</span>
                <span className="hidden sm:inline">New Decision</span>
              </button>
              <button
                onClick={() => refetch({ cancelRefetch: false })}
                disabled={isFetching}
                aria-label="Refresh decisions"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-(--text-secondary) 
                hover:bg-(--bg-secondary) transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          {decisions.length > 0 && (
            <div className="mb-4 sm:mb-6 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search decisions…"
                  aria-label="Search decisions"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 ${searchQuery ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl bg-(--bg-secondary) border border-transparent text-sm text-foreground 
                  placeholder:text-(--text-muted) focus:outline-none focus:border-(--text-muted)/40 transition-colors`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="pill-scroll pb-1 pr-2" role="group" aria-label="Filter decisions by lifecycle">
                  {(['all', 'fresh', 'stable', 'at_risk', 'stale', 'invalidated'] as const).map(state => (
                    <button
                      key={state}
                      aria-pressed={stateFilter === state}
                      onClick={(e) => {
                        setStateFilter(state)
                        e.currentTarget.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest', inline: 'center' })
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 sm:shrink
                      ${stateFilter === state
                          ? 'bg-foreground text-background'
                          : 'bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-card-hover) border border-(--border)'
                        }`}
                    >
                      {state === 'all' ? 'All' : stateLabels[state]}
                    </button>
                  ))}
                </div>
                {/* Scroll fade indicator for mobile */}
                <div className="absolute right-0 top-0 bottom-1 w-2 bg-linear-to-l from-background to-transparent pointer-events-none sm:hidden" />
              </div>
            </div>
          )}

          {decisions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <div className="flex flex-col items-center text-center max-w-sm">
                {/* Subtle animated ring */}
                <div className="relative mb-6">
                  <div className="absolute -inset-3 rounded-full bg-linear-to-tr from-foreground/4 to-foreground/1 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-(--border) bg-(--bg-secondary)/50">
                    <svg viewBox="0 0 40 40" className="w-8 h-8 text-(--text-muted)" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14 12 L14 28 M14 20 L22 12 M14 20 L22 28"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="22" cy="12" r="2.5" fill="currentColor" />
                      <circle cx="22" cy="28" r="2.5" fill="currentColor" />
                      <circle cx="14" cy="20" r="2" fill="currentColor" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-foreground/90 tracking-tight">No decisions yet</h2>
                <p className="mt-1.5 text-sm text-(--text-muted) leading-relaxed">
                  Start tracking your team&apos;s decisions to maintain<br className="hidden sm:inline" /> awareness over time.
                </p>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-(--border) bg-(--bg-secondary)/50 px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-all hover:bg-(--bg-card-hover) hover:text-foreground active:scale-[0.97]"
                >
                  <Plus size={16} />
                  Create your first decision
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Spinner overlay — only during background refetch, not initial load */}
              {isFetching && !isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ minHeight: '200px' }}>
                  <Spinner size={32} animated={false} />
                </div>
              )}
              <div className={`flex flex-col gap-4 md:gap-6 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                {sortedDecisions.length > 0 ? (
                  sortedDecisions.map(({ decision, confidence, state, insight: cardInsight, daysSinceReview }) => (
                    <div key={`${decision.id}-${stateFilter}`} className="decision-list-item">
                      <DecisionCard
                        decision={decision}
                        signalsCount={signalsCounts[decision.id] || 0}
                        conflictsCount={conflictsCounts[decision.id] || 0}
                        confidence={confidence}
                        state={state}
                        insight={cardInsight}
                        daysSinceReview={daysSinceReview}
                      />
                    </div>
                  ))
                ) : (
                  <div className="py-14 sm:py-20 flex flex-col items-center">
                    <svg viewBox="0 0 40 40" className="w-12 h-12 sm:w-14 sm:h-14 mb-5 opacity-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
                      <path d="M14 12 L14 28 M14 20 L22 12 M14 20 L22 28" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="22" cy="12" r="3" fill="var(--text-muted)" />
                      <circle cx="22" cy="28" r="3" fill="var(--text-muted)" />
                      <circle cx="14" cy="20" r="2.5" fill="var(--text-muted)" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-(--text-secondary) mb-1.5">No matching decisions</h3>
                    <p className="text-(--text-muted) text-sm sm:text-base text-center max-w-xs leading-relaxed">
                      {stateFilter !== 'all' && deferredSearch
                        ? `No ${stateLabels[stateFilter]} decisions matching "${deferredSearch}"`
                        : stateFilter !== 'all'
                          ? `No decisions in the ${stateLabels[stateFilter]} state right now`
                          : `No decisions matching "${deferredSearch}"`
                      }
                    </p>
                    <button
                      onClick={() => { setStateFilter('all'); setSearchQuery('') }}
                      className="mt-6 text-sm text-(--text-muted) hover:text-foreground border border-(--border) px-5 py-2 rounded-xl hover:bg-(--bg-card-hover) transition-colors"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create decision modal */}
          {showCreateForm && (
            <CreateDecisionModal
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => {
                setShowCreateForm(false)
                queryClient.invalidateQueries({ queryKey: decisionKeys.all })
              }}
            />
          )}
        </main>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Smart root — landing or dashboard           */
/* ──────────────────────────────────────────── */

export default function Home() {
  const { user, isLoading: checking } = useAuth()

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <Spinner size={32} />
      </div>
    )
  }

  return user ? <Dashboard /> : <DecisionLanding />
}
