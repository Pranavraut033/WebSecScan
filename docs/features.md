# Features

WebSecScan provides comprehensive security scanning through three complementary approaches: static analysis, dynamic testing, and dependency vulnerability checking. The platform includes real-time progress monitoring and Mozilla Observatory-style security scoring.

---

## 🔄 Real-time Scan Monitoring

WebSecScan provides live feedback during security scans using **Server-Sent Events (SSE)** for real-time log streaming.

### Live Progress Logs

Watch your scan progress in real-time with color-coded logs:

```
• 10:30:45 [DYNAMIC] Starting dynamic analysis...
• 10:30:46 [DYNAMIC] Fetching headers from https://example.com...
• 10:30:46 [DYNAMIC] Analyzing security headers...
✓ 10:30:47 [DYNAMIC] Crawl completed. Found 20 URLs, 0 endpoints, 2 forms
• 10:30:48 [DYNAMIC] Performing auth and security header checks...
• 10:30:50 [DYNAMIC] Saving 7 security test results...
✓ 10:30:51 [DYNAMIC] Dynamic analysis completed. Score: 85/100 (Risk: LOW)
```

### Features
- **Fixed-height scrollable container** - Shows 3-4 logs at a time
- **Auto-scroll** - Automatically scrolls to latest log entry
- **Color-coded levels** - Info (gray), Success (green), Warning (yellow), Error (red)
- **Phase labels** - STATIC, DYNAMIC phases clearly marked
- **Live connection indicator** - Visual status showing active SSE connection
- **Timestamps** - Each log shows exact time of emission

### User Flow
1. Enter target URL and click "Start Scan"
2. **Immediately redirected** to scan page
3. **Watch real-time logs** as scan executes
4. Logs update live via Server-Sent Events
5. When complete, logs disappear and full results display

### Technical Implementation
- Uses **SSE (Server-Sent Events)** instead of WebSockets
- Better compatibility with Next.js and serverless deployments
- Logs kept in-memory (not persisted to database)
- Automatic cleanup when scan completes or client disconnects

See [Real-time Logging Documentation](crawler/real-time-logging.md) for implementation details.

---

## 🔍 Static Analysis

Static analysis examines source code and markup files to identify security vulnerabilities without executing the application.

### JavaScript/TypeScript Analysis

#### Dangerous API Detection

Detects usage of inherently risky JavaScript APIs:

```javascript
// ❌ Detected as CRITICAL
eval('user input');
new Function('return ' + userInput);
setTimeout('alert(1)');
setInterval(userCode);
```

**Why it's dangerous**: Direct code execution from strings can lead to arbitrary code execution if user input is involved.

#### Unsafe DOM Manipulation

Identifies patterns that can lead to XSS:

```javascript
// ❌ Detected as HIGH
element.innerHTML = userInput;
element.outerHTML = data;
document.write(content);
```

**Remediation**: Use `textContent`, `createElement()`, or sanitize with DOMPurify.

#### Insecure Cookie Usage

Flags cookies without proper security attributes:

```javascript
// ❌ Detected as MEDIUM
document.cookie = "session=abc123";
// Missing: Secure, HttpOnly, SameSite
```

**Best practice**: 
```javascript
document.cookie = "session=abc123; Secure; HttpOnly; SameSite=Strict";
```

#### Hardcoded Secrets

Detects potential credentials in source code:

```javascript
// ❌ Detected as CRITICAL
const apiKey = 'sk_live_abc123';
const password = 'admin123';
const token = 'ghp_1234567890';
```

**Remediation**: Use environment variables and secret management systems.

---

### HTML/Template Analysis

#### Missing Content Security Policy

Detects absence of CSP headers or meta tags:

```html
<!-- ❌ Missing CSP -->
<html>
<head>
  <title>My App</title>
</head>
```

**Fix**: Add CSP meta tag:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'nonce-{random}'">
```

#### Inline Scripts Without Nonce

Identifies inline scripts that bypass CSP:

```html
<!-- ❌ Detected as HIGH -->
<script>
  doSomething();
</script>
```

**Remediation**: Use external scripts or nonce attributes with CSP.

#### Insecure Form Actions

Detects forms with security issues:

```html
<!-- ❌ HTTP submission detected -->
<form action="http://example.com/login">
  <input type="password" name="pwd">
</form>

<!-- ❌ Missing action attribute -->
<form method="post">
  <input type="password">
</form>
```

**Fix**: Always use HTTPS and explicit, validated action URLs.

#### Missing Input Validation Attributes

Flags input fields without proper constraints:

```html
<!-- ⚠️ No validation attributes -->
<input type="email" name="email">
<input type="url" name="website">
```

**Improvement**:
```html
<input type="email" name="email" required pattern="[^@]+@[^@]+\.[^@]+">
<input type="url" name="website" required pattern="https?://.+">
```

---

## 🔗 URL Normalization & Protocol Security

Before scanning begins, WebSecScan automatically normalizes and validates target URLs to ensure optimal security coverage.

### Automatic Protocol Handling

**HTTPS Preference**: URLs without a protocol automatically default to HTTPS
```
Input:  example.com
Output: https://example.com
```

**Automatic Upgrade**: HTTP URLs are tested for HTTPS availability
```
Input:  http://example.com
Test:   Attempt connection to https://example.com
Result: Upgrade to HTTPS if available, fallback to HTTP if not
```

### HTTP Security Threat Detection

Sites accessible only via HTTP are flagged as **HIGH severity** vulnerabilities:

```json
{
  "type": "INSECURE_PROTOCOL",
  "severity": "HIGH",
  "owaspCategory": "A04:2025-Cryptographic Failures",
  "message": "Site uses HTTP instead of HTTPS. All traffic is transmitted in cleartext.",
  "remediation": "Enable HTTPS by obtaining an SSL/TLS certificate. Configure server redirects and implement HSTS headers."
}
```

**Why it matters**: HTTP transmits all data in cleartext, including:
- Login credentials
- Session tokens
- Personal information
- API keys

### Redirect Detection

Automatically detects and tracks URL redirects:

**www-Redirect Detection**:
```
example.com → www.example.com (detected)
www.example.com → example.com (detected)
```

**Protocol Upgrades**:
```
http://example.com → https://example.com (detected)
```

**Benefits**:
- Ensures scanning targets the actual destination
- Identifies redirect chains that may indicate misconfiguration
- Tracks www vs non-www conventions

### Connection Validation

Before initiating a scan:
- Tests URL accessibility with HEAD requests (non-destructive)
- Validates DNS resolution
- Enforces configurable timeouts (default: 10 seconds)
- Provides clear error messages for unreachable targets

**Supported URL Formats**:
```
✅ https://example.com
✅ http://example.com
✅ example.com (auto-adds https://)
✅ www.example.com (auto-adds https://)
✅ example.com/path?query=value
❌ ftp://example.com (FTP not supported)
❌ user:pass@example.com (credentials not allowed)
```

### Private Network Protection

Safeguards against scanning restricted addresses:

**Blocked**:
- Link-local addresses (169.254.x.x)
- URLs with embedded credentials

**Allowed (Development Only)**:
- localhost / 127.0.0.1
- Private networks (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- .local domains

---

## 🌐 Dynamic Testing

Dynamic testing involves running safe, non-destructive tests against a live web application.

### 🏆 Security Scoring System

WebSecScan includes a comprehensive security scoring system that assesses your application's security posture using a numeric 0-100 scale with risk-based categorization.

#### Score Calculation

- **Base Score**: 100
- Tests add or subtract points based on security compliance
- Final score clamped to 0-100 range
- Risk level assigned: **LOW**, **MEDIUM**, **HIGH**, or **CRITICAL**

**Risk Bands**:
```
LOW      = Score ≥ 80  (Good security posture)
MEDIUM   = Score 60-79 (Moderate concerns)
HIGH     = Score 40-59 (Significant issues)
CRITICAL = Score < 40  (Severe vulnerabilities)
```

**See [Scoring Methodology](security/scoring.md) for detailed rationale and calculation details.**

#### Security Tests Performed

##### 1. Content Security Policy (CSP) Analysis

**10 Detailed Checks**:

✅ **No unsafe-inline in script-src** (High severity)
```html
<!-- ❌ Fails check -->
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' 'unsafe-inline'">

<!-- ✅ Passes check -->
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' 'nonce-{random}'">
```
**Impact**: -25 points if CSP missing, variable deduction for unsafe directives

✅ **No unsafe-eval in script-src** (High severity)
- Prevents `eval()` and `Function()` constructor abuse

✅ **Object-src restrictions** (Medium severity)
```
Required: object-src 'none' or inherited from default-src 'none'
```

✅ **No unsafe-inline in style-src** (Medium severity)
- Prevents inline style injection attacks

✅ **HTTPS-only resources** (High severity)
- No `http:`, `ftp:`, or wildcard `https:` schemes

✅ **Frame-ancestors for clickjacking** (Medium severity)
```
Recommended: frame-ancestors 'none' or 'self'
```

✅ **Deny by default** (Low severity)
```
Best practice: default-src 'none'
```

✅ **Base-uri restriction** (Medium severity)
- Prevents `<base>` tag hijacking

✅ **Form-action restriction** (Medium severity)
- Prevents form data exfiltration

✅ **Strict-dynamic for loading** (Info - optional)
- Advanced CSP feature for dynamic script loading

##### 2. Cookie Security

**Tests**:
- ✅ All cookies have `Secure` flag (-20 if missing)
- ✅ Session cookies have `HttpOnly` flag (-20 if missing)
- ✅ Cookies not set over HTTP (-20 if violated)
- ✅ `SameSite` attribute present (+5 bonus)

**Example**:
```http
✅ Set-Cookie: session=abc; Secure; HttpOnly; SameSite=Strict
❌ Set-Cookie: session=abc
```

##### 3. HTTP Security Headers

**Strict-Transport-Security (HSTS)**:
```http
✅ Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
❌ Missing header: -20 points
⚠️  Short max-age (<6 months): -10 points
```

**X-Content-Type-Options**:
```http
✅ X-Content-Type-Options: nosniff
❌ Missing: -5 points
```

**X-Frame-Options**:
```http
✅ X-Frame-Options: DENY
✅ X-Frame-Options: SAMEORIGIN
❌ Missing: -20 points
```

**Referrer-Policy**:
```http
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Referrer-Policy: no-referrer
⚠️  Missing: 0 points (Info only)
✅ Strong policy: +5 bonus points
```

#### Raw Server Headers Capture

All HTTP response headers are captured and displayed:
```json
{
  "content-security-policy": "default-src 'self'",
  "strict-transport-security": "max-age=31536000",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "set-cookie": "session=...; Secure; HttpOnly; SameSite=Strict"
}
```

### Web Crawler

A conservative crawler that discovers application endpoints while respecting boundaries:

**Features**:

- Honors `robots.txt` directives
- Enforces configurable rate limits (default: 10 requests/second)
- Respects `max-depth` setting to prevent infinite crawling
- Identifies:
  - Reachable pages and endpoints
  - Forms and input fields
  - API endpoints
  - External resource references

**Safety**: Never follows logout links or destructive actions (DELETE, remove, etc.)

### Cross-Site Scripting (XSS) Testing

Safe, non-exploitative XSS detection:

#### Reflected XSS

Tests for reflected user input without actual exploitation:

```
Test payloads (safe):
- <script>alert('XSS-Test')</script>
- <img src=x onerror=alert('XSS')>
- javascript:alert('XSS')
```

**Detection method**:
1. Submit test payload to input fields
2. Check if payload appears unescaped in response
3. Verify DOM context (script tag, attribute, etc.)
4. Record evidence without executing

**No harm done**: Uses benign `alert()` payloads that would only trigger in vulnerable contexts; never chains exploits.

#### DOM-based XSS

Analyzes client-side JavaScript for unsafe DOM manipulation:

```javascript
// Detected patterns:
location.href = userInput;  // Open redirect
eval(location.hash);        // Hash-based injection
innerHTML = params.get('q'); // URL parameter injection
```

### Security Header Validation

Checks for presence and proper configuration of security headers:

| Header | Check | Severity |
|--------|-------|----------|
| `Content-Security-Policy` | Present and properly configured | HIGH |
| `Strict-Transport-Security` | HTTPS sites should have HSTS | MEDIUM |
| `X-Frame-Options` | Present to prevent clickjacking | MEDIUM |
| `X-Content-Type-Options` | Set to `nosniff` | LOW |
| `Referrer-Policy` | Configured to limit referrer leakage | LOW |

### Authentication & Session Checks

Non-invasive validation of authentication patterns:

**Cookie Security**:

- ✅ `Secure` flag on HTTPS cookies
- ✅ `HttpOnly` flag to prevent XSS cookie theft
- ✅ `SameSite` attribute to prevent CSRF

**Session Management**:

- Detects weak session identifiers
- Checks for session fixation vulnerabilities
- Validates logout functionality

**Important**: No brute force, no credential testing, no account takeover attempts.

---

## 📦 Dependency Scanning

Identifies known vulnerabilities in third-party libraries.

### Package Manifest Analysis

Parses `package.json` and lock files:

```json
{
  "dependencies": {
    "lodash": "4.17.15",  // ❌ Known CVE
    "axios": "0.19.0"      // ❌ Outdated, has security fixes
  }
}
```

### Vulnerability Database Matching

Checks versions against:

- **NVD** (National Vulnerability Database)
- **CVE** (Common Vulnerabilities and Exposures)
- **npm advisory database**
- **GitHub Security Advisories**

### Fix Guidance

Provides actionable remediation:

```
✗ lodash@4.17.15 has 2 vulnerabilities

  High: Prototype Pollution
  CVE-2020-8203
  
  Fix: npm install lodash@4.17.21
  
  Medium: ReDoS in toNumber
  CVE-2019-10744
  
  Fixed in: 4.17.19+
```

---

## 📊 Reporting & Remediation

### Structured Vulnerability Reports

Each finding includes:

1. **Unique ID**: `WSS-STATIC-001`, `WSS-DYNAMIC-XSS-001`
2. **OWASP Category**: Mapped to OWASP Top 10 2025
3. **Severity**: Critical, High, Medium, Low
4. **Confidence**: How certain we are about the finding
5. **Evidence**: Code snippet or HTTP request/response
6. **Location**: File path, line number, or URL
7. **Remediation**: Step-by-step fix guidance
8. **References**: Links to OWASP, CVE, or documentation

### Example Vulnerability Report

```json
{
  "id": "WSS-STATIC-JS-001",
  "owaspCategory": "A05:2025-Injection",
  "severity": "CRITICAL",
  "confidence": "HIGH",
  "title": "Use of eval() with potential user input",
  "description": "The eval() function executes arbitrary JavaScript code...",
  "evidence": "const result = eval(userInput);",
  "location": "src/utils/parser.js:42",
  "remediation": [
    "Remove eval() usage entirely",
    "Use JSON.parse() for parsing JSON data",
    "Use Function constructors with caution and validation",
    "Implement input validation and sanitization"
  ],
  "references": [
    "https://owasp.org/Top10/2025/",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval"
  ]
}
```

### Dashboard Visualization

The UI presents findings with:

- **Color-coded severity badges**
- **Filterable vulnerability lists**
- **Trend analysis over time**
- **Exportable reports** (JSON, PDF planned)

---

## 🎯 Detection Accuracy

### Confidence Levels Explained

| Confidence | Meaning | Example |
|------------|---------|---------|
| **High** | Verified with strong evidence | Direct `eval()` call found |
| **Medium** | Likely issue, may need validation | Potential SQL injection pattern |
| **Low** | Possible issue, needs investigation | Suspicious variable name |

### False Positive Mitigation

We minimize false positives through:

1. **Context-aware analysis**: Check surrounding code context
2. **Comment filtering**: Ignore code in comments
3. **String literal analysis**: Distinguish between user input and constants
4. **Deterministic rules**: No probabilistic ML models
5. **Test fixtures**: Validated against known vulnerable code

---

## � Scan History & Tracking

### Historical Scan Data

View up to 20 previous scans for any hostname:

**Features**:
- Score and risk level tracking over time
- Status of each scan (COMPLETED, FAILED, RUNNING)
- Scan mode used (STATIC, DYNAMIC, BOTH)
- Quick navigation to detailed reports
- Timestamp of each scan

**Example History View**:
```
Scan History for example.com

Date                  Status      Mode     Score  Risk Level
2025-12-20 10:30 AM  COMPLETED   BOTH     85     B
2025-12-19 02:15 PM  COMPLETED   DYNAMIC  72     C
2025-12-18 09:00 AM  COMPLETED   BOTH     91     A
```

**Use Cases**:
- Track security improvements after fixes
- Compare scan results before/after deployment
- Monitor security posture trends
- Demonstrate compliance improvements

### Rescan Functionality

Quickly re-test a target with one click:

**Features**:
- One-click rescan button on results page
- Maintains same URL and scan mode
- Automatically navigates to new scan
- Preserves historical data

**Usage**:
1. View any completed scan
2. Click "Rescan" button in header
3. New scan starts with identical settings
4. Compare with previous results in history

## 🔄 Continuous Scanning

WebSecScan is designed for integration into CI/CD pipelines:

```bash
# Run scan via CLI (planned feature)
websecscan scan --target http://localhost:3000 --mode both

# Exit with error code if critical vulnerabilities found
websecscan scan --fail-on critical

# Fail if security score below threshold
websecscan scan --min-score 85
```

---

## 🛠️ Customization

Future configuration options (planned):

- Custom rule definitions
- Severity threshold configuration
- Exclude patterns for false positives
- Custom vulnerability databases

---

## Next Steps

- **[See What We Test](evaluation/testing-coverage.md)**: Detailed coverage matrix
- **[Understand Architecture](architecture.md)**: How features are implemented
- **[View API Reference](api.md)**: Integrate scanning into your tools
