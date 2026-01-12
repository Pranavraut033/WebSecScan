# Reducing False Positives

Techniques and strategies to minimize false positive findings and improve scan accuracy.

---

## What Are False Positives?

A **false positive** is when WebSecScan reports a vulnerability that isn't actually exploitable.

**Example**:
```javascript
// Pattern matching detects eval()
eval(userInput);  // Real vulnerability

// But this is safe (minified, concatenated)
const e = eval; e('');  // False positive if flagged as risky
```

---

## Confidence Scoring

Each finding includes a confidence level:

| Confidence | Meaning | Action |
|-----------|---------|--------|
| **HIGH** | Very likely a real vulnerability | Fix immediately |
| **MEDIUM** | Probably a real vulnerability | Verify and fix |
| **LOW** | Possible vulnerability, needs validation | Investigate |

**A HIGH severity with MEDIUM confidence might be less urgent than a CRITICAL with LOW confidence.**

---

## Context-Aware Detection

WebSecScan reduces false positives by understanding context:

### Framework Detection

```javascript
// React.js detected
dangerouslySetInnerHTML={{ __html: content }}
  // Expected in React for legitimate use
  // Confidence: MEDIUM (less risky than direct innerHTML)

// Plain JavaScript
element.innerHTML = content;
  // More likely a real XSS vulnerability
  // Confidence: HIGH
```

### Minification Awareness

```javascript
// Original code
eval(userInput);  // Confidence: HIGH

// Minified code
e(u);  // Confidence: LOW (unclear if eval)
```

Minified code is flagged with lower confidence.

### Data Flow Analysis

```javascript
// Safe: literal string
element.innerHTML = "<b>Hello</b>";
  // Confidence: HIGH (safe)

// Unsafe: user input
element.innerHTML = userInput;
  // Confidence: HIGH (dangerous)

// Unclear: indirect
let data = getData();
element.innerHTML = data;
  // Confidence: MEDIUM (could be safe or unsafe)
```

---

## Threshold Filtering

WebSecScan only reports findings above confidence thresholds:

| Severity | Min Confidence |
|----------|---|
| CRITICAL | MEDIUM |
| HIGH | MEDIUM |
| MEDIUM | MEDIUM |
| LOW | LOW |

**Result**: Very low-confidence findings are filtered out.

---

## Evidence Validation

Every finding requires actual evidence:

```json
// ✅ Good: Has evidence
{
  "title": "Reflected XSS",
  "evidence": "Payload '<img src=x onerror=1>' found in response",
  "severity": "HIGH"
}

// ❌ Bad: No evidence
{
  "title": "Possible XSS",
  "evidence": null,
  "severity": "MEDIUM"
}
```

---

## Manual Validation Tips

Even with automation, manual review is recommended:

### 1. Check the Evidence

```
Finding: "eval() detected"
Evidence: "eval(userInput)" ← Is userInput actually from user?
Action: Verify if userInput is user-controlled
```

### 2. Understand the Context

```
Framework: React.js
Finding: "dangerouslySetInnerHTML usage"
Context: React explicitly designed for this
Action: May be a false positive if properly sanitized
```

### 3. Test Manually

```
Finding: "XSS in /search?q="
Test: Try injecting <img src=x onerror=alert(1)>
Result: If it executes, it's real; otherwise, false positive
```

### 4. Check Remediation

```
Recommended fix: "Use textContent instead of innerHTML"
Actual code: Uses textContent + DOMPurify sanitization
Conclusion: Already fixed; this is a false positive
```

---

## Common False Positive Patterns

### 1. Framework-Specific APIs

| Framework | Pattern | False Positive Risk |
|-----------|---------|---|
| React | `dangerouslySetInnerHTML` | HIGH (designed for safe use) |
| Vue | `v-html` directive | MEDIUM (context-dependent) |
| Angular | `bypassSecurityTrustHtml` | HIGH (requires trust) |

### 2. Minified Code

Minification makes pattern detection less reliable:

```javascript
// Original
eval(userInput);  // Detected

// Minified
e(u);  // May not detect, or lower confidence
```

### 3. Comment/String Detection

```javascript
// Detected as eval() usage
const message = "Do not eval() user input";
// This is just a string, not actual code
// ✅ WebSecScan filters these out
```

### 4. Sandbox/Safe Contexts

```javascript
// In a worker/iframe sandbox
eval(userInput);  // Safer than in main context
// Confidence: MEDIUM (not HIGH)
```

---

## Improving Accuracy

### For WebSecScan Developers

1. **Improve context detection** — Better framework understanding
2. **Add data flow analysis** — Track where data comes from
3. **Increase pattern specificity** — Reduce broad matches
4. **Maintain updated rules** — OWASP 2025 alignment

### For Users

1. **Read remediation guidance** — Understand why it's flagged
2. **Check evidence** — Verify the actual code snippet
3. **Test manually** — Try to exploit the finding
4. **Report false positives** — Help improve the scanner

---

## Next Steps

- **[Detection Details](detection-details.md)** — Scoring algorithm
- **[Security Scoring](detection-details.md)** — Risk calculation
- **[Dynamic Testing](../scanning/dynamic-testing.md)** — How tests work
