'use client'

import { useEffect, useState, useMemo, useCallback, useDeferredValue } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

import { Plus, RefreshCw, Search, ArrowRight, BarChart3, Shield, Zap } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'
import { Decision } from '@/types/decision'
import { DecisionCard } from '@/components/DecisionCard'
import { calculateCurrentConfidence, determineLifecycleState } from '@/lib/decision-intelligence'
import { LifecycleState, stateLabels } from '@/lib/decision-constants'
import type { User } from '@supabase/supabase-js'

const CreateDecisionModal = dynamic(
  () => import('@/components/CreateDecisionModal').then(m => ({ default: m.CreateDecisionModal })),
  { loading: () => null }
)

/* ──────────────────────────────────────────── */
/*  Landing page (unauthenticated)              */
/* ──────────────────────────────────────────── */

function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-white/[0.02] blur-[120px]" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <Zap size={12} className="text-[var(--accent)]" />
            Decision Intelligence Platform
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Track decisions.
            <br />
            <span className="text-[var(--text-secondary)]">Detect drift.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            Maintain awareness over your team&apos;s decisions. Know when confidence decays,
            signals conflict, or a decision needs revisiting.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-black transition-all hover:bg-white/90 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] bg-[var(--bg-secondary)]/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {[
              {
                icon: <BarChart3 size={20} />,
                title: 'Confidence Tracking',
                desc: 'Monitor how decision confidence evolves over time with real-time signal analysis.',
              },
              {
                icon: <Shield size={20} />,
                title: 'Conflict Detection',
                desc: 'Automatically surface when decisions contradict each other across your organization.',
              },
              {
                icon: <Zap size={20} />,
                title: 'Lifecycle States',
                desc: 'Decisions flow through Fresh → Stable → At Risk → Stale, keeping your team aware.',
              },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-[var(--bg-card)] p-5 sm:p-6">
                <div className="mb-3 inline-flex rounded-lg bg-white/[0.06] p-2.5 text-[var(--text-secondary)]">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/* ──────────────────────────────────────────── */
/*  Dashboard (authenticated)                   */
/* ──────────────────────────────────────────── */

function Dashboard() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [signalsCounts, setSignalsCounts] = useState<Record<string, number>>({})
  const [conflictsCounts, setConflictsCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  const [stateFilter, setStateFilter] = useState<LifecycleState | 'all'>('all')

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

  const loadDecisions = useCallback(async () => {
    setIsLoading(true)

    // Fetch all data in parallel for better performance
    const [decisionsResult, signalsResult, conflictsResult] = await Promise.all([
      supabase.from('decisions').select('*').order('created_at', { ascending: false }),
      supabase.from('decision_signals').select('decision_id'),
      supabase.from('decision_conflicts').select('decision_a, decision_b'),
    ])

    if (decisionsResult.data) {
      setDecisions(decisionsResult.data)
    }

    // Build signals count map
    const signalsMap: Record<string, number> = {}
    signalsResult.data?.forEach((s: { decision_id: string }) => {
      signalsMap[s.decision_id] = (signalsMap[s.decision_id] || 0) + 1
    })
    setSignalsCounts(signalsMap)

    // Build conflicts count map
    const conflictsMap: Record<string, number> = {}
    conflictsResult.data?.forEach((c: { decision_a: string; decision_b: string }) => {
      conflictsMap[c.decision_a] = (conflictsMap[c.decision_a] || 0) + 1
      conflictsMap[c.decision_b] = (conflictsMap[c.decision_b] || 0) + 1
    })
    setConflictsCounts(conflictsMap)

    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadDecisions()
  }, [loadDecisions])

  // Memoized sorted and filtered decisions
  const sortedDecisions = useMemo(() => {
    return [...decisions]
      .map(d => {
        const signals = signalsCounts[d.id] || 0
        const conflicts = conflictsCounts[d.id] || 0
        const conf = calculateCurrentConfidence(d, signals, conflicts)
        const days = Math.floor((Date.now() - new Date(d.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
        const state = determineLifecycleState(conf, days, signals, conflicts)
        return { decision: d, confidence: conf, state }
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
      .map(({ decision }) => decision)
  }, [decisions, signalsCounts, conflictsCounts, deferredSearch, stateFilter])

  // Memoized at-risk count
  const atRiskCount = useMemo(() => {
    return decisions.filter(d => {
      const signals = signalsCounts[d.id] || 0
      const conflicts = conflictsCounts[d.id] || 0
      const conf = calculateCurrentConfidence(d, signals, conflicts)
      const days = Math.floor((Date.now() - new Date(d.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
      return determineLifecycleState(conf, days, signals, conflicts) === 'at_risk'
    }).length
  }, [decisions, signalsCounts, conflictsCounts])

  return (
    <div className="bg-background">
      <main className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1 text-foreground">Overview</h2>
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-(--text-muted)">
              <span>{decisions.length} Decision{decisions.length !== 1 ? 's' : ''}</span>
              {atRiskCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-red-400 font-medium">
                      {atRiskCount} Action Needed
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Decisions that are &apos;At Risk&apos; or have active conflicts.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-foreground text-background hover:bg-white/90 
                text-sm sm:text-base font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="inline sm:hidden">New</span>
              <span className="hidden sm:inline">New Decision</span>
            </button>
            <button
              onClick={loadDecisions}
              aria-label="Refresh decisions"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-(--text-secondary) 
                hover:bg-(--bg-secondary) transition-colors cursor-pointer"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
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
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-(--bg-secondary) border border-transparent text-sm text-foreground 
                  placeholder:text-(--text-muted) focus:outline-none"
              />
            </div>

            <div className="relative">
              <div className="pill-scroll pb-1 pr-2">
                {(['all', 'fresh', 'stable', 'at_risk', 'stale', 'invalidated'] as const).map(state => (
                  <button
                    key={state}
                    onClick={() => setStateFilter(state)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 sm:shrink
                      ${stateFilter === state
                        ? 'bg-foreground text-background'
                        : 'bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-card-hover) border border-white/5'
                      }`}
                  >
                    {state === 'all' ? 'All' : stateLabels[state]}
                  </button>
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-1 w-4 bg-gradient-to-l from-(--bg-primary) to-transparent pointer-events-none sm:hidden" />
            </div>
          </div>
        )}

        {/* Decisions grid */}
        {isLoading ? (
          <div className="h-[calc(100dvh-16rem)] flex items-center justify-center">
            <Spinner size={32} />
          </div>
        ) : decisions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="flex flex-col items-center text-center max-w-sm">
              {/* Subtle animated ring */}
              <div className="relative mb-6">
                <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-white/[0.04] to-white/[0.01] blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                  <svg viewBox="0 0 40 40" className="w-8 h-8 text-white/30" fill="none" xmlns="http://www.w3.org/2000/svg">
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

              <h2 className="text-lg font-semibold text-white/90 tracking-tight">No decisions yet</h2>
              <p className="mt-1.5 text-sm text-[var(--text-muted)] leading-relaxed">
                Start tracking your team&apos;s decisions to maintain<br className="hidden sm:inline" /> awareness over time.
              </p>

              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.1] hover:text-white active:scale-[0.97]"
              >
                <Plus size={16} />
                Create your first decision
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:gap-6">
            {sortedDecisions.length > 0 ? (
              sortedDecisions.map(decision => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  signalsCount={signalsCounts[decision.id] || 0}
                  conflictsCount={conflictsCounts[decision.id] || 0}
                />
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
                  className="mt-6 text-sm text-(--text-muted) hover:text-white border border-white/10 px-5 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create decision modal */}
      {showCreateForm && (
        <CreateDecisionModal
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

/* ──────────────────────────────────────────── */
/*  Smart root — landing or dashboard           */
/* ──────────────────────────────────────────── */

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setChecking(false)
    }
    check()
  }, [supabase.auth])

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center h-[calc(100dvh-10rem)]">
        <Spinner size={32} />
      </div>
    )
  }

  return user ? <Dashboard /> : <LandingPage />
}
