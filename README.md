# WebSecScan

[![GitHub License](https://img.shields.io/github/license/Pranavraut033/WebSecScan?style=flat-square)](https://github.com/Pranavraut033/WebSecScan/blob/main/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/Pranavraut033/WebSecScan?style=flat-square)](https://github.com/Pranavraut033/WebSecScan/releases)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0-green?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.x-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-online-success?style=flat-square)](https://pranavraut033.github.io/WebSecScan/)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://web-sec-scan.vercel.app)

🔒 **Automated Security Scanner for Web Application Vulnerabilities**

An open-source, rule-based web security scanner built with Next.js and TypeScript. Designed for developers, researchers, and security teams to identify common web vulnerabilities through static code analysis and dynamic behavioral testing.

**[Live Demo](https://web-sec-scan.vercel.app)** • **[Full Documentation](https://pranavraut033.github.io/WebSecScan/)** • **[Quick Start](#quick-start)**

---

## 🎯 What Is WebSecScan?

WebSecScan identifies web application vulnerabilities using:

- 📝 **Static Analysis** — Code patterns (JavaScript, HTML, dependencies)
- 🔍 **Dynamic Testing** — Runtime security checks (XSS, authentication, headers)
- 📊 **Security Scoring** — Risk-based 0-100 score with detailed breakdowns
- 🏆 **OWASP 2025 Mapping** — All findings classified by current vulnerability taxonomy

**Non-destructive, deterministic, and fully auditable.** No machine learning, no guessing—just reproducible security checks.

---

## ⭐ Key Features

- 📈 **Security Scoring** (0-100 scale, LOW/MEDIUM/HIGH/CRITICAL risk levels)
- 🔄 **Static & Dynamic Analysis** (choose one or both)
- 🏅 **OWASP Top 10 2025** Vulnerability categorization
- ⚡ **Real-time Scan Logs** via Server-Sent Events (SSE)
- 📚 **Scan History Tracking** (up to 20 scans per hostname)
- 🔐 **HTTP Security Headers Analysis** (CSP, HSTS, X-Frame-Options, etc.)
- 🍪 **Cookie Security Validation** (Secure, HttpOnly, SameSite attributes)
- 🔑 **Authenticated Scanning** (test security behind login barriers)
- 📋 **Raw Headers & Responses** (detailed diagnostic data)

See [Features Overview](docs/features.md) for comprehensive list.

---

## 🚀 Quick Start

### 🌐 Try the Live Demo

Visit **[https://web-sec-scan.vercel.app](https://web-sec-scan.vercel.app)** — no installation needed.

### 💻 Run Locally

```bash
# Clone & install
git clone https://github.com/Pranavraut033/WebSecScan.git
cd WebSecScan
npm install

# Set up database
npx prisma migrate dev

# Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Need help?** See [Installation Guide](docs/getting-started.md).

---

## 📁 Project Structure

```
WebSecScan/
├── src/
│   ├── app/              # Next.js App Router (UI & API)
│   ├── components/       # React components
│   ├── lib/              # Utilities (database, scoring, logging)
│   └── security/         # Analyzers (static, dynamic)
├── docs/                 # Full documentation (22+ guides)
├── test-fixtures/        # Intentionally vulnerable test apps
├── prisma/               # Database schema & migrations
└── __tests__/            # Test suite
```

---

## 📖 Documentation

### 🎓 Getting Started

| For... | Start Here |
|--------|-----------|
| **First-time users** | [Getting Started](docs/getting-started.md) |
| **Understanding features** | [Features Overview](docs/features.md) |
| **Production deployment** | [Deployment Guide](docs/deployment.md) |
| **Contributing code** | [Development Setup](docs/development/setup.md) |

### 🗺️ Full Learning Path

👉 **See [docs/index.md](docs/index.md) for complete navigation by role (users, developers, researchers, ops).**

### 🔗 Key Reference Docs

- [Architecture Overview](docs/architecture/overview.md) — System design
- [Scanning Methodology](docs/scanning/overview.md) — How static/dynamic analysis work
- [API Reference](docs/api/overview.md) — REST endpoints & Server Actions
- [OWASP 2025 Mapping](docs/security/owasp-2025.md) — Vulnerability categories
- [FAQ](docs/faq.md) — Common questions
- [Contributing Guide](docs/development/contributing.md) — How to contribute

---

## 🌍 Resources

| Resource | Link |
|----------|------|
| **Live Demo** | [https://web-sec-scan.vercel.app](https://web-sec-scan.vercel.app) |
| **GitHub** | [https://github.com/Pranavraut033/WebSecScan](https://github.com/Pranavraut033/WebSecScan) |
| **Documentation** | [https://pranavraut033.github.io/WebSecScan/](https://pranavraut033.github.io/WebSecScan/) |
| **Test Fixtures** | [https://github.com/Pranavraut033/WebSecScan-TestFixtures](https://github.com/Pranavraut033/WebSecScan-TestFixtures) |
| **Test Docker Image** | [https://github.com/Pranavraut033/WebSecScan-TestFixtures/pkgs/container/websecscan-test-fixtures](https://github.com/Pranavraut033/WebSecScan-TestFixtures/pkgs/container/websecscan-test-fixtures) |

---

<details>
<summary><strong>🔧 For Developers</strong> (click to expand)</summary>

### Clone & Test

```bash
# Clone with test fixtures
git clone --recurse-submodules https://github.com/Pranavraut033/WebSecScan.git
cd WebSecScan

# Run tests
npm test

# Lint & type-check
npm run lint
npm run build

# Use test fixtures
npm run docker:fixtures
npm run benchmark -- --target http://localhost:8081 --mode BOTH
```

### Common Commands

```bash
npx prisma migrate dev       # Create migrations
npx prisma studio           # View database
npm run dev                 # Development server
npm run build && npm start  # Production build
```

See [Development Setup](docs/development/setup.md) and [Contributing Guide](docs/development/contributing.md).

</details>

---

## 🐳 Docker

```bash
# Build
docker build -t websecscan .

# Run
docker run -p 3000:3000 websecscan

# Or use Docker Compose
docker-compose up
```

See [Deployment Guide](docs/deployment.md) for production setup.

---

## ⚖️ Legal & Ethics

⚠️ **Only scan systems you own or have explicit written permission to test.**

Unauthorized security testing may be illegal. WebSecScan is designed for:
- Testing your own applications
- Academic research on authorized targets
- Security education in controlled environments

See [Security & Ethics](docs/security/ethics-and-authorization.md) for details.

---

## 🤝 Contributing

We welcome contributions! Please:

1. Review [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
2. See [Contributing Guide](docs/development/contributing.md) for process
3. Ensure all PRs pass: `npm run lint && npm run build && npm test`

---

## ℹ️ Status

**Status**: Active Development  
**Latest Version**: 2.0.0  
**Updated**: January 2026

---

**🚀 Ready to scan?** Start with the [Getting Started Guide](docs/getting-started.md) or try the [Live Demo](https://web-sec-scan.vercel.app)
