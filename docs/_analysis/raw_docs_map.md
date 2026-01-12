# Raw Docs Inventory & Analysis

**Audit Date**: January 12, 2026  
**Total Files**: 24 markdown files across 4 categories  
**Total Content**: ~6,000+ lines of documentation

---

## 📋 Summary Table

| File | Category | Topic | Level | Lines | Status | Notes |
|------|----------|-------|-------|-------|--------|-------|
| **index.md** | Core | Project intro & quick links | User | ~80 | ✅ Active | Landing page; overlaps with README |
| **README.md** | Core | Extended project overview | User | ~210 | ✅ Active | More detailed than index; good as introduction |
| **getting-started.md** | Core | Installation & first scan | User | ~250 | ✅ Active | Clear, practical; needs minor updates for Prisma |
| **features.md** | Core | Feature overview | User | ~700 | ✅ Active | Comprehensive; includes real-time logging details |
| **architecture.md** | Core | System design & layers | Dev | ~680 | ✅ Active | Deep technical; good reference |
| **agents.md** | Core | Scanning agents deep-dive | Dev | ~700 | ✅ Active | Detailed agent logic; includes code examples |
| **api.md** | Core | REST API & Server Actions | Dev | ~990 | ✅ Active | Extensive endpoint documentation |
| **deployment.md** | Core | Production deployment | Ops | ~560 | ✅ Active | Docker, Docker Compose, manual setup |
| **development.md** | Core | Contributing & dev setup | Dev | ~730 | ✅ Active | Comprehensive development guide |
| **references.md** | Core | Academic & standards refs | Research | ~360 | ✅ Active | OWASP, security standards, academic papers |
| **TEST_ORGANIZATION.md** | Testing | Test suite structure | Dev | ~150 | ✅ Active | Current test file inventory (11 files, ~125 tests) |
| **DATA-FLOW-DIAGRAMS.md** | Testing | Data flow audit & mermaid | Dev/Infra | ~210 | ✅ Active | Static/dynamic/ZAP flow diagrams |
| **security/owasp-mapping.md** | Security | 2021→2025 taxonomy mapping | Dev/Research | ~135 | ✅ Active | **CRITICAL**: Canonical OWASP migration reference |
| **security/authenticated-scans.md** | Security | Session-based testing | Dev/Research | ~770 | ✅ Active | Phase 3 capability; detailed design |
| **security/csrf-protection.md** | Security | CSRF token detection | Dev | ~280 | ✅ Active | Token patterns, validation logic |
| **security/context-aware-confidence.md** | Security | Confidence scoring | Dev | ~300 | ✅ Active | Severity/confidence mapping |
| **security/header-security-enhancements.md** | Security | HTTP header analysis | Dev | ~250 | ✅ Active | CSP, HSTS, X-Frame-Options, etc. |
| **security/url-normalization.md** | Security | URL validation & canonicalization | Dev | ~200 | ✅ Active | Protocol handling, redirects, validation |
| **security/false-positive-analysis.md** | Security | Reducing false positives | Research | ~300 | ✅ Active | Confidence thresholds, context filters |
| **security/scoring.md** | Security | Security score calculation | Dev | ~280 | ✅ Active | CVSS-inspired scoring methodology |
| **security/security-ethics.md** | Security | Ethical scanning guidelines | Legal/Ethics | ~350 | ✅ Active | Consent, authorization, non-destructive testing |
| **crawler/crawler-design.md** | Crawler | Crawler architecture & algorithms | Dev | ~290 | ✅ Active | URL discovery, endpoint extraction, rate limiting |
| **crawler/crawler-improvements.md** | Crawler | Enhancements & roadmap | Dev | ~180 | ✅ Active | Recent fixes and future improvements |
| **crawler/real-time-logging.md** | Crawler | SSE-based live progress | Dev | ~200 | ✅ Active | Real-time log streaming implementation |

---

## 🔍 Detailed Analysis

### Core Documentation (10 files)

#### **index.md** & **README.md** — Landing & Overview
- **Overlap**: Severe. Both serve as project intro with nearly identical key feature lists.
- **Distinction**: `index.md` is shorter (marketing-style), `README.md` is more detailed (technical intro).
- **Conflict**: None, but duplication wastes space.
- **Recommendation**: Merge into single intro; use README for primary landing, retire index.

#### **getting-started.md** — Installation & First Run
- **Status**: Solid, practical walkthrough.
- **Issues**: 
  - Database setup mentions `npx prisma migrate deploy` but project uses `npx prisma migrate dev` in dev.
  - Could mention `npm run seed` earlier.
- **Overlap**: Minimal with others; stands alone.
- **Confidence**: High for production use.

#### **features.md** — Feature Inventory
- **Coverage**: Extremely comprehensive (700+ lines).
- **Topics**: Static analysis, dynamic testing, library scanning, real-time logging, scoring, authenticated scanning.
- **Issues**: 
  - Very long; best split into separate pages for each feature.
  - References real-time-logging.md but could be condensed here.
- **Overlap**: `features.md` → `agents.md` (both describe scanning logic).
- **Recommendation**: Keep as high-level overview; reference deeper docs for details.

#### **architecture.md** — System Design
- **Quality**: Excellent. Clear diagrams, layer descriptions, tech stack.
- **Depth**: Very technical (680+ lines); appropriate for developers.
- **Issues**: None identified.
- **Overlap**: Complements `agents.md` (high-level vs. agent details).

#### **agents.md** — Scanning Agents
- **Depth**: Very detailed; excellent for understanding detection logic.
- **Content**: Static analyzer, dynamic agent, library scanner, configuration, safety constraints.
- **Quality**: High; includes code examples.
- **Overlap**: Complements `architecture.md` (agents are subsystem); slight overlap with `security/` docs on specific checks.
- **Note**: Must align with OWASP 2025 taxonomy per copilot-instructions.md.

#### **api.md** — REST API Reference
- **Coverage**: Comprehensive (990+ lines).
- **Content**: POST /api/scan/start, endpoints, Server Actions, SSE logs, response schemas.
- **Issues**: 
  - Very long; could be split into: Core Endpoints, Server Actions, Logging, Schemas.
  - Some sections feel like reference material that could be in a separate "API Schema" doc.
- **Overlap**: Minimal; unique to this doc.

#### **deployment.md** — Production Deployment
- **Coverage**: Good (560+ lines).
- **Content**: Docker, Docker Compose, manual setup, environment variables, database migration, reverse proxy.
- **Quality**: Clear and practical.
- **Issues**: None significant.
- **Overlap**: Minimal; unique to ops/deployment audience.

#### **development.md** — Contributing & Dev Setup
- **Coverage**: Comprehensive (730+ lines).
- **Content**: Setup, running dev server, testing, code organization, contributing guidelines, PR checklist.
- **Quality**: Excellent reference.
- **Issues**: Very long; could be split into Development Setup vs. Contributing Guidelines.
- **Overlap**: Minimal overlap with others.

#### **references.md** — Academic & Standards References
- **Coverage**: Extensive (360+ lines).
- **Content**: OWASP standards, security specs (CVSS, NIST), web standards (CSP, HSTS), research papers, tools (Mozilla Observatory, ZAP).
- **Quality**: Well-organized; appropriate for researchers.
- **Issues**: Could be expanded with links to actual documents.
- **Overlap**: Complements security/* docs by providing source material.

---

### Security & Taxonomy (9 files under `security/`)

#### **security/owasp-mapping.md** — 2021→2025 Migration
- **Status**: **CRITICAL** — Canonical reference per copilot-instructions.md.
- **Content**: Complete mapping table, critical changes (Security Misconfiguration #5→#2, SSRF merged into A01).
- **Quality**: Excellent; prevents common misclassifications.
- **Overlap**: Referenced by agents.md; foundational for all vulnerability findings.
- **Confidence**: Must be current and accurate.

#### **security/authenticated-scans.md** — Session-Based Testing
- **Coverage**: Detailed (770+ lines).
- **Content**: Design principles, safety constraints, architecture, credential handling, test scenarios.
- **Quality**: High; Phase 3 feature documentation.
- **Issues**: Could be condensed; some repetition of ethical principles already in security-ethics.md.
- **Overlap**: Overlaps with security-ethics.md on ethical constraints (authorization, non-destructive).

#### **security/csrf-protection.md** — CSRF Detection
- **Content**: Token patterns, validation logic, SameSite cookies.
- **Quality**: Good reference material.
- **Overlap**: Part of broader dynamic testing (agents.md).

#### **security/context-aware-confidence.md** — Confidence Scoring
- **Content**: Severity/confidence mapping, context factors (framework detection, minification).
- **Quality**: Good technical reference.
- **Overlap**: Related to scoring.md (different angles: context vs. overall score).

#### **security/header-security-enhancements.md** — HTTP Headers
- **Content**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Spectre mitigation.
- **Quality**: Good reference.
- **Overlap**: Part of static/dynamic analysis (agents.md).

#### **security/url-normalization.md** — URL Validation
- **Content**: Protocol handling, HTTPS upgrade, redirect detection, private IP handling.
- **Quality**: Good technical spec.
- **Overlap**: Related to api.md (URL validation in requests).

#### **security/false-positive-analysis.md** — False Positive Reduction
- **Content**: Confidence thresholds, context filters, evidence evaluation.
- **Quality**: Good reference for researchers.
- **Overlap**: Relates to context-aware-confidence.md and scoring.md.

#### **security/scoring.md** — Security Score Calculation
- **Content**: CVSS-inspired scoring, risk levels, color mapping.
- **Quality**: Good technical spec.
- **Overlap**: Related to context-aware-confidence.md and false-positive-analysis.md.

#### **security/security-ethics.md** — Ethical Guidelines
- **Content**: Legal notice, consent, authorization, non-destructive testing, ethical principles.
- **Quality**: Important for users; covers liability, permissions, audit logging.
- **Overlap**: Overlaps with authenticated-scans.md on ethical constraints.

---

### Crawler Documentation (3 files under `crawler/`)

#### **crawler/crawler-design.md** — Crawler Architecture
- **Content**: Design philosophy, default configuration, crawl strategy, URL discovery, endpoint extraction, robots.txt handling.
- **Quality**: Excellent technical reference.
- **Overlap**: Part of broader system (agents.md).

#### **crawler/crawler-improvements.md** — Enhancements & Roadmap
- **Content**: Recent fixes, performance improvements, future roadmap.
- **Quality**: Good for tracking evolution.
- **Overlap**: Complements crawler-design.md.

#### **crawler/real-time-logging.md** — SSE-Based Live Progress
- **Content**: Server-Sent Events implementation, log streaming, progress updates.
- **Quality**: Good technical reference.
- **Overlap**: Relates to features.md (mentions real-time logging) and api.md (SSE endpoints).

---

### Testing & Evaluation (2 files + `evaluation/` subdirectory)

#### **TEST_ORGANIZATION.md** — Test Suite Structure
- **Content**: Test philosophy, current test files (11 files, ~125 tests), organization.
- **Quality**: Good reference for contributors.
- **Issues**: Status info (dates, test counts) may become stale; should be auto-generated if possible.
- **Overlap**: Part of development.md (testing section) but more detailed.

#### **DATA-FLOW-DIAGRAMS.md** — Data Flow Audit
- **Content**: Mermaid diagrams for static, dynamic, ZAP scan flows; data traceability.
- **Quality**: Good visual reference.
- **Overlap**: Complements architecture.md.

#### **evaluation/testing.md** — Testing Guide
- **Content**: Testing philosophy, test statistics, test commands, unit tests, integration tests, fixtures.
- **Quality**: Comprehensive (740+ lines).
- **Overlap**: Overlaps with TEST_ORGANIZATION.md and development.md.

#### **evaluation/testing-coverage.md** — Vulnerability Detection Coverage
- **Content**: Coverage matrix for each OWASP category across static/dynamic agents.
- **Quality**: Good for researchers; shows what's tested.
- **Overlap**: Related to agents.md (what agents detect).

#### **evaluation/benchmarking.md** — Performance Metrics
- **Content**: Benchmark methodology, metrics, performance targets.
- **Quality**: Good for researchers.

#### **evaluation/real-world-testing.md** — Real Application Testing
- **Content**: Testing against production/real apps, limitations, case studies.
- **Quality**: Good for researchers.

---

## 🚨 Issues & Conflicts

### 1. **Duplication**
| Source | Target | Severity | Note |
|--------|--------|----------|------|
| index.md | README.md | HIGH | Nearly identical intro and feature lists; merge |
| features.md | agents.md | MEDIUM | Both describe scanning; features = overview, agents = deep-dive |
| authenticated-scans.md | security-ethics.md | MEDIUM | Both cover authorization, consent, non-destructive testing |
| development.md | TEST_ORGANIZATION.md | LOW | Both mention test organization; development has broader scope |
| development.md | evaluation/testing.md | LOW | Both are "testing" docs; development is for contributors, evaluation is for researchers |
| api.md | architecture.md | LOW | Both mention API layer; api = reference, architecture = system design |

### 2. **Outdated or Incomplete**
| File | Issue | Impact |
|------|-------|--------|
| getting-started.md | Database setup references may not match current setup scripts | User confusion |
| TEST_ORGANIZATION.md | Test file counts and dates may become stale | Maintainer burden |
| crawler/crawler-improvements.md | Roadmap items may be completed or changed | Confusion about priorities |

### 3. **Terminology Inconsistencies**
| Term | Variations | Impact |
|------|-----------|--------|
| "Scanning Agent" | Also: "Agent", "Scanner", "Module" | Confusion in cross-references |
| "Vulnerability" | Also: "Finding", "Alert", "Result" | Inconsistent terminology |
| "Security Test" | Also: "Check", "Rule", "Detection" | Unclear distinction |

### 4. **Missing or Sparse Content**
| Topic | Status | Impact |
|-------|--------|--------|
| Data Model (Prisma schema explanation) | Not documented | Dev confusion; no schema reference guide |
| CLI Interface | Not documented | Users unaware of CLI capabilities |
| Error Handling & Troubleshooting | Minimal | Users struggle with common issues |
| Migration Guide (2021→2025) | In owasp-mapping.md only | May not be discoverable to contributors |

### 5. **Organization Issues**
- **Deep Nesting**: `raw_docs/security/`, `raw_docs/crawler/`, `raw_docs/evaluation/` create fragmentation.
- **No Table of Contents**: No central index document for raw_docs.
- **Links**: Files reference each other but paths are sometimes inconsistent (e.g., `[file.md](file.md)` vs `[file.md](./file.md)`).

---

## 📊 Content by Audience Level

### **User/Administrator Level** (How to use)
- index.md
- README.md
- getting-started.md
- features.md (first half)
- deployment.md
- security/security-ethics.md

### **Developer Level** (How it works / How to extend)
- architecture.md
- agents.md
- api.md
- development.md
- security/* (except security-ethics.md)
- crawler/*
- evaluation/testing.md
- TEST_ORGANIZATION.md
- DATA-FLOW-DIAGRAMS.md

### **Researcher Level** (Academic & theory)
- references.md
- security/owasp-mapping.md
- security/false-positive-analysis.md
- evaluation/benchmarking.md
- evaluation/testing-coverage.md
- evaluation/real-world-testing.md
- DATA-FLOW-DIAGRAMS.md

### **Operations Level** (Deployment & infrastructure)
- deployment.md
- development.md (CI/CD section)
- security/security-ethics.md (legal/audit)

---

## ✅ Quality Assessment

| File | Quality | Completeness | Currency | Recommendation |
|------|---------|-------------|----------|---|
| README.md | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Keep as-is |
| getting-started.md | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Minor updates needed |
| features.md | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Consider splitting |
| architecture.md | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Keep as-is |
| agents.md | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Update for OWASP 2025 |
| api.md | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Consider splitting |
| deployment.md | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Keep as-is |
| development.md | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Consider splitting |
| references.md | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Keep; can expand |
| security/owasp-mapping.md | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Keep as-is; critical |
| security/authenticated-scans.md | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Consolidate with ethics |
| security/security-ethics.md | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Keep as-is; critical |
| crawler/* | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Keep; well-organized |
| evaluation/* | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Keep; for researchers |

---

## 📝 Files in `_temp/` Subdirectory

The `raw_docs/_temp/` directory contains 13+ temporary audit and analysis files (AUDIT-CHECKLIST.md, EXECUTIVE-SUMMARY.md, etc.). These appear to be:

- **Status**: Intermediate/working documents
- **Purpose**: Audit trails, evaluation reports, implementation notes
- **Recommendation**: Review for extraction of critical findings; archive remainder

---

## 🎯 Recommendations for Phase 2

### Primary Actions

1. **Merge index.md + README.md** → Single, comprehensive introduction
2. **Split features.md** → High-level overview + feature-specific pages (5-6 pages)
3. **Split api.md** → Endpoints + Server Actions + Schemas + Logging (4 pages)
4. **Split development.md** → Development Setup + Contributing + PR Checklist (3 pages)
5. **Consolidate security docs** → Create security.md index with links to detailed docs
6. **Add missing docs**:
   - Prisma Data Model reference
   - Troubleshooting / FAQ
   - CLI Interface (if applicable)
   - Migration Guide from 2021→2025 (extracted from owasp-mapping.md)

### Documentation Structure Outcome

```
/docs/
├── index.md ........................ (Consolidated intro)
├── getting-started.md .............. (Installation & first scan)
├── features/
│   ├── overview.md ................. (Feature summary)
│   ├── static-analysis.md .......... (JS/HTML/deps)
│   ├── dynamic-testing.md .......... (Crawling, XSS, SQLi, etc.)
│   ├── library-scanning.md ......... (Vulnerability detection)
│   ├── authenticated-scanning.md ... (Session-based testing)
│   └── real-time-monitoring.md ..... (Live logs & SSE)
├── architecture.md ................. (System design)
├── security/
│   ├── index.md .................... (Security guide intro)
│   ├── owasp-2025.md ............... (OWASP mapping & migration)
│   ├── ethics.md ................... (Legal, consent, authorization)
│   ├── headers.md .................. (HTTP security headers)
│   ├── csrf.md ..................... (CSRF protection)
│   ├── url-validation.md ........... (URL normalization)
│   ├── scoring.md .................. (Risk scoring)
│   └── false-positives.md .......... (Reducing false positives)
├── scanner/
│   ├── agents.md ................... (Agent overview)
│   ├── static-analyzer.md .......... (JS/HTML analysis)
│   ├── dynamic-tester.md ........... (Runtime testing)
│   └── crawler.md .................. (URL discovery)
├── api/
│   ├── overview.md ................. (API intro)
│   ├── endpoints.md ................ (REST API reference)
│   ├── server-actions.md ........... (Next.js Server Actions)
│   └── schemas.md .................. (Request/response types)
├── data-model.md ................... (Prisma schema reference)
├── development/
│   ├── setup.md .................... (Dev environment)
│   ├── testing.md .................. (Test organization & running)
│   └── contributing.md ............. (PR guidelines)
├── deployment.md ................... (Production deployment)
├── deployment/
│   ├── docker.md ................... (Docker setup)
│   ├── kubernetes.md ............... (K8s deployment)
│   └── troubleshooting.md .......... (Common issues)
├── evaluation/
│   ├── benchmarking.md ............. (Performance metrics)
│   ├── coverage.md ................. (Detection coverage)
│   └── testing-real-apps.md ........ (Case studies)
├── references.md ................... (Academic & standards)
└── faq.md .......................... (Common questions)
```

---

## ✨ Phase 1 Conclusion

**Status**: ✅ **COMPLETE**

- 24 main documentation files analyzed
- 6 overlapping sections identified
- 4 missing content areas flagged
- 3 terminology inconsistencies noted
- Quality assessment completed for all files
- Recommended structure for Phase 2 provided

**Next**: Execute Phase 2 (Propose Documentation Structure)
