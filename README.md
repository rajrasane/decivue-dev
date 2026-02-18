# Decivue

A decision intelligence system that helps teams track the health and reliability of their decisions over time.

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=fff)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=fff)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

Organizations make critical decisions daily—choosing vendors, approving plans, prioritizing options. These decisions are made with incomplete information and temporary assumptions. Over time, conditions change, assumptions break, and the original reasoning fades. Yet the decision continues to influence actions.

Most tools focus on tasks and execution. Decivue focuses on the decisions themselves.

## What It Does

Decivue treats decisions as living entities, not static records. Each decision has:

- A clear statement of the choice made
- Initial confidence level (0-100%)
- Key assumptions/logic behind it
- Perceived risk level (low/medium/high/critical)

The system tracks how decision reliability evolves through:

**Confidence Decay** — Decisions naturally lose reliability over time. Higher risk decisions decay faster:
- Low risk: 0.5% per day
- Medium: 1% per day  
- High: 2% per day
- Critical: 3% per day

**Structural Penalties** — Active issues reduce confidence until resolved:
- Each signal: -5% confidence
- Each conflict: -10% confidence

These penalties persist even after reaffirming — you must dismiss signals or resolve conflicts to restore full confidence.

**Lifecycle States** — Decisions move through states based on confidence, time, and issues:
- **Fresh** → ≥80% confidence, reviewed within 7 days, no issues
- **Stable** → ≥60% confidence, minor issues (1-2 signals or 1 conflict)
- **At Risk** → Multiple issues (3+ issue score) or confidence dropping
- **Stale** → <40% confidence or >60 days without review
- **Invalidated** → <15% confidence

**Signals** — Users can report external changes that affect a decision (market shifts, team changes, budget constraints, etc.)

**Conflict Detection** — When creating a new decision, the AI checks for conflicts with existing decisions and explains them in plain language.

**History Timeline** — Complete audit trail of reaffirmations, edits, and dismissed signals.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Tailwind CSS
- Google Gemini AI (for conflict detection)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/rajrasane/decivue-dev.git
cd decivue
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Database

Schema overview:

![Database Schema](docs/schema.png)

Run [`docs/schema.sql`](docs/schema.sql) in Supabase SQL Editor to create the tables.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── decision/[id]/page.tsx      # Decision detail
│   └── api/detect-conflicts/       # Gemini AI endpoint
├── components/
│   ├── decision/                   # Detail page components
│   │   ├── ConflictsSection.tsx
│   │   ├── DangerZone.tsx
│   │   ├── DecisionDetails.tsx
│   │   ├── InfoCards.tsx
│   │   └── SignalsSection.tsx
│   ├── ui/tooltip.tsx              # UI primitives
│   ├── AddSignalModal.tsx
│   ├── ConfidenceGauge.tsx
│   ├── CreateDecisionForm.tsx
│   ├── DecisionCard.tsx
│   ├── DeleteConfirmModal.tsx
│   ├── DismissSignalModal.tsx
│   ├── EditDecisionModal.tsx
│   ├── ErrorBoundary.tsx
│   ├── HistoryTimeline.tsx
│   ├── SiteFooter.tsx
│   └── SiteHeader.tsx
├── hooks/
│   └── useDecision.ts              # Data fetching
├── lib/
│   ├── decision-intelligence.ts    # Core algorithms
│   └── supabase/                   # DB clients
└── types/
    └── decision.ts                 # TypeScript
```

## How It Works

The core logic lives in `decision-intelligence.ts`:

```typescript
// Confidence calculation includes structural penalties
currentConfidence = initialConfidence 
  - (daysSinceReview * decayRate)  // Time decay (reset by Reaffirm)
  - (signalsCount * 5)              // Signal penalty (must dismiss to clear)
  - (conflictsCount * 10)           // Conflict penalty (must resolve to clear)

// State transitions based on confidence, time, AND issue count
const issueScore = signalsCount + (conflictsCount * 2)

if (confidence < 15) return 'invalidated'
if (confidence < 40 || days > 60) return 'stale'
if (issueScore >= 3) return 'at_risk'  // Too many issues
if (issueScore === 0 && days <= 7 && confidence >= 80) return 'fresh'
if (confidence >= 60 && days <= 30) return 'stable'
return 'at_risk'
```

**Key Behavior:**
- **Reaffirm** resets time decay only — signal/conflict penalties persist
- **Dismiss Signal** removes a signal and restores 5% confidence
- **Resolve Conflict** removes a conflict and restores 10% confidence
- Many issues (3+ score) force "At Risk" state regardless of confidence

## Notes

- **No authentication** — By design, Decivue focuses on core decision intelligence rather than access control. Authentication can be added later as needed.
- **Minimal UI** — The target users are non-technical teams (managers, leads, planners). The interface is intentionally clean and jargon-free so anyone can understand decision health at a glance.
- **Fully responsive** — Works on desktop, tablet, and mobile. Decision-makers can check on their decisions from anywhere.

## Screenshots


![Dashboard](docs/screenshots/dashboard.png)  
![Detail](docs/screenshots/detail.png)
