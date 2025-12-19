# Agent Tasks

This document outlines task responsibilities and important safety constraints for each agent in WebSecScan.

## Static Analysis Agent Tasks
1. Parse JS/TS and HTML templates.
2. Identify dangerous APIs and unsafe sinks (e.g., `eval`, `innerHTML`).
3. Detect basic hardcoded secrets via regex rules.
4. Validate presence of CSP, secure cookies, and other headers when possible from source.
5. Produce structured vulnerabilities with severity and confidence.

## Dynamic Analysis Agent Tasks
1. Conservative crawling (honor robots.txt, rate-limited).
2. Test for reflected XSS using non-destructive payloads.
3. Validate security headers (CSP, HSTS, X-Frame-Options, etc.).
4. Perform basic auth checks (cookie attributes, insecure redirects) without brute force.
5. Record evidence (HTTP request/response, screenshots) for each finding.

**Important safety constraints:** dynamic tests are non-destructive — no brute force, no DoS, no credential stuffing, and timeouts/rate-limits are enforced.

## Library Scanner Agent Tasks
1. Parse dependency manifests (`package.json`) and lock files.
2. Map package versions to advisories via curated feeds (NVD/CVE or advisory indexes).
3. Suggest minimal remediation guidance (upgrade paths, patches).

## Task Execution & Monitoring
- Tasks execute asynchronously; progress and status are stored in Prisma `Scan` objects.
- Logs for debugging are server-side only. Exportable reports are generated from saved results.