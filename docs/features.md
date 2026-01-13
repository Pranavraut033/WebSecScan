# Features

WebSecScan provides comprehensive web security scanning through three complementary approaches: static analysis, dynamic testing, and dependency vulnerability detection.

---

## Overview

WebSecScan scans web applications using deterministic, rule-based detection aligned with **OWASP Top 10 2025**. No machine learning or randomness—every finding is auditable and reproducible.

### Three Scan Modes

| Mode | Analyzes | Best For | Speed |
|------|----------|----------|-------|
| **Static Only** | Source code patterns | Code review, offline testing | Very fast |
| **Dynamic Only** | Runtime behavior | Live site testing, crawling | Moderate |
| **Both** | Code + runtime behavior | Comprehensive assessment | Moderate-slow |

See [Scanning Overview](scanning/overview.md) for detailed explanation.

---

## Static Analysis

Analyzes source code without executing it to identify dangerous patterns and misconfigurations.

### JavaScript/TypeScript Analysis

Detects:
- **Dangerous APIs**: `eval()`, `new Function()`, `setTimeout(string)`
- **Unsafe DOM Manipulation**: `innerHTML`, `outerHTML`, `document.write()`
- **Insecure Cookies**: Missing `Secure`, `HttpOnly`, `SameSite` flags
- **Hardcoded Secrets**: API keys, passwords, tokens

**Examples**:
```javascript
// ❌ Detected as CRITICAL
eval(userInput);
element.innerHTML = untrustedData;
document.cookie = "session=abc123";  // Missing Secure flag
```

See [Static Analysis Rules](scanning/static-analysis.md) for complete rule set.

### HTML & Template Analysis

Detects:
- **Missing Content Security Policy** (CSP meta tags)
- **Unsafe Form Attributes** (autocomplete, unencrypted submission)
- **Insecure Links** (integrity attributes, deprecated protocols)

### Dependency Vulnerability Scanning

Checks dependencies against:
- **NVD (National Vulnerability Database)**
- **CVE Feeds**
- **Advisory databases**

Identifies:
- Known vulnerable versions
- Outdated packages
- Supply chain risks

---

## Dynamic Testing

Safe, non-destructive runtime testing against a permitted target URL.

### What It Tests

- **XSS (Cross-Site Scripting)** — 12 attack contexts
- **SQL Injection** — Error-based detection
- **Path Traversal** — Directory enumeration
- **CSRF (Cross-Site Request Forgery)** — Token validation
- **Authentication Flaws** — Session security, bypass attempts
- **Security Headers** — CSP, HSTS, X-Frame-Options, etc.
- **HTTP Configuration** — Protocol, redirects, TLS

### Safety Guarantees

All dynamic tests are **non-destructive**:

- ✅ No brute force attacks
- ✅ No credential stuffing
- ✅ No data extraction or modification
- ✅ No exploit chaining
- ✅ Rate-limited requests (300-1000ms between requests)
- ✅ Explicit timeouts to prevent hanging

See [Dynamic Testing Methodology](scanning/dynamic-testing.md) for details.

### URL Discovery & Crawling

The crawler discovers endpoints by:

1. **HTML Link Analysis** — Extracts `<a href>` links
2. **JavaScript Parsing** — Detects API endpoints in code
3. **Sitemap Parsing** — Reads `sitemap.xml`
4. **Endpoint Extraction** — Common patterns: `/api/*`, `/graphql`, `/rest/*`

**Default Configuration**:
- Max depth: 2 levels
- Max pages: 50
- Rate limit: 1 second between requests
- Respects `robots.txt`
- Timeout: 10 seconds per request

See [Crawler Design](scanning/crawler.md) for configuration details.

### Real-time Progress Monitoring

Watch your scan live with **Server-Sent Events (SSE)**:

```
• 10:30:45 [STATIC] Analyzing JavaScript files...
• 10:30:46 [STATIC] Found 5 potential vulnerabilities
✓ 10:30:47 [STATIC] Static analysis complete
• 10:30:48 [DYNAMIC] Starting dynamic testing...
• 10:30:50 [DYNAMIC] Crawled 20 endpoints
• 10:31:05 [DYNAMIC] Performing security tests...
✓ 10:31:30 [DYNAMIC] Complete. Score: 78/100 (Risk: MEDIUM)
```

Logs are:
- **Color-coded** by level (info, success, warning, error)
- **Timestamped** for each entry
- **Live-streamed** via SSE
- **Phase-labeled** (STATIC, DYNAMIC)

---

## Vulnerability Detection

### Finding Information

Each vulnerability includes:

| Field | Description |
|-------|-------------|
| **Title** | Clear vulnerability name |
| **Description** | What the vulnerability is and why it's risky |
| **OWASP Category** | A01-A10 (2025 taxonomy) |
| **Severity** | CRITICAL, HIGH, MEDIUM, LOW |
| **Confidence** | HIGH, MEDIUM, LOW (how confident we are) |
| **Evidence** | Code/response snippet showing the issue |
| **Remediation** | How to fix it |
| **References** | Links to OWASP, standards, etc. |

### Security Scoring

WebSecScan calculates an **overall security score** (0-100):

- **90-100**: Low Risk (GREEN)
- **70-89**: Medium Risk (YELLOW)
- **40-69**: High Risk (ORANGE)
- **0-39**: Critical Risk (RED)

Score is calculated from:
- Number and severity of vulnerabilities
- OWASP category distribution
- Context-aware confidence adjustments

See [Security Scoring](security/detection-details.md) for the algorithm.

### Reducing False Positives

WebSecScan minimizes false positives through:

- **Context-Aware Scoring** — Detects frameworks, minification, code flow
- **Confidence Thresholds** — Only reports findings above confidence threshold
- **Evidence Validation** — Requires proof, not just pattern matches
- **Category-Specific Rules** — Different thresholds for different vulnerability types

See [Reducing False Positives](security/reducing-false-positives.md) for details.

---

## Authenticated Scanning

Test security behind login pages by providing credentials.

**Features**:
- Session-based testing
- Authenticated endpoint discovery
- Post-login vulnerability testing
- Privilege escalation detection

**Safety**:
- Credentials used **in-memory only** (never logged)
- Browser contexts **isolated** per scan
- Tests remain **non-destructive**
- **Rate-limited** to respect server resources

See [Security & Ethics](security/ethics-and-authorization.md) for authorization requirements.

---

## Results & Reporting

After each scan, you'll see:

1. **Summary Card** — Score, risk level, finding count
2. **Vulnerability List** — Grouped by severity
3. **OWASP Breakdown** — Coverage by category
4. **Remediation Guidance** — How to fix each issue
5. **Export Options** — JSON, CSV, or markdown reports

---

## Scan History

WebSecScan maintains a **scan history** with:

- All scans performed
- Target URLs and modes
- Timestamps
- Scores and findings
- Trend analysis (improving/degrading over time)

---

## Comparison & Benchmarking

Compare scans across:

- **Time** — Same target, different dates
- **Modes** — Static vs Dynamic results
- **Tools** — WebSecScan vs OWASP ZAP, other tools

This helps track improvement and validate scanner accuracy.

---

## Next Steps

- **[Understand Scan Modes](scanning/overview.md)** — Static vs Dynamic in detail
- **[Static Analysis Rules](scanning/static-analysis.md)** — What patterns are detected
- **[Dynamic Testing Methodology](scanning/dynamic-testing.md)** — How runtime testing works
- **[Security & Ethics](security/ethics-and-authorization.md)** — Authorization requirements
- **[API Reference](api/overview.md)** — Programmatic scanning

## Resources

| Resource | Link |
|----------|------|
| **GitHub Repository** | [https://github.com/Pranavraut033/WebSecScan](https://github.com/Pranavraut033/WebSecScan) |
| **Live Demo** | [https://web-sec-scan.vercel.app](https://web-sec-scan.vercel.app) |
| **Documentation** | [https://pranavraut033.github.io/WebSecScan/](https://pranavraut033.github.io/WebSecScan/) |
| **Test Fixtures** | [https://github.com/Pranavraut033/WebSecScan-TestFixtures](https://github.com/Pranavraut033/WebSecScan-TestFixtures) |
