# Phase 2: Draft Research Report - WebSecScan

**Student Name:** Pranav Virendra Raut
**Course:** Project: Computer Science (DLMCSPCSP01)

---

## 1. Abstract

Web applications are increasingly targeted by cyberattacks exploiting vulnerabilities such as Cross-Site Scripting (XSS), SQL injection, and insecure configurations. While enterprise-grade security tools exist, they are often complex and cost-prohibitive for small to mid-sized development teams. **WebSecScan** is an automated, lightweight security scanner designed to bridge this gap. It combines static code analysis (SAST) with dynamic behavioral testing (DAST) to identify common vulnerabilities aligned with the OWASP Top 10. Built on a modern Next.js architecture, WebSecScan provides real-time security scoring, detailed vulnerability reports, and actionable remediation guidance. This report details the design, implementation, and testing of WebSecScan, demonstrating its capability to empower developers to integrate security checks directly into their workflow.

## 2. Introduction

### 2.1 Problem Statement
The rapid proliferation of web applications has expanded the attack surface for malicious actors. Vulnerabilities such as XSS, insecure authentication mechanisms, and outdated dependencies remain prevalent despite the availability of secure coding guidelines. A significant barrier to securing these applications is the lack of accessible, easy-to-use tools for smaller development teams who may lack dedicated security personnel. Existing solutions are often resource-intensive, difficult to configure, or require deep security expertise to interpret.

### 2.2 Motivation
The primary motivation for WebSecScan is to democratize web application security. By providing a tool that is easy to deploy and understand, we aim to shift security "left" in the development lifecycle. This allows developers to catch vulnerabilities early, reducing the cost and risk associated with security remediation in later stages.

## 3. Objectives

The project aims to achieve the following measurable outcomes:

1.  **Automated Vulnerability Detection**: Successfully identify common vulnerabilities (e.g., XSS, insecure headers, dangerous JS functions) with a high degree of accuracy.
2.  **Hybrid Analysis**: Implement both static analysis of source code and dynamic analysis of running applications.
3.  **Security Scoring**: Develop a quantifiable scoring system (0-100) based on industry standards (like Mozilla Observatory) to give immediate feedback on security posture.
4.  **Developer-Centric Reporting**: Generate clear, actionable reports with remediation steps, severity levels, and OWASP mappings.
5.  **Performance**: Ensure scans are lightweight and do not significantly impede the development workflow.

## 4. Related Work

Several tools exist in the web security domain:

*   **OWASP ZAP (Zed Attack Proxy)**: A widely used open-source DAST tool. While powerful, it can be complex for beginners and is often used by security professionals rather than developers.
*   **SonarQube**: A popular static analysis tool that includes security checks. It is comprehensive but can be heavy to set up and maintain for smaller projects.
*   **Burp Suite**: The industry standard for penetration testing. It is primarily a manual tool for security experts, with automated features available in the expensive enterprise version.

**WebSecScan** differentiates itself by focusing on simplicity and integration. It is built as a Next.js application that can be easily run locally or deployed, offering a "single pane of glass" for both static and dynamic checks without the steep learning curve of enterprise tools.

## 5. Technical Background

### 5.1 Static Application Security Testing (SAST)
SAST involves analyzing source code without executing it. WebSecScan uses pattern matching (Regex) and basic parsing to identify dangerous coding patterns, such as the use of `eval()`, `innerHTML` without sanitization, or hardcoded secrets. While Regex provides a lightweight and fast detection mechanism, it is important to note that it may produce more false positives compared to more complex Abstract Syntax Tree (AST) parsing, which understands the code's structure.

### 5.2 Dynamic Application Security Testing (DAST)
DAST involves interacting with a running application to find vulnerabilities. WebSecScan employs a crawler to discover endpoints and performs active tests like injecting safe XSS payloads and checking HTTP response headers for security configurations (CSP, HSTS, etc.).

### 5.3 OWASP Top 10
The Open Web Application Security Project (OWASP) Top 10 is a standard awareness document for developers and web application security. WebSecScan's rules are mapped to the **OWASP Top 10:2025** release candidate categories to ensure relevance. It should be noted that as a "release candidate," these categories represent the latest industry consensus but are subject to final refinement by the OWASP foundation. The 2025 categories are:

*   **A01:2025 - Broken Access Control**
*   **A02:2025 - Security Misconfiguration**
*   **A03:2025 - Software Supply Chain Failures**
*   **A04:2025 - Cryptographic Failures**
*   **A05:2025 - Injection**
*   **A06:2025 - Insecure Design**
*   **A07:2025 - Authentication Failures**
*   **A08:2025 - Software or Data Integrity Failures**
*   **A09:2025 - Security Logging & Alerting Failures**
*   **A10:2025 - Mishandling of Exceptional Conditions**

WebSecScan specifically targets categories such as **A02:2025 - Security Misconfiguration** (via header analysis), **A03:2025 - Software Supply Chain Failures** (via dependency checks), **A04:2025 - Cryptographic Failures** (via secret detection and HSTS checks), **A05:2025 - Injection** (via XSS testing and static analysis), and **A07:2025 - Authentication Failures** (via cookie analysis).

## 6. Methodology

### 6.1 System Architecture
WebSecScan is built using a modern web stack:
*   **Frontend**: Next.js (App Router) for the dashboard and reporting UI.
*   **Backend**: Next.js Server Actions and API Routes to handle scanning logic.
*   **Database**: Prisma ORM with a relational database (SQLite/PostgreSQL) to store scan history and results.
*   **Scanning Engine**: A modular system of "Agents" that perform specific security checks.

### 6.2 Scanning Agents
The core logic is divided into specialized agents:
*   **Static Analysis Agent**: Analyzes JS/TS and HTML files for insecure patterns.
*   **Dynamic Analysis Agent**: Crawls the target URL and performs runtime checks (headers, cookies, XSS).
*   **Dependency Analysis Agent**: Checks `package.json` for known vulnerable dependencies.

### 6.3 Scoring Algorithm
A custom scoring algorithm evaluates the results. It starts with a baseline score and deducts points for vulnerabilities based on severity (Critical, High, Medium, Low) while awarding points for positive security measures (e.g., strong CSP, HSTS enabled). This results in a final grade based on the following numerical thresholds:
*   **A+**: 135+ (Extra Credit)
*   **A**: 100 - 134
*   **B**: 85 - 99
*   **C**: 70 - 84
*   **D**: 50 - 69
*   **F**: 0 - 49

## 7. Implementation

The implementation follows a modular design to allow for easy extensibility.

### 7.1 Core Components
*   **`jsAnalyzer.ts`**: Implements regex-based detection for dangerous JavaScript APIs (`eval`, `setTimeout` with strings) and secret patterns (API keys).
*   **`htmlAnalyzer.ts`**: Scans HTML content for unsafe attributes and missing security meta tags.
*   **`dependencyAnalyzer.ts`**: Parses `package.json` files to identify known vulnerable dependencies and outdated packages.
*   **`crawler.ts`**: A lightweight crawler that respects `robots.txt` and maps out the application's structure.
*   **`headerAnalyzer.ts`**: Checks HTTP response headers against best practices (e.g., presence of `Strict-Transport-Security`, `Content-Security-Policy`).
*   **`scanLogger.ts`**: A real-time logging system using Server-Sent Events (SSE) to provide feedback to the user during the scan.

### 7.2 Data Model
Prisma is used to define the schema, including `Scan`, `Vulnerability`, and `ScanLog` models. This ensures structured data storage and easy retrieval for the history view.

### 7.3 User Interface
The UI is built with React components, providing a clean dashboard for initiating scans and viewing results. It includes visual indicators for severity and detailed cards for each finding with remediation advice.

## 8. Testing

Verification of the system is conducted through:

*   **Unit Tests**: Located in `__tests__/`, these tests verify the logic of individual analyzers (e.g., `jsAnalyzer.test.ts`, `htmlAnalyzer.test.ts`) using mock inputs to ensure deterministic detection.
*   **Integration Tests**: `integration.test.ts` runs a full scan against a controlled test fixture (`test-fixtures/vulnerable-app.html`) to verify the end-to-end flow from scanning to reporting.
*   **Test Fixtures**: A set of intentionally vulnerable files (`vulnerable-script.js`, `insecure-package.json`) are used to validate that the scanner correctly identifies known issues.

## 9. Timeline & Milestones

*   **Phase 1 (Conception)**: Problem definition, requirement gathering, and architectural design. (Completed)
*   **Phase 2 (Development)**: Implementation of core scanning engine, static and dynamic agents, database integration, and basic UI. (Current Status: Mostly Complete)
*   **Phase 3 (Finalization)**: Refinement of scoring algorithm, comprehensive testing, documentation, and final report generation. (Upcoming)

## 10. Conclusion

WebSecScan represents a practical approach to automated web security. By combining static and dynamic analysis in a developer-friendly package, it addresses the critical need for accessible security tools. The current implementation successfully detects a range of common vulnerabilities and provides actionable feedback. Future work will focus on expanding the rule set, improving the crawler's depth, and adding support for authenticated scanning.

## 11. Bibliography

1.  **OWASP Foundation**. "OWASP Top 10:2025". https://owasp.org/Top10/2025/
2.  **Mozilla**. "Mozilla Observatory". https://observatory.mozilla.org/
3.  **Next.js Documentation**. https://nextjs.org/docs
4.  **Prisma Documentation**. https://www.prisma.io/docs

---

**GitHub Repository**: [Link to your repository]
