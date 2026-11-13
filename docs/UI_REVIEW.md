# Decivue independent UI review — 13 November 2026

The attached redesign was restored and independently reviewed on the local branch `design/decision-lifecycle-experience`. The editorial landing, interactive decision lifecycle and dashboard refinements are preserved. No repository changes have been pushed, deployed, merged or published.

## Provenance and scope

- Repository: `rajrasane/decivue-dev`.
- Base: `5ee0e5c2e67dfd8e190c7d8756b7aa997d63529d`.
- Supplied work: `decivue-review.patch`, described by the requester as the diff of local commit `5dcbd339615838376ce5bb7a5e0cff634b9270a2` against the base. The original commit object was not supplied; its patch applied cleanly.
- Attachment SHA-256: `7cc9a0db5f9d0758983013ca066c390e85d2f75a455f61558bcb23e4dfdb93bb`.
- Inspected the README and application structure. This checkout and its workspace have no applicable `AGENTS.md` or `.agents/skills` files.
- All changes remain within the original ten files listed below. Dependency manifests, lockfiles, application configuration, auth/API implementations and schema are unchanged. No credential files were created, read or modified.

## Findings corrected during independent review

1. **Browser Back after the workflow anchor.** The native hash anchor created a history entry without Next router state. After opening the workflow, following signup and pressing Back, the URL returned to the landing but the signup form remained visible. The anchor now uses Next `Link`. Desktop and mobile browser regression checks pass.
2. **Inconsistent review age and insight clock.** A decision saved or refreshed seconds after the dashboard's minute snapshot could display `-1d since review`. Both dashboard age calculations now use the same `differenceInDays` semantics as confidence scoring. Insight generation accepts the captured timestamp too. Regression coverage includes a recent save, minute/day boundaries, historical insight aging and daylight-saving transitions. Scoring rates, penalties and lifecycle thresholds are unchanged.
3. **Text contrast and small labels.** Increased new landing label contrast and key microcopy sizes. Corrected shared muted text and light-theme status/signal/danger colors so dashboard metadata and confidence labels are readable. Automated contrast checks now pass in the tested landing/dashboard states.
4. **Mobile card hierarchy.** The 120px confidence gauge crowded decision titles on narrow screens. Cards use an 80px gauge below the small breakpoint and retain 120px on larger screens; only one variant is visible and exposed at a time.
5. **Lifecycle control semantics.** Added the missing group role so the interactive example's accessible group name is exposed.

Visual review confirms the warm paper/forest palette, editorial typography, explicit reasoning example and restrained dashboard hierarchy remain intact. The illustrative score is clearly labelled as a rule-based indicator, not a probability.

## Independent verification

| Check | Result |
| --- | --- |
| Production webpack build | Passed independently before the final browser fixes |
| Final default Turbopack production build | Passed with synthetic configuration and the environment-only system TLS setting described below |
| TypeScript, `npx --no-install tsc --noEmit` | Passed on final source |
| `npm run lint` | Zero errors; the same two warnings in unchanged files: anonymous default export in `cloudflare-worker/worker.js:6`, unused `options` in `src/lib/supabase/middleware.ts:18` |
| `node scripts/check-landing.mjs` | Eight server-render assertions passed |
| `node scripts/check-confidence.mjs` | Fifteen deterministic confidence/lifecycle/insight assertions passed |
| Landing browser interactions | Sixteen scenario checks passed across 1440px and 390px: all lifecycle stages/associated copy, keyboard activation and visible focus, anchor position, signup/sign-in routes and Back, closing CTA, theme persistence/hydration and reduced motion |
| Dashboard browser interactions | Twenty-one scenario checks passed: all lifecycle filters and ordering, search/clear/no-results, refresh disabling, recent-review regression, minute boundary, account-menu keyboard dismissal/focus return, create-modal open/Escape/scroll unlock, detail navigation/Back, empty account, themes and responsive gauges |
| Synthetic mutation flows | Four checks passed: create updates the dashboard, reaffirm resets age and records history, revise updates detail/history, and refresh shows the revised decision |
| Landing visual/accessibility matrix | Light/dark at 320, 390, 768, 1024 and 1440px: no horizontal overflow; zero axe WCAG 2 A/AA and 2.1 AA violations in all ten combinations |
| Dashboard visual/accessibility matrix | Light/dark at 320, 375 and 1440px: no horizontal overflow; zero axe WCAG 2 A/AA and 2.1 AA violations in all six combinations. Also checked 768px interaction layout |
| Browser runtime | No observed runtime/hydration errors or unexpected external requests in the final interaction suites |
| `git diff --check` | Passed |

The final build used these command-scoped placeholders; no `.env` file or config change was needed:

```sh
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 \
NEXT_PUBLIC_SUPABASE_URL=https://decivue-review.invalid \
NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-review-key \
NEXT_TELEMETRY_DISABLED=1 npm run build
```

The first default Turbopack attempt could not validate Google Fonts through the cloud TLS proxy. Next's documented system-certificate environment setting resolved it without disabling TLS verification. This is an environment requirement, not an application configuration change.

Browser QA ran against the locally served production build in Chromium/Playwright. Synthetic auth/REST responses were intercepted in an external test harness; a test-only preload also served synthetic auth to the server middleware. No live customer data, real accounts, or real backend mutations were used. Harnesses, screenshots and JSON results remain under `/workspace/work/` outside the repository (`landing-interactions.cjs`, `landing-qa.cjs`, `browser-qa/`, `dashboard-qa.cjs`, `qa/`). They are review evidence, not runtime dependencies.

## Remaining limits

- The unchanged create/edit dialogs lack complete dialog semantics and focus trapping/initialization/restoration. Escape and scroll unlock work. This inherited accessibility limitation is outside the ten-file scope; the zero-violation page scans do not certify modal accessibility.
- These checks do not verify real Supabase persistence/RLS, email/OAuth delivery, the Gemini service, deletion, signal/conflict mutations, or other browser engines. Live-service testing was intentionally excluded by the request.

## Exact ten-file publication scope

1. `docs/UI_REVIEW.md`
2. `scripts/check-confidence.mjs`
3. `scripts/check-landing.mjs`
4. `src/app/globals.css`
5. `src/app/page.tsx`
6. `src/components/DecisionCard.tsx`
7. `src/components/DecisionLanding.tsx`
8. `src/components/SiteHeader.tsx`
9. `src/components/ThemeToggle.tsx`
10. `src/lib/decision-intelligence.ts`

## Publication blocker

The requester reports that a previous permission review rejected uploading source to GitHub. Raj's explicit approval of these ten changed files is still outstanding. This review did not retry that upload or use another tool to bypass the restriction. Local verification does not grant permission to push, open a published PR, merge or deploy. Publication remains blocked until that explicit approval is obtained and the applicable permission review permits the action.
