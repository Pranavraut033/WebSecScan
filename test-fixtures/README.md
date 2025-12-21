# Test Fixtures

This directory contains intentionally vulnerable test applications and files used for testing the WebSecScan security scanner.

## Purpose

These fixtures are designed to:
1. Provide deterministic test cases for unit and integration tests
2. Demonstrate vulnerability detection capabilities
3. Validate scanner accuracy and completeness

## Structure

- `vulnerable-app.html` - Static HTML page with multiple security issues
- `vulnerable-script.js` - JavaScript file with dangerous patterns
- `insecure-package.json` - Package manifest with known vulnerable dependencies

## ⚠️ Security Warning

**DO NOT deploy these files to production or public servers.**

These files contain intentionally insecure code patterns for educational and testing purposes only. They are designed to be scanned locally for security vulnerabilities.

## Usage

Run tests against these fixtures:

```bash
npm test
```

Or scan manually:
```bash
# Start local server (if needed)
npx http-server test-fixtures -p 8080

# Scan in WebSecScan
Target URL: http://localhost:8080/vulnerable-app.html
```

## Vulnerabilities Included

The test fixtures include examples of:
- XSS via eval() and innerHTML
- Missing CSP headers
- Insecure forms
- Hardcoded secrets
- Vulnerable dependencies
- Missing security headers
- Insecure cookies
