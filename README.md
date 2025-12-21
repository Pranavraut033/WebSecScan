# WebSecScan

An Automated Security Scanner for Web Application Vulnerabilities with Mozilla Observatory-style Scoring

## Problem Statement

As web applications proliferate, they increasingly become targets for cyberattacks that exploit vulnerabilities such as SQL injection, Cross-Site Scripting (XSS), insecure authentication, and outdated libraries. While large organizations can afford dedicated security resources, small to mid-sized development teams often lack the expertise or tools to conduct comprehensive security evaluations. This gap results in widespread exposure of web applications to preventable attacks, posing risks to both users and businesses.

## Proposed Solution

WebSecScan is an automated, lightweight security scanner that identifies common web application vulnerabilities through both static code analysis and dynamic behavioral testing. The tool provides:

- **Comprehensive Security Scoring** (0-100 scale with letter grades A+ to F)
- **Mozilla Observatory-style Testing** with detailed security header analysis
- **CSP Analysis** with 10 specific checks for Content Security Policy
- **Cookie Security Validation** including Secure, HttpOnly, and SameSite attributes
- **OWASP Top 10 2025 Mapping** for all detected vulnerabilities
- **Scan History Tracking** to monitor security improvements over time
- **Raw Header Capture** for detailed security analysis

## Key Features

### 🏆 Security Scoring System
- Letter grades from **A+** (135+ points) to **F** (0-49 points)
- Based on Mozilla Observatory methodology
- Real-time score calculation during scans
- Historical trend tracking

### 🔍 Comprehensive Testing
- **Static Analysis**: JavaScript, HTML, dependencies
- **Dynamic Testing**: XSS, authentication, security headers
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Cookie Analysis**: Secure, HttpOnly, SameSite attributes
- **CSP Deep Dive**: 10 detailed Content Security Policy checks
- **URL Normalization**: Automatic HTTPS upgrade, redirect detection, HTTP threat flagging

### 📊 Detailed Reporting
- Pass/Fail status for each security test
- Score contribution (+/- points) per test
- Actionable recommendations
- Raw server headers and CSP directives
- Historical scan comparison

### 🔄 Scan Management
- Track up to 20 scans per hostname
- One-click rescan functionality
- Compare results over time
- Export capabilities (planned)

## Expected Outcome

WebSecScan provides practical, actionable vulnerability reports with security scoring that developers can use to enhance application security before deployment. The tool promotes secure coding practices, reduces common vulnerabilities across web projects, and contributes to a more secure web ecosystem, especially benefiting teams with limited cybersecurity resources.

**Key Deliverables**:
- ✅ Security score (0-100) and letter grade (A+ to F)
- ✅ Detailed test results for 10+ security checks
- ✅ Raw HTTP headers and security configuration capture
- ✅ Scan history and trend analysis
- ✅ OWASP Top 10 2025 vulnerability mapping
- ✅ Actionable remediation guidance

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/websecscan.git
cd websecscan

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Running Locally

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the UI.

### Running Your First Scan

1. Enter a target URL (e.g., `https://example.com`)
2. Select scan mode:
   - **STATIC**: Code analysis only
   - **DYNAMIC**: Live testing with security scoring
   - **BOTH**: Complete analysis (recommended)
3. Click "Start Scan"
4. View results with security score and grade

### Understanding Your Score

**Score Breakdown**:
```
Base Score: 100 points

Deductions:
- Missing HSTS: -20
- Missing CSP: -25
- Insecure Cookies: -20
- Missing X-Content-Type-Options: -5
- Missing X-Frame-Options: -20

Bonuses:
- Strong Referrer-Policy: +5
- All cookies secure: +5

Final Score = Base + Bonuses - Deductions
Grade assigned based on final score
```

---

## API Endpoints

### Core Endpoints
- `POST /api/scan/start` — Start a new scan
- `GET /api/scan/:id/status` — Poll scan status
- `GET /api/scan/:id/results` — Fetch complete results with score and tests
- `GET /api/history/:hostname` — Get scan history for a hostname

### Server Actions
Used for trusted server-side operations:
- `createScan(targetUrl, mode)` — Create scan record
- `runStaticAnalysis(scanId)` — Execute static analysis
- `runDynamicAnalysis(scanId)` — Execute dynamic testing with scoring
- `getScanHistory(hostname)` — Get historical scans
- `generateReport(scanId)` — Generate formatted report

### Response Example (with Scoring)

```json
{
  "scan": {
    "id": "clx1a2b3c4d5e6f7g8h9",
    "targetUrl": "https://example.com",
    "hostname": "example.com",
    "mode": "BOTH",
    "status": "COMPLETED",
    "score": 85,
    "grade": "B",
    "completedAt": "2025-12-20T10:35:23.000Z",
    "scanSummary": {
      "totalTests": 10,
      "passedTests": 7,
      "failedTests": 3,
      "rawHeaders": { ... },
      "setCookieHeaders": [...],
      "csp": "default-src 'self'"
    }
  },
  "securityTests": [
    {
      "testName": "Content Security Policy",
      "passed": false,
      "score": -25,
      "result": "Failed",
      "reason": "CSP implemented unsafely",
      "recommendation": "Remove unsafe-inline from script-src"
    }
  ],
  "vulnerabilities": [...]
}
```

> All scanning logic runs on the server. The client UI only requests scans; it never executes scanning code.

---

## Security & Ethical Constraints
- Only scan assets you own or have explicit permission to test.
- Dynamic checks are safe and non-destructive: no brute force, no DoS, no credential stuffing, and no chained exploit payloads.
- Security testing follows Mozilla Observatory methodology
- All tests are deterministic and reproducible
- Scoring is transparent and documented

---

## Project Structure

```
WebSecScan/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions.ts         # Server Actions (createScan, runAnalysis)
│   │   ├── api/               # REST API endpoints
│   │   └── scan/[id]/         # Scan results page
│   ├── components/            # React Components
│   │   ├── ScoreCard.tsx      # Security score display
│   │   ├── SecurityTestCard.tsx # Test result cards
│   │   ├── ScanHistory.tsx    # Historical scans
│   │   └── VulnerabilityCard.tsx
│   ├── lib/
│   │   ├── db.ts             # Prisma client
│   │   └── scoring.ts        # Scoring algorithm
│   └── security/             # Security analyzers
│       ├── static/           # Static code analysis
│       │   ├── jsAnalyzer.ts
│       │   ├── htmlAnalyzer.ts
│       │   └── dependencyAnalyzer.ts
│       └── dynamic/          # Dynamic testing
│           ├── crawler.ts
│           ├── xssTester.ts
│           ├── headerAnalyzer.ts   # HTTP headers
│           ├── cookieAnalyzer.ts   # Cookie security
│           └── cspAnalyzer.ts      # CSP analysis
├── prisma/
│   ├── schema.prisma         # Database models
│   └── migrations/
├── docs/                     # Documentation
│   ├── features.md          # Feature documentation
│   ├── architecture.md      # System architecture
│   ├── api.md              # API reference
│   └── testing.md          # Testing guide
└── __tests__/              # Test suites
```

---

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Features Guide](docs/features.md)** - Complete feature list with security scoring details
- **[Architecture](docs/architecture.md)** - System design and data models
- **[API Reference](docs/api.md)** - REST API and Server Actions documentation
- **[Testing Guide](docs/testing.md)** - Test coverage and methodology
- **[URL Normalization](docs/url-normalization.md)** - Automatic HTTPS upgrade and HTTP threat detection
- **[Scoring Implementation](SCORING_IMPLEMENTATION.md)** - Detailed scoring system documentation

### Key Documentation Updates

**New in this release**:
- Security scoring system (0-100 scale)
- Mozilla Observatory-style testing
- CSP analysis with 10 detailed checks
- Cookie security validation
- Raw HTTP header capture
- Scan history tracking
- Rescan functionality

## Acceptance Criteria
- ✅ Detects vulnerabilities in intentionally insecure fixtures
- ✅ Results stored and retrievable from Prisma database
- ✅ Clear UI presentation with security scores and grades
- ✅ Deterministic output for the same input
- ✅ Security tests pass/fail with actionable recommendations
- ✅ Raw headers and CSP captured for analysis
- ✅ Scan history tracked per hostname

---

For detailed architecture, see [project-specifications.md](project-specifications.md). 

## Docker Setup

Run WebSecScan in Docker:

```bash
# Build the image
docker build -t websecscan .

# Run the container
docker run -p 3000:3000 websecscan

# Or use docker-compose
docker-compose up
```

The application will be available at [http://localhost:3000](http://localhost:3000)

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. Review [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
2. Ensure all new security checks include:
   - Unit tests with deterministic inputs/outputs
   - Documentation with usage examples
   - OWASP category mapping
   - Score impact calculation (for security tests)
3. All PRs must pass:
   - TypeScript type checks (`npm run build`)
   - ESLint (`npm run lint`)
   - Test suite (`npm test`)
4. Update relevant documentation in `/docs`

### Development Commands

```bash
# Type checking
npm run build

# Linting
npm run lint

# Run tests
npm test

# Database operations
npx prisma migrate dev     # Create new migration
npx prisma generate        # Regenerate Prisma client
npx prisma studio          # View database in browser
```

---

## Agents & Task System

WebSecScan uses modular security agents for scanning:

- **Static Analysis Agent**: Code analysis (JS/TS, HTML)
- **Dynamic Analysis Agent**: Live testing with security scoring
- **Dependency Scanner**: Vulnerability checking

See [agents.md](agents.md) for agent architecture and [tasks.md](tasks.md) for task definitions.
