# Dynamic Testing Methodology

Detailed explanation of safe, non-destructive runtime vulnerability testing.

---

## Dynamic Testing Philosophy

All dynamic tests are **safe and non-destructive**:

- ✅ No data modification or extraction
- ✅ No credential stuffing or brute force
- ✅ No denial-of-service attacks
- ✅ Rate-limited to respect server resources
- ✅ Explicit timeouts to prevent hanging
- ✅ Detection-only (no exploitation)

---

## Test Categories

### 1. XSS Testing (12 Contexts)

Tests reflected input across different rendering contexts:

| Context | Payload | Detection |
|---------|---------|-----------|
| HTML body | `<img src=x onerror=alert(1)>` | HTML tag injection |
| HTML attribute | `" onload="alert(1)"` | Attribute injection |
| JavaScript string | `'; alert(1); //` | String termination |
| Event handler | `<body onload=alert(1)>` | Event handler injection |
| URL fragment | `#<script>alert(1)</script>` | Fragment parsing |
| JSON response | `{"data":"<script>"}` | JSON parsing |
| DOM property | `element.innerHTML = '<img onerror=1>'` | DOM manipulation |
| CSS context | `{background:url('javascript:alert(1)')}` | CSS parsing |
| Template literal | `\`${alert(1)}\`` | Template injection |
| SVG context | `<svg onload=alert(1)>` | SVG parsing |
| iframe src | `<iframe src="javascript:alert(1)">` | iframe context |
| Script tag | `<script>alert(1)</script>` | Script execution |

### 2. SQL Injection Testing

Error-based detection using safe payloads:

```
' OR '1'='1
' OR 1=1--
' OR '1'='1' /*
' UNION SELECT NULL--
' AND 1=0 UNION SELECT NULL--
'; DROP TABLE users--
' OR SLEEP(5)--
```

Monitoring for:
- MySQL error messages (`You have an error...`)
- PostgreSQL error messages (`syntax error...`)
- MSSQL error messages (`Incorrect syntax...`)
- Oracle error messages (`ORA-...`)
- SQLite error messages (`Error...`)

### 3. Path Traversal Testing

Directory enumeration using safe payloads:

```
../../../etc/passwd
..\\..\\..\\windows\\win.ini
....//....//....//etc/passwd
%2e%2e%2f%2e%2e%2fetc%2fpasswd
```

Detection of:
- Unix file signatures (`root:x:0:0`)
- Windows file markers (`[drivers]`)
- Directory listings

### 4. CSRF Testing

Checks CSRF protection mechanisms:

| Check | Validates |
|-------|-----------|
| Token presence | Form has CSRF token (8+ patterns) |
| Token entropy | Random, not predictable |
| Token validation | Different values per request |
| SameSite cookies | Set to Strict or Lax |
| State-changing methods | POST/PUT/DELETE (not GET) |

### 5. Authentication Testing

Tests authentication and session security:

| Test | Validates |
|------|-----------|
| Unauthenticated access | Protected endpoints require auth |
| Session cookie security | Secure, HttpOnly, SameSite flags |
| Invalid token handling | Rejected properly |
| Parameter manipulation | Can't escalate privileges |

### 6. Security Header Testing

Checks for security HTTP headers:

| Header | Impact if Missing |
|--------|------------------|
| CSP | No script injection defense |
| HSTS | No HTTPS enforcement |
| X-Frame-Options | Vulnerable to clickjacking |
| X-Content-Type-Options | MIME sniffing possible |
| X-XSS-Protection | Legacy XSS defense absent |
| Permissions-Policy | Uncontrolled API access |

---

## Crawling Strategy

### URL Discovery

1. **HTML Link Extraction**
   ```html
   <a href="/products">Products</a>  → /products
   <a href="/api/users">Users</a>   → /api/users
   ```

2. **JavaScript Analysis**
   ```javascript
   fetch('/api/data')     → /api/data
   $.ajax({url: '/admin'}) → /admin
   axios.get('/status')   → /status
   ```

3. **Sitemap Parsing**
   ```xml
   <url><loc>/page1</loc></url>  → /page1
   ```

4. **API Endpoint Patterns**
   - `/api/*`
   - `/v1/*`, `/v2/*`
   - `/graphql`
   - `/rest/*`

### Crawl Configuration

| Setting | Default | Purpose |
|---------|---------|---------|
| maxDepth | 2 | Stop after 2 link levels |
| maxPages | 50 | Stop after 50 URLs discovered |
| rateLimit | 1000ms | 1 second between requests |
| timeout | 10000ms | 10 second per-request timeout |
| respectRobotsTxt | true | Honor robots.txt |
| followRedirects | true | Follow 301/302 redirects |

---

## Safety Constraints

### Request Limits

- **Rate limiting**: 1 request per second (configurable)
- **Max concurrent requests**: 1 per scan
- **Per-request timeout**: 10 seconds
- **Overall scan timeout**: 5 minutes
- **Max URLs crawled**: 50 by default

### Payload Constraints

All payloads are:
- **Non-exploitative** — Detection only, no actual code execution
- **Safe** — No data extraction or modification
- **Reversible** — No permanent changes
- **Logged** — All attempts recorded for audit

### Error Handling

If target becomes unresponsive:
- ✅ Gracefully timeout requests
- ✅ Skip remaining tests
- ✅ Mark scan as INCOMPLETE
- ✅ Return partial results

---

## Output Example

```json
{
  "vulnerabilities": [
    {
      "id": "WSS-XSS-002",
      "owaspId": "A03:2025",
      "severity": "HIGH",
      "confidence": "HIGH",
      "title": "Reflected XSS in /search endpoint",
      "description": "User input reflected in response without HTML escaping",
      "location": "GET /search?q=",
      "evidence": "XSS payload '<img src=x onerror=alert(1)>' was reflected in response",
      "remediation": "Use textContent instead of innerHTML; sanitize with DOMPurify or HTML encoder"
    }
  ]
}
```

---

## Next Steps

- **[Crawler Configuration](crawler.md)** — URL discovery details
- **[Scanner Components](../architecture/components.md)** — Agent implementations
- **[OWASP 2025](../security/owasp-2025.md)** — Vulnerability categories
