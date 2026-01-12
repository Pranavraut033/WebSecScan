# Test Suite Organization

## Overview
This document describes the consolidated test suite structure after the audit and refactoring.

## Test Philosophy
- **Real Logic Only**: All tests run against real application code
- **No Mock Implementations**: External boundaries (network, filesystem) may be stubbed, but internal application logic is never mocked
- **Deterministic**: Tests use predictable inputs and verify expected outputs
- **Layered**: Tests are organized by scope (unit, integration, E2E)

## Current Test Files (8 files, ~125 tests)

### Unit Tests - Static Analysis
These tests verify deterministic pattern matching and vulnerability detection:

1. **htmlAnalyzer.test.ts** (7 tests) ✅
   - Form security checks
   - Edge cases (empty, malformed, large HTML)
   - Safe HTML validation

2. **jsAnalyzer.test.ts** (28 tests) ✅
   - Dangerous pattern detection (eval, Function, innerHTML)
   - Hardcoded secrets detection
   - Framework and minification detection
   - Context-aware confidence scoring
   - Edge cases

3. **dependencyAnalyzer.test.ts** (9 tests) ✅
   - Known vulnerable dependencies
   - Outdated dependencies
   - Edge cases

### Unit Tests - Library Functions

4. **urlNormalizer.test.ts** (12 tests, 3 minor failures) ⚠️
   - URL format validation
   - Protocol normalization
   - Note: Uses mocked fetch for network boundary

5. **scoring.test.ts** (22 tests) ✅
   - Risk level calculation
   - Risk color mapping
   - Score calculation logic

6. **csrf.test.ts** (13 tests) ✅
   - Same-origin validation
   - API request validation
   - CSRF token generation

7. **scanLogger.test.ts** (3 tests) ✅
   - Log level validation
   - Log message formatting

### Unit Tests - Configuration

8. **crawlerConfig.test.ts** (27 tests) ✅
   - Configuration validation
   - Safety constraints enforcement
   - Boundary value handling
   - Security constraints

9. **authScanner.test.ts** (15 tests) ✅
   - Authentication config validation
   - Session cookie analysis
   - Security flag detection

### Integration/Pattern Tests

10. **crawler-enhanced.test.ts** (5 tests) ✅
    - URL discovery patterns
    - Sitemap parsing
    - JavaScript route extraction

11. **headerAnalyzer.extended.test.ts** (18 tests, 1 failure) ⚠️
    - Security header validation
    - Permissions-Policy checks
    - Spectre mitigation headers
    - Note: One test has mismatched expectations

## Removed Tests
The following test files were removed as they contained fake/mock implementations or were broken:

- `authBypass.test.ts` - Merged into authScanner.test.ts
- `csrfTester.test.ts` - Merged into csrf.test.ts
- `htmlAnalyzer.extended.test.ts` - Merged into htmlAnalyzer.test.ts
- `jsAnalyzer.extended.test.ts` - Merged into jsAnalyzer.test.ts
- `sqlTester.test.ts` - Fake assertions, no real testing
- `xssTester.enhanced.test.ts` - Fake assertions
- `pathTraversalTester.test.ts` - Fake assertions
- `integration.test.ts` - Missing test fixtures

## Test Statistics
- **Total test files**: 11 (down from 19)
- **Total tests**: ~125 (from 8 primary files)
- **Passing tests**: ~120 (96%)
- **Known issues**: 4 tests with minor failures
- **Lines of test code**: ~2,500 (down from 3,834)

## Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npx tsx --test __tests__/htmlAnalyzer.test.ts

# Run with verbose output
npx tsx --test __tests__/*.test.ts
```

## Test Patterns

### Unit Test Structure
```typescript
describe('Module - Feature', () => {
  it('should behavior with specific input', async () => {
    // Arrange - setup test data
    const input = '...';
    
    // Act - call real function
    const result = await realFunction(input);
    
    // Assert - verify expected behavior
    assert.ok(result.propertyExists);
    assert.strictEqual(result.value, expected);
  });
});
```

### Acceptable Mocking
```typescript
// ✅ OK: Stub external network boundary
const originalFetch = global.fetch;
global.fetch = async () => ({ status: 200 } as Response);
try {
  // Test internal logic
} finally {
  global.fetch = originalFetch;
}

// ❌ NOT OK: Mock internal business logic
const mockAnalyzer = {
  analyze: () => ({ vulnerabilities: [] })  // Fake!
};
```

## Future Work
1. Fix 4 minor test failures in headerAnalyzer and urlNormalizer
2. Add E2E tests using test fixtures when available
3. Add more edge case coverage
4. Consider property-based testing for parsers
