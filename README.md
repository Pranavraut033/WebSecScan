# WebSecScan

An Automated Security Scanner for Web Application Vulnerabilities

## Problem Statement

As web applications proliferate, they increasingly become targets for cyberattacks that exploit vulnerabilities such as SQL injection, Cross-Site Scripting (XSS), insecure authentication, and outdated libraries. While large organizations can afford dedicated security resources, small to mid-sized development teams often lack the expertise or tools to conduct comprehensive security evaluations. This gap results in widespread exposure of web applications to preventable attacks, posing risks to both users and businesses.

## Proposed Solution

The project will develop WebSecScan, an automated, lightweight security scanner tailored to identify common web application vulnerabilities. By leveraging both static code analysis (examining source files like HTML and JavaScript) and dynamic behavioral analysis of web applications, WebSecScan will systematically detect issues using recognized vulnerability databases (such as the OWASP Top 10). The tool will feature an intuitive interface to facilitate adoption and integration within typical development workflows, empowering teams to incorporate security checks early and often.

## Expected Outcome

WebSecScan will yield practical, actionable vulnerability reports that developers can use to enhance the security of their applications before deployment. By lowering technical barriers and automating security analysis, the tool is expected to promote secure coding practices, reduce the prevalence of common vulnerabilities across web projects, and contribute to a more secure web ecosystem, especially benefiting teams with limited cybersecurity resources.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open http://localhost:3000 to view the UI.

---

## API & Server Actions
- POST `/api/scan/start` — start a new scan (server-side only).
- GET  `/api/scan/:id/status` — poll scan status.
- GET  `/api/scan/:id/results` — fetch results.

Server Actions used for trusted operations: createScan(), runStaticAnalysis(), runDynamicAnalysis(), generateReport().

> All scanning logic runs on the server. The client UI must only request scans; it must not execute scanning code.

---

## Security & Ethical Constraints
- Only scan assets you own or have explicit permission to test.
- Dynamic checks are safe and non-destructive: no brute force, no DoS, no credential stuffing, and no chained exploit payloads.

---

## Contributing
- Follow the checklist in `.github/copilot-instructions.md`.
- Ensure all new checks include tests and documentation.
- CI must pass type-checks, linters, and tests.

---

## Acceptance Criteria
- Detects vulnerabilities in intentionally insecure fixtures
- Results stored and retrievable from Prisma
- Clear UI presentation and remediation advice
- Deterministic output for the same input

---

For detailed architecture, see `project-specifications.md`. 

## Docker Setup

To run with Docker:

```bash
docker build -t websecscan .
docker run -p 3000:3000 websecscan
```

## Agents

See [agents.md](agents.md) for details on the scanning agents.

## Tasks

See [tasks.md](tasks.md) for agent task definitions.
