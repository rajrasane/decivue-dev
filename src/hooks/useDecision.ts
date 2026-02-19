import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Decision, DecisionSignal, DecisionConflict, DecisionHistory } from '@/types/decision'
import {
    calculateCurrentConfidence,
    determineLifecycleState,
    generateInsight,
} from '@/lib/decision-intelligence'
import { differenceInCalendarDays } from 'date-fns'

const supabase = createClient()

// ─── Query Keys ────────────────────────────────────────────
export const decisionKeys = {
    all: ['decisions'] as const,
    detail: (id: string) => ['decision', id] as const,
    signals: (id: string) => ['decision', id, 'signals'] as const,
    conflicts: (id: string) => ['decision', id, 'conflicts'] as const,
    history: (id: string) => ['decision', id, 'history'] as const,
}

// ─── Fetch Functions ───────────────────────────────────────
async function fetchDecision(id: string) {
    const { data, error } = await supabase.from('decisions').select('*').eq('id', id).single()
    if (error) throw error
    return data as Decision
}

async function fetchSignals(id: string) {
    const { data } = await supabase.from('decision_signals').select('*').eq('decision_id', id).order('created_at', { ascending: false })
    return (data ?? []) as DecisionSignal[]
}

async function fetchConflicts(id: string) {
    const { data } = await supabase.from('decision_conflicts').select('*').or(`decision_a.eq.${id},decision_b.eq.${id}`)
    if (!data || data.length === 0) return [] as (DecisionConflict & { other_decision?: Decision })[]

    const otherIds = data.map((c: { decision_a: string; decision_b: string }) => c.decision_a === id ? c.decision_b : c.decision_a)
    const { data: otherDecisions } = await supabase.from('decisions').select('*').in('id', otherIds)

    const decisionsMap = new Map(otherDecisions?.map((d: Decision) => [d.id, d]) || [])
    return data.map((conflict: DecisionConflict) => ({
        ...conflict,
        other_decision: decisionsMap.get(conflict.decision_a === id ? conflict.decision_b : conflict.decision_a)
    })) as (DecisionConflict & { other_decision?: Decision })[]
}

async function fetchHistory(id: string) {
    const { data } = await supabase.from('decision_history').select('*').eq('decision_id', id).order('created_at', { ascending: false })
    return (data ?? []) as DecisionHistory[]
}

// ─── Main Hook ─────────────────────────────────────────────
export function useDecision(id: string) {
    const queryClient = useQueryClient()

    // Parallel queries — React Query deduplicates automatically
    const { data: decision = null, isLoading: decisionLoading } = useQuery({
        queryKey: decisionKeys.detail(id),
        queryFn: () => fetchDecision(id),
    })

    const { data: signals = [] } = useQuery({
        queryKey: decisionKeys.signals(id),
        queryFn: () => fetchSignals(id),
    })

    const { data: conflicts = [] } = useQuery({
        queryKey: decisionKeys.conflicts(id),
        queryFn: () => fetchConflicts(id),
    })

    const { data: history = [] } = useQuery({
        queryKey: decisionKeys.history(id),
        queryFn: () => fetchHistory(id),
    })

    // ─── Computed Values ───────────────────────────────────
    const computed = useMemo(() => {
        if (!decision) return { currentConfidence: 0, daysSinceReview: 0, lifecycleState: 'fresh' as const, insight: '' }
        const conf = calculateCurrentConfidence(decision, signals.length, conflicts.length)
        const days = differenceInCalendarDays(new Date(), new Date(decision.last_reviewed_at))
        return {
            currentConfidence: conf,
            daysSinceReview: days,
            lifecycleState: determineLifecycleState(conf, days, signals.length, conflicts.length),
            insight: generateInsight({
                decision,
                currentConfidence: conf,
                signals,
                conflicts,
                conflictingDecisionStatements: conflicts
                    .map(c => c.other_decision?.statement)
                    .filter((s): s is string => !!s),
            }),
        }
    }, [decision, signals, conflicts])

    // ─── Mutations ─────────────────────────────────────────
    const reaffirmMutation = useMutation({
        mutationFn: async () => {
            if (!decision) throw new Error('No decision')
            const timestamp = new Date().toISOString()
            await supabase.from('decision_history').insert({
                decision_id: decision.id,
                action_type: 'reaffirmed',
                previous_state: { last_reviewed_at: decision.last_reviewed_at },
                new_state: { last_reviewed_at: timestamp },
                change_summary: 'Decision reaffirmed. Freshness confirmed.',
            })
            await supabase.from('decisions').update({ last_reviewed_at: timestamp }).eq('id', decision.id)
            return timestamp
        },
        onSuccess: (timestamp) => {
            // Optimistic: update decision cache directly
            queryClient.setQueryData(decisionKeys.detail(id), (old: Decision | undefined) =>
                old ? { ...old, last_reviewed_at: timestamp } : old
            )
            // Invalidate history to show new entry
            queryClient.invalidateQueries({ queryKey: decisionKeys.history(id) })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!decision) throw new Error('No decision')
            await Promise.all([
                supabase.from('decision_signals').delete().eq('decision_id', decision.id),
                supabase.from('decision_conflicts').delete().or(`decision_a.eq.${decision.id},decision_b.eq.${decision.id}`),
                supabase.from('decision_history').delete().eq('decision_id', decision.id),
            ])
            await supabase.from('decisions').delete().eq('id', decision.id)
        },
        onSuccess: () => {
            // Invalidate dashboard list
            queryClient.invalidateQueries({ queryKey: decisionKeys.all })
        },
    })

    const dismissSignalMutation = useMutation({
        mutationFn: async (signal: DecisionSignal) => {
            if (!decision) throw new Error('No decision')
            await supabase.from('decision_history').insert({
                decision_id: decision.id,
                action_type: 'signal_dismissed',
                previous_state: { signal_type: signal.signal_type, description: signal.description },
                new_state: null,
                change_summary: `Dismissed signal: ${signal.description}`,
            })
            await supabase.from('decision_signals').delete().eq('id', signal.id)
            return signal.id
        },
        onSuccess: (signalId) => {
            // Optimistic: remove from signals cache
            queryClient.setQueryData(decisionKeys.signals(id), (old: DecisionSignal[] | undefined) =>
                old?.filter(s => s.id !== signalId) ?? []
            )
            queryClient.invalidateQueries({ queryKey: decisionKeys.history(id) })
        },
    })

    const dismissConflictMutation = useMutation({
        mutationFn: async (conflictId: string) => {
            const conflict = conflicts.find(c => c.id === conflictId)
            if (decision && conflict) {
                await supabase.from('decision_history').insert({
                    decision_id: decision.id,
                    action_type: 'conflict_resolved',
                    previous_state: { conflict_explanation: conflict.conflict_explanation },
                    new_state: null,
                    change_summary: `Resolved conflict: ${conflict.conflict_explanation?.slice(0, 80) ?? 'Unknown conflict'}`,
                })
            }
            await supabase.from('decision_conflicts').delete().eq('id', conflictId)
            return conflictId
        },
        onSuccess: (conflictId) => {
            // Optimistic: remove from conflicts cache
            queryClient.setQueryData(decisionKeys.conflicts(id), (old: (DecisionConflict & { other_decision?: Decision })[] | undefined) =>
                old?.filter(c => c.id !== conflictId) ?? []
            )
            queryClient.invalidateQueries({ queryKey: decisionKeys.history(id) })
        },
    })

    // ─── Stable Callbacks (per mutation-prefer-mutate rule: use mutate, not mutateAsync) ──
    const reaffirm = useCallback(() => { reaffirmMutation.mutate() }, [reaffirmMutation])
    const deleteDecision = useCallback(() => deleteMutation.mutateAsync(), [deleteMutation])
    const dismissSignal = useCallback((signal: DecisionSignal) => { dismissSignalMutation.mutate(signal) }, [dismissSignalMutation])
    const dismissConflict = useCallback((conflictId: string) => { dismissConflictMutation.mutate(conflictId) }, [dismissConflictMutation])

    const reload = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['decision', id] })
    }, [queryClient, id])

    return {
        decision, signals, conflicts, history,
        isLoading: decisionLoading,
        isReaffirming: reaffirmMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isDismissing: dismissSignalMutation.isPending,
        ...computed,
        reaffirm, deleteDecision, dismissSignal, dismissConflict, reload,
    }
}
