import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const requireModule = createRequire(import.meta.url);
const source = fs.readFileSync('src/lib/decision-intelligence.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleBox = { exports: {} };
vm.runInNewContext(compiled, { exports: moduleBox.exports, module: moduleBox, require: requireModule });
const { calculateCurrentConfidence: confidence, determineLifecycleState: state, generateInsight: insight } = moduleBox.exports;
const now = new Date('2026-11-13T12:00:00Z');
const decision = { initial_confidence: 90, perceived_risk: 'medium', last_reviewed_at: '2026-11-03T12:00:00Z' };
assert.equal(confidence(decision, 0, 0, now), 80);
assert.equal(confidence(decision, 1, 1, now), 65);
assert.equal(confidence({ ...decision, last_reviewed_at: now.toISOString() }, 1, 1, now), 75);
assert.equal(confidence(decision, 20, 10, now), 0);
assert.equal(state(90, 1, 0, 0), 'fresh');
assert.equal(state(65, 10, 1, 1), 'at_risk');
assert.equal(state(65, 10, 1, 0), 'stable');
assert.equal(state(35, 10, 0, 0), 'stale');
assert.equal(state(10, 10, 0, 0), 'invalidated');
// A freshly saved review can be a few seconds ahead of the dashboard's minute snapshot.
assert.equal(confidence({ ...decision, last_reviewed_at: '2026-11-13T12:00:30Z' }, 0, 0, now), 90);

// Historical snapshots must drive insight text as well as the score, independent of the wall clock.
const agingDecision = { ...decision, last_reviewed_at: '2000-01-01T12:00:00Z' };
const beforeAging = new Date('2000-01-15T12:00:00Z');
const afterAging = new Date('2000-01-16T12:00:00Z');
assert.equal(insight(agingDecision, 90, 0, 0, beforeAging), 'Decision is 90% confident and stable. No action needed.');
assert.equal(insight(agingDecision, 90, 0, 0, afterAging), 'Not reviewed in 15 days. Reaffirm or revise.');
assert.equal(insight({ decision: agingDecision, currentConfidence: 90, now: afterAging }), 'Not reviewed in 15 days. Reaffirm or revise.');
assert.equal(insight(agingDecision, 90, 0, 1, afterAging), '1 conflict detected. Review and revise to resolve.');

// Preserve the existing local-calendar-day scoring rule across daylight-saving transitions.
const originalTimezone = process.env.TZ;
try {
    process.env.TZ = 'America/New_York';
    assert.equal(confidence({ ...decision, last_reviewed_at: '2026-03-07T12:00:00-05:00' }, 0, 0, new Date('2026-03-08T12:00:00-04:00')), 89);
} finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
}
console.log('15 deterministic confidence/lifecycle assertions passed. No backend calls.');
