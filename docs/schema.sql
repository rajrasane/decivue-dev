CREATE TABLE decisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    statement TEXT NOT NULL,
    initial_confidence INTEGER NOT NULL CHECK (initial_confidence BETWEEN 0 AND 100),
    logic TEXT[] DEFAULT '{}',
    perceived_risk TEXT NOT NULL CHECK (perceived_risk IN ('low', 'medium', 'high', 'critical')),
    lifecycle_state TEXT DEFAULT 'fresh' CHECK (lifecycle_state IN ('fresh', 'stable', 'at_risk', 'stale', 'invalidated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE decision_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE decision_conflicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_a UUID REFERENCES decisions(id) ON DELETE CASCADE,
    decision_b UUID REFERENCES decisions(id) ON DELETE CASCADE,
    conflict_explanation TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE decision_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('created', 'reaffirmed', 'edited', 'state_changed', 'signal_added', 'signal_dismissed', 'conflict_resolved')),
    previous_state JSONB,
    new_state JSONB,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);