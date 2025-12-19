# Project Name

**WebSecScan** – Automated Web Application Security Scanner

---

## Project Context

This is an academic (college) project. Focus on clarity, correctness, modularity, and demonstrable security concepts (not enterprise-scale exploitation).

Goal: build a developer-facing security scanning tool that detects common web vulnerabilities using static analysis and lightweight dynamic checks, aligned with the OWASP Top 10.

---

## High-Level Objectives

- Detect common web vulnerabilities using automated techniques.
- Provide actionable, developer-friendly reports.
- Demonstrate secure software engineering practices.
- Integrate cleanly with modern web workflows using Next.js.

---

## Tech Stack (MANDATORY)

- Framework: Next.js (App Router)  
- Frontend UI: Next.js Server Components + Client Components where needed  
- Backend Logic:
  - Next.js Server Actions for trusted operations
  - Next.js API Routes for scanning execution
- Database: Prisma ORM (PostgreSQL or SQLite acceptable)  
- Language: TypeScript (strict mode)  
- Constraints:
  - No external paid APIs
  - No illegal / destructive scanning

---

## Core Architecture

```
Next.js App
│
├── UI (Dashboard, Scan Forms, Reports)
│
├── Server Actions
│   ├── createScan()
│   ├── runStaticAnalysis()
│   ├── runDynamicAnalysis()
│   └── generateReport()
│
├── API Routes (/api/scan)
│   ├── POST /scan/start
│   ├── GET  /scan/:id/status
│   └── GET  /scan/:id/results
│
├── Security Engine
│   ├── static/
│   │   ├── jsAnalyzer.ts
│   │   ├── htmlAnalyzer.ts
│   │   └── dependencyAnalyzer.ts
│   ├── dynamic/
│   │   ├── crawler.ts
│   │   ├── xssTester.ts
│   │   └── authChecks.ts
│   └── rules/
│       └── owaspRules.ts
│
└── Prisma Database
```

---

## Functional Requirements

1. User Interface (Next.js UI)
   - Dashboard with:
     - New Scan form
     - Scan history
     - Severity summary (Critical / High / Medium / Low)
   - Scan input options:
     - Target URL (mandatory)
     - Scan mode: Static only / Dynamic only / Both
   - Results view:
     - Vulnerability list
     - Severity color coding
     - File/URL location
     - Clear remediation advice

2. Static Analysis (Server-side)
   - Analyze:
     - JavaScript / TypeScript
     - HTML templates
   - Detect:
     - eval, new Function
     - Unsafe innerHTML
     - Unsanitized user input
     - Missing CSP headers/meta tags
     - Insecure cookies
     - Hardcoded secrets (basic regex-based detection)
   - Characteristics:
     - Rule-based, deterministic (no ML)
     - Output structured vulnerability objects with Confidence: Low / Medium / High

3. Dynamic Analysis (Controlled & Safe)
   - Use safe, non-destructive payloads
   - Detect:
     - Reflected XSS
     - Missing security headers
     - Basic authentication weaknesses
   - Use:
     - Headless browser (Playwright preferred)
     - No brute force or DoS techniques

4. Vulnerability Classification
   - Each finding must include:
     - ID (e.g., WSS-XSS-001)
     - Name
     - OWASP category
     - Severity (Critical / High / Medium / Low)
     - Confidence (High / Medium / Low)
     - Evidence
     - Remediation guidance

---

## Severity Scale

| Severity  | Description |
|-----------|-------------|
| CRITICAL  | Exploitable with severe impact |
| HIGH      | High likelihood/impact vulnerabilities |
| MEDIUM    | Moderate impact or likelihood |
| LOW       | Informational or low-risk issues |

---

## Prisma Data Models (REQUIRED)

```prisma
model Scan {
  id        String   @id @default(cuid())
  targetUrl String
  mode      ScanMode
  status    ScanStatus
  createdAt DateTime @default(now())
  results   Vulnerability[]
}

model Vulnerability {
  id          String   @id @default(cuid())
  scanId      String
  type        String
  severity    Severity
  confidence  Confidence
  description String
  location    String
  remediation String
  scan        Scan     @relation(fields: [scanId], references: [id])
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

## API Contracts

- POST /api/scan/start

Request:
```json
{
  "targetUrl": "http://localhost:3000",
  "mode": "BOTH"
}
```

Response:
```json
{
  "scanId": "abc123",
  "status": "RUNNING"
}
```

- GET /api/scan/:id/results

Response:
```json
{
  "scanId": "abc123",
  "summary": {
    "critical": 1,
    "high": 2,
    "medium": 4,
    "low": 3
  },
  "vulnerabilities": [...]
}
```

---

## Server Action Rules

- All scanning logic runs server-side only
- UI components must never execute security scans directly
- Server Actions handle:
  - Validation
  - Database writes
  - Scan orchestration

---

## Security & Ethical Constraints

> “Only scan applications you own or have permission to test.”

- Disable:
  - Password brute force
  - Exploit payload chaining
  - Automated account takeover

---

## Non-Functional Requirements

- Deterministic output (same input → same result)
- Clear logs for debugging
- Type-safe code (TypeScript strict)
- Modular architecture
- Readable comments (important for evaluation)

---

## Acceptance Criteria (for Evaluation)

- Successfully detects vulnerabilities in a deliberately insecure test app
- Results stored and retrievable from Prisma
- UI clearly presents findings
- No runtime crashes
- Code structure demonstrates clean separation of concerns

---

## Explicit Copilot Instructions

- Do NOT generate placeholder logic
- Do NOT skip validation
- Prefer clarity over cleverness
- Add comments explaining why a vulnerability is risky
- Follow OWASP terminology exactly
- Use TypeScript strict typing everywhere
- Work through each checklist item systematically
- Keep communication concise and focused
- Follow development best practices
- Separate scanning logic; don't put everything in one file, making it big, so split the content into different files
- Verify that .github/copilot-instructions.md exists and is complete

--- 
