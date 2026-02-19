import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Decision } from '@/types/decision'
import { decisionKeys } from './useDecision'

const supabase = createClient()

type DashboardData = {
    decisions: Decision[]
    signalsCounts: Record<string, number>
    conflictsCounts: Record<string, number>
}

async function fetchDashboardData(): Promise<DashboardData> {
    const [decisionsResult, signalsResult, conflictsResult] = await Promise.all([
        supabase.from('decisions').select('*').order('created_at', { ascending: false }),
        supabase.from('decision_signals').select('decision_id'),
        supabase.from('decision_conflicts').select('decision_a, decision_b'),
    ])

    const decisions = decisionsResult.data ?? []

    // Build signals count map
    const signalsCounts: Record<string, number> = {}
    signalsResult.data?.forEach((s: { decision_id: string }) => {
        signalsCounts[s.decision_id] = (signalsCounts[s.decision_id] || 0) + 1
    })

    // Build conflicts count map
    const conflictsCounts: Record<string, number> = {}
    conflictsResult.data?.forEach((c: { decision_a: string; decision_b: string }) => {
        conflictsCounts[c.decision_a] = (conflictsCounts[c.decision_a] || 0) + 1
        conflictsCounts[c.decision_b] = (conflictsCounts[c.decision_b] || 0) + 1
    })

    return { decisions, signalsCounts, conflictsCounts }
}

export function useDashboard() {
    return useQuery({
        queryKey: decisionKeys.all,
        queryFn: fetchDashboardData,
    })
}
