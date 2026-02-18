import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Decision, DecisionSignal, DecisionConflict, DecisionHistory } from '@/types/decision'
import {
    calculateCurrentConfidence,
    determineLifecycleState,
    generateInsight,
} from '@/lib/decision-intelligence'
import { differenceInCalendarDays } from 'date-fns'

const supabase = createClient()

export function useDecision(id: string) {
    const [decision, setDecision] = useState<Decision | null>(null)
    const [signals, setSignals] = useState<DecisionSignal[]>([])
    const [conflicts, setConflicts] = useState<(DecisionConflict & { other_decision?: Decision })[]>([])
    const [history, setHistory] = useState<DecisionHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isReaffirming, setIsReaffirming] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDismissing, setIsDismissing] = useState(false)

    const loadDecision = useCallback(async () => {
        const [decisionResult, signalsResult, conflictsResult, historyResult] = await Promise.all([
            supabase.from('decisions').select('*').eq('id', id).single(),
            supabase.from('decision_signals').select('*').eq('decision_id', id).order('created_at', { ascending: false }),
            supabase.from('decision_conflicts').select('*').or(`decision_a.eq.${id},decision_b.eq.${id}`),
            supabase.from('decision_history').select('*').eq('decision_id', id).order('created_at', { ascending: false }),
        ])

        if (decisionResult.data) {
            setDecision(decisionResult.data)
            setSignals(signalsResult.data || [])
            setHistory(historyResult.data || [])

            if (conflictsResult.data && conflictsResult.data.length > 0) {
                const otherIds = conflictsResult.data.map((c: { decision_a: string; decision_b: string }) => c.decision_a === id ? c.decision_b : c.decision_a)
                const { data: otherDecisions } = await supabase.from('decisions').select('*').in('id', otherIds)

                const decisionsMap = new Map(otherDecisions?.map((d: Decision) => [d.id, d]) || [])
                setConflicts(conflictsResult.data.map((conflict: { decision_a: string; decision_b: string;[key: string]: unknown }) => ({
                    ...conflict,
                    other_decision: decisionsMap.get(conflict.decision_a === id ? conflict.decision_b : conflict.decision_a)
                })))
            } else {
                setConflicts([])
            }
        }
        setIsLoading(false)
    }, [id])

    useEffect(() => { loadDecision() }, [loadDecision])

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

    const reaffirm = useCallback(async () => {
        if (!decision) return
        setIsReaffirming(true)
        const timestamp = new Date().toISOString()

        const { error: historyError } = await supabase.from('decision_history').insert({
            decision_id: decision.id,
            action_type: 'reaffirmed',
            previous_state: { last_reviewed_at: decision.last_reviewed_at },
            new_state: { last_reviewed_at: timestamp },
            change_summary: `Decision reaffirmed. Freshness confirmed.`,
        })

        if (!historyError) {
            await supabase.from('decisions').update({ last_reviewed_at: timestamp }).eq('id', decision.id)
            setDecision({ ...decision, last_reviewed_at: timestamp })
            await loadDecision()
        }
        setIsReaffirming(false)
    }, [decision, loadDecision])

    const deleteDecision = useCallback(async () => {
        if (!decision) return
        setIsDeleting(true)
        await Promise.all([
            supabase.from('decision_signals').delete().eq('decision_id', decision.id),
            supabase.from('decision_conflicts').delete().or(`decision_a.eq.${decision.id},decision_b.eq.${decision.id}`),
            supabase.from('decision_history').delete().eq('decision_id', decision.id),
        ])
        await supabase.from('decisions').delete().eq('id', decision.id)
    }, [decision])

    const dismissSignal = useCallback(async (signal: DecisionSignal) => {
        if (!decision || isDismissing) return
        setIsDismissing(true)
        try {
            await supabase.from('decision_history').insert({
                decision_id: decision.id,
                action_type: 'signal_dismissed',
                previous_state: { signal_type: signal.signal_type, description: signal.description },
                new_state: null,
                change_summary: `Dismissed signal: ${signal.description}`,
            })
            await supabase.from('decision_signals').delete().eq('id', signal.id)
            await loadDecision()
        } finally {
            setIsDismissing(false)
        }
    }, [decision, isDismissing, loadDecision])

    const dismissConflict = useCallback(async (conflictId: string) => {
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
        loadDecision()
    }, [decision, conflicts, loadDecision])

    return {
        decision, signals, conflicts, history,
        isLoading, isReaffirming, isDeleting, isDismissing,
        ...computed,
        reaffirm, deleteDecision, dismissSignal, dismissConflict, reload: loadDecision,
    }
}
