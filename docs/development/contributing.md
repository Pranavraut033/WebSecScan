# Contributing to WebSecScan

Guidelines for contributing code, documentation, and tests to WebSecScan.

---

## Code Standards

### TypeScript Strict Mode

All code must be strict TypeScript:

```typescript
// ✅ Good
function analyzeCode(code: string): Vulnerability[] {
  return [];
}

// ❌ Bad
function analyzeCode(code: any): any {
  return [];
}
```

Never use `any` without documented justification.

### Naming Conventions

- **Files**: kebab-case (`url-normalizer.ts`)
- **Classes**: PascalCase (`URLNormalizer`)
- **Functions**: camelCase (`normalizeURL()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DEPTH = 2`)

### Comments & Documentation

Add JSDoc for public functions:

```typescript
/**
 * Analyzes JavaScript code for security vulnerabilities.
 * @param code - Source code to analyze
 * @param filename - Original filename for context
 * @returns Array of detected vulnerabilities
 */
export async function analyzeJavaScript(
  code: string,
  filename: string
): Promise<Vulnerability[]> {
  // implementation
}
```

---

## Testing Requirements

### Unit Tests Required

For every new rule or function:

```bash
npm test  # Must pass all tests
```

### Test Quality

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('MyNewFeature', () => {
  it('should detect the vulnerability', () => {
    const result = myNewCheck('vulnerable code');
    assert.ok(result.length > 0);
  });

  it('should not flag safe code', () => {
    const result = myNewCheck('safe code');
    assert.equal(result.length, 0);
  });
});
```

**Requirements**:
- Edge cases covered
- Both positive and negative tests
- Clear assertions
- Deterministic (no random data)

---

## Mandatory Project Rules

From `.github/copilot-instructions.md`:

- ✅ **No placeholder logic** — Implement real rule checks, not fake findings
- ✅ **Validate all inputs** — Server-side validation always
- ✅ **TypeScript strict mode** — Avoid `any`
- ✅ **Server-only scanning** — Never run scanners on client
- ✅ **OWASP 2025 taxonomy** — Use current classification
- ✅ **Separate modules** — Small, focused files
- ✅ **Clear comments** — Explain why each finding is risky
- ✅ **No hardcoded secrets** — Never commit credentials

### OWASP 2025 Examples

```typescript
// ✅ Correct
vulnerability.owaspId = 'A02:2025';  // Security Misconfiguration

// ❌ Wrong
vulnerability.owaspId = 'A05:2021';  // Old taxonomy
vulnerability.owaspId = 'A05:2025';  // Wrong number (moved to A02!)
```

See [OWASP 2025 Mapping](../security/owasp-2025.md) for complete guide.

---

## Pull Request Checklist

Before submitting:

### Code Quality
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint` passes (ESLint)
- [ ] No hardcoded secrets or credentials
- [ ] No console.log() — Use logger instead
- [ ] No commented-out code

### Testing
- [ ] `npm test` passes
- [ ] New tests written for new code
- [ ] Edge cases tested
- [ ] At least 80% coverage for new code

### Documentation
- [ ] Function JSDoc comments added
- [ ] Complex logic explained
- [ ] README updated if needed
- [ ] CHANGELOG updated

### Ethical & Safety
- [ ] No exploitative code
- [ ] No credential harvesting
- [ ] No unethical defaults
- [ ] Includes safety constraints

---

## PR Process

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/WebSecScan.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feat/my-new-feature
   ```

3. **Make your changes**
   - Follow code standards
   - Write tests
   - Add documentation

4. **Test locally**
   ```bash
   npm run lint
   npm test
   npx tsc --noEmit
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add XSS detection in JSON responses

   - Detect XSS in JSON parsing contexts
   - Add 8 test cases for edge cases
   - Map to A03:2025 (Injection)"
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feat/my-new-feature
   ```

7. **Address review comments**
   - Respond to feedback
   - Make requested changes
   - Update tests if needed

---

## Development Workflow

### 1. Set Up Environment

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 2. Make Changes

```typescript
// Add new vulnerability check in src/security/rules/
export async function checkNewVulnerability(code: string): Vulnerability[] {
  // Implementation
}
```

### 3. Write Tests

```typescript
// Add test in __tests__/
it('should detect new vulnerability', () => {
  const result = checkNewVulnerability('vulnerable code');
  assert.ok(result.length > 0);
});
```

### 4. Test Locally

```bash
npm test
npm run lint
npx tsc --noEmit
```

### 5. Commit & Push

```bash
git add src/ __tests__/
git commit -m "feat: add new vulnerability check"
git push origin feat/my-feature
```

---

## Adding New Detection Rules

### Step 1: Create Rule Module

File: `src/security/rules/my-check.ts`

```typescript
import { Vulnerability } from '@prisma/client';

export async function checkMyVulnerability(
  code: string,
  filename: string
): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  // Your detection logic here
  if (code.includes('dangerous_pattern')) {
    vulnerabilities.push({
      id: 'WSS-XXX-001',
      owaspId: 'A02:2025',  // OWASP 2025 category
      severity: 'HIGH',
      confidence: 'HIGH',
      title: 'Dangerous Pattern Detected',
      description: 'Explain why this is risky...',
      evidence: 'Code snippet...',
      remediation: 'How to fix it...',
      location: `${filename}:${lineNumber}`
    });
  }

  return vulnerabilities;
}
```

### Step 2: Write Tests

File: `__tests__/my-check.test.ts`

```typescript
describe('My Check', () => {
  it('should detect vulnerability', async () => {
    const result = await checkMyVulnerability('bad code');
    assert.ok(result.length > 0);
  });

  it('should not flag safe code', async () => {
    const result = await checkMyVulnerability('safe code');
    assert.equal(result.length, 0);
  });
});
```

### Step 3: Register Rule

Update `src/security/rules/index.ts`:

```typescript
import { checkMyVulnerability } from './my-check';

export const SECURITY_RULES = [
  // ... existing rules
  checkMyVulnerability
];
```

### Step 4: Test & Document

```bash
npm test           # Must pass
npm run lint       # Must pass
# Update README if adding major feature
```

---

## Common Mistakes to Avoid

❌ **Don't**: Mock core scanning logic
✅ **Do**: Test real vulnerability detection

❌ **Don't**: Use `any` types
✅ **Do**: Use explicit TypeScript types

❌ **Don't**: Hardcode secrets or credentials
✅ **Do**: Use environment variables

❌ **Don't**: Skip tests for new code
✅ **Do**: Write comprehensive tests

❌ **Don't**: Mix OWASP 2021/2025
✅ **Do**: Use OWASP 2025 exclusively

---

## Code Review

Your PR will be reviewed on:

1. **Code Quality** — Follows standards, no `any`, clear logic
2. **Testing** — Comprehensive tests, all passing
3. **Documentation** — JSDoc, comments, README updated
4. **Safety** — No exploitative code, ethical defaults
5. **Correctness** — OWASP 2025, no false logic

---

## Getting Help

- **Questions?** Open a GitHub Discussion
- **Stuck?** Ask in the PR comments
- **Want to discuss?** Start an issue for design feedback

---

**Thank you for contributing!** 🎉
