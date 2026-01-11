# Agents

WebSecScan uses specialized, modular agents that each perform a focused set of deterministic security checks (no ML). Agents are configured centrally and run in isolated worker environments (processes, containers, or dedicated threads) to limit blast radius and allow safe resource management.

## 🚨 Critical Rule: OWASP 2025 Taxonomy Only

**ALL vulnerability detections MUST use OWASP Top 10 2025 taxonomy.**

- ✅ **Correct:** `owaspId: 'A02:2025'`, `owaspCategory: 'A02:2025 - Security Misconfiguration'`
- ❌ **WRONG:** `owaspId: 'A05:2021'` or any 2021 categories

**Before adding new rules:**
1. Consult [docs/owasp-mapping.md](docs/owasp-mapping.md) for correct 2025 categories
2. Import mapping utilities from [src/lib/owaspMapping.ts](src/lib/owaspMapping.ts)
3. Never guess category numbers — the order changed significantly from 2021 to 2025

**Key Changes to Remember:**
- Security Misconfiguration: A05:2021 → **A02:2025** (NOT A05:2025!)
- Cryptographic Failures: A02:2021 → **A04:2025**
- Injection: A03:2021 → **A05:2025**
- SSRF: A10:2021 → **A01:2025** (merged into Broken Access Control, use subtype)
- Exception Handling: **A10:2025** (NEW category)

See [docs/MIGRATION-SUMMARY.md](docs/MIGRATION-SUMMARY.md) for complete migration details.

---

## Scanning Agents

### Static Analysis Agent
- Purpose: Rule-based, deterministic analysis of source artifacts (JS/TS, HTML, templates).
- Components:
  - `jsAnalyzer` — detects dangerous APIs (e.g., `eval`, `new Function`), unsanitized sinks, insecure cookie usage, and hardcoded secrets via regex rules.
  - `htmlAnalyzer` — looks for unsafe `innerHTML` usage, missing/misconfigured CSP meta tags, and insecure form attributes.
  - `dependencyAnalyzer` — lightweight parsing of manifest files (`package.json`) to help static dependency checks.
- Output: Structured `Vulnerability` objects (see project spec) with ID (WSS-...), OWASP category, severity, confidence, evidence, and remediation guidance.

### Dynamic Analysis Agent
- Purpose: Safe, non-destructive runtime tests against a permitted target URL.
- Components:
  - `crawler` — conservative crawler that respects robots.txt and rate limits; discovers reachable endpoints and input points.
  - `xssTester` — sends safe reflected XSS payloads across 12 contexts (DOM, JSON, event handlers, SVG, template literals); captures page responses and DOM reflections without exploiting vulnerabilities.
  - `sqlTester` — error-based SQL injection detection using 7 safe payloads; identifies database error patterns across MySQL, PostgreSQL, MSSQL, Oracle, SQLite without data extraction.
  - `pathTraversalTester` — tests for directory traversal vulnerabilities using 8 payloads targeting Unix/Windows file systems; detects /etc/passwd, win.ini exposure without arbitrary file reads.
  - `csrfTester` — analyzes forms for CSRF tokens (8+ patterns), validates token entropy, checks SameSite cookie attributes; only flags state-changing methods.
  - `authScanner` — verifies session cookie security and tests for authentication bypass via 3 methods: unauthenticated access, invalid tokens, parameter manipulation.
  - `authChecks` — verifies presence of insecure auth patterns (e.g., weak redirects, missing session flags) without brute forcing credentials.
- Implementation note: Uses Playwright (headless) and enforces explicit timeouts and request throttling. All tests are rate-limited (300-1000ms) to prevent DoS.
- Safety guarantees: No exploit chaining, no brute force, no data extraction, no destructive operations. All findings are detection-only.

### Library Scanner Agent
- Purpose: Identify known vulnerable dependency versions and outdated packages.
- Behavior:
  - Parses package manifests and checks against curated vulnerability feeds (NVD/CVE or OSS advisory indexes) and local advisories.
  - Produces fix guidance and links to advisories.
- Safety: No network scanning nor credential usage beyond fetching public advisories.

## Agent Configuration & Safety
- Configuration options exposed via the UI or API include `scanMode` (STATIC/DYNAMIC/BOTH), `maxDepth`, `rateLimit`, and `allowExternalRequests`.
- Safety Constraints:
  - Dynamic tests are explicitly non-destructive: no brute force, no DoS, no exploit chaining, no automated account takeover.
  - Scans must be run only against assets you own or have written permission to test (the UI will show a consent checkbox).

## Outputs & Integration
- Agents emit structured results stored via Prisma `Scan`/`Vulnerability` models.
- Each finding includes a canonical ID, OWASP mapping, severity, confidence, evidence snippet, and remediation guidance to support developer action.
- Agents log verbose debug output to server-only logs (never to client-facing logs) to aid reproducible debugging.

## Extensibility
- New checks should be added as small, testable modules and registered with the agent runner. Modules must include unit tests and example inputs for deterministic behavior.

### Backward Compatibility Policy
- Agents and rule modules do not preserve backward compatibility by default.
- Prioritize deterministic correctness, clear OWASP mapping, and simplicity over legacy behavior.
- When changing outputs, schemas, or result shapes, update unit/integration tests and relevant docs (`README.md`, `agents.md`, `tasks.md`).
- Communicate breaking changes in release notes/changelogs; ensure CI gates (typecheck, lint, tests) enforce the new contract.