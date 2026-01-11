# WebSecScan Architecture Specification

This document describes the technical architecture, design principles, and implementation details of **WebSecScan**. It is intended for developers, researchers, and contributors seeking a clear, comprehensive understanding of the system.

---

## 1. System Overview

WebSecScan is a modular, full-stack web security scanner built on Next.js. It separates concerns between the user interface, business logic, and security scanning engines, ensuring maintainability, extensibility, and security.

### 1.1 High-Level Architecture

#### System Layers

```mermaid
graph TB
    Client["🖥️ Client Layer<br/>React UI + Browser"]
    API["⚡ API Layer<br/>REST Routes + Server Actions + SSE"]
    Scanning["🔍 Security Scanning<br/>Static + Dynamic + Library Scanners"]
    Data["💾 Data & Utilities<br/>Database + Logging + Scoring"]
    
    Client --> API
    API --> Scanning
    Scanning --> Data
    Data -.-> API
    
    style Client fill:#e1f5ff
    style API fill:#fff3cd
    style Scanning fill:#f8d7da
    style Data fill:#d4edda
```

#### Request Flow

```mermaid
graph LR
    UI[User Interface]
    API[API Routes]
    Norm[URL Normalizer]
    Static[Static Analyzer]
    Dynamic[Dynamic Tester]
    Lib[Library Scanner]
    Rules[OWASP Rules]
    Score[Scoring]
    DB[(Database)]
    
    UI -->|1. Submit| API
    API -->|2. Validate| Norm
    API -->|3. Dispatch| Static
    API -->|3. Dispatch| Dynamic
    API -->|3. Dispatch| Lib
    Static -->|4. Findings| Rules
    Dynamic -->|4. Findings| Rules
    Lib -->|4. Findings| Rules
    Rules -->|5. Score| Score
    Score -->|6. Store| DB
    DB -->|7. Results| UI
    
    style UI fill:#e1f5ff
    style API fill:#fff3cd
    style Static fill:#f8d7da
    style Dynamic fill:#f8d7da
    style Lib fill:#f8d7da
    style DB fill:#d4edda
```

---

## 2. Technology Stack

### 2.1 Core Framework

| Technology     | Version  | Purpose                                         |
|----------------|----------|-------------------------------------------------|
| **Next.js**    | 16.1.0   | Full-stack React framework with App Router      |
| **TypeScript** | 5.x      | Strict type-safe development                    |
| **React**      | 19.2.3   | UI component library                            |
| **Node.js**    | ≥18.x    | Runtime environment                             |

### 2.2 Data Layer

| Technology      | Purpose                                   |
|-----------------|-------------------------------------------|
| **Prisma ORM**  | Type-safe database access and migrations  |
| **SQLite**      | Embedded database for dev/testing         |
| **PostgreSQL**  | Production database option                |

### 2.3 Security & Testing

| Technology      | Purpose                                   |
|-----------------|-------------------------------------------|
| **Playwright**  | Headless browser for dynamic testing      |
| **Cheerio**     | Fast HTML parsing for static analysis     |
| **Node Test Runner** | Built-in test framework              |

### 2.4 UI/UX

| Technology                  | Purpose                                |
|-----------------------------|----------------------------------------|
| **Tailwind CSS**            | Utility-first CSS framework            |
| **Next.js Server Components** | Server-side rendering & streaming    |

---

## 3. Project Structure

```
WebSecScan/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Dashboard UI
│   │   ├── layout.tsx         # Root layout
│   │   ├── actions.ts         # Server Actions
│   │   ├── api/               # REST API Routes
│   │   │   ├── scan/
│   │   │   │   ├── start/route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── status/route.ts
│   │   │   │       └── results/route.ts
│   │   │   └── history/
│   │   │       └── [hostname]/route.ts  # Scan history
│   │   ├── scan/[id]/         # Scan details page
│   │   └── results/           # Results page
│   │
│   ├── components/            # React Components
│   │   ├── ScanForm.tsx           # Scan configuration form
│   │   ├── ScanSummaryCard.tsx    # Scan list card
│   │   ├── VulnerabilityCard.tsx  # Vulnerability display
│   │   ├── ScoreCard.tsx          # Security score badge
│   │   ├── SecurityTestCard.tsx   # Individual test result
│   │   ├── ScanHistory.tsx        # Historical scans table
│   │   └── ScanLogs.tsx           # Real-time log display (NEW)
│   │
│   ├── lib/                   # Shared utilities
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── scoring.ts            # Security scoring system
│   │   ├── urlNormalizer.ts      # URL validation & normalization
│   │   └── scanLogger.ts         # Real-time logging via SSE (NEW)
│   │
│   └── security/              # Security scanning engines
│       ├── static/            # Static analysis
│       │   ├── jsAnalyzer.ts
│       │   ├── htmlAnalyzer.ts
│       │   └── dependencyAnalyzer.ts
│       ├── dynamic/           # Dynamic testing
│       │   ├── crawler.ts
│       │   ├── xssTester.ts
│       │   ├── authChecks.ts
│       │   ├── headerAnalyzer.ts    # HTTP security headers
│       │   ├── cookieAnalyzer.ts    # Cookie security
│       │   └── cspAnalyzer.ts       # CSP analysis
│       └── rules/
│           └── owaspRules.ts  # OWASP mapping & rules
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   │   └── 20251220100133_add_scoring_and_tests/
│   │       └── migration.sql
│   └── seed.ts               # Test data seeder
│
├── __tests__/                 # Test suites
│   ├── jsAnalyzer.test.ts
│   ├── htmlAnalyzer.test.ts
│   ├── dependencyAnalyzer.test.ts
│   ├── urlNormalizer.test.ts      # URL normalization tests (NEW)
│   └── integration.test.ts
│
├── test-fixtures/             # Vulnerable test files
│   ├── vulnerable-script.js
│   ├── vulnerable-app.html
│   └── insecure-package.json
│
├── docs/                      # Documentation (MkDocs)
├── .github/                   # CI/CD & GitHub config
│   ├── copilot-instructions.md
│   └── workflows/
│       └── docs.yml          # GitHub Pages deployment
│
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Container image
├── package.json              # Node dependencies
└── tsconfig.json             # TypeScript config
```

---

## 4. Data Flow and Scan Lifecycle

### 4.1 Scan Workflow Phases

#### Phase 1: Initialization

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant API
    participant Norm as URL Normalizer
    participant DB
    
    User->>UI: Submit scan
    UI->>API: POST /api/scan/start
    API->>Norm: Validate & normalize URL
    Norm-->>API: Normalized URL
    API->>DB: Create scan record
    DB-->>API: scanId
    API-->>UI: Redirect to /scan/{id}
```

#### Phase 2: Scanning & Analysis

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant Agents as Scan Agents
    participant Logger
    participant Rules
    
    UI->>API: Connect SSE logs
    API-->>UI: Stream opened
    
    API->>Agents: Run scans (parallel)
    Agents->>Logger: Emit progress
    Logger-->>UI: Stream events
    Agents-->>API: Return findings
    
    API->>Rules: Map to OWASP
    Rules-->>API: Vulnerabilities
```

#### Phase 3: Scoring & Storage

```mermaid
sequenceDiagram
    participant API
    participant Score as Scoring Engine
    participant DB
    participant UI
    
    API->>Score: Calculate score
    Score-->>API: Score + risk level
    API->>DB: Store results
    DB-->>API: Success
    API-->>UI: Close stream
    UI->>UI: Display results
```

### 4.2 Scan Execution Flow

```mermaid
flowchart TD
    A["1. User submits scan request"] --> B["2. POST /api/scan/start"]
    B --> C["3. URL Normalization & Validation<br/>• Validate format<br/>• Add protocol (HTTPS default)<br/>• Test HTTPS availability<br/>• Detect redirects"]
    C --> D["4. Create Scan record (PENDING)<br/>• Store normalized URL<br/>• Flag HTTP threats"]
    D --> E["5. Redirect to /scan/{scanId}<br/>• Open SSE connection<br/>• Stream real-time logs"]
    E --> F["6. Dispatch to Agents"]
    F --> G[Static Analyzer]
    F --> H[Dynamic Tester]
    F --> I[Dependency Scanner]
    F --> J[Rules Validator]
    G --> K["7. Collect vulnerabilities"]
    H --> K
    I --> K
    J --> K
    K --> L["8. OWASP mapping & scoring"]
    L --> M["9. Store results (COMPLETED)"]
    M --> N["10. Close SSE stream"]
    N --> O["11. Display results & score"]
    
    style A fill:#e1f5ff
    style C fill:#fff3cd
    style F fill:#f8d7da
    style M fill:#d4edda
    style O fill:#d4edda
```

### 4.3 Input Processing Pipeline

```mermaid
graph LR
    I[Target URL] --> V1[Format Check]
    V1 --> V2[Protocol Detection]
    V2 --> V3[HTTPS Test]
    V3 --> V4[Redirect Check]
    V4 --> O[Create Scan]
    
    style I fill:#e1f5ff
    style V3 fill:#fff3cd
    style O fill:#d4edda
```

### 4.4 Scan Execution Pipeline

```mermaid
graph TB
    Start[Dispatch Scan] --> Static[Static Analysis]
    Start --> Dynamic[Dynamic Testing]
    Start --> Library[Library Scanning]
    
    Static --> JS[JS Analyzer]
    Static --> HTML[HTML Analyzer]
    Static --> Dep[Dep Analyzer]
    
    Dynamic --> Crawler[Crawler]
    Dynamic --> Headers[Header Tests]
    Dynamic --> Cookies[Cookie Tests]
    
    JS --> Collect[Collect Findings]
    HTML --> Collect
    Dep --> Collect
    Crawler --> Collect
    Headers --> Collect
    Cookies --> Collect
    Library --> Collect
    
    style Start fill:#fff3cd
    style Static fill:#f8d7da
    style Dynamic fill:#f8d7da
    style Library fill:#f8d7da
    style Collect fill:#d4edda
```

### 4.5 Results Processing Pipeline

```mermaid
graph LR
    Findings[Raw Findings] --> OWASP[OWASP Mapping]
    OWASP --> Severity[Severity Rating]
    Severity --> Score[Score Calculation]
    Score --> Risk[Risk Banding]
    Risk --> Store[(Store Results)]
    Store --> Output[Display Report]
    
    style Findings fill:#f8d7da
    style Score fill:#d1ecf1
    style Store fill:#d4edda
    style Output fill:#d4edda
```

---

## 5. Scanning Agents

WebSecScan uses specialized, modular agents for deterministic security checks. Each agent runs in an isolated environment (process, container, or thread) for safety and resource control.

### 5.1 Static Analysis Agent

- **Purpose:** Rule-based, deterministic analysis of source artifacts (JS/TS, HTML, templates).
- **Components:**
  - `jsAnalyzer`: Detects dangerous APIs (e.g., `eval`, `new Function`), unsanitized sinks, insecure cookie usage, and hardcoded secrets via regex rules.
  - `htmlAnalyzer`: Looks for unsafe `innerHTML` usage, missing/misconfigured CSP meta tags, and insecure form attributes.
  - `dependencyAnalyzer`: Lightweight parsing of manifest files (`package.json`) for static dependency checks.
- **Output:** Structured `Vulnerability` objects with canonical ID, OWASP category, severity, confidence, evidence, and remediation guidance.

#### Static Analysis Engine Architecture

```mermaid
graph TB
    Coordinator[Static Analysis Coordinator]
    
    Coordinator --> JS[JS Analyzer]
    Coordinator --> HTML[HTML Analyzer]
    Coordinator --> Dep[Dependency Scanner]
    
    JS --> OWASP[OWASP Rules Engine<br/>Severity mapping & categorization]
    HTML --> OWASP
    Dep --> OWASP
    
    style Coordinator fill:#fff3cd
    style JS fill:#f8d7da
    style HTML fill:#f8d7da
    style Dep fill:#f8d7da
    style OWASP fill:#d1ecf1
```

**Example Implementation:**

```typescript
export async function analyzeJavaScript(
  code: string,
  filename: string
): Promise<AnalysisResult> {
  // ...pattern matching, evidence extraction, rule application...
}
```

```typescript
export async function analyzeHTML(
  html: string,
  filename: string
): Promise<AnalysisResult> {
  // ...CSP checks, inline script detection, form security checks...
}
```

### 5.2 Dynamic Analysis Agent

- **Purpose:** Safe, non-destructive runtime tests against a permitted target URL.
- **Components:**
  - `crawler`: Conservative crawler respecting robots.txt and rate limits; discovers endpoints and input points.
  - `xssTester`: Sends safe reflected XSS payloads; captures responses and DOM reflections.
  - `authChecks`: Verifies insecure auth patterns (e.g., weak redirects, missing session flags) without brute forcing.
- **Implementation:** Uses Playwright (headless), enforces timeouts and request throttling.

#### Dynamic Testing Engine Architecture

```mermaid
graph TB
    Coordinator[Dynamic Testing Coordinator]
    
    Coordinator --> Crawler[Crawler]
    Coordinator --> XSS[XSS Tester]
    Coordinator --> Auth[Auth Checker]
    
    Crawler --> Browser[Playwright Browser]
    XSS --> Browser
    Auth --> Browser
    
    style Coordinator fill:#fff3cd
    style Crawler fill:#f8d7da
    style XSS fill:#f8d7da
    style Auth fill:#f8d7da
    style Browser fill:#d1ecf1
```

**Example Implementation:**

```typescript
export async function crawl(
  startUrl: string,
  options: CrawlOptions
): Promise<CrawlResult> {
  // ...browser automation, endpoint discovery, rate limiting...
}
```

```typescript
export async function testXSS(
  endpoint: Endpoint,
  options: TestOptions
): Promise<XSSResult[]> {
  // ...payload injection, reflection detection, evidence extraction...
}
```

### 5.3 Library Scanner Agent

- **Purpose:** Identify known vulnerable dependency versions and outdated packages.
- **Behavior:** Parses manifests, checks against curated vulnerability feeds (NVD/CVE, OSS advisories), and produces fix guidance.
- **Safety:** No network scanning or credential usage beyond fetching public advisories.

---

## 6. Agent Configuration & Safety

- **Configuration Options:** Exposed via UI/API: `scanMode` (STATIC/DYNAMIC/BOTH), `maxDepth`, `rateLimit`, `allowExternalRequests`.
- **Safety Constraints:**
  - Dynamic tests are non-destructive: no brute force, DoS, exploit chaining, or account takeover.
  - Scans must only target assets owned or with explicit permission (UI enforces consent).
- **Outputs & Integration:**
  - Agents emit structured results stored via Prisma `Scan`/`Vulnerability` models.
  - Each finding includes canonical ID, OWASP mapping, severity, confidence, evidence, and remediation guidance.
  - Verbose debug output is logged server-side only.

---

## 7. URL Normalization Module

**Location:** `src/lib/urlNormalizer.ts`

**Purpose:** Validates, normalizes, and secures target URLs before scanning.

**Key Functions:**
- `normalizeUrl(inputUrl, options)`: Adds protocol, tests HTTPS, detects redirects, returns comprehensive info.
- `validateUrlFormat(url)`: Checks format, credentials, hostname.
- `testUrlConnection(url, timeout)`: Non-destructive HEAD request.
- `checkRedirects(url, timeout)`: Follows redirects, detects www-redirects.

**Security Features:**
- Automatic HTTPS upgrade.
- HTTP usage flagged as HIGH severity (OWASP A04:2025 - Cryptographic Failures).
- Non-destructive testing, configurable timeouts.

**Integration Example:**

```typescript
const normalizeResult = await normalizeUrl(targetUrl, {
  preferHttps: true,
  checkRedirects: true,
  timeout: 10000,
});
if (normalizeResult.securityThreats.length > 0) {
  await recordProtocolVulnerability(scanId, threat);
}
```

---

## 8. Database Schema

```prisma
model Scan {
  id           String          @id @default(cuid())
  targetUrl    String
  hostname     String
  mode         ScanMode
  status       ScanStatus      @default(PENDING)
  score        Int?            // Security score (0-100)
  grade        String?         // Grade: A+, A, B, C, D, F
  createdAt    DateTime        @default(now())
  completedAt  DateTime?
  scanSummary  Json?           // Raw headers, cookies, CSP
  
  results      Vulnerability[]
  securityTests SecurityTest[]
  
  @@index([status])
  @@index([hostname])
  @@index([grade])
}

model Vulnerability {
  id            String     @id @default(cuid())
  scanId        String
  type          String
  severity      Severity
  confidence    Confidence
  description   String
  location      String
  remediation   String
  owaspCategory String?
  owaspId       String?
  ruleId        String?
  scan          Scan       @relation(fields: [scanId], references: [id])
  
  @@index([scanId])
  @@index([severity])
}

model SecurityTest {
  id             String      @id @default(cuid())
  scanId         String
  testName       String      // e.g., "Content Security Policy"
  passed         Boolean
  score          Int         // Score contribution
  result         String      // "Passed", "Failed", "Info", "N/A"
  reason         String?
  recommendation String?
  details        Json?       // Structured test data
  scan           Scan        @relation(fields: [scanId], references: [id])
  
  @@index([scanId])
}

enum ScanMode {
  STATIC
  DYNAMIC
  BOTH
}

enum ScanStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum Confidence {
  HIGH
  MEDIUM
  LOW
}
```

---

## 9. Security Considerations

### 9.1 Server-Side Execution Only

All scanning logic executes exclusively on the server to prevent client-side tampering, exposure of scanning techniques, and unauthorized scanning.

```typescript
// ✅ Correct: Server Action
'use server';
export async function scanWebsite(targetUrl: string) {
  // Secure server-side execution
}

// ❌ Wrong: Client-side scanning
'use client';
export function scanWebsite(targetUrl: string) {
  // NEVER implement scanning client-side
}
```

### 9.2 Input Validation

All user inputs are validated and sanitized before processing.

```typescript
function validateScanInput(input: ScanInput): ValidationResult {
  // ...URL validation, private IP checks, rate limiting...
}
```

### 9.3 Safe Dynamic Testing

Dynamic tests are strictly non-destructive:
- Timeout enforcement (30s default)
- Request rate limiting
- robots.txt compliance
- No brute force, credential testing, or state modification

---

## 10. Performance & Scalability

### 10.1 Performance Optimizations

- **Parallel Processing:** Multiple analyzers run concurrently.
- **Streaming Results:** Real-time updates via Next.js streaming.
- **Caching:** Local cache for advisories and scan results; memoization per file hash.

### 10.2 Scalability

- **Current:** Suitable for academic, small team, and dev/test use (~100 scans/day).
- **Future:** Queue-based architecture, distributed workers, database sharding, CDN integration.

---

## 11. Testing Architecture

### 11.1 Test Pyramid

```mermaid
graph TB
    subgraph " "
        Integration["Integration Tests<br/>18+ tests<br/>(End-to-end)"]
        Unit["Unit Tests<br/>51+ tests<br/>(Isolated)"]
    end
    
    Integration --> Unit
    
    style Integration fill:#fff3cd
    style Unit fill:#d4edda
```

### 11.2 Test Infrastructure

- Deterministic fixtures (vulnerable code samples)
- Isolated test environments
- Mocked external services (no real network calls in tests)
- Snapshot testing for vulnerability outputs

---

## 12. Extensibility & Contribution

- New checks are added as small, testable modules and registered with the agent runner.
- Modules must include unit tests and example inputs for deterministic behavior.
- No backward compatibility guarantees for agent/rule modules; prioritize correctness and clarity.
- Update tests and documentation (`README.md`, `agents.md`, `tasks.md`) with any breaking changes.
- CI gates (typecheck, lint, tests) enforce contract compliance.

---

## 13. Next Steps

- **[View Scanning Agents](agents.md):** Detailed agent architecture
- **[API Reference](api.md):** API endpoint specifications
- **[Development Guide](development.md):** Contributing to the architecture

---
