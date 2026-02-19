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
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center justify-center">
        {/* Animated gradient mesh orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-[-10%] left-[15%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.07] blur-[100px]"
            style={{ animation: 'gradient-shift 12s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-[-5%] right-[10%] h-[400px] w-[400px] rounded-full bg-purple-500/[0.05] blur-[120px]"
            style={{ animation: 'gradient-shift 15s ease-in-out infinite reverse' }}
          />
          <div
            className="absolute top-[30%] right-[30%] h-[300px] w-[300px] rounded-full bg-cyan-400/[0.04] blur-[100px]"
            style={{ animation: 'gradient-shift 10s ease-in-out infinite 3s' }}
          />
        </div>

        {/* Subtle grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)]/50 px-5 py-2 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Decision Intelligence Platform
          </div>

          {/* Headline — staggered */}
          <h1 className="animate-fade-in-up animation-delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]">
            Track decisions.
          </h1>
          <h1 className="animate-fade-in-up animation-delay-200 mt-1 sm:mt-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            <span className="bg-gradient-to-r from-foreground/60 via-foreground/40 to-foreground/20 bg-clip-text text-transparent">
              Detect drift.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up animation-delay-300 mx-auto mt-6 sm:mt-8 max-w-xl text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
            Maintain awareness over your team&apos;s decisions. Know when confidence
            decays, signals conflict, or a decision needs revisiting.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in-up animation-delay-400 mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-2.5 rounded-xl bg-foreground px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-semibold text-background transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started free
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base font-medium text-[var(--text-secondary)] backdrop-blur-sm transition-all hover:bg-[var(--bg-card-hover)] hover:text-foreground hover:border-[var(--text-muted)]"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      </section>

      {/* ═══════════════════════ SOCIAL PROOF ═══════════════════════ */}
      <section className="relative border-t border-[var(--border)] py-10 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Built for teams who make critical decisions
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-3 text-xs sm:text-sm text-[var(--text-muted)] font-medium">
            {['Engineering', 'Product', 'Strategy', 'Operations', 'Leadership'].map((word) => (
              <span key={word} className="transition-colors hover:text-[var(--text-secondary)]">{word}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section className="relative py-20 sm:py-28">
        {/* Background accent */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-blue-500/[0.03] blur-[150px]" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-6">
          <div className="mb-12 sm:mb-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Everything you need to stay aware
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] max-w-lg mx-auto">
              A complete system to track, monitor, and manage decisions across your team.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
            {[
              {
                icon: <BarChart3 size={22} />,
                title: 'Confidence Tracking',
                desc: 'Monitor how decision confidence evolves over time with real-time signal analysis and decay alerts.',
                color: 'from-emerald-500/20 to-emerald-500/5',
                borderHover: 'hover:border-emerald-500/20',
              },
              {
                icon: <Shield size={22} />,
                title: 'Conflict Detection',
                desc: 'AI-powered detection surfaces when decisions contradict each other across your organization.',
                color: 'from-blue-500/20 to-blue-500/5',
                borderHover: 'hover:border-blue-500/20',
              },
              {
                icon: <Zap size={22} />,
                title: 'Lifecycle States',
                desc: 'Decisions flow through Fresh → Stable → At Risk → Stale → Invalidated, keeping everyone aware.',
                color: 'from-amber-500/20 to-amber-500/5',
                borderHover: 'hover:border-amber-500/20',
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-sm p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 ${f.borderHover}`}
                style={{ animation: `pulse-glow 4s ease-in-out infinite ${i * 1.5}s` }}
              >
                {/* Icon with gradient bg */}
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.color} p-3 text-white`}>
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="relative border-t border-[var(--border)] py-20 sm:py-28 bg-[var(--bg-secondary)]/20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="mb-12 sm:mb-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Three steps to clarity
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)]">
              From logging to insight — in seconds.
            </p>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-3 sm:gap-6">
            {/* Connector line (desktop only) */}
            <div className="pointer-events-none absolute top-[52px] left-[16.7%] right-[16.7%] hidden sm:block">
              <div className="h-px bg-gradient-to-r from-transparent via-foreground/[0.12] to-transparent" />
            </div>

            {[
              { step: '01', title: 'Log a decision', desc: 'Document your decision with confidence level, perceived risk, and key assumptions.' },
              { step: '02', title: 'Track signals', desc: 'Add supporting or contradicting signals over time. Watch confidence shift in real-time.' },
              { step: '03', title: 'Stay aware', desc: 'Get notified when decisions drift, conflict with each other, or need revisiting.' },
            ].map((s, i) => (
              <div key={i} className="relative text-center sm:text-left">
                {/* Step number */}
                <div className="mx-auto sm:mx-0 mb-5 flex h-[64px] w-[64px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 text-lg font-bold text-[var(--text-muted)] backdrop-blur-sm"
                  style={{ animation: 'float 6s ease-in-out infinite', animationDelay: `${i * 0.8}s` }}
                >
                  {s.step}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-muted)] max-w-[280px] mx-auto sm:mx-0">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 px-6 py-14 sm:px-12 sm:py-16 text-center backdrop-blur-sm">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-[-50%] left-[20%] h-[300px] w-[300px] rounded-full bg-blue-500/[0.06] blur-[80px]" />
              <div className="absolute bottom-[-30%] right-[15%] h-[250px] w-[250px] rounded-full bg-purple-500/[0.04] blur-[80px]" />
            </div>

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Ready to make better decisions?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] max-w-md mx-auto">
                Start tracking your team&apos;s decisions today. Free to get started, no credit card required.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-foreground px-7 py-3.5 text-sm sm:text-base font-semibold text-background transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get started free
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
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
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-foreground text-background hover:opacity-90 
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
                        : 'bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-card-hover) border border-[var(--border)]'
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
                <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-foreground/[0.04] to-foreground/[0.01] blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)]/50">
                  <svg viewBox="0 0 40 40" className="w-8 h-8 text-[var(--text-muted)]" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <p className="mt-1.5 text-sm text-[var(--text-muted)] leading-relaxed">
                Start tracking your team&apos;s decisions to maintain<br className="hidden sm:inline" /> awareness over time.
              </p>

              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card-hover)] hover:text-foreground active:scale-[0.97]"
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
                  className="mt-6 text-sm text-(--text-muted) hover:text-foreground border border-[var(--border)] px-5 py-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors"
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
