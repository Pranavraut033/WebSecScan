# Development Setup

This guide covers setting up WebSecScan for development and testing.

---

## Prerequisites

Ensure you have:

- **Node.js** v18+ — [nodejs.org](https://nodejs.org/)
- **npm** v9+ — Comes with Node.js
- **Git** — [git-scm.com](https://git-scm.com/)
- **Docker** (optional) — For containerized dev

---

## Environment Setup

### 1. Clone & Install

```bash
git clone https://github.com/Pranavraut033/WebSecScan.git
cd WebSecScan
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
# Database (SQLite for dev)
DATABASE_URL="file:./prisma/dev.db"

# or PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/websecscan"

# Environment
NODE_ENV=development
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed test data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

---

## Project Structure

Key directories:

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard home
│   ├── api/               # API routes
│   ├── scan/[id]/         # Scan results page
│   └── components/        # React components
├── security/              # Security scanning
│   ├── static/            # Static analysis
│   ├── dynamic/           # Dynamic testing
│   └── rules/             # OWASP rules
└── lib/                   # Utilities

__tests__/                 # Test files
prisma/                    # Database schema
```

---

## Code Standards

### TypeScript

All code must be **strict TypeScript**:

```typescript
// ✅ Good: explicit types
function analyzeCode(code: string, filename: string): Vulnerability[] {
  return vulnerabilities;
}

// ❌ Bad: avoid `any`
function analyzeCode(code: any, filename: any): any {
  return vulnerabilities;
}
```

### Naming Conventions

- **Files**: kebab-case (`url-normalizer.ts`)
- **Classes**: PascalCase (`URLNormalizer`)
- **Functions**: camelCase (`normalizeURL()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DEPTH = 2`)

### Error Handling

Always handle errors explicitly:

```typescript
// ✅ Good
try {
  const result = await scanTarget(url);
  return { success: true, data: result };
} catch (error) {
  logger.error('Scan failed', { url, error });
  return { success: false, error: error.message };
}

// ❌ Bad
const result = await scanTarget(url); // May throw unhandled
```

---

## Running Tests

### Execute Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Specific test file
node --test __tests__/jsAnalyzer.test.ts --experimental-strip-types
```

### Writing Tests

Use Node.js test runner:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeJavaScript } from '../src/security/static/jsAnalyzer';

describe('JavaScript Analyzer', () => {
  describe('eval() detection', () => {
    it('should detect eval() usage', async () => {
      const code = "eval('2 + 2');";
      const result = await analyzeJavaScript(code, 'test.js');
      
      assert.ok(result.length > 0);
      assert.equal(result[0].title, 'Dangerous API: eval()');
    });
  });
});
```

### Test Philosophy

- ✅ **Deterministic** — Same input = same output
- ✅ **Real logic** — No mocks of core logic
- ✅ **Fast** — Run in <5 seconds
- ✅ **Clear** — Test names describe what's being tested
- ✅ **Isolated** — Tests don't depend on each other

---

## Code Review Checklist

Before committing:

### Type Safety
- [ ] `npx tsc --noEmit` passes
- [ ] No `any` types without documentation
- [ ] All function parameters have types

### Testing
- [ ] Tests written for new code
- [ ] `npm test` passes
- [ ] Edge cases covered

### Code Quality
- [ ] `npm run lint` passes
- [ ] No console.log() statements (use logger)
- [ ] No hardcoded secrets or credentials

### Documentation
- [ ] New functions have JSDoc comments
- [ ] Complex logic is commented
- [ ] README updated if needed

---

## Debugging

### Using VS Code

Add `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Node: Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/_mocha",
      "args": ["__tests__/**/*.test.ts"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Console Logging

Use the logger utility (not console.log):

```typescript
import { logger } from '@/lib/logger';

logger.info('Scan started', { url, mode });
logger.error('Scanner failed', { error });
logger.debug('Found XSS', { location, payload });
```

### Database Inspection

View database with Prisma Studio:

```bash
npx prisma studio
```

Opens GUI at **http://localhost:5555**

---

## Docker Development

Develop inside Docker:

```bash
docker-compose up --build

# In another terminal
docker-compose exec web npm test
docker-compose exec web npx prisma migrate dev
```

---

## Common Issues

### "Cannot find module" errors

```bash
npx prisma generate
npm install
```

### Database migration fails

```bash
npx prisma migrate reset --force
npx prisma migrate dev
npm run seed
```

### Port already in use

```bash
PORT=3001 npm run dev
```

### Tests failing randomly

Likely a timing issue. Check:
- Database cleanup between tests
- Async/await properly handled
- Timeouts set correctly

---

## Next Steps

- **[Testing Guide](./testing.md)** — Detailed testing documentation
- **[Contributing](contributing.md)** — PR guidelines
- **[Architecture](../architecture/overview.md)** — System design

## Resources

| Resource | Link |
|----------|------|
| **GitHub Repository** | [https://github.com/Pranavraut033/WebSecScan](https://github.com/Pranavraut033/WebSecScan) |
| **Live Demo** | [https://web-sec-scan.vercel.app](https://web-sec-scan.vercel.app) |
| **Documentation** | [https://pranavraut033.github.io/WebSecScan/](https://pranavraut033.github.io/WebSecScan/) |
| **Test Fixtures** | [https://github.com/Pranavraut033/WebSecScan-TestFixtures](https://github.com/Pranavraut033/WebSecScan-TestFixtures) |
