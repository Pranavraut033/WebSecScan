# WebSecScan

**Open-Source Web Security Scanner for Academic Research**

WebSecScan is a modular, deterministic web vulnerability scanner built with Next.js and TypeScript. Designed for security research, education, and ethical penetration testing, it provides rule-based detection of common web vulnerabilities aligned with OWASP Top 10 2025.

## Key Features

- ✅ **Static Analysis** - JavaScript/TypeScript and HTML security analysis
- ✅ **Dynamic Testing** - Safe, non-destructive runtime vulnerability detection
- ✅ **Library Scanning** - Known vulnerability detection in dependencies
- ✅ **OWASP 2025 Aligned** - Up-to-date vulnerability categorization
- ✅ **Authenticated Scanning** - Session-based testing capabilities
- ✅ **Real-time Logging** - Live scan progress with SSE
- ✅ **Deterministic Results** - Reproducible, auditable findings

## Who Is This For?

- **Graduate Students** building security tools for thesis work
- **Security Researchers** studying vulnerability detection
- **Educators** teaching web security concepts
- **Developers** learning secure coding practices

## Quick Links

- **[Getting Started Guide](getting-started.md)** - Install and run your first scan
- **[Features Overview](features.md)** - Understand scanner capabilities
- **[Architecture](architecture.md)** - Learn system design
- **[Security Ethics](security/security-ethics.md)** - Ethical scanning guidelines

## Project Philosophy

WebSecScan emphasizes:

1. **Transparency** - All detection logic is rule-based and auditable
2. **Reproducibility** - Scans produce consistent, deterministic results
3. **Safety** - Non-destructive testing with explicit permission checks
4. **Education** - Clear documentation suitable for learning

This is an academic research tool, not a commercial product. It prioritizes correctness and clarity over speed or marketing claims.

## Legal Notice

⚠️ **Only scan systems you own or have explicit written permission to test.**

Unauthorized security testing may be illegal. See [Security & Ethics](security/security-ethics.md) for detailed guidelines.

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **Testing**: Playwright, Node Test Runner
- **UI**: React 19, Tailwind CSS

## Contributing

Contributions are welcome! See [Development Guide](development.md) for setup instructions and contribution guidelines.

## Support

- **Issues**: [GitHub Issues](https://github.com/Pranavraut033/WebSecScan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Pranavraut033/WebSecScan/discussions)
- **Documentation**: You're reading it!

---

**Ready to start?** Head to the [Getting Started Guide](getting-started.md) →
