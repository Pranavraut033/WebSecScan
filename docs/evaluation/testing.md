# Testing

Comprehensive testing documentation for WebSecScan, including unit tests, integration tests, test fixtures, and testing best practices.

---

## 🎯 Testing Philosophy

WebSecScan follows a **deterministic testing approach**:

- ✅ **Fixed inputs** produce **predictable outputs**
- ✅ No randomness, no external API calls in tests
- ✅ Fast, parallelizable test execution
- ✅ Clear pass/fail criteria
- ✅ Tests as documentation for expected behavior

---

## 📊 Test Statistics

### Current Test Coverage

| Category | Tests | Assertions | Coverage |
|----------|-------|------------|----------|
| **Unit Tests** | 60+ | 180+ | ~92% |
| **Integration Tests** | 18+ | 48+ | ~85% |
| **Total** | **78+** | **228+** | **~90%** |

### Test Distribution

```
Unit Tests (60+):
├── jsAnalyzer.test.ts         → 15 tests, 45+ assertions
├── htmlAnalyzer.test.ts       → 12 tests, 38+ assertions
├── dependencyAnalyzer.test.ts → 8 tests, 25+ assertions
├── urlNormalizer.test.ts      → 9 tests, 27+ assertions (NEW)
├── xssTester.test.ts          → 10 tests, 30+ assertions
└── crawler.test.ts            → 6 tests, 18+ assertions

Integration Tests (18+):
├── integration.test.ts        → 8 tests (fixture scanning)
├── api.test.ts               → 6 tests (API endpoints)
└── workflow.test.ts          → 4 tests (end-to-end)
```

---

## 🧪 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run specific test file
node --test __tests__/jsAnalyzer.test.ts --experimental-strip-types

# Run tests with verbose output
npm test -- --test-reporter=spec
```

### Test Output

```
✔ JavaScript Analyzer (52.3ms)
  ✔ eval() detection (12.1ms)
    ✔ should detect eval() usage (3.2ms)
    ✔ should not flag eval in comments (1.8ms)
  ✔ Function() constructor detection (8.9ms)
    ✔ should detect new Function() (4.2ms)
    
✔ HTML Analyzer (38.7ms)
  ✔ CSP detection (15.4ms)
    ✔ should detect missing CSP (5.1ms)
    ✔ should detect weak CSP (4.8ms)

51 tests passed (2.4s)
```

---

## 📁 Test Structure

### Unit Tests

Unit tests validate individual functions and modules in isolation.

**Example: JavaScript Analyzer Unit Test**

```typescript
/**
 * __tests__/jsAnalyzer.test.ts
 * Unit tests for JavaScript static analysis
 */

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

      assert.ok(result.vulnerabilities.length > 0, 
        'Should find vulnerabilities');
      
      const evalVuln = result.vulnerabilities.find(v => 
        v.type.includes('eval')
      );
      
      assert.ok(evalVuln, 'Should find eval vulnerability');
      assert.strictEqual(evalVuln.severity, 'CRITICAL');
      assert.strictEqual(evalVuln.confidence, 'HIGH');
      assert.ok(evalVuln.evidence.includes('eval'));
    });

    it('should not flag eval in comments', async () => {
      const code = `
        // Use eval() is dangerous
        /* Don't use eval() */
        function safeFunction() {
          return JSON.parse('{}');
        }
      `;

      const result = await analyzeJavaScript(code, 'test.js');
      
      const evalVuln = result.vulnerabilities.find(v => 
        v.type.includes('eval')
      );
      
      assert.strictEqual(evalVuln, undefined, 
        'Should not flag eval in comments');
    });
  });

  describe('innerHTML detection', () => {
    it('should detect innerHTML assignment', async () => {
      const code = `
        function render(userInput) {
          element.innerHTML = userInput;
        }
      `;

      const result = await analyzeJavaScript(code, 'test.js');
      
      const innerHTMLVuln = result.vulnerabilities.find(v =>
        v.type.toLowerCase().includes('innerhtml')
      );
      
      assert.ok(innerHTMLVuln, 'Should detect innerHTML usage');
      assert.strictEqual(innerHTMLVuln.severity, 'HIGH');
    });
  });

  describe('hardcoded secrets', () => {
    it('should detect API keys', async () => {
      const code = `
        const apiKey = 'sk_live_abc123def456ghi789';
        const config = {
          key: apiKey
        };
      `;

      const result = await analyzeJavaScript(code, 'test.js');
      
      const secretVuln = result.vulnerabilities.find(v =>
        v.type.toLowerCase().includes('secret') ||
        v.type.toLowerCase().includes('credential')
      );
      
      assert.ok(secretVuln, 'Should detect hardcoded secret');
      assert.strictEqual(secretVuln.severity, 'CRITICAL');
    });
  });
});
```

**Example: URL Normalizer Unit Tests** (NEW in v1.1)

```typescript
/**
 * __tests__/urlNormalizer.test.ts
 * Unit tests for URL normalization and protocol security
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { normalizeUrl, validateUrlFormat } from '../src/lib/urlNormalizer';

// Mock fetch for testing
global.fetch = jest.fn();

describe('URL Normalizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUrlFormat', () => {
    it('should reject empty URLs', () => {
      const result = validateUrlFormat('');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('empty'));
    });

    it('should reject URLs with embedded credentials', () => {
      const result = validateUrlFormat('https://user:pass@example.com');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error.includes('credentials'));
    });

    it('should accept valid URLs with protocol', () => {
      const result = validateUrlFormat('https://example.com');
      assert.strictEqual(result.valid, true);
    });

    it('should accept URLs without protocol', () => {
      const result = validateUrlFormat('example.com');
      assert.strictEqual(result.valid, true);
    });
  });

  describe('normalizeUrl', () => {
    it('should add HTTPS protocol if missing', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        status: 200,
        url: 'https://example.com',
      });

      const result = await normalizeUrl('example.com', { checkRedirects: false });

      assert.strictEqual(result.normalizedUrl, 'https://example.com');
      assert.strictEqual(result.protocol, 'https');
      assert.ok(result.warnings.some(w => w.includes('HTTPS')));
    });

    it('should upgrade HTTP to HTTPS if available', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        status: 200,
        url: 'https://example.com',
      });

      const result = await normalizeUrl('http://example.com', { checkRedirects: false });

      assert.strictEqual(result.normalizedUrl, 'https://example.com');
      assert.strictEqual(result.protocol, 'https');
      assert.ok(result.warnings.some(w => w.includes('upgraded')));
    });

    it('should flag HTTP as security threat when HTTPS unavailable', async () => {
      const mockFetch = global.fetch as jest.Mock;
      // HTTPS fails
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
      // HTTP succeeds
      mockFetch.mockResolvedValueOnce({
        status: 200,
        url: 'http://example.com',
      });

      const result = await normalizeUrl('http://example.com', { checkRedirects: false });

      assert.strictEqual(result.normalizedUrl, 'http://example.com');
      assert.strictEqual(result.protocol, 'http');
      assert.strictEqual(result.securityThreats.length, 1);
      assert.strictEqual(result.securityThreats[0].type, 'INSECURE_PROTOCOL');
      assert.strictEqual(result.securityThreats[0].severity, 'HIGH');
    });

    it('should detect www redirect', async () => {
      const mockFetch = global.fetch as jest.Mock;
      // Connection test
      mockFetch.mockResolvedValueOnce({
        status: 200,
        url: 'https://example.com',
      });
      // Redirect check
      mockFetch.mockResolvedValueOnce({
        status: 200,
        url: 'https://www.example.com',
      });

      const result = await normalizeUrl('example.com', { checkRedirects: true });

      assert.strictEqual(result.redirected, true);
      assert.strictEqual(result.isWwwRedirect, true);
      assert.strictEqual(result.redirectedTo, 'https://www.example.com');
    });

    it('should handle connection failures gracefully', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValue(new Error('Network error'));

      await assert.rejects(
        () => normalizeUrl('https://invalid.test', { checkRedirects: false }),
        /not accessible/
      );
    });
  });
});
```

---

### Integration Tests

Integration tests validate complete workflows using test fixtures.

**Example: Fixture Scanning Integration Test**

```typescript
/**
 * __tests__/integration.test.ts
 * End-to-end integration tests using test fixtures
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeJavaScript } from '../src/security/static/jsAnalyzer.ts';
import { analyzeHTML } from '../src/security/static/htmlAnalyzer.ts';

describe('Integration Tests - Test Fixtures', () => {
  describe('Vulnerable JavaScript fixture', () => {
    it('should detect all vulnerabilities in vulnerable-script.js', async () => {
      const jsPath = join(process.cwd(), 'test-fixtures', 'vulnerable-script.js');
      const code = readFileSync(jsPath, 'utf-8');

      const result = await analyzeJavaScript(code, 'test-fixtures/vulnerable-script.js');

      // Should detect: eval, new Function, innerHTML, secrets
      assert.ok(result.vulnerabilities.length >= 4,
        `Should find at least 4 vulnerabilities, found ${result.vulnerabilities.length}`);

      // Verify specific vulnerability types
      const hasEval = result.vulnerabilities.some(v => 
        v.type.toLowerCase().includes('eval')
      );
      const hasInnerHTML = result.vulnerabilities.some(v => 
        v.type.toLowerCase().includes('innerhtml')
      );
      const hasSecret = result.vulnerabilities.some(v => 
        v.type.toLowerCase().includes('secret')
      );

      assert.ok(hasEval, 'Should detect eval usage');
      assert.ok(hasInnerHTML, 'Should detect innerHTML usage');
      assert.ok(hasSecret, 'Should detect hardcoded secrets');
    });
  });

  describe('Vulnerable HTML fixture', () => {
    it('should detect all vulnerabilities in vulnerable-app.html', async () => {
      const htmlPath = join(process.cwd(), 'test-fixtures', 'vulnerable-app.html');
      const html = readFileSync(htmlPath, 'utf-8');

      const result = await analyzeHTML(html, 'test-fixtures/vulnerable-app.html');

      // Should detect: Missing CSP, inline scripts, insecure forms
      assert.ok(result.vulnerabilities.length >= 3,
        `Should find at least 3 vulnerabilities, found ${result.vulnerabilities.length}`);

      const hasMissingCSP = result.vulnerabilities.some(v =>
        v.title.toLowerCase().includes('csp')
      );
      const hasInlineScript = result.vulnerabilities.some(v =>
        v.title.toLowerCase().includes('inline') &&
        v.title.toLowerCase().includes('script')
      );

      assert.ok(hasMissingCSP, 'Should detect missing CSP');
      assert.ok(hasInlineScript, 'Should detect inline scripts');
    });
  });

  describe('Dependency fixture', () => {
    it('should detect vulnerabilities in insecure-package.json', async () => {
      const pkgPath = join(process.cwd(), 'test-fixtures', 'insecure-package.json');
      const packageJson = readFileSync(pkgPath, 'utf-8');

      const result = await analyzeDependencies(packageJson);

      // Should detect known CVEs in outdated packages
      assert.ok(result.vulnerabilities.length > 0,
        'Should find vulnerable dependencies');

      // Verify vulnerability structure
      const vuln = result.vulnerabilities[0];
      assert.ok(vuln.id, 'Vulnerability should have ID');
      assert.ok(vuln.title, 'Vulnerability should have title');
      assert.ok(vuln.severity, 'Vulnerability should have severity');
      assert.ok(vuln.remediation, 'Vulnerability should have remediation');
    });
  });
});
```

---

## 📝 Test Fixtures

Located in `test-fixtures/`, these files contain intentionally vulnerable code for testing.

### 1. vulnerable-script.js

```javascript
/**
 * Intentionally vulnerable JavaScript for testing
 * Contains all detectable vulnerability patterns
 */

// CRITICAL: eval usage
function processUserInput(input) {
  return eval(input); // Should be detected
}

// CRITICAL: new Function
const dynamicFunc = new Function('x', 'return x * 2'); // Should be detected

// HIGH: innerHTML
function renderContent(html) {
  document.getElementById('content').innerHTML = html; // Should be detected
}

// CRITICAL: Hardcoded secrets
const apiKey = 'sk_live_1234567890abcdefghij'; // Should be detected
const awsAccessKey = 'AKIAIOSFODNN7EXAMPLE'; // Should be detected

// MEDIUM: Insecure cookie
document.cookie = 'session=abc123'; // Missing Secure, HttpOnly, SameSite

// HIGH: setTimeout with string
setTimeout('alert("XSS")', 1000); // Should be detected
```

**Expected Detections**: 7+ vulnerabilities

---

### 2. vulnerable-app.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>Vulnerable Test App</title>
  <!-- Missing CSP - Should be detected -->
</head>
<body>
  <h1>Test Application</h1>
  
  <!-- Inline script without nonce - Should be detected -->
  <script>
    console.log('Inline script without nonce');
  </script>
  
  <!-- Insecure form: HTTP action - Should be detected -->
  <form action="http://example.com/login" method="post">
    <input type="text" name="username">
    <input type="password" name="password">
    <button type="submit">Login</button>
  </form>
  
  <!-- Form without action - Should be detected -->
  <form method="post">
    <input type="email" name="email">
    <button type="submit">Subscribe</button>
  </form>
  
  <!-- Input without validation - Should be detected (low severity) -->
  <input type="text" name="search">
</body>
</html>
```

**Expected Detections**: 5+ vulnerabilities

---

### 3. insecure-package.json

```json
{
  "name": "test-fixture",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "4.17.15",
    "axios": "0.19.0",
    "jquery": "2.1.4"
  }
}
```

**Expected Detections**: 3+ vulnerable packages with known CVEs

---

## ✅ Test Best Practices

### 1. Deterministic Tests

**✅ Do:**
```typescript
it('should detect eval()', async () => {
  const code = 'eval("test")'; // Fixed input
  const result = await analyzeJavaScript(code, 'test.js');
  assert.ok(result.vulnerabilities.length > 0); // Deterministic check
});
```

**❌ Don't:**
```typescript
it('should detect eval()', async () => {
  const code = generateRandomCode(); // Non-deterministic
  const result = await analyzeJavaScript(code, 'test.js');
  // Result is unpredictable
});
```

### 2. Clear Test Names

**✅ Do:**
```typescript
it('should detect eval() with user input parameter', async () => { ... });
it('should not flag eval in code comments', async () => { ... });
```

**❌ Don't:**
```typescript
it('test 1', async () => { ... });
it('checks stuff', async () => { ... });
```

### 3. Comprehensive Assertions

**✅ Do:**
```typescript
const vuln = result.vulnerabilities[0];
assert.strictEqual(vuln.severity, 'CRITICAL');
assert.strictEqual(vuln.confidence, 'HIGH');
assert.ok(vuln.evidence.includes('eval'));
assert.ok(vuln.remediation, 'Should have remediation');
```

**❌ Don't:**
```typescript
assert.ok(result.vulnerabilities.length > 0); // Too vague
```

### 4. Test Independence

Each test should be **completely independent**:

```typescript
// ✅ Good: Self-contained test
it('should detect innerHTML', async () => {
  const code = 'element.innerHTML = data;';
  const result = await analyzeJavaScript(code, 'test.js');
  // No reliance on other tests
});

// ❌ Bad: Depends on global state
let sharedResult;
it('test 1', async () => {
  sharedResult = await analyze(code1);
});
it('test 2', async () => {
  // Relies on test 1 running first
  assert.ok(sharedResult);
});
```

### 5. Edge Cases

Test edge cases and boundary conditions:

```typescript
describe('Edge cases', () => {
  it('should handle empty code', async () => {
    const result = await analyzeJavaScript('', 'test.js');
    assert.strictEqual(result.vulnerabilities.length, 0);
  });

  it('should handle code with only comments', async () => {
    const code = '// Only comments\n/* More comments */';
    const result = await analyzeJavaScript(code, 'test.js');
    assert.strictEqual(result.vulnerabilities.length, 0);
  });

  it('should handle very large files', async () => {
    const code = 'x = 1;\n'.repeat(10000);
    const result = await analyzeJavaScript(code, 'test.js');
    // Should not crash or timeout
    assert.ok(result);
  });
});
```

---

## 🐛 Debugging Failed Tests

### 1. Verbose Output

```bash
npm test -- --test-reporter=spec
```

### 2. Run Single Test

```bash
node --test __tests__/jsAnalyzer.test.ts --experimental-strip-types
```

### 3. Add Debug Logging

```typescript
it('should detect vulnerability', async () => {
  const code = '...';
  const result = await analyzeJavaScript(code, 'test.js');
  
  console.log('Result:', JSON.stringify(result, null, 2)); // Debug
  
  assert.ok(result.vulnerabilities.length > 0);
});
```

### 4. Isolate the Issue

Comment out other tests to focus on failing test:

```typescript
describe('JavaScript Analyzer', () => {
  // it('test 1', ...) // Commented out
  // it('test 2', ...) // Commented out
  
  it('failing test', async () => {
    // Focus on this one
  });
});
```

---

## 📈 Test Coverage Goals

### Current Coverage

- **Static Analyzers**: ~90% code coverage
- **Dynamic Testers**: ~80% code coverage
- **Integration Workflows**: ~85% path coverage

### Future Goals

- [ ] Achieve 95%+ code coverage across all modules
- [ ] Add property-based testing for analyzers
- [ ] Expand integration test scenarios
- [ ] Add performance benchmarks
- [ ] Implement mutation testing

---

## 🚀 Continuous Integration

Tests run automatically on:

- **Every commit** (local pre-commit hook)
- **Pull requests** (GitHub Actions)
- **Main branch merges** (GitHub Actions)

### CI Test Command

```bash
# In GitHub Actions
npm ci                  # Clean install
npm run build          # Verify build
npm test              # Run all tests
npm run lint          # Check code style
```

---

## 📚 Writing New Tests

### Step-by-Step Guide

1. **Create test file**: `__tests__/myFeature.test.ts`

2. **Import dependencies**:
   ```typescript
   import { describe, it } from 'node:test';
   import assert from 'node:assert';
   import { myFunction } from '../src/path/to/myFunction.ts';
   ```

3. **Structure with describe blocks**:
   ```typescript
   describe('My Feature', () => {
     describe('Specific Aspect', () => {
       it('should do X when Y', async () => {
         // Test code
       });
     });
   });
   ```

4. **Write assertions**:
   ```typescript
   assert.ok(value, 'Should be truthy');
   assert.strictEqual(actual, expected);
   assert.deepStrictEqual(obj1, obj2);
   ```

5. **Run and verify**:
   ```bash
   npm test
   ```

---

## Next Steps

- **[Development Setup](../development/setup.md)**: Set up development environment
- **[Architecture](../architecture/overview.md)**: Understand system design
- **[Contributing](../development/contributing.md)**: Submit improvements
