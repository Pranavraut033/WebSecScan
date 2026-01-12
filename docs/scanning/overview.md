# Scanning Overview

WebSecScan scans web applications using three complementary modes: Static Analysis, Dynamic Testing, or Both.

---

## Scan Modes Explained

### Static Analysis

**What it does**: Analyzes source code patterns without executing the application.

| Aspect | Details |
|--------|---------|
| **Input** | JavaScript, TypeScript, HTML source code |
| **Speed** | Very fast (seconds) |
| **Scope** | Broad pattern matching |
| **Depth** | High (can find root causes) |
| **Requirements** | Access to source code |
| **Best for** | Code review, offline testing, CI/CD pipelines |

**Detects**:
- Dangerous APIs (`eval`, `innerHTML`, etc.)
- Insecure coding patterns
- Hardcoded secrets
- Missing security headers
- Vulnerable dependencies

**Example**:
```bash
Target: https://example.com
Mode: Static
Result: "eval() detected in main.js:45" (HIGH risk)
```

### Dynamic Testing

**What it does**: Runtime testing via HTTP requests against a live target.

| Aspect | Details |
|--------|---------|
| **Input** | Live URL (must be accessible) |
| **Speed** | Moderate to slow (1-5 minutes) |
| **Scope** | Deep runtime testing |
| **Depth** | Tests actual behavior, not just patterns |
| **Requirements** | Live, accessible target |
| **Best for** | Live site testing, behavior validation |

**Detects**:
- XSS (Cross-Site Scripting)
- SQL Injection
- Authentication flaws
- CSRF vulnerabilities
- Misconfigured security headers
- Directory traversal

**Example**:
```bash
Target: https://example.com
Mode: Dynamic
Result: "XSS reflected in search endpoint" (HIGH risk)
```

### Both (Static + Dynamic)

Combines both approaches for comprehensive assessment.

| Aspect | Details |
|--------|---------|
| **Speed** | Moderate-slow (1-10 minutes) |
| **Coverage** | Most comprehensive |
| **Cost** | Time investment |
| **Best for** | Complete security assessments |

**Detects**: Everything from both modes

**Example**:
```bash
Target: https://example.com
Mode: Both
Results:
  Static: 5 issues found
  Dynamic: 3 issues found
  Total: 8 issues (3 unique to static, 2 unique to dynamic, 2 found by both)
```

---

## When to Use Each Mode

### Use Static Only If...

✅ You don't have a live target  
✅ You're reviewing code locally  
✅ You want very fast feedback  
✅ You're running in CI/CD  
✅ Target is not accessible from your network  

### Use Dynamic Only If...

✅ You can't access source code  
✅ You're testing a third-party app  
✅ You want to validate actual behavior  
✅ You need real-world evidence  

### Use Both If...

✅ You have the time  
✅ You need comprehensive assessment  
✅ You're doing security audit  
✅ You want to compare results  

---

## Scan Process

### 1. URL Validation

Your target URL is validated and normalized:

```
Input: example.com
↓
- Protocol check (HTTP or HTTPS?)
- HTTPS upgrade attempt
- Redirect detection
- Private IP check (dev only)
↓
Output: https://example.com
```

See [URL Validation](../security/detection-details.md) for details.

### 2. Authorization Check

You must confirm:

> "I have authorization to test this target"

This is a **legal requirement**. Unauthorized testing is illegal.

See [Security & Ethics](../security/ethics-and-authorization.md) for details.

### 3. Scan Execution

#### For Static Mode:
1. Fetch source code (if available)
2. Analyze JavaScript/TypeScript
3. Analyze HTML/templates
4. Check dependencies
5. Classify findings (OWASP 2025)
6. Calculate security score

#### For Dynamic Mode:
1. Crawl target (discover endpoints)
2. Perform XSS testing
3. Perform SQL injection testing
4. Perform CSRF testing
5. Check authentication
6. Analyze security headers
7. Classify findings (OWASP 2025)
8. Calculate security score

### 4. Real-time Progress

During the scan, live logs stream via Server-Sent Events:

```
• 10:30:45 [STATIC] Analyzing JavaScript files...
• 10:30:46 [STATIC] Found pattern: eval() at main.js:45
• 10:30:47 [STATIC] Analyzing HTML templates...
✓ 10:30:50 [STATIC] Static analysis complete: 5 findings
• 10:30:51 [DYNAMIC] Starting URL crawl...
• 10:30:55 [DYNAMIC] Discovered 20 endpoints
• 10:31:00 [DYNAMIC] Testing XSS vulnerabilities...
• 10:31:15 [DYNAMIC] Reflected XSS found in /search
✓ 10:31:30 [DYNAMIC] Dynamic testing complete: 3 findings
```

### 5. Results

After completion:

1. **Summary** — Overall score, risk level, finding count
2. **Vulnerabilities** — Grouped by severity (CRITICAL → LOW)
3. **Remediation** — How to fix each issue
4. **OWASP Breakdown** — Coverage by category (A01-A10)
5. **Timeline** — Scan history and trends

---

## Understanding Results

### Severity Levels

| Level | Risk | Action |
|-------|------|--------|
| **CRITICAL** | Immediate exploitation risk | Fix immediately |
| **HIGH** | Likely exploitable | Fix ASAP (days) |
| **MEDIUM** | Possible exploitation | Fix soon (weeks) |
| **LOW** | Unlikely exploitation | Fix eventually |

### Confidence Levels

| Confidence | Meaning |
|-----------|---------|
| **HIGH** | Very likely a real vulnerability |
| **MEDIUM** | Probably a real vulnerability |
| **LOW** | Possible vulnerability, needs validation |

A **HIGH severity finding with MEDIUM confidence** is more urgent than a **CRITICAL finding with LOW confidence**.

### Security Score

WebSecScan calculates an overall score (0-100):

| Score | Risk Level | Color |
|-------|-----------|-------|
| 90-100 | LOW | 🟢 Green |
| 70-89 | MEDIUM | 🟡 Yellow |
| 40-69 | HIGH | 🟠 Orange |
| 0-39 | CRITICAL | 🔴 Red |

Score is based on:
- Number of vulnerabilities
- Severity distribution
- OWASP category coverage
- Context-aware confidence adjustments

---

## Comparison Scans

Compare scan results to track improvement:

```
Static Analysis (Jan 10): 5 findings
  - A03:2025 Injection: 2
  - A05:2025 Security Misconfiguration: 3
  Score: 62/100 (HIGH)

Static Analysis (Jan 15): 3 findings
  - A03:2025 Injection: 1
  - A05:2025 Security Misconfiguration: 2
  Score: 72/100 (MEDIUM)

Improvement: +10 points, 2 fewer vulnerabilities
```

---

## Common Questions

**Q: What's the difference between finding something in static vs dynamic?**

A: Static detects patterns (e.g., `eval()` in code). Dynamic detects actual exploitation (e.g., XSS payload reflected in response). Both are real issues.

**Q: Why does dynamic testing take longer?**

A: It must crawl the site (discover endpoints), then test each endpoint. Rate limiting (1 request/second) prevents overwhelming the target.

**Q: Can I cancel a running scan?**

A: Yes, you can stop it anytime. Partial results are saved.

**Q: Are the findings always accurate?**

A: WebSecScan minimizes false positives through confidence scoring. See [Reducing False Positives](../security/reducing-false-positives.md) for details. Manual validation is always recommended.

---

## Next Steps

- **[Static Analysis Rules](static-analysis.md)** — What patterns are detected
- **[Dynamic Testing](dynamic-testing.md)** — How runtime testing works
- **[Crawler Configuration](crawler.md)** — How URL discovery works
- **[Security Scoring](../security/detection-details.md)** — How risk is calculated
