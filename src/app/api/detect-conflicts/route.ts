import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
    try {
        // Auth check — reject unauthenticated requests
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { newDecisionStatement, newDecisionLogic } = body

        // Input validation
        if (typeof newDecisionStatement !== 'string' || newDecisionStatement.trim().length === 0) {
            return NextResponse.json({ error: 'Invalid decision statement' }, { status: 400 })
        }
        if (newDecisionStatement.length > 2000) {
            return NextResponse.json({ error: 'Decision statement too long' }, { status: 400 })
        }

        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY not set, skipping conflict detection')
            return NextResponse.json({ conflicts: [] })
        }

        // Get all existing decisions
        const { data: existingDecisions, error } = await supabase
            .from('decisions')
            .select('id, statement, logic')
            .neq('lifecycle_state', 'invalidated')

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ conflicts: [] })
        }

        if (!existingDecisions || existingDecisions.length === 0) {
            return NextResponse.json({ conflicts: [] })
        }

        // Prepare prompt for Gemini with actual IDs
        const existingDecisionsText = existingDecisions
            .map((d) => `ID: ${d.id}\nStatement: "${d.statement}"\nAssumptions: ${d.logic?.join(', ') || 'none'}`)
            .join('\n\n')

        const prompt = `You are a decision intelligence assistant. Analyze if this new decision conflicts with any existing decisions.

NEW DECISION:
Statement: "${newDecisionStatement}"
Assumptions: ${Array.isArray(newDecisionLogic) ? newDecisionLogic.join(', ') : 'none'}

EXISTING DECISIONS:
${existingDecisionsText}

A conflict exists when decisions:
- Directly contradict each other (e.g., "use vendor A" vs "use vendor B")
- Have incompatible resource usage
- Are based on mutually exclusive assumptions

If conflicts exist, respond with a JSON array:
[
  {
    "decision_id": "the UUID of the conflicting decision",
    "explanation": "brief explanation (max 50 words)"
  }
]

If NO conflicts, respond with: []

IMPORTANT: Only respond with the JSON array, nothing else.`

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Parse the JSON response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/)
        const conflicts = jsonMatch ? JSON.parse(jsonMatch[0]) : []

        return NextResponse.json({ conflicts })
    } catch (err) {
        console.error('Conflict detection error:', err)
        // Return empty conflicts on error — generic message, no internal details
        return NextResponse.json({ conflicts: [] })
    }
}
