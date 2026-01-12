# Static Analysis Rules

Detailed detection rules for JavaScript/TypeScript, HTML, and dependency analysis.

---

## JavaScript/TypeScript Detection

### Dangerous APIs

| API | Severity | Pattern | Why Risky |
|-----|----------|---------|----------|
| `eval()` | CRITICAL | `\beval\s*\(` | Direct code execution from strings |
| `new Function()` | CRITICAL | `new\s+Function\s*\(` | Dynamic function creation |
| `setTimeout(string)` | HIGH | `setTimeout\s*\(\s*['"]` | Indirect code execution |
| `setInterval(string)` | HIGH | `setInterval\s*\(\s*['"]` | Repeated code execution |
| `Function.constructor()` | CRITICAL | `Function\.constructor` | Alternative code execution |

### Unsafe DOM Manipulation

| Method | Severity | Pattern | XSS Risk |
|--------|----------|---------|----------|
| `.innerHTML =` | HIGH | `\.innerHTML\s*=` | Direct HTML parsing; no escaping |
| `.outerHTML =` | HIGH | `\.outerHTML\s*=` | Replaces parent element |
| `document.write()` | HIGH | `document\.write\s*\(` | Uncontrolled DOM writes |
| `.insertAdjacentHTML()` | HIGH | `insertAdjacentHTML` | Parses HTML without escaping |

### Insecure Cookie Usage

| Issue | Severity | Pattern | Risk |
|-------|----------|---------|------|
| Missing `Secure` flag | MEDIUM | `document\.cookie.*(?!Secure)` | Session hijacking via MITM |
| Missing `HttpOnly` flag | MEDIUM | `document\.cookie.*(?!HttpOnly)` | XSS cookie theft |
| Missing `SameSite` flag | MEDIUM | `document\.cookie.*(?!SameSite)` | CSRF cookie submission |

**Example**:
```javascript
// ❌ DETECTED as MEDIUM severity
document.cookie = "session=abc123; Secure; HttpOnly";
// Missing SameSite flag
```

### Hardcoded Secrets

Patterns for detecting potential credentials:

| Secret Type | Pattern |
|---|---|
| AWS Access Key | `AKIA[0-9A-Z]{16}` |
| API Keys | `api[_-]?key.*[=:]\s*['"][^'"]{20,}['"]` |
| Passwords | `password\s*[=:]\s*['"][^'"]{8,}['"]` |
| Private Keys | `-----BEGIN RSA PRIVATE KEY-----` |
| OAuth Tokens | `oauth[_-]?token.*[=:]\s*['"][^'"]{20,}['"]` |

---

## HTML & Template Detection

### Security Headers

| Header | Severity | Why Check |
|--------|----------|-----------|
| Content-Security-Policy | MEDIUM | Prevents script injection |
| Strict-Transport-Security | MEDIUM | Enforces HTTPS |
| X-Frame-Options | MEDIUM | Prevents clickjacking |
| X-Content-Type-Options | LOW | Prevents MIME sniffing |

**Example Missing CSP**:
```html
<!-- ❌ Detected as MEDIUM -->
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
  <!-- No CSP meta tag -->
</head>
```

### Form Security

| Check | Severity | Why Check |
|-------|----------|-----------|
| CSRF token presence | MEDIUM | Prevents cross-site form submission |
| POST method for forms | HIGH | GET requests expose data in logs/history |
| HTTPS form action | MEDIUM | Encrypts form data in transit |
| autocomplete on password input | LOW | UX security consideration |

---

## Dependency Scanning

### Known Vulnerabilities

Checks `package.json` against vulnerability databases:

| Check | Severity |
|-------|----------|
| Known CVE in version | CRITICAL/HIGH |
| Outdated (1+ year) | MEDIUM |
| Deprecated package | MEDIUM |
| Typosquatting pattern | HIGH |

**Example**:
```json
{
  "dependencies": {
    "lodash": "4.17.20"  // Known CVE-2021-23337
  }
}
```

### Supply Chain Risks

| Risk | Detection |
|------|-----------|
| Typosquatting (npm: `loadash` vs `lodash`) | String similarity >90% |
| Newly published (< 1 week) | Creation date check |
| Missing repository link | Metadata inspection |
| No maintenance (>1 year) | Last commit date |

---

## Confidence & Context

### Framework Detection

Reduces false positives by understanding framework patterns:

| Framework | Handles |
|-----------|---------|
| **React** | `dangerouslySetInnerHTML` expected in some cases |
| **Vue** | `v-html` directive usage patterns |
| **Angular** | `bypassSecurityTrustHtml()` safe patterns |
| **jQuery** | `.html()` usage context-aware |

### Minification Detection

Identifies minified code and adjusts rules:

- Minified patterns are less reliable (more false positives)
- Confidence reduced from HIGH → MEDIUM
- Advises user to test minified source if critical

### Code Flow Analysis

Simple data flow tracking for common patterns:

```javascript
// ✅ Safe: string literal
element.innerHTML = "<b>safe</b>";

// ❌ Unsafe: user input
element.innerHTML = userInput;

// ⚠️ Context-dependent
let data = getUserData();  // Could be safe or unsafe
element.innerHTML = data;   // Flagged with MEDIUM confidence
```

---

## Output Example

```json
{
  "id": "WSS-JS-001",
  "owaspId": "A03:2025",
  "severity": "CRITICAL",
  "confidence": "HIGH",
  "title": "Dangerous API: eval()",
  "description": "eval() allows arbitrary code execution from strings. If user input flows through eval(), it leads to code injection.",
  "evidence": "eval(userInput)",
  "location": "src/app.js:42",
  "remediation": "Replace eval() with safer alternatives: JSON.parse(), Function(), or context-specific methods. Avoid eval() unless absolutely necessary.",
  "references": [
    "https://owasp.org/www-community/attacks/Code_Injection",
    "https://cheatsheetseries.owasp.org/cheatsheets/Injection_Flaws.html"
  ]
}
```

---

## Next Steps

- **[Dynamic Testing](dynamic-testing.md)** — Runtime vulnerability testing
- **[Scanner Components](../architecture/components.md)** — How static analyzer works
- **[OWASP 2025](../security/owasp-2025.md)** — Vulnerability categories
