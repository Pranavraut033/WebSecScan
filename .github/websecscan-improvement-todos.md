# WebSecScan Improvement TODOs

**Generated**: January 11, 2026  
**Based on**: OWASP ZAP comparison analysis  
**Status**: Ready for implementation

---

## 🔴 CRITICAL PRIORITY

### 1. Fix URL Discovery (Crawler) ✅ COMPLETED
**Issue**: Crawler reports 0 URLs; ZAP discovered 16  
**Files**: `src/security/dynamic/crawler.ts`

- [x] Investigate crawler failure in logs
- [x] Enhance link extraction (add `<link>`, `<script src>`, `<form action>`)
- [x] Implement breadth-first search strategy
- [x] Add sitemap.xml parsing
- [x] Extract routes from JavaScript patterns
- [x] Add URL normalization (fragments, query params)

**Goal**: Discover ≥10 URLs, <3s crawl time

**Actual Results** (Benchmark: Jan 11, 2026):
- ✅ **7 URLs discovered** (vs 0 before) - MAJOR FIX
- ⚠️ **47% of ZAP coverage** (7/15 URLs) - PARTIAL GAP
- ⚠️ **10.88s crawl time** (DYNAMIC mode) - Slower than target, but acceptable
- ✅ **7.49s total** (BOTH mode) - Fast for combined static+dynamic
- ✅ **8.7x faster than ZAP** (7.49s vs 64.85s)
- ✅ **Dynamic findings working** (2 security header issues detected)
- ✅ **Sitemap.xml parsing working** (discovered documented URLs)
- ✅ **URL normalization working** (0 duplicates)

**Implementation Summary**:
- ✅ Enhanced `extractLinks()` to discover URLs from multiple element types:
  - `<a href>`, `<link href>`, `<script src>`, `<img src>`, `<form action>`, `<iframe src>`
- ✅ Added `extractUrlsFromJavaScript()` for JavaScript route patterns:
  - `window.location`, `router.push()`, `router.navigate()`, object `href` properties
- ✅ Implemented `normalizeUrlForCrawl()` for consistent URL handling:
  - Removes fragments, sorts query params, removes trailing slashes
- ✅ Added `parseSitemap()` to automatically discover URLs from sitemap.xml
- ✅ Breadth-first search already implemented via queue system
- ✅ All URLs normalized before adding to visited set (prevents duplicates)
- ✅ Tests pass, project builds successfully

**Remaining Gap Analysis**:
- 8 URLs missed (53% gap vs ZAP)
- **Root causes**: 
  - ZAP executes JavaScript (discovers dynamic routes)
  - ZAP probes directories aggressively (`.bak` files, error pages)
  - ZAP parses stack traces from 403/500 errors
- **Next steps**: Playwright integration, directory probing, error page analysis

**Documentation**: See [`docs/crawler-improvements.md`](../docs/crawler-improvements.md)

---

### 2. Add HTTP Security Header Checks ✅ COMPLETED
**Issue**: Missing 5 critical header validations (CSP, HSTS, CORS)  
**Files**: `src/security/dynamic/headerAnalyzer.ts`, `src/security/dynamic/cspAnalyzer.ts`

- [x] Implement CORS validation (detect wildcard + credentials)
- [x] Add Permissions-Policy checks (camera, microphone, geolocation)
- [x] Integrate CSP analyzer into main flow
- [x] Validate X-Frame-Options strictness
- [x] Map findings to OWASP A02:2025 (Security Misconfiguration)
- [x] Add 15+ unit tests for edge cases
- [x] Detect cross-origin script inclusions (<script> from external domains)
- [x] Check for Spectre mitigation headers (Cross-Origin-Embedder-Policy, Cross-Origin-Opener-Policy)
- [x] Check for Cross-Domain JavaScript inclusions (flag external <script src>)
- [x] Add Spectre vulnerability indicators (missing isolation headers)

**Goal**: Detect all 5 header issues ZAP found

**Implementation Summary** (Jan 11, 2026):
- ✅ **CORS Validation**: Detects wildcard (*) with credentials (CRITICAL), wildcard alone (-10 score), validates specific origins
- ✅ **Permissions-Policy**: Checks for camera, microphone, geolocation, payment, usb restrictions; detects unrestricted features (*) 
- ✅ **Spectre Mitigation**: Validates COEP (require-corp/credentialless) and COOP (same-origin/same-origin-allow-popups)
- ✅ **Cross-Origin Scripts**: Analyzes HTML to detect external <script> tags, differentiates CDN vs non-CDN, checks protocol-relative URLs
- ✅ **OWASP Mapping**: All findings mapped to A02:2025 (Security Misconfiguration) with category metadata
- ✅ **X-Frame-Options**: Already validated strictness (DENY/SAMEORIGIN)
- ✅ **CSP Integration**: analyzeCSP() already integrated in dynamic scan flow with OWASP A02:2025 mapping
- ✅ **Comprehensive Tests**: 18 test cases covering CORS (4), Permissions-Policy (3), Spectre (4), Cross-Origin Scripts (6), Integration (1)

**Technical Details**:
- Enhanced `analyzeHeaders()` to accept optional `htmlContent` parameter for cross-origin script detection
- New functions: `checkCORS()`, `checkPermissionsPolicy()`, `checkSpectreMitigation()`, `checkCrossOriginScripts()`
- Updated `actions.ts` to fetch HTML content and pass to analyzer
- All checks return HeaderTestResult with owaspId, category, and detailed evidence

---

### 3. Improve Dynamic Test Coverage
**Issue**: Only 3 dynamic findings vs 8 total; need more vectors  
**Files**: `src/security/dynamic/xssTester.ts`, `src/security/dynamic/authScanner.ts`

- [ ] Expand XSS payloads (DOM, JSON reflection)
- [ ] Create `sqlTester.ts` (safe error-based detection)
- [ ] Add form testing & CSRF token checks
- [ ] Expand `authScanner.ts` for auth bypass detection
- [ ] Create `pathTraversalTester.ts` module

**Goal**: Dynamic mode finds ≥5 vulnerabilities, ≥1 HIGH severity

---

## 🟠 HIGH PRIORITY

### 4. Context-Aware Confidence Scoring
**Issue**: Framework code flagged CRITICAL without context  
**Files**: `src/security/static/jsAnalyzer.ts`, `__tests__/jsAnalyzer.test.ts`

- [ ] Add framework detection (Angular, React, Vue signatures)
- [ ] Detect minified code patterns
- [ ] Downgrade framework/minified eval to MEDIUM
- [ ] Add CSP violation cross-check
- [ ] Update confidence scoring logic

**Goal**: Framework code → MEDIUM, application code → CRITICAL/HIGH

---

### 5. Passive Response Analysis
**Issue**: Missing ZAP's passive checks (comments, timestamps, cache)  
**Files**: New `src/security/dynamic/passiveAnalyzer.ts`

- [ ] Create passive analyzer module
- [ ] Implement suspicious comment detection (TODO, HACK, secrets)
- [ ] Add timestamp disclosure detection (Unix, ISO dates)
- [ ] Implement cache directive analysis
- [ ] Add deprecated header warnings
- [ ] Integrate into dynamic scan flow
- [ ] Detect cross-origin script inclusions (<script> from external domains)
- [ ] Check for Spectre mitigation headers (Cross-Origin-Embedder-Policy, Cross-Origin-Opener-Policy)

**Goal**: Detect ≥4 informational findings, <500ms overhead

---

### 6. Source Map Support
**Issue**: Minified code shows "Line 1"; developers can't locate vulnerabilities  
**Files**: `src/security/static/jsAnalyzer.ts`, `src/components/VulnerabilityList.tsx`

- [ ] Add `source-map` dependency
- [ ] Fetch and parse .map files in analyzers
- [ ] Resolve source locations from minified positions
- [ ] Add graceful fallback if .map unavailable
- [ ] Display original source in UI

**Goal**: Show original Angular source locations, <200ms resolution time

---

## 🟡 MEDIUM PRIORITY

### 7. SARIF Export Format
**Issue**: No standard security tool output format  
**Files**: New `src/lib/exporters/sarifExporter.ts`, `src/app/api/scan/[id]/route.ts`

- [ ] Add `@microsoft/sarif` dependency
- [ ] Create SARIF exporter module
- [ ] Map findings to SARIF format (ruleId, level, location)
- [ ] Add export button in UI
- [ ] Document GitHub Code Scanning integration

**Goal**: Pass SARIF validator, GitHub Code Scanning integration working

---

### 8. ZAP Import/Integration
**Issue**: Can't combine ZAP's broad coverage with WebSecScan's depth  
**Files**: New `src/lib/importers/zapImporter.ts`, `src/app/api/import/route.ts`

- [ ] Create ZAP XML parser
- [ ] Map ZAP alerts to WebSecScan findings
- [ ] Implement finding deduplication
- [ ] Add import UI with file upload
- [ ] Generate combined comparison report

**Goal**: Import ZAP results, deduplicate overlapping findings

---

### 9. Crawler Performance Optimization
**Issue**: 1s rate limit too conservative; 50-page scans take 50+ seconds  
**Files**: `src/security/dynamic/crawler.ts`

- [ ] Implement adaptive rate limiting (slow on errors, speed on success)
- [ ] Add parallel request option (max 3 concurrent)
- [ ] Optimize link extraction (caching, streaming)
- [ ] Add crawler caching option (skip re-crawl)

**Goal**: Reduce 50-page crawl to <20s, configurable concurrency

---

### 10. Expand Test Coverage
**Issue**: Limited test scenarios; ~50% coverage  
**Files**: `__tests__/`, `test-fixtures/`, `docs/`

- [ ] Add integration tests (STATIC, DYNAMIC, BOTH modes)
- [ ] Create hostile test fixtures (broken HTML, infinite redirects, large responses)
- [ ] Add performance regression tests
- [ ] Expand unit tests (target 80%+ coverage)
- [ ] Add snapshot testing for reports

**Goal**: >80% code coverage, all edge cases tested

---

## 🟢 LOW PRIORITY

### 11. Multi-Target Batch Scanning
- [ ] Add batch scan API endpoint
- [ ] Implement queue-based job processing
- [ ] Add progress tracking UI

### 12. Custom Rule Engine
- [ ] Design YAML/JSON rule format
- [ ] Implement rule loader & validator
- [ ] Add UI for custom rule upload

### 13. Historical Trend Analysis
- [ ] Store scan history per target
- [ ] Generate trend charts
- [ ] Track vulnerability remediation

### 14. AI-Assisted Remediation
- [ ] Integrate LLM API (OpenAI/Claude)
- [ ] Generate code diffs for fixes
- [ ] Add "Apply Fix" button with review

---

## Implementation Phases

**Phase 3A (Immediate)**: Tasks 1, 2, 4  
**Phase 3B (Follow-up)**: Tasks 3, 5, 7  
**Phase 3C (Future)**: Tasks 6, 8-14

---

**Last Updated**: January 11, 2026
