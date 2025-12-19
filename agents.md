# Agents

WebSecScan uses specialized, modular agents that each perform a focused set of deterministic security checks (no ML). Agents are configured centrally and run in isolated worker environments (processes, containers, or dedicated threads) to limit blast radius and allow safe resource management.

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
  - `xssTester` — sends safe reflected XSS payloads that do not exploit chained vulnerabilities; captures page responses and DOM reflections.
  - `authChecks` — verifies presence of insecure auth patterns (e.g., weak redirects, missing session flags) without brute forcing credentials.
- Implementation note: Uses Playwright (headless) and enforces explicit timeouts and request throttling.

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