export type Decision = {
    id: string
    statement: string
    initial_confidence: number
    logic: string[]
    perceived_risk: 'low' | 'medium' | 'high' | 'critical'
    lifecycle_state: 'fresh' | 'stable' | 'at_risk' | 'stale' | 'invalidated'
    created_at: string
    last_reviewed_at: string
    updated_at: string
}

export type DecisionSignal = {
    id: string
    decision_id: string
    signal_type: 'aging' | 'external_change' | 'assumption_broken' | 'team_feedback'
    description: string
    created_at: string
}

export type DecisionConflict = {
    id: string
    decision_a: string
    decision_b: string
    conflict_explanation: string
    detected_at: string
}

export type DecisionWithMetrics = Decision & {
    current_confidence: number
    days_since_review: number
    signals_count: number
    conflicts_count: number
}

export type DecisionHistory = {
    id: string
    decision_id: string
    action_type: 'created' | 'reaffirmed' | 'edited' | 'state_changed' | 'signal_added' | 'signal_dismissed'
    previous_state: Partial<Decision> | null
    new_state: Partial<Decision> | null
    change_summary: string
    created_at: string
}
