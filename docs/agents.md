# Scanning Agents

WebSecScan uses specialized, modular agents that each perform a focused set of deterministic security checks. This document provides an in-depth look at each agent's responsibilities, implementation, and safety constraints.

---

## 🎯 Agent Overview

Agents are isolated, composable modules that:

- Execute specific security checks
- Produce structured vulnerability reports
- Run independently or in parallel
- Enforce safety and ethical constraints
- Log detailed debugging information server-side

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
│ Analysis│     │ Testing  │      │ Scanner │
│  Agent  │     │  Agent   │      │  Agent  │
└─────────┘     └──────────┘      └─────────┘
```

---

## 🔍 Static Analysis Agent

### Purpose

Analyze source artifacts (JavaScript/TypeScript, HTML, templates) without executing code to identify dangerous patterns and security misconfigurations.

### Components

#### 1. JavaScript/TypeScript Analyzer (`jsAnalyzer.ts`)

**Responsibilities**:

- Detect dangerous APIs: `eval()`, `new Function()`, `setTimeout(string)`
- Identify unsafe DOM manipulation: `innerHTML`, `outerHTML`, `document.write()`
- Find insecure cookie usage: missing `Secure`, `HttpOnly`, `SameSite`
- Detect hardcoded secrets: API keys, passwords, tokens

**Implementation Strategy**:

```typescript
export async function analyzeJavaScript(
  code: string,
  filename: string
): Promise<AnalysisResult> {
  // 1. Remove comments to avoid false positives
  const cleanCode = removeComments(code);
  
  // 2. Apply rule-based pattern matching
  const vulnerabilities: Vulnerability[] = [];
  
  for (const rule of JS_RULES) {
    const regex = new RegExp(rule.pattern, 'g');
    let match;
    
    while ((match = regex.exec(cleanCode)) !== null) {
      // 3. Extract context and evidence
      const lineNumber = getLineNumber(code, match.index);
      const evidence = extractEvidence(code, match.index, 50);
      
      // 4. Create vulnerability object
      vulnerabilities.push({
        id: generateId('JS', rule.type),
        owaspCategory: rule.owaspCategory,
        severity: rule.severity,
        confidence: rule.confidence,
        title: rule.title,
        description: rule.description,
        evidence,
        location: `${filename}:${lineNumber}`,
        remediation: rule.remediation,
        references: rule.references
      });
    }
  }
  
  return { vulnerabilities };
}
```

**Detection Rules**:

| Pattern | Regex | Severity | OWASP |
|---------|-------|----------|-------|
| `eval()` | `\beval\s*\(` | CRITICAL | A03 |
| `new Function()` | `new\s+Function\s*\(` | CRITICAL | A03 |
| `innerHTML` | `\.innerHTML\s*=` | HIGH | A03 |
| `document.cookie` | `document\.cookie\s*=\s*[^;]*(;|$)(?![^;]*Secure)` | MEDIUM | A02 |
| API keys | `(sk_live_|AKIA|ghp_|glpat-)[A-Za-z0-9_-]{20,}` | CRITICAL | A02 |

**False Positive Mitigation**:

- Strip comments before analysis
- Context-aware matching (check surrounding code)
- Exclude test files (configurable)
- Ignore string literals in documentation

---

#### 2. HTML/Template Analyzer (`htmlAnalyzer.ts`)

**Responsibilities**:

- Detect missing or weak Content Security Policy
- Find inline scripts without nonce attributes
- Identify insecure form configurations
- Check for missing input validation attributes

**Implementation Strategy**:

```typescript
export async function analyzeHTML(
  html: string,
  filename: string
): Promise<AnalysisResult> {
  const $ = cheerio.load(html);
  const vulnerabilities: Vulnerability[] = [];
  
  // Check 1: CSP presence and configuration
  const csp = $('meta[http-equiv="Content-Security-Policy"]').attr('content');
  if (!csp) {
    vulnerabilities.push(createMissingCSPVulnerability(filename));
  } else if (hasUnsafeCSPDirectives(csp)) {
    vulnerabilities.push(createWeakCSPVulnerability(filename, csp));
  }
  
  // Check 2: Inline scripts
  $('script:not([src])').each((i, elem) => {
    if (!$(elem).attr('nonce')) {
      const scriptContent = $(elem).html() || '';
      vulnerabilities.push({
        id: generateId('HTML', 'INLINE_SCRIPT'),
        owaspCategory: 'A05:2025-Injection',
        severity: 'HIGH',
        title: 'Inline script without nonce',
        description: 'Inline scripts bypass CSP unless nonce is used',
        evidence: scriptContent.substring(0, 100),
        location: `${filename}:inline-script-${i}`,
        remediation: 'Add nonce attribute or move to external file'
      });
    }
  });
  
  // Check 3: Form security
  $('form').each((i, elem) => {
    checkFormSecurity($, elem, vulnerabilities, filename, i);
  });
  
  // Check 4: Input validation
  $('input, textarea').each((i, elem) => {
    checkInputValidation($, elem, vulnerabilities, filename, i);
  });
  
  return { vulnerabilities };
}
```

**Key Checks**:

1. **CSP Validation**
   - Presence of CSP meta tag or HTTP header
   - Detection of unsafe directives: `unsafe-inline`, `unsafe-eval`
   - Validation of nonce usage

2. **Form Security**
   - HTTP vs HTTPS action URLs
   - Missing action attributes
   - Password fields over insecure connections

3. **Input Validation**
   - Missing `required` attributes
   - Missing `pattern` attributes
   - Missing `maxlength` constraints

---

#### 3. Dependency Analyzer (`dependencyAnalyzer.ts`)

**Responsibilities**:

- Parse `package.json` and lock files
- Extract dependency list with versions
- Map to vulnerability advisories
- Suggest upgrade paths

**Implementation Strategy**:

```typescript
export async function analyzeDependencies(
  packageJson: string,
  lockfile?: string
): Promise<AnalysisResult> {
  // 1. Parse manifest
  const manifest = JSON.parse(packageJson);
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies
  };
  
  // 2. Load vulnerability database
  const advisories = await loadAdvisories();
  
  // 3. Check each dependency
  const vulnerabilities: Vulnerability[] = [];
  
  for (const [pkg, version] of Object.entries(dependencies)) {
    const pkgAdvisories = advisories.get(pkg);
    if (!pkgAdvisories) continue;
    
    for (const advisory of pkgAdvisories) {
      if (isVersionVulnerable(version, advisory.vulnerable_versions)) {
        vulnerabilities.push({
          id: generateId('DEP', pkg),
          owaspCategory: 'A03:2025-Software Supply Chain Failures',
          severity: mapAdvisorySeverity(advisory.severity),
          title: `${pkg}@${version}: ${advisory.title}`,
          description: advisory.overview,
          evidence: `"${pkg}": "${version}"`,
          location: 'package.json',
          remediation: `Update to ${pkg}@${advisory.patched_versions}`,
          references: [advisory.url, advisory.cve]
        });
      }
    }
  }
  
  return { vulnerabilities };
}
```

**Data Sources**:

- npm audit database
- NVD (National Vulnerability Database)
- GitHub Security Advisories
- Local curated advisories

---

## 🌐 Dynamic Testing Agent

### Purpose

Perform safe, non-destructive runtime tests against a live web application to detect vulnerabilities that only manifest during execution.

### Components

#### 1. Web Crawler (`crawler.ts`)

**Responsibilities**:

- Discover reachable pages and endpoints
- Identify forms and input points
- Map site structure
- Respect robots.txt and rate limits

**Implementation Strategy**:

```typescript
export async function crawl(
  startUrl: string,
  options: CrawlOptions
): Promise<CrawlResult> {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'WebSecScan/1.0 (+https://github.com/pranavraut/WebSecScan)'
  });
  
  const visited = new Set<string>();
  const queue = [startUrl];
  const endpoints: Endpoint[] = [];
  
  // 1. Check robots.txt
  const robotsAllowed = await checkRobotsTxt(startUrl);
  if (!robotsAllowed) {
    throw new Error('Crawling disallowed by robots.txt');
  }
  
  // 2. Crawl with rate limiting
  while (queue.length > 0 && visited.size < options.maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    
    // Rate limiting
    await sleep(1000 / options.rateLimit);
    
    const page = await context.newPage();
    
    try {
      await page.goto(url, { 
        timeout: options.timeout,
        waitUntil: 'networkidle'
      });
      
      // 3. Discover links
      const links = await page.$$eval('a', (anchors, baseUrl) =>
        anchors
          .map(a => a.href)
          .filter(href => href.startsWith(baseUrl)),
        startUrl
      );
      
      // Filter out dangerous actions
      const safeLinks = links.filter(link => 
        !link.includes('logout') && 
        !link.includes('delete') &&
        !link.includes('remove')
      );
      
      queue.push(...safeLinks);
      
      // 4. Discover forms
      const forms = await discoverForms(page, url);
      endpoints.push(...forms);
      
      visited.add(url);
      
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  
  return { 
    endpoints, 
    visited: Array.from(visited),
    crawlDuration: Date.now() - startTime
  };
}
```

**Safety Constraints**:

- Max depth limit (default: 3 levels)
- Max pages limit (default: 100 pages)
- Rate limiting (default: 10 req/sec)
- Timeout per page (default: 30 seconds)
- Exclude logout/delete links
- Honor robots.txt

---

#### 2. XSS Tester (`xssTester.ts`)

**Responsibilities**:

- Test for reflected XSS vulnerabilities
- Detect DOM-based XSS patterns
- Test input sanitization
- Record evidence without exploitation

**Implementation Strategy**:

```typescript
export async function testXSS(
  endpoints: Endpoint[],
  options: TestOptions
): Promise<XSSResult[]> {
  const browser = await playwright.chromium.launch();
  const results: XSSResult[] = [];
  
  // Non-exploitative test payloads
  const SAFE_PAYLOADS = [
    '<script>alert("XSS-Test")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")'
  ];
  
  for (const endpoint of endpoints) {
    const page = await browser.newPage();
    
    for (const payload of SAFE_PAYLOADS) {
      try {
        // 1. Submit payload
        await submitToEndpoint(page, endpoint, payload);
        
        // 2. Wait for response
        await page.waitForLoadState('networkidle');
        
        // 3. Check if reflected unescaped
        const html = await page.content();
        const isReflectedRaw = html.includes(payload);
        
        if (isReflectedRaw) {
          // 4. Analyze context
          const context = analyzeReflectionContext(html, payload);
          
          results.push({
            type: 'Reflected XSS',
            severity: context.dangerous ? 'CRITICAL' : 'HIGH',
            confidence: 'HIGH',
            endpoint: endpoint.url,
            parameter: endpoint.param,
            payload: payload,
            evidence: extractEvidence(html, payload),
            context: context.location,
            remediation: 'Sanitize user input, use contextual escaping'
          });
        }
        
        // 5. Check DOM-based XSS
        const domXSS = await checkDOMBasedXSS(page, endpoint, payload);
        if (domXSS) {
          results.push(domXSS);
        }
        
      } catch (error) {
        // Safe failure - log and continue
        console.error('XSS test failed:', error);
      }
    }
    
    await page.close();
  }
  
  await browser.close();
  return results;
}
```

**Safety Guarantees**:

- ✅ Non-exploitative payloads (only `alert()`)
- ✅ No chained exploits
- ✅ No account takeover attempts
- ✅ Timeouts enforced
- ✅ Rate limiting
- ✅ Graceful error handling

---

#### 3. Authentication Checker (`authChecks.ts`)

**Responsibilities**:

- Validate cookie security attributes
- Check session management patterns
- Detect open redirects
- Test security header presence

**Implementation Strategy**:

```typescript
export async function checkAuth(
  url: string,
  options: AuthCheckOptions
): Promise<AuthResult[]> {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const results: AuthResult[] = [];
  
  await page.goto(url);
  
  // 1. Check cookies
  const cookies = await context.cookies();
  for (const cookie of cookies) {
    // Check Secure flag
    if (!cookie.secure && url.startsWith('https')) {
      results.push({
        type: 'Insecure Cookie',
        severity: 'MEDIUM',
        detail: `Cookie "${cookie.name}" missing Secure flag`,
        remediation: 'Set Secure flag on all HTTPS cookies'
      });
    }
    
    // Check HttpOnly flag
    if (!cookie.httpOnly && isSessionCookie(cookie.name)) {
      results.push({
        type: 'Cookie Accessible via JavaScript',
        severity: 'MEDIUM',
        detail: `Session cookie "${cookie.name}" missing HttpOnly flag`,
        remediation: 'Set HttpOnly flag to prevent XSS cookie theft'
      });
    }
    
    // Check SameSite attribute
    if (!cookie.sameSite || cookie.sameSite === 'None') {
      results.push({
        type: 'CSRF Vulnerable Cookie',
        severity: 'MEDIUM',
        detail: `Cookie "${cookie.name}" missing SameSite attribute`,
        remediation: 'Set SameSite=Lax or SameSite=Strict'
      });
    }
  }
  
  // 2. Check security headers
  const response = await page.goto(url);
  const headers = response?.headers() || {};
  
  const headerChecks = [
    { name: 'content-security-policy', severity: 'HIGH' },
    { name: 'strict-transport-security', severity: 'MEDIUM' },
    { name: 'x-frame-options', severity: 'MEDIUM' },
    { name: 'x-content-type-options', severity: 'LOW' }
  ];
  
  for (const check of headerChecks) {
    if (!headers[check.name]) {
      results.push({
        type: 'Missing Security Header',
        severity: check.severity,
        detail: `Missing ${check.name} header`,
        remediation: `Add ${check.name} header`
      });
    }
  }
  
  await browser.close();
  return results;
}
```

**No Invasive Testing**:

- ❌ No password brute forcing
- ❌ No credential stuffing
- ❌ No account enumeration
- ❌ No session hijacking attempts
- ✅ Only passive observation and attribute checking

---

## 📦 Library Scanner Agent

### Purpose

Identify known vulnerabilities in third-party dependencies by comparing versions against curated vulnerability databases.

### Implementation

```typescript
export async function analyzeDependencies(
  packageJsonContent: string,
  sourceUrl: string
): Promise<DependencyAnalysisResult> {
  // 1. Parse manifest
  const manifest = JSON.parse(packageJsonContent);
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies
  };
  
  // 2. Load vulnerability database
  const advisories = await loadAdvisoryDatabase();
  
  // 3. Check each dependency
  const vulnerabilities: Vulnerability[] = [];
  
  for (const [pkg, version] of Object.entries(dependencies)) {
    const matchingAdvisories = findAdvisories(
      pkg,
      version as string,
      advisories
    );
    
    for (const advisory of matchingAdvisories) {
      vulnerabilities.push({
        id: generateId('DEP', pkg),
        owaspCategory: 'A03:2025-Software Supply Chain Failures',
        severity: mapAdvisorySeverity(advisory.severity),
        title: `${pkg}@${version}: ${advisory.title}`,
        description: advisory.description,
        evidence: `"${pkg}": "${version}"`,
        location: 'package.json',
        remediation: `Update to ${pkg}@${advisory.patched_versions}`,
        references: [advisory.url, advisory.cve]
      });
    }
  }
  
  return { vulnerabilities };
}
```

**Advisory Sources**:

- npm audit database
- NVD/CVE feeds
- GitHub Security Advisories
- Snyk vulnerability database (public data)

---

## 🔧 Agent Configuration

Agents are configured via options passed at runtime:

```typescript
interface AgentConfig {
  // Static analysis
  excludePatterns?: string[];       // Files to exclude
  includeTestFiles?: boolean;       // Scan test files
  
  // Dynamic testing
  maxDepth?: number;                // Crawl depth (default: 3)
  maxPages?: number;                // Max pages to crawl (default: 100)
  rateLimit?: number;               // Requests per second (default: 10)
  timeout?: number;                 // Per-page timeout (default: 30s)
  allowExternalRequests?: boolean;  // Follow external links (default: false)
  
  // Library scanning
  checkDevDependencies?: boolean;   // Scan devDependencies (default: true)
  severityThreshold?: Severity;     // Minimum severity to report
}
```

---

## 📊 Agent Outputs

All agents produce structured `Vulnerability` objects:

```typescript
interface Vulnerability {
  id: string;                    // WSS-STATIC-JS-001
  owaspCategory: string;         // A05:2025-Injection
  cweId?: string;                // CWE-79
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  evidence?: string;
  location: string;
  remediation: string;
  references: string[];
  createdAt: Date;
}
```

---

## 🛡️ Safety & Ethics

### Non-Destructive Testing

All agents enforce:

- No state modification
- No data deletion
- No account takeover
- No DoS attacks
- No brute force attempts

### Consent & Authorization

- Users must confirm ownership/permission before scanning
- Respects robots.txt
- Honors rate limits
- Graceful error handling

### Logging & Transparency

- Verbose server-side logs for debugging
- All actions auditable
- Clear remediation guidance
- References to authoritative sources

---

## 🔄 Extensibility

Adding new agents or checks:

1. Create new module in `src/security/[static|dynamic]/`
2. Implement standard `analyze()` function
3. Return `AnalysisResult` with vulnerabilities
4. Add tests in `__tests__/`
5. Register with agent coordinator
6. Update documentation

---

## Next Steps

- **[System Architecture](../architecture/overview.md)**: How agents integrate into the system
- **[Testing Guide](../development/testing.md)**: Test agent implementations
- **[API Reference](../api/overview.md)**: Trigger agent scans programmatically
