# WebSecScan Documentation

WebSecScan is an open-source, modular web security scanner designed for academic research, security education, and vulnerability assessment. Built on Next.js with TypeScript, it provides deterministic, rule-based detection of common web vulnerabilities aligned with OWASP Top 10 2025.

## 🎯 Purpose

This project serves as:

- **Academic Research Tool**: A foundation for studying web security scanning methodologies and vulnerability detection
- **Educational Resource**: A clear, well-documented codebase for students learning security engineering
- **Research Prototype**: An extensible platform for experimenting with security testing approaches
- **Ethical Testing Framework**: A safe, permission-based scanner for authorized security assessments

## 👥 Target Audience

- **Graduate Students**: Building or extending security tools for thesis projects
- **Security Researchers**: Investigating web vulnerability detection techniques
- **Educators**: Teaching practical web security concepts
- **Developers**: Learning secure coding practices through real-world examples

## 📚 Documentation Structure

### Core Documentation

| Document | Purpose |
|----------|---------|
| [getting-started.md](getting-started.md) | Installation, setup, and first scan |
| [features.md](features.md) | Complete feature overview |
| [architecture/overview.md](architecture/overview.md) | System design and technical details |
| [architecture/components.md](architecture/components.md) | Security scanning agents deep-dive |
| [api/overview.md](api/overview.md) | REST API and Server Actions reference |
| [deployment.md](deployment.md) | Production deployment guide |
| [development/contributing.md](development/contributing.md) | Contributing and development setup |
| [references.md](references.md) | Academic papers, standards, and resources |

### Security Topics

| Document | Purpose |
|----------|---------|
| [security/owasp-mapping.md](security/owasp-mapping.md) | OWASP Top 10 2025 category mapping |
| [security/authenticated-scans.md](security/authenticated-scans.md) | Session-based and authenticated scanning |
| [security/csrf-protection.md](security/csrf-protection.md) | CSRF token detection and validation |
| [security/header-security-enhancements.md](security/header-security-enhancements.md) | HTTP security header analysis |
| [security/url-normalization.md](security/url-normalization.md) | URL validation and canonicalization |
| [security/context-aware-confidence.md](security/context-aware-confidence.md) | Vulnerability confidence scoring |
| [security/false-positive-analysis.md](security/false-positive-analysis.md) | Reducing false positives |
| [security/scoring.md](security/scoring.md) | Security score calculation |
| [security/security-ethics.md](security/security-ethics.md) | Ethical scanning guidelines |

### Crawler System

| Document | Purpose |
|----------|---------|
| [crawler/crawler-design.md](crawler/crawler-design.md) | Crawler architecture and algorithms |
| [crawler/crawler-improvements.md](crawler/crawler-improvements.md) | Recent enhancements and roadmap |
| [crawler/real-time-logging.md](crawler/real-time-logging.md) | Live scan progress reporting |

### Testing & Evaluation

| Document | Purpose |
|----------|---------|
| [evaluation/testing.md](evaluation/testing.md) | Unit and integration test guide |
| [evaluation/testing-coverage.md](evaluation/testing-coverage.md) | Vulnerability detection coverage |
| [evaluation/benchmarking.md](evaluation/benchmarking.md) | Performance benchmarks and metrics |
| [evaluation/real-world-testing.md](evaluation/real-world-testing.md) | Testing against real applications |

## 🚀 Quick Start

If you're new to WebSecScan, start here:

1. **[Installation & Setup](getting-started.md)** - Get the scanner running locally
2. **[Features Overview](features.md)** - Understand what the scanner can do
3. **[Architecture Guide](architecture/overview.md)** - Learn how the system works
4. **[Running Your First Scan](getting-started.md#running-your-first-scan)** - Execute a basic security test

## 🔬 For Researchers

If you're conducting research or building upon this project:

- **[Agents Documentation](architecture/components.md)** - Understand scanning methodologies
- **[OWASP 2025 Mapping](security/owasp-mapping.md)** - Vulnerability categorization
- **[Benchmarking Guide](evaluation/benchmarking.md)** - Measure performance and accuracy
- **[Testing Coverage](evaluation/testing-coverage.md)** - Validate detection capabilities

## 🛠️ For Contributors

Contributing to the project:

- **[Development Setup](development/setup.md)** - Configure your environment
- **[Testing Guide](development/testing.md)** - Write and run tests
- **[API Reference](api/overview.md)** - Understand internal interfaces
- **[Security Ethics](security/ethics-and-authorization.md)** - Ethical scanning principles

## 📖 Building Documentation Locally

This documentation is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Serve with live reload
mkdocs serve

# Build static site
mkdocs build
```

Documentation will be available at http://localhost:8000

### Contributing to Docs

1. Edit Markdown files in the `docs/` directory
2. Test locally with `mkdocs serve`
3. Update `mkdocs.yml` navigation if adding new pages
4. Submit a pull request

**Guidelines:**
- Use clear, technical language appropriate for academic work
- Include code examples with proper syntax highlighting
- Add diagrams using Mermaid where helpful
- Reference OWASP standards and academic sources
- Keep content focused and avoid marketing language

## 🌐 Live Documentation

Production documentation: **https://pranavraut.github.io/WebSecScan/**

## 📝 Project Context

WebSecScan was developed as an academic project to explore deterministic web vulnerability detection without machine learning. It emphasizes:

- **Transparency**: All detection logic is rule-based and auditable
- **Reproducibility**: Tests produce consistent results across runs
- **Extensibility**: Modular architecture for adding new detection rules
- **Safety**: Non-destructive testing with explicit permission checks

This is a research tool, not a commercial product. It prioritizes clarity and correctness over speed or comprehensiveness.

## ⚠️ Legal & Ethical Notice

**Only scan systems you own or have explicit written permission to test.**

WebSecScan is designed for:
- Testing your own applications
- Academic research on authorized targets
- Security education in controlled environments

Unauthorized scanning may be illegal. See [security/ethics-and-authorization.md](security/ethics-and-authorization.md) for detailed guidelines.

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/Pranavraut033/WebSecScan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Pranavraut033/WebSecScan/discussions)
- **Contributing**: See [development/contributing.md](development/contributing.md)

## 📄 License

This project is open-source. See the root [LICENSE](../LICENSE) file for details.

---

**Last Updated**: January 2026  
**Documentation Version**: 1.0.0  
**Project Status**: Active Development

## 📦 Dependencies

- **mkdocs**: Static site generator
- **mkdocs-material**: Material Design theme
- **mkdocs-minify-plugin**: HTML/CSS/JS minification

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean previous builds
rm -rf site/

# Reinstall dependencies
pip install --upgrade mkdocs-material mkdocs-minify-plugin

# Build with verbose output
mkdocs build --verbose
```

### Broken Links

To check for broken links:

```bash
mkdocs build --strict
```

This will fail the build if there are any broken internal links.

## 📞 Need Help?

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **MkDocs Docs**: https://www.mkdocs.org/
- **Material Theme**: https://squidfunk.github.io/mkdocs-material/
