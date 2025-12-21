# What We Test

This page provides a comprehensive overview of the security checks WebSecScan performs, mapped to industry standards and best practices.

---

## 🎯 OWASP Top 10 2025 Coverage

WebSecScan aligns with the **OWASP Top 10** to ensure comprehensive vulnerability detection:

| OWASP Category | Coverage | Detection Method | Example Vulnerabilities |
|----------------|----------|------------------|------------------------|
| **A01: Broken Access Control** | Partial | Dynamic (Auth checks) | Missing authentication, insecure direct object references |
| **A02: Cryptographic Failures** | ✅ Full | Static + Dynamic | Weak encryption, missing HTTPS, insecure cookies |
| **A03: Injection** | ✅ Full | Static (eval, innerHTML) | XSS, code injection via eval() |
| **A04: Insecure Design** | Partial | Static (CSP, form validation) | Missing CSP, weak form validation |
| **A05: Security Misconfiguration** | ✅ Full | Static + Dynamic | Missing security headers, default configs |
| **A06: Vulnerable Components** | ✅ Full | Dependency scan | Outdated libraries, known CVEs |
| **A07: Identification & Auth Failures** | Partial | Dynamic (session checks) | Insecure cookies, weak session management |
| **A08: Software & Data Integrity** | Partial | Static (CSP, SRI) | Missing CSP, no subresource integrity |
| **A09: Security Logging & Monitoring** | ⚠️ Limited | N/A | (Future: detect missing logging) |
| **A10: Server-Side Request Forgery** | ⚠️ Limited | Dynamic (URL validation) | (Future: SSRF pattern detection) |

**Legend**:
- ✅ Full: Comprehensive detection with high confidence
- Partial: Some aspects covered
- ⚠️ Limited: Minimal or planned coverage

---

## 🔍 Static Analysis Checks

### JavaScript/TypeScript Security Patterns

#### 1. Code Injection Vulnerabilities

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| `eval()` usage | CRITICAL | A03 | Detects direct `eval()` calls |
| `new Function()` | CRITICAL | A03 | Detects dynamic function creation |
| `setTimeout(string)` | HIGH | A03 | String-based timeout execution |
| `setInterval(string)` | HIGH | A03 | String-based interval execution |
| `execScript()` | CRITICAL | A03 | Legacy IE code execution |

**Test Example**:
```javascript
// All of these are detected:
eval(userInput);                           // CRITICAL
const fn = new Function('x', 'return ' + x); // CRITICAL
setTimeout('doSomething()', 1000);         // HIGH
setInterval(code, 100);                    // HIGH
```

#### 2. DOM Manipulation Vulnerabilities

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| `innerHTML` assignment | HIGH | A03 | XSS via innerHTML |
| `outerHTML` assignment | HIGH | A03 | XSS via outerHTML |
| `document.write()` | MEDIUM | A03 | Legacy document manipulation |
| `insertAdjacentHTML()` | HIGH | A03 | HTML injection point |

**Test Example**:
```javascript
// Detected XSS vectors:
element.innerHTML = userInput;              // HIGH
element.outerHTML = data;                  // HIGH
document.write('<div>' + content + '</div>'); // MEDIUM
element.insertAdjacentHTML('beforeend', html); // HIGH
```

#### 3. Insecure Cookie Handling

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| Missing `Secure` flag | MEDIUM | A02, A07 | Cookie without Secure attribute |
| Missing `HttpOnly` flag | MEDIUM | A07 | XSS can steal session cookies |
| Missing `SameSite` | MEDIUM | A07 | CSRF vulnerability |

**Test Example**:
```javascript
// Detected as insecure:
document.cookie = "session=xyz";           // MEDIUM (missing all flags)

// Secure alternative:
document.cookie = "session=xyz; Secure; HttpOnly; SameSite=Strict";
```

#### 4. Hardcoded Secrets

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| API keys | CRITICAL | A02 | Hardcoded API credentials |
| Passwords | CRITICAL | A02, A07 | Plaintext passwords in code |
| Tokens | CRITICAL | A02 | OAuth/JWT tokens in source |
| Private keys | CRITICAL | A02 | Cryptographic keys in code |

**Detection Patterns**:
```javascript
// All detected as CRITICAL:
const apiKey = 'sk_live_...';
const password = 'admin123';
const token = 'ghp_...';
const awsSecret = 'AKIA...';
```

---

### HTML/Template Security Patterns

#### 5. Content Security Policy

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| Missing CSP header/meta | HIGH | A05 | No CSP protection |
| Unsafe CSP directives | MEDIUM | A05 | `unsafe-inline`, `unsafe-eval` |
| Missing nonce on inline scripts | HIGH | A03, A05 | Inline script without nonce |

**Test Example**:
```html
<!-- ❌ Missing CSP -->
<html><head><title>App</title></head></html>

<!-- ❌ Inline script without nonce -->
<script>alert('hello');</script>

<!-- ✅ Secure CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'nonce-{random}'">
<script nonce="{random}">alert('safe');</script>
```

#### 6. Form Security

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| HTTP form action | HIGH | A02 | Form submits over HTTP |
| Missing form action | MEDIUM | A04 | No explicit action URL |
| Password field over HTTP | CRITICAL | A02 | Credentials sent unencrypted |

**Test Example**:
```html
<!-- ❌ HTTP form submission -->
<form action="http://example.com/login" method="post">
  <input type="password" name="pwd">
</form>

<!-- ❌ Missing action -->
<form method="post">
  <input type="password">
</form>

<!-- ✅ Secure form -->
<form action="https://example.com/login" method="post">
  <input type="password" name="pwd" autocomplete="current-password">
</form>
```

#### 7. Input Validation

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| Missing `required` attribute | LOW | A04 | No client-side validation |
| Missing `pattern` attribute | LOW | A04 | No input format validation |
| Missing `maxlength` | LOW | A04 | No length constraints |

---

## 🌐 Dynamic Analysis Checks

### 8. Cross-Site Scripting (XSS)

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| Reflected XSS | CRITICAL | A03 | User input reflected unescaped |
| DOM-based XSS | HIGH | A03 | Client-side XSS via DOM manipulation |
| Stored XSS potential | HIGH | A03 | Input stored without sanitization |

**Test Methodology**:
1. Submit safe test payloads: `<script>alert('XSS-Test')</script>`
2. Check if payload appears unescaped in response
3. Analyze DOM context (script tag, attribute, URL)
4. Record evidence without executing malicious code

**Test Payloads** (non-destructive):
```html
<script>alert('XSS-Test')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
javascript:alert('XSS')
```

### 9. Security Headers

| Header | Check | Severity | OWASP |
|--------|-------|----------|-------|
| `Content-Security-Policy` | Presence & config | HIGH | A05 |
| `Strict-Transport-Security` | HTTPS sites | MEDIUM | A02, A05 |
| `X-Frame-Options` | Anti-clickjacking | MEDIUM | A04, A05 |
| `X-Content-Type-Options` | nosniff | LOW | A05 |
| `Referrer-Policy` | Referrer control | LOW | A05 |
| `Permissions-Policy` | Feature control | LOW | A05 |

**Test Method**:
```http
GET / HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'  ✅ Present
Strict-Transport-Security: max-age=31536000  ✅ Present
X-Frame-Options: DENY                        ✅ Present
X-Content-Type-Options: nosniff              ✅ Present
```

### 10. Authentication & Session Management

| Check | Severity | OWASP | Description |
|-------|----------|-------|-------------|
| Insecure cookies | MEDIUM | A07 | Missing Secure/HttpOnly/SameSite |
| Weak session IDs | HIGH | A07 | Predictable session identifiers |
| Session fixation | HIGH | A07 | Session ID not regenerated on auth |
| Open redirect | MEDIUM | A01 | Unvalidated redirects |

**Safety Constraints**:
- ✅ No brute force attacks
- ✅ No credential testing
- ✅ No account takeover attempts
- ✅ Only passive observation and safe validation

### 11. Web Crawler Discovery

| Feature | Description |
|---------|-------------|
| Endpoint discovery | Find reachable pages and API endpoints |
| Form detection | Identify input points for testing |
| Link analysis | Map site structure |
| robots.txt compliance | Honor exclusion rules |
| Rate limiting | Configurable request throttling |

---

## 📦 Dependency Scanning Checks

### 12. Known Vulnerabilities

| Check | Database | Description |
|-------|----------|-------------|
| CVE matching | NVD | Known CVE vulnerabilities |
| npm advisories | npm audit | npm security advisories |
| GitHub advisories | GitHub API | GitHub Security Advisories |
| Version analysis | Semver | Outdated package detection |

**Example Detection**:
```json
{
  "package": "lodash",
  "version": "4.17.15",
  "vulnerabilities": [
    {
      "cve": "CVE-2020-8203",
      "severity": "HIGH",
      "title": "Prototype Pollution",
      "fixedIn": "4.17.21"
    }
  ]
}
```

### 13. Dependency Freshness

| Check | Severity | Description |
|-------|----------|-------------|
| Major version behind | MEDIUM | Multiple major versions outdated |
| Security updates available | HIGH | Known security fixes available |
| Unmaintained packages | MEDIUM | Package no longer maintained |

---

## 📊 Test Statistics

### Unit Test Coverage

| Component | Tests | Coverage | Assertions |
|-----------|-------|----------|------------|
| JS Analyzer | 15 | ~95% | 45+ |
| HTML Analyzer | 12 | ~90% | 38+ |
| Dependency Analyzer | 8 | ~85% | 25+ |
| Dynamic XSS Tester | 10 | ~80% | 30+ |
| Crawler | 6 | ~75% | 18+ |

**Total**: 51+ unit tests, 156+ assertions

### Integration Test Coverage

| Test Suite | Tests | Description |
|------------|-------|-------------|
| Vulnerable fixtures | 8 | End-to-end scanning of intentionally insecure code |
| Report generation | 4 | Verify complete scan workflow |
| API endpoints | 6 | Test REST API functionality |

**Total**: 18+ integration tests

### Test Fixtures

Located in `test-fixtures/`:

1. **vulnerable-script.js**: Contains all JavaScript vulnerability patterns
2. **vulnerable-app.html**: HTML with security issues
3. **insecure-package.json**: Dependencies with known CVEs

**Deterministic Testing**: All tests use fixed inputs and expected outputs to ensure reproducibility.

---

## 🎯 Detection Confidence

### High Confidence (90%+)

- Direct `eval()` usage
- `innerHTML` with unsanitized input
- Missing security headers
- Known CVE matches

### Medium Confidence (60-90%)

- Potential SQL injection patterns
- Suspicious variable names (password, secret, etc.)
- Weak cookie configurations

### Low Confidence (<60%)

- Complex code flow analysis
- Context-dependent vulnerabilities

---

## 🚧 Limitations & Future Work

### Current Limitations

- No SQL injection detection (requires database analysis)
- Limited SSRF detection
- No advanced authentication bypass testing
- Limited coverage of API security

### Planned Enhancements

- API security testing (REST, GraphQL)
- SQL injection detection
- Business logic vulnerability checks
- SSRF pattern detection
- Custom rule engine

---

## Next Steps

- **[Explore Features](features.md)**: Deep dive into scanning capabilities
- **[Architecture](architecture.md)**: Understand how detection works
- **[Testing Guide](testing.md)**: Run and understand our tests
