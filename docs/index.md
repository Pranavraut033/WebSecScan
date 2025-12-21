# WebSecScan

<div align="center">
  <h2>Automated Web Application Security Scanner</h2>
  <p><strong>Detect common vulnerabilities before they become threats</strong></p>
</div>

---

## 🎯 Overview

**WebSecScan** is an automated, lightweight security scanner designed to identify common web application vulnerabilities through both static code analysis and dynamic behavioral testing. Built as an academic project, it empowers small to mid-sized development teams with enterprise-grade security scanning capabilities.

The tool systematically detects security issues aligned with the **OWASP Top 10 2025**, providing actionable insights and remediation guidance to help developers build more secure web applications.

---

## ✨ Key Features

- **🔍 Static Analysis**: Examine JavaScript/TypeScript and HTML source files for dangerous patterns
- **🌐 Dynamic Testing**: Safe, non-destructive runtime vulnerability detection
- **📦 Dependency Scanning**: Identify known vulnerabilities in third-party libraries
- **📊 Actionable Reports**: Developer-friendly vulnerability reports with clear remediation steps
- **🎨 Modern UI**: Clean, intuitive dashboard built with Next.js
- **🔒 Ethical & Safe**: Respects robots.txt, enforces rate limits, no destructive testing

---

## 🚀 Quick Links

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;">

<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
<h3 style="margin-top: 0;">🚀 Getting Started</h3>
<p>Install dependencies and run your first scan</p>
<p><a href="getting-started/">→ Quick Start Guide</a></p>
</div>

<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
<h3 style="margin-top: 0;">✨ Features</h3>
<p>Explore static analysis, dynamic testing, and dependency scanning</p>
<p><a href="features/">→ View Features</a></p>
</div>

<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
<h3 style="margin-top: 0;">🔍 What We Test</h3>
<p>Comprehensive coverage of OWASP Top 10 and security checks</p>
<p><a href="testing-coverage/">→ Testing Coverage</a></p>
</div>

<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
<h3 style="margin-top: 0;">🏗️ Architecture</h3>
<p>Understand the system design and component architecture</p>
<p><a href="architecture/">→ Architecture Guide</a></p>
</div>

<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
<h3 style="margin-top: 0;">💻 Development</h3>
<p>Contribute to the project with our development guide</p>
<p><a href="development/">→ Developer Guide</a></p>
</div>

<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
<h3 style="margin-top: 0;">📡 API Reference</h3>
<p>REST API endpoints and server actions documentation</p>
<p><a href="api/">→ API Docs</a></p>
</div>

</div>

---

## 🎓 Problem Statement

Web applications increasingly become targets for cyberattacks that exploit vulnerabilities such as:

- Cross-Site Scripting (XSS)
- SQL Injection
- Insecure Authentication
- Outdated Libraries with Known Vulnerabilities

While large organizations can afford dedicated security resources, small to mid-sized development teams often lack the expertise or tools to conduct comprehensive security evaluations. This gap results in widespread exposure of web applications to preventable attacks.

---

## 💡 Our Solution

WebSecScan provides:

1. **Automated Detection**: Both static code analysis and dynamic behavioral testing
2. **OWASP Alignment**: Checks based on the OWASP Top 10 2025
3. **Developer-Friendly**: Intuitive interface and actionable reports
4. **Workflow Integration**: Designed to fit naturally into development processes
5. **Accessibility**: Free, open-source tool for teams with limited security resources

---

## 🎯 Expected Outcomes

- **Practical Reports**: Actionable vulnerability reports that developers can immediately use
- **Security Awareness**: Promote secure coding practices across development teams
- **Risk Reduction**: Decrease prevalence of common vulnerabilities in web projects
- **Empowerment**: Enable teams with limited cybersecurity resources to improve security posture

---

## 📊 At a Glance

| Feature | Description |
|---------|-------------|
| **Framework** | Next.js (App Router) with TypeScript |
| **Database** | Prisma ORM with SQLite/PostgreSQL |
| **Static Analysis** | JavaScript/TypeScript & HTML pattern detection |
| **Dynamic Testing** | Safe XSS testing, crawler, auth checks |
| **Dependency Scanning** | NVD/CVE advisory checking |
| **Test Coverage** | Unit + Integration tests with deterministic fixtures |
| **Deployment** | Docker support, CI/CD ready |

---

## 🛡️ Security & Ethics

WebSecScan is built with strict ethical guidelines:

- ✅ Only scan assets you own or have explicit permission to test
- ✅ Non-destructive testing: no brute force, no DoS, no credential stuffing
- ✅ Respects robots.txt and enforces rate limits
- ✅ Transparent about what is tested and how

[Learn more about our security practices →](security-ethics.md)

---

## 📚 Documentation Structure

This documentation is organized into the following sections:

- **[Getting Started](getting-started.md)**: Installation, setup, and first scan
- **[Features](features.md)**: Detailed feature descriptions and capabilities
- **[What We Test](testing-coverage.md)**: Comprehensive testing coverage matrix
- **[Architecture](architecture.md)**: System design and technical architecture
- **[Scanning Agents](agents.md)**: Deep dive into scanning agents and their tasks
- **[Development](development.md)**: Development setup and contribution guide
- **[Testing](testing.md)**: Unit tests, integration tests, and test fixtures
- **[API Reference](api.md)**: REST API and Server Actions documentation
- **[Deployment](deployment.md)**: Docker and production deployment guide
- **[Security & Ethics](security-ethics.md)**: Ethical scanning practices and legal considerations

---

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](development.md) for:

- Project structure
- Coding standards
- Testing requirements
- Pull request process

---

## 📄 License

This is an academic project developed for educational purposes.

---

<div align="center">
  <p><strong>Built with ❤️ for a more secure web</strong></p>
</div>
