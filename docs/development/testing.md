# Development Testing Guide

Comprehensive testing documentation for WebSecScan contributors.

---

## Test Philosophy

WebSecScan uses **deterministic testing**:

- ✅ **Fixed inputs** → **predictable outputs**
- ✅ **Real logic** — Never mock core functionality
- ✅ **Reproducible** — Same test, same result, every time
- ✅ **Fast** — Complete suite in <5 seconds
- ✅ **Isolated** — Tests don't depend on each other

---

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

Re-runs tests whenever files change.

### Specific Test File

```bash
node --test __tests__/jsAnalyzer.test.ts --experimental-strip-types
```

### Test Statistics

Current test suite: **60+ unit tests**, **~150+ assertions**

---

## Test Organization

### Unit Tests (Static Analysis)

```
__tests__/jsAnalyzer.test.ts
  - eval() detection
  - innerHTML detection
  - Hardcoded secrets
  - Framework detection
  - Minification handling

__tests__/htmlAnalyzer.test.ts
  - Form security checks
  - CSP header validation
  - Unsafe form attributes
  - Edge cases

__tests__/dependencyAnalyzer.test.ts
  - Known vulnerable versions
  - Outdated packages
  - Supply chain risks
```

### Integration Tests

```
__tests__/crawler.test.ts
  - URL discovery
  - Endpoint extraction
  - Rate limiting

__tests__/scoring.test.ts
  - Risk level calculation
  - Score computation
  - Color mapping
```

---

## Writing Tests

### Test Template

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeJavaScript } from '../src/security/static/jsAnalyzer';

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

      assert.ok(result.length > 0, 'Should find at least one vulnerability');
      assert.equal(result[0].title, 'Dangerous API: eval()');
      assert.equal(result[0].severity, 'CRITICAL');
    });

    it('should NOT detect eval-like strings in comments', async () => {
      const code = `
        // This is eval() but just in a comment
        const safe = 'eval is dangerous';
      `;

      const result = await analyzeJavaScript(code, 'test.js');
      assert.equal(result.length, 0, 'Comments should be ignored');
    });
  });
});
```

### Best Practices

✅ **Do**:
- Use descriptive test names
- Test both happy path and edge cases
- Test error conditions
- Clean up database state between tests
- Use meaningful assertions

❌ **Don't**:
- Mock core logic (test real behavior)
- Use random test data (be deterministic)
- Leave network calls in tests (mock at boundaries)
- Create tests that depend on execution order
- Write tests longer than 10 lines (keep focused)

---

## Test Fixtures

Intentionally vulnerable apps for testing:

```bash
cd test-fixtures
docker-compose up

# Then scan
Target: http://localhost:3001
```

Includes:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Weak authentication
- Missing security headers

---

## Coverage Goals

| Category | Target |
|----------|--------|
| Unit tests | >90% |
| Integration tests | >80% |
| Overall | >85% |

Check coverage:

```bash
npm run test:coverage
```

---

## CI/CD Testing

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before release builds

Requirements:
- [ ] All tests pass
- [ ] No new test failures
- [ ] Linting passes
- [ ] TypeScript strict mode passes

---

## Debugging Tests

### VSCode Debugger

Add `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/.bin/_mocha",
  "args": ["__tests__/**/*.test.ts"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Manual Debugging

```bash
# Run single test with output
node --test __tests__/jsAnalyzer.test.ts --experimental-strip-types 2>&1 | head -50

# Or inspect specific assertions
console.log('Debug:', actualResult, expectedResult);
```

---

## Common Test Patterns

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await analyzeAsync(code);
  assert.ok(result);
});
```

### Testing Error Handling

```typescript
it('should handle invalid input gracefully', () => {
  assert.throws(() => {
    parseInvalidInput();
  }, /expected error message/);
});
```

### Testing Database Queries

```typescript
it('should save and retrieve scan', async () => {
  const scan = await prisma.scan.create({
    data: { targetUrl: 'https://example.com', mode: 'BOTH' }
  });
  
  const retrieved = await prisma.scan.findUnique({
    where: { id: scan.id }
  });
  
  assert.equal(retrieved.targetUrl, 'https://example.com');
});
```

---

## Next Steps

- **[Contributing Guide](contributing.md)** — PR process and code standards
- **[Development Setup](setup.md)** — Configure your environment
- **[Architecture](../architecture/overview.md)** — System design
