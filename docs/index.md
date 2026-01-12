# WebSecScan

**Open-Source Web Security Scanner for Academic Research**

WebSecScan is a modular, deterministic web vulnerability scanner built with Next.js and TypeScript. Designed for security research, education, and ethical penetration testing, it provides rule-based detection of common web vulnerabilities aligned with OWASP Top 10 2025.

## Key Features

- ✅ **Static Analysis** — JavaScript/TypeScript and HTML security analysis
- ✅ **Dynamic Testing** — Safe, non-destructive runtime vulnerability detection
- ✅ **Library Scanning** — Known vulnerability detection in dependencies
- ✅ **OWASP 2025 Aligned** — Up-to-date vulnerability categorization
- ✅ **Authenticated Scanning** — Session-based testing capabilities
- ✅ **Real-time Logging** — Live scan progress with Server-Sent Events (SSE)
- ✅ **Deterministic Results** — Reproducible, auditable findings

## Who Is This For?

- **Graduate Students** building security tools for thesis work
- **Security Researchers** studying vulnerability detection methodologies
- **Educators** teaching web security concepts with real code examples
- **Developers** learning secure coding practices

## Project Philosophy

WebSecScan emphasizes:

1. **Transparency** — All detection logic is rule-based and auditable
2. **Reproducibility** — Scans produce consistent, deterministic results
3. **Safety** — Non-destructive testing with explicit permission checks
4. **Education** — Clear documentation suitable for learning

This is an **academic research tool**, not a commercial product. It prioritizes correctness and clarity over speed or comprehensive coverage.

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Next.js | 16.1.0 |
| **Language** | TypeScript | 5.x (strict mode) |
| **Runtime** | Node.js | ≥18.x |
| **Database** | Prisma ORM | Latest |
| **Browser Testing** | Playwright | Latest |
| **HTML Parsing** | Cheerio | Latest |
| **UI** | React 19 + Tailwind CSS | Latest |
| **Testing** | Node Test Runner | Built-in |

## Quick Start

### For Users

1. **[Installation & First Scan](getting-started.md)** — Get the scanner running locally (5 minutes)
2. **[Features Overview](features.md)** — Understand what the scanner can do
3. **[Security & Ethics](security/ethics-and-authorization.md)** — Legal guidelines and authorization requirements
4. **[Deployment](deployment.md)** — Set up in production

### For Developers

1. **[Architecture Overview](architecture/overview.md)** — Understand system design
2. **[How Scanning Works](scanning/overview.md)** — Scan modes and methodology
3. **[API Reference](api/overview.md)** — REST API and Server Actions
4. **[Development Setup](development/setup.md)** — Configure your environment
5. **[Testing Guide](development/testing.md)** — Write and run tests
6. **[Contributing](development/contributing.md)** — Submit pull requests

### For Researchers

1. **[OWASP 2025 Mapping](security/owasp-2025.md)** — Vulnerability categorization and 2021→2025 migration
2. **[Static Analysis Rules](scanning/static-analysis.md)** — JavaScript/HTML detection patterns
3. **[Dynamic Testing Methodology](scanning/dynamic-testing.md)** — Safe testing approach for runtime vulnerabilities
4. **[Reducing False Positives](security/reducing-false-positives.md)** — Confidence scoring and accuracy
5. **[Academic References](references.md)** — OWASP, security standards, research papers

### For Operations

1. **[Deployment Guide](deployment.md)** — Docker, Docker Compose, manual setup
2. **[Security & Ethics](security/ethics-and-authorization.md)** — Legal and audit logging
3. **[FAQ](faq.md)** — Common deployment questions

## ⚠️ Legal & Ethical Notice

**Only scan systems you own or have explicit written permission to test.**

Unauthorized security testing may be illegal. WebSecScan is designed for:

- Testing your own applications
- Academic research on authorized targets
- Security education in controlled environments

See [Security & Ethics](security/ethics-and-authorization.md) for detailed guidelines.

## Core Concepts

### Scan Modes

WebSecScan operates in three modes:

| Mode | What it does | Speed | Coverage |
|------|------------|-------|----------|
| **Static Only** | Analyzes source code patterns | Very Fast | Broad |
| **Dynamic Only** | Runtime testing via HTTP requests | Moderate | Deep |
| **Both** | Combined analysis | Moderate-Slow | Comprehensive |

### Vulnerability Categories

All findings are classified using **OWASP Top 10 2025**:

- **A01:2025** — Broken Access Control (includes SSRF)
- **A02:2025** — Cryptographic Failures
- **A03:2025** — Software Supply Chain Failures
- **A04:2025** — Cryptographic Failures
- **A05:2025** — Injection (SQL, Command, XPath)
- **A06:2025** — Insecure Design
- **A07:2025** — Authentication Failures
- **A08:2025** — Software or Data Integrity Failures
- **A09:2025** — Security Logging and Alerting Failures
- **A10:2025** — Mishandling of Exceptional Conditions

See [OWASP 2025 Mapping](security/owasp-2025.md) for complete reference.

## Documentation

| Section | Purpose |
|---------|---------|
| **Getting Started** | Installation, first scan, basic usage |
| **Features** | Overview of capabilities and features |
| **Architecture** | System design, components, request flow |
| **Scanning** | How static/dynamic analysis works |
| **Security** | OWASP taxonomy, ethics, detection details |
| **API** | REST endpoints and Server Actions |
| **Development** | Setup, testing, contributing guidelines |
| **Deployment** | Production setup and configuration |
| **References** | Academic sources and standards |
| **FAQ** | Common questions and troubleshooting |

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/Pranavraut033/WebSecScan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Pranavraut033/WebSecScan/discussions)
- **Documentation**: You're reading it!

## Contributing

Contributions are welcome! See [Contributing Guide](development/contributing.md) for:

- Code standards and requirements
- Testing and documentation expectations
- Pull request process
- Mandatory project rules

## Project Status

**Status**: Active Development  
**Latest Version**: 2.0.0  
**Last Updated**: January 2026

---

**Ready to start?** Head to [Getting Started](getting-started.md) →
