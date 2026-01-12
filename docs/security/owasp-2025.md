# OWASP Top 10 2025

WebSecScan classifies all vulnerabilities using **OWASP Top 10 2025** taxonomy. This page covers the complete mapping and key migration details from the 2021 version.

---

## Complete Mapping Table

| 2021 ID | 2021 Name | 2025 ID | 2025 Name | Changes |
|---------|-----------|---------|-----------|---------|
| A01 | Broken Access Control | A01 | Broken Access Control | ✓ No change |
| A02 | Cryptographic Failures | A04 | Cryptographic Failures | Moved: #2 → #4 |
| A03 | Injection | A05 | Injection | Moved: #3 → #5 |
| A04 | Insecure Design | A06 | Insecure Design | Moved: #4 → #6 |
| A05 | Security Misconfiguration | **A02** | **Security Misconfiguration** | **⚠️ CRITICAL: #5 → #2** |
| A06 | Vulnerable & Outdated Components | A03 | Software Supply Chain Failures | Renamed + expanded |
| A07 | Identification & Authentication Failures | A07 | Authentication Failures | Name simplified |
| A08 | Software & Data Integrity Failures | A08 | Software or Data Integrity Failures | Minor grammar |
| A09 | Security Logging & Monitoring Failures | A09 | Security Logging & Alerting Failures | Expanded to alerting |
| A10 | Server-Side Request Forgery (SSRF) | —merge— | **A01:2025** | **⚠️ MERGED into A01** |
| — | — | **A10** | **Mishandling of Exceptional Conditions** | **✨ NEW in 2025** |

---

## Critical Changes

### 1. Security Misconfiguration Moved to #2 (A05→A02)

**This is the most common misclassification.**

In **2021**: A05 (5th position)  
In **2025**: **A02 (2nd position)** — now one of the top 2 risks!

**What counts as A02:2025**:
- Missing security headers (CSP, HSTS, X-Frame-Options, etc.)
- Misconfigured CORS
- Verbose error messages in responses
- Default credentials left enabled
- Directory listing enabled
- Unnecessary services running
- Unencrypted cookies
- Debug modes enabled in production

**Example**:
```typescript
// ❌ WRONG (this is NOT A05:2025)
owaspId: 'A05:2025'

// ✅ CORRECT
owaspId: 'A02:2025'
```

### 2. SSRF No Longer Standalone (A10:2021→A01:2025)

**In 2021**: A10 (Server-Side Request Forgery) was standalone

**In 2025**: SSRF is a **subtype** of Broken Access Control (A01)

**Detection approach**:
```typescript
// ✅ Classify SSRF as A01, but keep SSRF in title/description
{
  owaspId: 'A01:2025',
  title: 'Server-Side Request Forgery (SSRF)',
  description: '...allows attacker to make requests from server...'
}
```

**Why**: SSRF is fundamentally an access control bypass (attacker gains unauthorized server-side capability).

### 3. New Category: Mishandling of Exceptional Conditions (A10:2025)

**NEW in 2025**:
```
A10:2025 - Mishandling of Exceptional Conditions
```

Covers:
- Unhandled exceptions exposing stack traces
- Missing error handling for critical operations
- Weak exception handling allowing bypass
- Information disclosure through error messages

---

## Category Descriptions

### A01:2025 - Broken Access Control

**Risk**: Users perform actions or access data beyond their permissions.

**Examples**:
- Direct object reference (IDOR)
- Privilege escalation
- SSRF (server-side request forgery)
- Broken authentication (merged from A07:2021)

**WebSecScan Detects**:
- Authentication bypass patterns
- SSRF endpoints
- Session validation flaws

---

### A02:2025 - Security Misconfiguration

**Risk**: Missing security controls, default credentials, or exposed configuration.

**Examples**:
- Missing CSP, HSTS, X-Frame-Options
- Default credentials enabled
- Directory listing enabled
- Unnecessary services running
- Verbose error messages
- Unencrypted sensitive data

**WebSecScan Detects**:
- Missing security headers
- Default credentials in configuration
- Overly verbose error messages
- Insecure protocol usage (HTTP)

---

### A03:2025 - Software Supply Chain Failures

**Risk**: Vulnerable or compromised dependencies, third-party libraries, and build processes.

**Examples**:
- Vulnerable npm packages
- Outdated libraries with known CVEs
- Typosquatting attacks
- Compromised package repositories

**WebSecScan Detects**:
- Known vulnerable dependency versions
- Outdated packages
- CVE-rated vulnerabilities in dependencies

---

### A04:2025 - Cryptographic Failures

**Risk**: Sensitive data exposed due to weak encryption or missing cryptography.

**Examples**:
- Unencrypted data in transit (HTTP)
- Weak encryption algorithms
- Missing encryption for sensitive data
- Hardcoded secrets
- Exposed API keys in code

**WebSecScan Detects**:
- HTTP usage (no HTTPS)
- Hardcoded secrets (API keys, passwords)
- Insecure cookie flags

---

### A05:2025 - Injection

**Risk**: Untrusted data directly interpreted as code.

**Examples**:
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- LDAP Injection
- XPath Injection

**WebSecScan Detects**:
- Reflected XSS (12 contexts)
- SQL Injection (error-based)
- Command injection patterns
- Path traversal

---

### A06:2025 - Insecure Design

**Risk**: Fundamental design flaws in security architecture.

**Examples**:
- Missing or weak authentication design
- Poor session management design
- CSRF vulnerability design flaws
- Missing rate limiting design

**WebSecScan Detects**:
- CSRF token validation gaps
- Weak session management patterns
- Missing rate limiting indicators

---

### A07:2025 - Authentication Failures

**Risk**: Broken authentication allowing unauthorized access.

**Examples**:
- Weak password policies
- Credential stuffing
- Brute force vulnerability
- Session fixation
- Missing MFA

**WebSecScan Detects**:
- Unauthenticated access to protected endpoints
- Invalid token handling
- Session cookie security issues

---

### A08:2025 - Software or Data Integrity Failures

**Risk**: Updates, CI/CD, or data integrity issues allowing attackers to inject malicious code.

**Examples**:
- Insecure deserialization
- Insecure update mechanisms
- Missing code signing
- Vulnerable build processes

**WebSecScan Detects**:
- Insecure deserialization patterns
- Missing integrity checks

---

### A09:2025 - Security Logging & Alerting Failures

**Risk**: Insufficient logging allowing attacks to go undetected.

**Examples**:
- Missing security event logging
- Logs stored insecurely
- Logs without alerting
- Sensitive data logged (passwords, tokens)

**WebSecScan Detects**:
- Missing security header logging configuration
- Verbose error messages (potential info disclosure)

---

### A10:2025 - Mishandling of Exceptional Conditions

**Risk**: Unhandled exceptions and error conditions leading to security bypass.

**Examples**:
- Stack traces in error responses
- Missing exception handling
- Improper error recovery
- Null pointer dereference exposures

**WebSecScan Detects**:
- Verbose error messages with stack traces
- Missing error handling indicators

---

## Migration Guide (2021→2025)

If you've previously used OWASP 2021, update your mental models:

| Old Thinking | New Thinking |
|---|---|
| Injection is #3, focus there | Security Misconfiguration is now #2! |
| SSRF is a separate category | SSRF is now part of Broken Access Control |
| No A10 exists | A10 now covers exceptional condition handling |
| 10 categories total | Still 10, but renumbered |

### Quick Reference for Common Findings

```
Finding: Missing CSP header
2021: A05 (Security Misconfiguration)
2025: A02 (Security Misconfiguration) ← Same, but different position

Finding: SQL Injection vulnerability
2021: A03 (Injection)
2025: A05 (Injection) ← Same, but different position

Finding: Vulnerable npm package
2021: A06 (Vulnerable Components)
2025: A03 (Supply Chain Failures) ← Renamed

Finding: SSRF vulnerability
2021: A10 (SSRF)
2025: A01 (Broken Access Control) ← Merged!

Finding: Stack trace in error page
2021: Not explicitly mapped
2025: A10 (Exceptional Conditions) ← NEW!
```

---

## Using OWASP 2025 in WebSecScan

All WebSecScan findings automatically use OWASP 2025:

```json
{
  "id": "WSS-001",
  "owaspId": "A05:2025",
  "owaspCategory": "Injection - Cross-Site Scripting (XSS)",
  "severity": "HIGH",
  "title": "Reflected XSS in Search Parameter",
  "description": "User input reflected in response without HTML escaping"
}
```

---

## References

- **[OWASP Top 10 2025 Official](https://owasp.org/Top10/)** — Authoritative source
- **[Security & Ethics](ethics-and-authorization.md)** — Legal and ethical guidelines
- **[Reducing False Positives](reducing-false-positives.md)** — Confidence scoring
