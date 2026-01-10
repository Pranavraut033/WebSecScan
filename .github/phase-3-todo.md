# Phase 3 TODO — Copilot-Friendly Checklist

This checklist translates Phase 2 feedback into concrete, automatable tasks for Phase 3. Follow `.github/copilot-instructions.md` rules: deterministic logic, strict TypeScript, server-only scanning, OWASP mapping, tests for every rule.

## Scoring Refactor
- [ ] Replace letter grades with numeric score (0–100) + risk bands (Low ≥80, Medium 60–79, High 40–59, Critical <40).
- [ ] Update `src/lib/scoring.ts` to export `getRiskLevel(score)` and `getRiskColor(level)`.
- [ ] Update `src/components/ScoreCard.tsx` to show risk level badge and numeric score.
- [ ] Remove grade display from `src/components/ScanHistory.tsx`; compute risk from `score`.
- [ ] Keep Prisma unchanged; avoid new fields. Compute risk at render time.
- [ ] Document rationale and thresholds in `docs/scoring.md`.

## Diagrams & Documentation
- [ ] Add system architecture, agent workflow, and data flow diagrams (Mermaid) to `docs/architecture.md`.
- [ ] Create `docs/benchmarking.md` (methodology vs OWASP ZAP, metrics, procedure).
- [ ] Create `docs/real-world-testing.md` (targets, consent, metrics capture, safety constraints).
- [ ] Create `docs/authenticated-scans.md` (Playwright login flow, config, scope, safeguards).
- [ ] Create `docs/crawler-design.md` (limits: maxDepth/maxPages/rateLimit, robots.txt, trade-offs).
- [ ] Create `docs/references.md` (OWASP, CVSS, NIST, Mozilla Observatory, recent peer-reviewed papers).
- [ ] Update `mkdocs.yml` nav to include new docs; ensure Mermaid via `pymdownx.superfences`.

## Evaluation & Benchmarking
- [ ] Add Docker task to run OWASP Juice Shop locally for permitted testing.
- [ ] Create benchmarking script/harness to run WebSecScan (STATIC, DYNAMIC, BOTH) and record metrics.
- [ ] Run OWASP ZAP baseline/full scan with equivalent constraints (no destructive tests) and collect metrics.
- [ ] Add comparative results (coverage, findings by OWASP category, false positives, runtime, resource use) to `docs/benchmarking.md`.

## Crawler & Auth Scans
- [ ] Review and document crawler defaults in `src/security/dynamic/crawler.ts` (e.g., `maxDepth`, `maxPages`, `rateLimit`, `respectRobotsTxt`, `allowExternalLinks`).
- [ ] Expose sane config via UI/API with validation; keep safe defaults.
- [ ] Implement authenticated scan flow (optional config: login URL, selectors, credentials) using Playwright.
- [ ] Enforce safety constraints (no brute force, rate limiting, explicit consent) for auth scans.

## Tests & CI
- [ ] Add unit tests for scoring changes (`__tests__/scanLogger.test.ts` or new `scoring.test.ts`).
- [ ] Expand analyzer unit tests and integration tests to cover new docs/flows and edge cases.
- [ ] Add false-positive analysis procedure and sample validation notes in `docs/benchmarking.md`.
- [ ] Ensure CI gates: `tsc --noEmit`, ESLint, and tests must pass before merge.
- [ ] Verify no hardcoded secrets; inputs validated/sanitized in server routes/actions.

## UI/UX & Ethics
- [ ] Add explicit consent checkbox in scan UI for real-world targets.
- [ ] Display risk banding consistently in results/history.
- [ ] Update docs’ ethical guidance and safety constraints across `docs/security-ethics.md` and new docs.

## Copilot Constraints (do not skip)
- [ ] Deterministic rule checks; no placeholder/fake vulnerabilities.
- [ ] Strict TypeScript everywhere; avoid `any` unless justified.
- [ ] Scanning logic server-only (Server Actions/API routes); client never runs scanners.
- [ ] OWASP terminology and severity mapping adhered to.
- [ ] Small, modular rule implementations with clear remediation comments.
- [ ] Unit tests per agent rule + integration tests against `test-fixtures/`.
- [ ] Update `README.md`, `agents.md`, `tasks.md` as relevant.

## Quick Commands (reference)

Type checks & tests:

```bash
npm run lint
npm run test
npm run typecheck
```

Docs (local preview):

```bash
pip install mkdocs mkdocs-material pymdown-extensions
mkdocs serve
```

Optional local target (safe, permitted):

```bash
docker run -d -p 3000:3000 bkimminich/juice-shop
```
