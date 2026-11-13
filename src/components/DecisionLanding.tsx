'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, GitCompare, History, Radio, RotateCcw } from 'lucide-react'

const stages = [
  { label: 'Decide', date: 'Day 01', confidence: 92, state: 'Fresh', note: 'The reasoning is recorded. The assumptions are clear.', signal: 'Choose a managed database for the next release.', assumption: 'Our usage will stay within the current pricing tier.', color: 'var(--fresh)' },
  { label: 'Observe', date: 'Day 18', confidence: 68, state: 'Stable', note: 'Time passes. A new signal challenges the original plan.', signal: 'Projected storage costs are higher than expected.', assumption: 'Recheck the cost assumption before the next release.', color: 'var(--stable)' },
  { label: 'Revisit', date: 'Day 26', confidence: 42, state: 'At risk', note: 'The decision deserves another look, not blind confidence.', signal: 'A new cost-reduction decision conflicts with this choice.', assumption: 'Compare both decisions and record the next review.', color: 'var(--at-risk)' },
]

/** Illustrative interaction only; no account or backend calls. */
export function DecisionLanding() {
  const [stageIndex, setStageIndex] = useState(0)
  const stage = stages[stageIndex]
  return (
    <main className="decision-landing">
      <section className="decision-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="tiny-mark" /> A living record of your reasoning</p>
          <h1>Good decisions<br />deserve a<br /><em>second look.</em></h1>
          <p className="hero-description">Keep the why behind every choice. Notice when assumptions change. Return to the decisions that need your attention.</p>
          <div className="hero-actions">
            <Link href="/signup" className="decision-primary">Start your decision log <ArrowUpRight size={17} /></Link>
            <Link href="#decision-demo" className="decision-text-link">Explore the workflow <ArrowDown size={15} /></Link>
          </div>
          <p className="hero-footnote">Your reasoning, connected over time.</p>
        </div>
        <div className="decision-stage" id="decision-demo">
          <div className="stage-caption"><span>THE LIFE OF A DECISION</span><span>INTERACTIVE EXAMPLE</span></div>
          <div className="stage-controls" role="group" aria-label="Explore the decision lifecycle">
            {stages.map((item, index) => <button key={item.label} type="button" onClick={() => setStageIndex(index)} aria-pressed={stageIndex === index} className={stageIndex === index ? 'selected' : ''}><span>0{index + 1}</span>{item.label}<ArrowRight size={14} /></button>)}
          </div>
          <article className="sample-decision" aria-live="polite" aria-atomic="true">
            <div className="sample-meta"><span>PRODUCT / INFRASTRUCTURE</span><span>{stage.date}</span></div>
            <div className="sample-heading"><h2>Build on a managed<br />database.</h2><span className="sample-state"><span style={{ background: stage.color }} />{stage.state}</span></div>
            <div className="sample-reason"><span className="eyebrow">THE REASONING</span><p>Less infrastructure to maintain.<br />More time to build the product.</p></div>
            <div className="sample-confidence"><span>Confidence indicator</span><strong>{stage.confidence}<small>/100</small></strong></div>
            <div className="confidence-track"><span style={{ width: `${stage.confidence}%`, background: stage.color }} /></div>
            <div className="sample-update"><Radio size={17} /><div><strong>{stage.signal}</strong><p>{stage.assumption}</p></div></div>
            <div className="sample-bottom"><span><History size={14} /> Reasoning stays in the record</span><span>DEC—001</span></div>
          </article>
          <p className="stage-note">{stage.note}</p>
          <p className="demo-disclaimer">Illustrative data and scores. Confidence is a rule-based indicator, not a probability of being right.</p>
        </div>
      </section>

      <section className="decision-principle" aria-labelledby="principle-title">
        <p className="eyebrow">LESS GUESSING. MORE CONTEXT.</p>
        <h2 id="principle-title">A decision is not finished<br />when you make it.</h2>
        <p>Plans meet reality. People forget the original context. Decivue brings the choice, the assumptions and what changed into the same place.</p>
      </section>

      <section className="decision-features" aria-label="How Decivue works">
        {[
          { icon: <Check size={21} />, number: '01', title: 'Keep the why.', description: 'Record the decision, the assumptions behind it and your starting confidence. Give future you something better than a vague memory.', detail: 'A clear starting point' },
          { icon: <Radio size={21} />, number: '02', title: 'Listen for change.', description: 'Add new signals and examine possible conflicts. AI can suggest contradictions; you decide what matters.', detail: 'Signals, not noise' },
          { icon: <RotateCcw size={21} />, number: '03', title: 'Close the loop.', description: 'Review decisions as confidence changes. Reaffirm, edit and preserve the history of how your thinking evolved.', detail: 'A record that grows with you' },
        ].map(feature => <article key={feature.number}><div className="feature-index"><span>{feature.number}</span>{feature.icon}</div><h3>{feature.title}</h3><p>{feature.description}</p><span className="feature-detail">{feature.detail}<ArrowUpRight size={14} /></span></article>)}
      </section>

      <section className="decision-bottom-cta"><div><p className="eyebrow"><GitCompare size={14} /> DECISION INTELLIGENCE, WITHOUT THE BLACK BOX</p><h2>Make the next review<br />a little clearer.</h2></div><Link href="/signup" className="decision-primary">Create your first decision <ArrowUpRight size={17} /></Link></section>
    </main>
  )
}
