# Security Scanning Agents & Components

This page describes the specialized scanning agents that perform vulnerability detection.

---

## Agent Overview

WebSecScan uses modular, composable agents that each perform a focused set of deterministic security checks:

```
┌─────────────────────────────────────────┐
│         Agent Coordinator               │
│    (Orchestrates multi-agent scans)     │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┬──────────────────┐
    ↓                 ↓                   ↓
┌─────────┐     ┌──────────┐      ┌─────────┐
│ Static  │     │ Dynamic  │      │ Library │
│Analysis │     │ Testing  │      │ Scanner │
│  Agent  │     │  Agent   │      │  Agent  │
└─────────┘     └──────────┘      └─────────┘
```

Each agent:
- ✅ Executes independently
- ✅ Produces structured findings
- ✅ Enforces safety constraints
- ✅ Logs detailed debug info

---

## Static Analysis Agent

### Purpose

Analyze source code and markup without executing it to identify dangerous patterns and security misconfigurations.

### Components

#### JavaScript/TypeScript Analyzer

**Detects**:

| Pattern | Severity | Why Risky |
|---------|----------|----------|
| `eval()` | CRITICAL | Direct code execution from strings |
| `new Function()` | CRITICAL | Dynamic function creation |
| `setTimeout(string)` | HIGH | Indirect code execution |
| `.innerHTML =` | HIGH | Potential XSS via unsanitized input |
| `.outerHTML =` | HIGH | Potential XSS |
| `document.write()` | HIGH | Uncontrolled DOM writes |
| `document.cookie` without `Secure` | MEDIUM | Session hijacking risk |
| `document.cookie` without `HttpOnly` | MEDIUM | XSS cookie theft |
| Hardcoded secrets (API keys, passwords) | CRITICAL | Credential exposure |

**Example**:
```javascript
// ❌ Detected as CRITICAL
eval(userInput);

// ❌ Detected as HIGH
element.innerHTML = userData;

// ❌ Detected as MEDIUM
document.cookie = "session=abc123";  // Missing Secure/HttpOnly
```

**Output**: List of vulnerabilities with line numbers and evidence snippets.

#### HTML & Template Analyzer

**Detects**:

| Pattern | Severity | Why Risky |
|---------|----------|----------|
| Missing `<meta>` CSP tag | MEDIUM | No content security policy |
| Form without CSRF token pattern | MEDIUM | CSRF vulnerability |
| `autocomplete="off"` on login forms | LOW | UX issue (not security) |
| Unencrypted form submission (HTTP) | HIGH | Man-in-the-middle exposure |

#### Dependency Analyzer

**Detects**:

| Check | Severity |
|-------|----------|
| Known vulnerable versions (CVE) | CRITICAL/HIGH |
| Outdated packages (1+ year old) | MEDIUM/LOW |
| Supply chain risks (typosquats) | HIGH |

Checks against:
- National Vulnerability Database (NVD)
- CVE feeds
- Package advisory databases

---

## Dynamic Testing Agent

### Purpose

Safe, non-destructive runtime testing against a permitted target URL.

### Components

#### URL Crawler

**Discovers endpoints by**:
1. HTML link extraction (`<a href>`)
2. JavaScript parsing (API endpoint patterns)
3. Sitemap.xml parsing
4. AJAX/fetch call detection

**Safety defaults**:
- Max depth: 2 levels
- Max pages: 50
- Rate limit: 1 second between requests
- Respects `robots.txt`
- Timeout: 10 seconds per request

See [Crawler Design](../scanning/crawler.md) for full details.

#### XSS Tester

**Tests 12 attack contexts**:
1. Reflected in HTML body
2. In HTML attributes
3. In JavaScript strings
4. In event handlers
5. In URL fragments
6. In JSON responses
7. In DOM properties
8. In CSS contexts
9. In template literals
10. In SVG elements
11. In iframe src
12. In script tag content

**Payloads**: Safe, detection-only (no execution):
```javascript
// Example payload (safe)
'"><svg onload=alert(1)>
```

**Output**: Identifies vulnerable endpoints and injection points.

#### SQL Injection Tester

**Tests error-based injection** with 7 safe payloads:

```
' OR '1'='1
' OR 1=1--
' OR '1'='1' /*
' UNION SELECT NULL--
' AND 1=0 UNION SELECT NULL--
'; DROP TABLE users--
' OR SLEEP(5)--
```

**Detection**: Monitors for database error messages in responses (MySQL, PostgreSQL, MSSQL, Oracle, SQLite).

**Output**: Identifies injectable parameters.

#### Path Traversal Tester

**Tests 8 payloads** targeting Unix/Windows file systems:

```
../../../etc/passwd
..\\..\\..\\windows\\win.ini
....//....//....//etc/passwd
%2e%2e%2f%2e%2e%2fetc%2fpasswd
```

**Detection**: Looks for file content patterns (magic bytes, known file contents).

**Output**: Identifies vulnerable parameters.

#### CSRF Tester

**Checks**:
1. Presence of CSRF tokens (8+ patterns)
2. Token entropy and uniqueness
3. SameSite cookie attributes
4. State-changing method analysis (POST vs GET)

**Output**: CSRF protection gaps.

#### Authentication Scanner

**Tests**:
1. Session cookie security (Secure, HttpOnly, SameSite)
2. Unauthenticated access to protected endpoints
3. Invalid token handling (malformed, expired)
4. Parameter manipulation (ID-based access control)

**Output**: Authentication/authorization flaws.

#### Security Header Tester

**Checks for**:
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Permissions-Policy
- Referrer-Policy
- Expect-CT

**Output**: Missing or misconfigured security headers.

---

## Library Scanner Agent

### Purpose

Identify known vulnerable dependency versions and outdated packages.

### Behavior

1. **Parse manifest files**:
   - `package.json` (Node.js/JavaScript)
   - `requirements.txt` (Python)
   - `pom.xml` (Java)
   - `Gemfile` (Ruby)
   - etc.

2. **Check version against vulnerability feeds**:
   - NVD (National Vulnerability Database)
   - CVE feeds
   - Package-specific advisories

3. **Produce findings**:
   - Vulnerable version number
   - CVE identifier
   - Severity (CVSS score)
   - Remediation (upgrade version)
   - Link to advisory

### Output

Structured vulnerability objects with:
- Package name and version
- OWASP 2025 category (`A03:2025 - Supply Chain`)
- Severity and CVSS score
- Remediation guidance

---

## Agent Configuration & Safety

### Configuration Options

| Option | Default | Purpose |
|--------|---------|---------|
| `scanMode` | `"BOTH"` | `"STATIC"`, `"DYNAMIC"`, or `"BOTH"` |
| `maxDepth` | `2` | Crawler max depth |
| `maxPages` | `50` | Crawler max pages to crawl |
| `rateLimit` | `1000ms` | Delay between requests |
| `timeout` | `10000ms` | Per-request timeout |
| `respectRobotsTxt` | `true` | Honor robots.txt directives |

### Safety Constraints

All agents enforce:

✅ **Deterministic behavior** — Same input → same output  
✅ **No randomness** — Reproducible scans  
✅ **No brute force** — No credential guessing  
✅ **No DoS** — Rate limited, timeouts enforced  
✅ **No data extraction** — Read-only operations  
✅ **No exploit chaining** — Single-test isolation  
✅ **Explicit authorization** — User consent required  
✅ **Auditable logic** — Rule-based, not ML  

---

## Outputs & Integration

### Finding Structure

Each vulnerability includes:

```typescript
{
  id: "WSS-XSS-001",              // Unique ID
  owaspId: "A03:2025",            // OWASP 2025 category
  owaspCategory: "Injection",     // Human-readable
  severity: "HIGH",               // CRITICAL | HIGH | MEDIUM | LOW
  confidence: "HIGH",             // HIGH | MEDIUM | LOW
  title: "Reflected XSS",
  description: "User input reflected in response without escaping",
  evidence: "<img src=x onerror=alert(1)>",  // Code snippet
  location: "GET /search?q=",     // Where it was found
  remediation: "Use textContent instead of innerHTML; sanitize with DOMPurify",
  references: [
    "https://owasp.org/...",
    "https://cheatsheetseries.owasp.org/..."
  ]
}
```

### Integration

Findings from all agents are:
1. **Normalized** to common format
2. **Deduplicated** (same vuln from multiple agents = 1 finding)
3. **Classified** using OWASP 2025 mapping
4. **Scored** for risk level
5. **Stored** in database
6. **Returned** to user

---

## Next Steps

- **[Static Analysis Rules](../scanning/static-analysis.md)** — Detailed static checks
- **[Dynamic Testing](../scanning/dynamic-testing.md)** — Detailed dynamic tests
- **[Crawler Design](../scanning/crawler.md)** — URL discovery configuration
- **[OWASP 2025](../security/owasp-2025.md)** — Vulnerability categories

## Resources

| Resource | Link |
|----------|------|
| **GitHub Repository** | [https://github.com/Pranavraut033/WebSecScan](https://github.com/Pranavraut033/WebSecScan) |
| **Live Demo** | [https://web-sec-scan.vercel.app](https://web-sec-scan.vercel.app) |
| **Documentation** | [https://pranavraut033.github.io/WebSecScan/](https://pranavraut033.github.io/WebSecScan/) |
| **Test Fixtures** | [https://github.com/Pranavraut033/WebSecScan-TestFixtures](https://github.com/Pranavraut033/WebSecScan-TestFixtures) |
