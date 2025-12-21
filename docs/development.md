# Development Guide

This guide covers everything you need to know to develop, test, and contribute to WebSecScan.

---

## 🚀 Development Setup

### Prerequisites

Ensure you have installed:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **(Optional)** **Docker** for containerized development

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/pranavraut/WebSecScan.git
cd WebSecScan

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed test data
npm run seed
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Development
NODE_ENV=development

# (Optional) For PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/websecscan"
```

---

## 🏃 Running the Application

### Development Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000) with hot-reloading enabled.

### Production Build

```bash
npm run build
npm start
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or with standalone Docker
docker build -t websecscan .
docker run -p 3000:3000 websecscan
```

---

## 📁 Project Structure Deep Dive

### Source Directory (`src/`)

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Dashboard (home page)
│   ├── layout.tsx               # Root layout with metadata
│   ├── globals.css              # Global styles
│   ├── actions.ts               # Server Actions
│   │
│   ├── api/                     # REST API Routes
│   │   └── scan/
│   │       ├── start/
│   │       │   └── route.ts    # POST /api/scan/start
│   │       └── [id]/
│   │           ├── status/
│   │           │   └── route.ts # GET /api/scan/:id/status
│   │           └── results/
│   │               └── route.ts # GET /api/scan/:id/results
│   │
│   ├── scan/[id]/              # Dynamic scan page
│   │   └── page.tsx
│   └── results/                # Results listing page
│       └── page.tsx
│
├── components/                  # React Components
│   ├── ScanForm.tsx            # Scan configuration form
│   ├── ScanSummaryCard.tsx     # Vulnerability summary widget
│   └── VulnerabilityCard.tsx   # Individual vulnerability display
│
├── lib/                        # Shared utilities
│   └── db.ts                   # Prisma client singleton
│
└── security/                   # Security scanning engines
    ├── static/                 # Static analysis
    │   ├── jsAnalyzer.ts      # JavaScript/TypeScript analyzer
    │   ├── htmlAnalyzer.ts    # HTML/template analyzer
    │   └── dependencyAnalyzer.ts # Dependency scanner
    │
    ├── dynamic/                # Dynamic testing
    │   ├── crawler.ts         # Web crawler
    │   ├── xssTester.ts       # XSS vulnerability tester
    │   └── authChecks.ts      # Authentication/session checks
    │
    └── rules/
        └── owaspRules.ts      # OWASP mapping & severity rules
```

### Database (`prisma/`)

```
prisma/
├── schema.prisma              # Database schema definition
├── migrations/                # Migration history
│   ├── migration_lock.toml
│   └── 20251219_*/           # Individual migrations
└── seed.ts                    # Test data seeding script
```

### Tests (`__tests__/`)

```
__tests__/
├── jsAnalyzer.test.ts        # JS analyzer unit tests
├── htmlAnalyzer.test.ts      # HTML analyzer unit tests
├── dependencyAnalyzer.test.ts # Dependency scanner tests
└── integration.test.ts        # End-to-end tests
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run specific test file
node --test __tests__/jsAnalyzer.test.ts --experimental-strip-types
```

### Test Structure

WebSecScan uses Node.js built-in test runner with TypeScript support:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeJavaScript } from '../src/security/static/jsAnalyzer.ts';

describe('JavaScript Analyzer', () => {
  describe('eval() detection', () => {
    it('should detect eval() usage', async () => {
      const code = `
        function test() {
          const result = eval('2 + 2');
          return result;
        }
      `;

      const result = await analyzeJavaScript(code, 'test.js');

      assert.ok(result.vulnerabilities.length > 0);
      const evalVuln = result.vulnerabilities.find(v => 
        v.type.includes('eval')
      );
      assert.ok(evalVuln);
      assert.strictEqual(evalVuln.severity, 'CRITICAL');
    });
  });
});
```

### Writing New Tests

1. **Create test file** in `__tests__/` with `.test.ts` extension
2. **Import dependencies**: test framework + module under test
3. **Organize with `describe` blocks**: Group related tests
4. **Write `it` blocks**: Individual test cases
5. **Use assertions**: `assert.ok()`, `assert.strictEqual()`, etc.

### Test Fixtures

Located in `test-fixtures/`:

- `vulnerable-script.js`: JavaScript with all vulnerability patterns
- `vulnerable-app.html`: HTML with security issues
- `insecure-package.json`: Dependencies with known CVEs

These are used by integration tests to ensure deterministic, reproducible results.

---

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name describe_your_change

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ destroys data)
npx prisma migrate reset

# Open Prisma Studio GUI
npx prisma studio
```

### Schema Changes Workflow

1. **Edit** `prisma/schema.prisma`
2. **Generate migration**: `npx prisma migrate dev --name your_change`
3. **Review migration SQL** in `prisma/migrations/`
4. **Test migration**: Run tests to ensure compatibility
5. **Commit migration files**: Include in version control

### Example Migration

```prisma
// Add new field to Scan model
model Scan {
  id          String   @id @default(cuid())
  targetUrl   String
  // ... existing fields
  
  // New field
  userEmail   String?  // Add after deployment
  
  @@index([userEmail])
}
```

```bash
npx prisma migrate dev --name add_user_email
```

---

## 🎨 Code Style & Standards

### TypeScript Configuration

WebSecScan uses **strict mode** TypeScript:

```json
// tsconfig.json (relevant parts)
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Avoid `any`** unless absolutely necessary and documented.

### ESLint

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Code Formatting

We follow standard TypeScript/Next.js conventions:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing commas**: Prefer in multi-line objects/arrays

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | camelCase or kebab-case | `jsAnalyzer.ts`, `scan-form.tsx` |
| Components | PascalCase | `ScanForm.tsx` |
| Functions | camelCase | `analyzeDependencies()` |
| Types/Interfaces | PascalCase | `Vulnerability`, `ScanResult` |
| Constants | UPPER_SNAKE_CASE | `MAX_DEPTH`, `DEFAULT_TIMEOUT` |

---

## 🔧 Adding New Features

### Adding a New Static Check

**1. Define the rule in `owaspRules.ts`:**

```typescript
export const NEW_CHECK_RULE = {
  id: 'NEW_CHECK',
  pattern: /your-regex-pattern/g,
  type: 'Your Vulnerability Type',
  owaspCategory: 'A03:2021-Injection',
  severity: 'HIGH' as const,
  confidence: 'HIGH' as const,
  title: 'Clear vulnerability title',
  description: 'Detailed description of the issue',
  remediation: 'How to fix it',
  references: ['https://owasp.org/...']
};
```

**2. Add detection logic in analyzer:**

```typescript
// src/security/static/jsAnalyzer.ts

export async function analyzeJavaScript(
  code: string,
  filename: string
): Promise<AnalysisResult> {
  // ... existing code
  
  // Add new check
  const newCheckMatches = findMatches(code, NEW_CHECK_RULE.pattern);
  for (const match of newCheckMatches) {
    vulnerabilities.push(createVulnerability(
      NEW_CHECK_RULE,
      filename,
      match
    ));
  }
  
  return { vulnerabilities };
}
```

**3. Write tests:**

```typescript
// __tests__/jsAnalyzer.test.ts

describe('New check', () => {
  it('should detect the vulnerability', async () => {
    const code = `/* vulnerable code */`;
    const result = await analyzeJavaScript(code, 'test.js');
    
    assert.ok(result.vulnerabilities.some(v => 
      v.type === NEW_CHECK_RULE.type
    ));
  });
  
  it('should not create false positives', async () => {
    const code = `/* safe code */`;
    const result = await analyzeJavaScript(code, 'test.js');
    
    assert.ok(!result.vulnerabilities.some(v => 
      v.type === NEW_CHECK_RULE.type
    ));
  });
});
```

**4. Update documentation:**
- Add to [testing-coverage.md](testing-coverage.md)
- Update feature count in [features.md](features.md)

---

### Adding a New Dynamic Check

**1. Create function in appropriate module:**

```typescript
// src/security/dynamic/newCheck.ts

import playwright from 'playwright';

export async function performNewCheck(
  url: string,
  options: CheckOptions
): Promise<CheckResult[]> {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  const results: CheckResult[] = [];
  
  try {
    await page.goto(url, { timeout: options.timeout });
    
    // Perform your check
    const issue = await detectIssue(page);
    
    if (issue) {
      results.push({
        type: 'New Vulnerability Type',
        severity: 'HIGH',
        evidence: issue.evidence,
        remediation: 'How to fix'
      });
    }
    
  } finally {
    await browser.close();
  }
  
  return results;
}
```

**2. Register in dynamic coordinator:**

```typescript
// src/security/dynamic/index.ts

export async function runDynamicAnalysis(url: string) {
  const [crawlResults, xssResults, newCheckResults] = await Promise.all([
    crawl(url, options),
    testXSS(endpoints, options),
    performNewCheck(url, options) // Add here
  ]);
  
  return combineResults([crawlResults, xssResults, newCheckResults]);
}
```

**3. Add tests with safe, deterministic inputs**

---

## 🐛 Debugging

### Server-Side Debugging

Add console logs in Server Actions or API Routes:

```typescript
// src/app/actions.ts
'use server';

export async function scanWebsite(targetUrl: string) {
  console.log('[DEBUG] Starting scan for:', targetUrl);
  
  const result = await performScan(targetUrl);
  
  console.log('[DEBUG] Scan completed:', result.summary);
  
  return result;
}
```

View logs in terminal where `npm run dev` is running.

### Client-Side Debugging

Use React DevTools and browser console:

```typescript
// src/components/ScanForm.tsx
'use client';

export function ScanForm() {
  const handleSubmit = async (data) => {
    console.log('Submitting scan:', data);
    
    const result = await fetch('/api/scan/start', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    console.log('Scan started:', result);
  };
}
```

### Database Debugging

Use Prisma Studio:

```bash
npx prisma studio
```

Opens GUI at [http://localhost:5555](http://localhost:5555) to view/edit database.

---

## 📦 Building & Deployment

### Production Build

```bash
# Create optimized build
npm run build

# Test production build locally
npm start
```

### Docker Build

```bash
# Build image
docker build -t websecscan:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/prod.db" \
  websecscan:latest
```

### Environment Variables

Production environment variables:

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NODE_ENV=production

# Optional
PORT=3000
LOG_LEVEL=info
```

---

## 🤝 Contributing

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make changes** with clear, atomic commits
4. **Write/update tests** for new functionality
5. **Run tests**: `npm test`
6. **Run linter**: `npm run lint`
7. **Update documentation** if needed
8. **Push to your fork**: `git push origin feature/your-feature`
9. **Open Pull Request** with clear description

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] New features have tests
- [ ] Documentation updated (if applicable)
- [ ] Commit messages are clear and descriptive
- [ ] No hardcoded secrets or credentials
- [ ] Follows security best practices from `.github/copilot-instructions.md`

### Commit Message Format

```
feat: Add XYZ vulnerability detection
fix: Resolve false positive in eval() detection
docs: Update API reference for new endpoint
test: Add integration test for dependency scanner
refactor: Simplify HTML parsing logic
```

---

## 📚 Additional Resources

### Project Documentation

- [Copilot Instructions](.github/copilot-instructions.md): Contributor guidelines
- [Project Specifications](../project-specifications.md): Detailed requirements
- [OWASP Migration Guide](../OWASP_2025_MIGRATION.md): OWASP Top 10 mapping

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## ❓ Getting Help

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check this guide and other docs first

---

## Next Steps

- **[Run Tests](testing.md)**: Understand the test suite
- **[View Architecture](architecture.md)**: Learn system design
- **[API Reference](api.md)**: Integrate scanning into tools
