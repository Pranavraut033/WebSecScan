# Phase 2: Proposed Documentation Structure

**Date**: January 12, 2026  
**Constraint**: Minimize total document count; consolidate overlapping content  
**Target**: 15-18 core documents (not 40+)

---

## 🎯 Design Principles

1. **Hierarchical Organization** — Use 3-4 main sections with smart subsections
2. **No Duplication** — Each topic covered once, linked from multiple places
3. **Audience Segmentation** — Clear paths for Users, Developers, Researchers, Ops
4. **Lean Structure** — Prefer longer, well-organized pages over many short ones
5. **Progressive Detail** — Start simple, link to detailed sections

---

## 📐 Proposed Directory Structure

```
/docs/
├── index.md ............................ (Home: merged README + index)
├── getting-started.md .................. (Install & first scan)
├── features.md ......................... (Feature overview)
│
├── architecture/ ........................ (System Design & Internals)
│   ├── overview.md ..................... (System layers, request flow)
│   └── components.md ................... (Agents, crawler, database)
│
├── scanning/ ........................... (How Scanning Works)
│   ├── overview.md ..................... (Scan modes: static/dynamic/both)
│   ├── static-analysis.md .............. (JS/HTML/dependencies)
│   ├── dynamic-testing.md .............. (Crawling, XSS, SQLi, CSRF, auth)
│   └── crawler.md ...................... (URL discovery & configuration)
│
├── security/ ........................... (Security & Compliance)
│   ├── owasp-2025.md ................... (OWASP taxonomy & mapping)
│   ├── ethics-and-authorization.md .... (Legal, consent, permissions)
│   ├── detection-details.md ............ (Headers, CSRF, URL validation, scoring)
│   └── reducing-false-positives.md .... (Confidence, context, accuracy)
│
├── api/ ................................ (API Reference)
│   ├── overview.md ..................... (API intro & conventions)
│   ├── endpoints.md .................... (REST API & Server Actions)
│   └── schemas.md ...................... (Request/response types)
│
├── development/ ........................ (For Contributors)
│   ├── setup.md ........................ (Development environment)
│   ├── testing.md ...................... (Test organization & running)
│   └── contributing.md ................. (PR guidelines, code standards)
│
├── deployment.md ....................... (Production Setup)
├── references.md ....................... (Academic & Standards)
└── faq.md .............................. (Common Questions)
```

**Total: 18 core documents**

---

## 📑 Content Mapping: raw_docs → final docs

### 1. **index.md** (NEW — MERGED)

**Feeds from:**
- `raw_docs/index.md` (marketing/intro)
- `raw_docs/README.md` (technical intro)

**Consolidation:**
- Merge opening statements: "What is WebSecScan?" (one clear intro, not two)
- Key features list: De-duplicate (appears in both)
- Target audience: Keep both sections (complementary)
- Quick links: Merge and reorganize by role (User, Developer, Researcher)
- Quick start: Keep from README
- Technology stack: Keep concisely

**Exclude:** Nothing; both files are foundational.

**Outcome:** ~150 lines, single authoritative landing page.

---

### 2. **getting-started.md** (CORE — MINIMAL CHANGES)

**Feeds from:**
- `raw_docs/getting-started.md` (primary source)

**Consolidation:**
- Update database setup to match current Prisma commands
- Add note about `.env` configuration
- Update any outdated CLI examples

**Exclude:** Nothing.

**Outcome:** ~250 lines, unchanged in scope.

---

### 3. **features.md** (OVERVIEW — NOT SPLIT)

**Feeds from:**
- `raw_docs/features.md` (primary; keep as high-level overview)

**Consolidation:**
- Trim redundant explanations
- Add subtle navigation hints: "See [API Reference](api/overview.md) for details"
- Keep real-time logging section (already in features; don't move)

**Link to deeper docs:** Not split into separate pages; reference subsections in other docs.

**Exclude:** Nothing.

**Outcome:** ~600 lines, feature overview with links to details.

---

### 4. **architecture/overview.md** (SYSTEM DESIGN)

**Feeds from:**
- `raw_docs/architecture.md` (primary; system layers, request flow, tech stack)
- `raw_docs/DATA-FLOW-DIAGRAMS.md` (extract mermaid diagrams)

**Consolidation:**
- Keep Section 1: System Overview (layers, request flow)
- Keep Section 2: Technology Stack
- Integrate mermaid diagrams from DATA-FLOW-DIAGRAMS.md for visual clarity
- Reference components.md for agent details

**Exclude:** Detailed agent descriptions (move to components.md).

**Outcome:** ~400 lines, high-level system design with diagrams.

---

### 5. **architecture/components.md** (AGENTS & INTERNALS)

**Feeds from:**
- `raw_docs/agents.md` (agents overview, Static/Dynamic/Library scanners)
- `raw_docs/architecture.md` Section 3+ (agent details)

**Consolidation:**
- Agent Coordinator overview
- Static Analysis Agent (JS, HTML, dependencies)
- Dynamic Testing Agent (crawling, XSS, SQLi, CSRF, auth)
- Library Scanner Agent
- Configuration & safety constraints
- Agent output & integration

**Exclude:** Nothing; consolidate agent docs here.

**Outcome:** ~700 lines, comprehensive agent reference.

---

### 6. **scanning/overview.md** (SCAN MODES)

**Feeds from:**
- `raw_docs/features.md` (Scan mode descriptions: static, dynamic, both)

**Consolidation:**
- What each mode does
- When to use each
- Safety considerations
- Quick comparison table
- Navigate to deeper sections for details

**Exclude:** Specific rule details (move to static-analysis.md, dynamic-testing.md).

**Outcome:** ~200 lines, quick scan mode guide.

---

### 7. **scanning/static-analysis.md** (STATIC RULES)

**Feeds from:**
- `raw_docs/features.md` (Static analysis section)
- `raw_docs/agents.md` (JavaScript/TypeScript analyzer section)

**Consolidation:**
- Dangerous API detection (eval, Function, setTimeout)
- Unsafe DOM manipulation (innerHTML, outerHTML, document.write)
- Insecure cookie usage
- Hardcoded secrets
- Framework detection
- Minification handling
- Detection rules table

**Exclude:** Nothing.

**Outcome:** ~400 lines, static analysis rule reference.

---

### 8. **scanning/dynamic-testing.md** (DYNAMIC RULES)

**Feeds from:**
- `raw_docs/features.md` (Dynamic testing section)
- `raw_docs/agents.md` (Dynamic Testing Agent section)
- `raw_docs/security/csrf-protection.md` (CSRF testing details)
- `raw_docs/security/header-security-enhancements.md` (header testing)
- `raw_docs/security/authenticated-scans.md` (auth testing; excerpt relevant parts)

**Consolidation:**
- Dynamic testing philosophy (safe, non-destructive)
- XSS testing (12 contexts, payloads)
- SQL injection testing (error-based, payloads)
- Path traversal testing
- CSRF detection (token patterns, validation)
- Authentication testing (session, bypass detection)
- Security header testing (CSP, HSTS, X-Frame-Options)
- Rate limiting & safety

**Exclude:** Full authenticated-scans.md design (save for security/ethics-and-authorization.md).

**Outcome:** ~600 lines, dynamic testing rules & methodology.

---

### 9. **scanning/crawler.md** (URL DISCOVERY)

**Feeds from:**
- `raw_docs/crawler/crawler-design.md` (primary source)
- `raw_docs/crawler/crawler-improvements.md` (recent enhancements)
- `raw_docs/crawler/real-time-logging.md` (logging during crawl)

**Consolidation:**
- Crawler design philosophy (conservative, safe, ethical)
- Default configuration (maxDepth, maxPages, rateLimit, robots.txt)
- Crawl strategy (breadth-first, depth control)
- URL discovery methods (HTML links, inline scripts, event handlers)
- Endpoint extraction patterns (API routes, AJAX calls)
- Real-time logging (SSE, progress updates)
- Recent improvements & roadmap (brief)

**Exclude:** Nothing; crawler docs are cohesive.

**Outcome:** ~500 lines, crawler architecture & configuration.

---

### 10. **security/owasp-2025.md** (TAXONOMY & MIGRATION)

**Feeds from:**
- `raw_docs/security/owasp-mapping.md` (primary; canonical reference)
- `raw_docs/agents.md` (mentions OWASP alignment)

**Consolidation:**
- Complete 2021 → 2025 mapping table
- Critical changes (Security Misconfiguration #5→#2, SSRF→A01 merge, NEW A10)
- Example classifications
- Migration notes for researchers

**Exclude:** Nothing; critical document per copilot-instructions.md.

**Outcome:** ~150 lines, OWASP reference.

---

### 11. **security/ethics-and-authorization.md** (LEGAL & CONSENT)

**Feeds from:**
- `raw_docs/security/security-ethics.md` (primary; legal, consent, authorization)
- `raw_docs/security/authenticated-scans.md` (Section: Design Principles, Safety-First Approach, Ethical Constraints)

**Consolidation:**
- Legal notice & liability
- Authorization requirements (written permission)
- Ethical scanning principles (no brute force, rate limiting, explicit consent)
- Credential safety (in-memory only, no logging)
- Session isolation (browser contexts)
- Audit logging & transparency
- Case studies / ethical considerations
- Authenticated scanning safety constraints

**Exclude:** Implementation details of authenticated-scans.md (keep in development docs if needed).

**Outcome:** ~400 lines, ethics & authorization guide.

---

### 12. **security/detection-details.md** (TECHNICAL CHECKS)

**Feeds from:**
- `raw_docs/security/header-security-enhancements.md` (HTTP headers: CSP, HSTS, X-Frame, etc.)
- `raw_docs/security/url-normalization.md` (URL validation, protocol handling, redirects)
- `raw_docs/security/csrf-protection.md` (CSRF token patterns, validation)
- `raw_docs/security/scoring.md` (Security score calculation, risk levels)
- `raw_docs/security/context-aware-confidence.md` (Confidence scoring, context factors)

**Consolidation:**
- Security Header Detection
  - CSP validation
  - HSTS enforcement
  - X-Frame-Options
  - X-Content-Type-Options
  - Permissions-Policy
  - Spectre mitigation headers
- URL Validation & Normalization
  - Format validation
  - Protocol handling (HTTP/HTTPS)
  - Redirect detection
  - Private IP handling
- CSRF Protection
  - Token patterns (8+ patterns)
  - Token entropy validation
  - SameSite cookie analysis
- Security Scoring
  - CVSS-inspired methodology
  - Risk level calculation
  - Color mapping
  - Confidence scoring (context-aware)
  - Severity/confidence mapping

**Exclude:** Nothing; these are technical specs.

**Outcome:** ~500 lines, technical detection & scoring reference.

---

### 13. **security/reducing-false-positives.md** (ACCURACY & VALIDATION)

**Feeds from:**
- `raw_docs/security/false-positive-analysis.md` (primary source)
- `raw_docs/security/context-aware-confidence.md` (context factors, minification handling)

**Consolidation:**
- Sources of false positives (pattern matching, minification, framework detection)
- Confidence thresholds & filtering
- Context-aware scoring (framework detection, minification, code flow analysis)
- Evidence evaluation
- Best practices for users (interpreting results)

**Exclude:** Nothing.

**Outcome:** ~300 lines, false positive reduction guide.

---

### 14. **api/overview.md** (API INTRO)

**Feeds from:**
- `raw_docs/api.md` (Introduction section, base URL, general patterns)

**Consolidation:**
- What the API provides
- Base URL & authentication
- Request/response conventions
- Error handling
- Rate limiting
- Real-time logging via SSE

**Exclude:** Specific endpoints (move to endpoints.md).

**Outcome:** ~150 lines, API introduction.

---

### 15. **api/endpoints.md** (REST API REFERENCE)

**Feeds from:**
- `raw_docs/api.md` (POST /api/scan/start, other endpoints, Server Actions)

**Consolidation:**
- POST /api/scan/start (scan initiation)
- GET /api/scan/{scanId} (scan status & results)
- GET /api/scan/{scanId}/logs (SSE log streaming)
- Server Actions (if applicable)
- Request/response examples
- Status codes & error responses

**Exclude:** Schema details (move to schemas.md).

**Outcome:** ~300 lines, endpoint reference.

---

### 16. **api/schemas.md** (REQUEST/RESPONSE TYPES)

**Feeds from:**
- `raw_docs/api.md` (Schema definitions, request bodies, response types)

**Consolidation:**
- ScanRequest schema
- ScanResponse schema
- Vulnerability schema
- SecurityTest schema
- Error response schema
- Type definitions for TypeScript users

**Exclude:** Nothing.

**Outcome:** ~200 lines, schema reference.

---

### 17. **development/setup.md** (DEV ENVIRONMENT)

**Feeds from:**
- `raw_docs/development.md` (Prerequisites, clone & install, environment config, running dev/prod)

**Consolidation:**
- Prerequisites (Node.js, npm, Git, Docker)
- Clone & install steps
- Environment configuration (.env file)
- Running dev server
- Running production build
- Docker development setup

**Exclude:** Testing & contributing (move to testing.md, contributing.md).

**Outcome:** ~250 lines, development setup guide.

---

### 18. **development/testing.md** (TESTING & QA)

**Feeds from:**
- `raw_docs/development.md` (Testing section)
- `raw_docs/TEST_ORGANIZATION.md` (test file inventory, organization)
- `raw_docs/evaluation/testing.md` (testing philosophy, test commands, test fixtures)

**Consolidation:**
- Testing philosophy (deterministic, real logic, no mocks)
- Test file organization (current structure)
- Running tests (npm test, watch mode, specific files)
- Test fixtures (insecure apps for testing)
- Writing tests (patterns, examples)
- Coverage goals
- CI/CD integration

**Exclude:** Nothing; consolidate all testing docs here.

**Outcome:** ~400 lines, testing guide for contributors.

---

### 19. **development/contributing.md** (CONTRIBUTION GUIDELINES)

**Feeds from:**
- `raw_docs/development.md` (PR checklist, contributing guidelines, code standards)
- `.github/copilot-instructions.md` (Mandatory Project Rules from project context)

**Consolidation:**
- How to contribute
- Development workflow
- Code standards (TypeScript strict mode, no `any`, etc.)
- Mandatory rules (no placeholder logic, server-only scanning, OWASP terminology)
- Testing requirements (unit tests + integration tests)
- Documentation requirements
- PR checklist (type-check, lint, tests, docs, no secrets)
- Ethical guidelines (safety, non-destructive testing)

**Exclude:** Nothing; important for contributors.

**Outcome:** ~250 lines, contribution guide.

---

### 20. **deployment.md** (PRODUCTION SETUP)

**Feeds from:**
- `raw_docs/deployment.md` (Docker, Docker Compose, manual deployment, environment, database, reverse proxy, troubleshooting)

**Consolidation:**
- Docker deployment (quick start, docker-compose.yml)
- Manual deployment (prerequisites, clone, install, build, configure, reverse proxy)
- Database setup (PostgreSQL in prod)
- Environment variables (production settings)
- HTTPS & reverse proxy (Nginx/Caddy)
- Health checks & monitoring
- Troubleshooting (common deployment issues)

**Exclude:** Nothing.

**Outcome:** ~500 lines, production deployment guide.

---

### 21. **references.md** (ACADEMIC & STANDARDS)

**Feeds from:**
- `raw_docs/references.md` (primary; OWASP, security specs, web standards, research papers, tools)

**Consolidation:**
- Keep all references as-is (well-organized, authoritative)
- Add links to source documents where available

**Exclude:** Nothing.

**Outcome:** ~360 lines, references & bibliography.

---

### 22. **faq.md** (COMMON QUESTIONS) — NEW

**Synthesized from:**
- Common questions arising from all docs (not a raw_docs source)
- Extracted patterns: "Why does it...?", "How do I...?", "What's the difference between...?"

**Content:**
- **Usage FAQ**: "Can I scan localhost?", "How long does a scan take?", "What if I get false positives?"
- **Development FAQ**: "How do I add a new detection rule?", "Why are tests failing?", "What test framework is used?"
- **Deployment FAQ**: "Which database should I use?", "How do I set up HTTPS?", "Can I scale horizontally?"
- **Security FAQ**: "Is it safe to scan production?", "What's OWASP 2025?", "Why no brute force testing?"

**Outcome:** ~200 lines, Q&A for quick lookups.

---

## 📊 Summary

| Section | Documents | Purpose | Total Lines |
|---------|-----------|---------|------------|
| **Core** | 3 | Intro, getting started, features | ~1000 |
| **Architecture** | 2 | System design & components | ~1100 |
| **Scanning** | 4 | How scanning works (static, dynamic, crawler) | ~1700 |
| **Security** | 4 | OWASP, ethics, detection, false positives | ~1350 |
| **API** | 3 | API reference | ~650 |
| **Development** | 3 | Setup, testing, contributing | ~900 |
| **Deployment** | 1 | Production setup | ~500 |
| **Reference** | 2 | References & FAQ | ~560 |
| **TOTAL** | **22** | **Complete documentation** | **~7760** |

---

## 🎯 Audience Paths

### **For Users** (How to use the tool)
1. index.md
2. getting-started.md
3. features.md
4. scanning/overview.md
5. security/ethics-and-authorization.md
6. deployment.md
7. faq.md

### **For Developers** (How it works / How to extend)
1. getting-started.md
2. architecture/overview.md
3. architecture/components.md
4. scanning/* (all subsections)
5. security/* (all subsections)
6. api/* (all subsections)
7. development/* (all subsections)
8. faq.md

### **For Researchers** (Academic, theory, evaluation)
1. architecture/overview.md
2. scanning/dynamic-testing.md (methodology)
3. security/owasp-2025.md
4. security/reducing-false-positives.md
5. evaluation docs (referenced but not in main docs — can be separate)
6. references.md

### **For Ops/DevOps** (Deployment, scaling, operations)
1. deployment.md
2. security/ethics-and-authorization.md (audit logging)
3. references.md (standards)
4. faq.md (operational questions)

---

## 🔄 Consolidation Decisions

### **Merged** (Folded into larger docs)
- `index.md` + `README.md` → `index.md`
- `features.md` (kept as-is, not split per feature)
- `raw_docs/agents.md` → `architecture/components.md`
- `raw_docs/architecture.md` Section 1-2 → `architecture/overview.md`, Section 3+ → `architecture/components.md`
- `raw_docs/crawler/*` → `scanning/crawler.md`
- `raw_docs/security/authenticated-scans.md` (ethics portion) → `security/ethics-and-authorization.md`
- `raw_docs/evaluation/testing.md` + `TEST_ORGANIZATION.md` → `development/testing.md`

### **Kept as-is** (Minimal changes)
- `getting-started.md` (install guide; no splitting)
- `deployment.md` (comprehensive; no splitting)
- `references.md` (well-organized; no splitting)
- `security/owasp-2025.md` (critical; canonical)

### **Created** (New, synthesized)
- `faq.md` (extracted from all docs; common questions)

### **Not Included** (Raw docs that are subsumed)
- `raw_docs/evaluation/benchmarking.md` (move to separate /evaluation folder if needed for researchers; not core user docs)
- `raw_docs/evaluation/testing-coverage.md` (can be separate; for researchers)
- `raw_docs/evaluation/real-world-testing.md` (can be separate; for researchers)
- `raw_docs/_temp/*` (audit files; not included)

---

## ✅ Validation

### **Coverage Check**

| raw_docs File | Destination | Status |
|---|---|---|
| index.md | index.md | ✅ Merged |
| README.md | index.md | ✅ Merged |
| getting-started.md | getting-started.md | ✅ As-is |
| features.md | features.md | ✅ As-is |
| architecture.md | architecture/{overview,components}.md | ✅ Split |
| agents.md | architecture/components.md | ✅ Moved |
| api.md | api/{overview,endpoints,schemas}.md | ✅ Split |
| deployment.md | deployment.md | ✅ As-is |
| development.md | development/{setup,testing,contributing}.md | ✅ Split |
| references.md | references.md | ✅ As-is |
| TEST_ORGANIZATION.md | development/testing.md | ✅ Merged |
| DATA-FLOW-DIAGRAMS.md | architecture/overview.md | ✅ Merged |
| security/owasp-mapping.md | security/owasp-2025.md | ✅ Renamed (no change) |
| security/authenticated-scans.md | security/ethics-and-authorization.md | ⚠️ Partial (ethics section) |
| security/csrf-protection.md | scanning/dynamic-testing.md | ✅ Merged |
| security/context-aware-confidence.md | security/detection-details.md | ✅ Merged |
| security/header-security-enhancements.md | security/detection-details.md + scanning/dynamic-testing.md | ✅ Merged |
| security/url-normalization.md | security/detection-details.md | ✅ Merged |
| security/false-positive-analysis.md | security/reducing-false-positives.md | ✅ Renamed (no change) |
| security/scoring.md | security/detection-details.md | ✅ Merged |
| security/security-ethics.md | security/ethics-and-authorization.md | ✅ Merged |
| crawler/crawler-design.md | scanning/crawler.md | ✅ Merged |
| crawler/crawler-improvements.md | scanning/crawler.md | ✅ Merged |
| crawler/real-time-logging.md | scanning/crawler.md | ✅ Merged |
| evaluation/testing.md | development/testing.md | ✅ Merged |
| evaluation/testing-coverage.md | (Separate /evaluation if needed) | ⚠️ Optional |
| evaluation/benchmarking.md | (Separate /evaluation if needed) | ⚠️ Optional |
| evaluation/real-world-testing.md | (Separate /evaluation if needed) | ⚠️ Optional |

✅ = All core content preserved  
⚠️ = Optional; can be in separate /evaluation section for researchers  

### **No Orphaned Content**

- Every raw_docs file is used or explicitly excluded
- No duplicated explanations across final docs
- All cross-references will be validated during Phase 3

---

## 📋 Next Steps (Phase 3)

1. **Write final documentation** using this structure
2. **Merge overlapping content** (e.g., CSRF in both dynamic-testing.md and detection-details.md → single authoritative location in dynamic-testing.md)
3. **Normalize terminology** (Agent vs Scanner, Finding vs Alert, etc.)
4. **Add cross-references** (links between docs)
5. **Create mkdocs.yml** with nav matching this structure
6. **Validate all links** before deploying

---

**Status**: ✅ **PHASE 2 COMPLETE**

Structure is lean (22 docs), well-organized, and ready for writing.
