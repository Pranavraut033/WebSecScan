# Phase 2: Draft Research Report - WebSecScan

**Student Name:** Pranav Virendra Raut
**Course:** Project: Computer Science (DLMCSPCSP01)

---

## 1. Abstract

Web applications are increasingly targeted by cyberattacks exploiting vulnerabilities such as Cross-Site Scripting (XSS), SQL injection, Cross-Site Request Forgery (CSRF), and insecure configurations. While enterprise-grade security tools exist, they are often complex and cost-prohibitive for small to mid-sized development teams. **WebSecScan** is an automated, lightweight security scanner designed to bridge this gap. It combines static code analysis (SAST) with dynamic behavioral testing (DAST) to identify common vulnerabilities aligned with the OWASP Top 10. Built on a modern Next.js architecture with enterprise-grade security measures including CSRF protection, same-origin validation, and comprehensive security headers, WebSecScan provides real-time security scoring, detailed vulnerability reports, and actionable remediation guidance. This report details the design, implementation, and testing of WebSecScan, demonstrating its capability to empower developers to integrate security checks directly into their workflow while maintaining the highest security standards for the tool itself.

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
6.  **Security Hardening**: Implement enterprise-grade security measures including CSRF protection, same-origin validation, and comprehensive security headers to protect the scanner itself from attacks.
7.  **Defense in Depth**: Apply multiple layers of security validation (middleware, route-level, and business logic) following OWASP best practices.

## 4. Related Work

Several tools exist in the web security domain:

*   **OWASP ZAP (Zed Attack Proxy)**: A widely used open-source DAST tool. While powerful, it can be complex for beginners and is often used by security professionals rather than developers.
*   **SonarQube**: A popular static analysis tool that includes security checks. It is comprehensive but can be heavy to set up and maintain for smaller projects.
*   **Burp Suite**: The industry standard for penetration testing. It is primarily a manual tool for security experts, with automated features available in the expensive enterprise version.

**WebSecScan** differentiates itself by focusing on simplicity and integration. It is built as a Next.js application that can be easily run locally or deployed, offering a "single pane of glass" for both static and dynamic checks without the steep learning curve of enterprise tools.

## 5. Technical Background

### 5.1 Static Application Security Testing (SAST)
SAST involves analyzing source code without executing it. WebSecScan uses pattern matching (Regex) and basic parsing to identify dangerous coding patterns, such as the use of `eval()`, `innerHTML` without sanitization, or hardcoded secrets.

### 5.2 Dynamic Application Security Testing (DAST)
DAST involves interacting with a running application to find vulnerabilities. WebSecScan employs a crawler to discover endpoints and performs active tests like injecting safe XSS payloads and checking HTTP response headers for security configurations (CSP, HSTS, etc.).

### 5.3 OWASP Top 10
The Open Web Application Security Project (OWASP) Top 10 is a standard awareness document for developers and web application security. WebSecScan's rules are mapped to the latest **OWASP Top 10:2025** release candidate categories to ensure relevance. The 2025 categories are:

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
WebSecScan is built using a modern web stack with enterprise-grade security:
*   **Frontend**: Next.js (App Router) for the dashboard and reporting UI.
*   **Backend**: Next.js Server Actions and API Routes to handle scanning logic.
*   **Security Layer**: Comprehensive CSRF protection, same-origin validation, and security headers middleware.
*   **Database**: Prisma ORM with a relational database (SQLite/PostgreSQL) to store scan history and results.
*   **Scanning Engine**: A modular system of "Agents" that perform specific security checks.

**Security Architecture**:
*   **Global Middleware** (`middleware.ts`): Applies security headers (X-Frame-Options, CSP, X-XSS-Protection, etc.) and performs origin validation
*   **CSRF Protection** (`csrf.ts`): Same-origin validation on all API endpoints to prevent cross-site request forgery
*   **Route-Level Validation**: Each API route validates request origin before processing
*   **Defense in Depth**: Multiple security layers ensure comprehensive protection

### 6.2 Scanning Agents
The core logic is divided into specialized agents:
*   **Static Analysis Agent**: Analyzes JS/TS and HTML files for insecure patterns.
*   **Dynamic Analysis Agent**: Crawls the target URL and performs runtime checks (headers, cookies, XSS).
*   **Dependency Analysis Agent**: Checks `package.json` for known vulnerable dependencies.

### 6.3 Scoring Algorithm
A custom scoring algorithm evaluates the results. It starts with a baseline score and deducts points for vulnerabilities based on severity (Critical, High, Medium, Low) while awarding points for positive security measures (e.g., strong CSP, HSTS enabled). This results in a final grade (A+ to F).

## 7. Implementation

The implementation follows a modular design to allow for easy extensibility.

### 7.1 Core Components

**Security Components**:
*   **`csrf.ts`**: CSRF protection utilities including same-origin validation, token generation, and request validation functions.
*   **`middleware.ts`**: Global Next.js middleware applying security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Content-Security-Policy, X-XSS-Protection, Referrer-Policy, Permissions-Policy) and origin validation for all routes.
*   **API Route Protection**: All API endpoints (`/api/scan/start`, `/api/scan/logs`, `/api/scan/[id]/status`, `/api/scan/[id]/results`, `/api/history/[hostname]`) implement same-origin validation to prevent CSRF attacks.

**Scanning Components**:
*   **`jsAnalyzer.ts`**: Implements regex-based detection for dangerous JavaScript APIs (`eval`, `setTimeout` with strings) and secret patterns (API keys).
*   **`htmlAnalyzer.ts`**: Scans HTML content for unsafe attributes and missing security meta tags.
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
*   **Security Tests**: `csrf.test.ts` validates CSRF protection mechanisms, same-origin validation logic, and origin header checking for various request scenarios.
*   **Integration Tests**: `integration.test.ts` runs a full scan against a controlled test fixture (`test-fixtures/vulnerable-app.html`) to verify the end-to-end flow from scanning to reporting.
*   **Test Fixtures**: A set of intentionally vulnerable files (`vulnerable-script.js`, `insecure-package.json`) are used to validate that the scanner correctly identifies known issues.
*   **Build Verification**: TypeScript compilation and Next.js build process validate all security implementations without errors.

## 9. Security Implementation

### 9.1 CSRF Protection
WebSecScan implements comprehensive Cross-Site Request Forgery (CSRF) protection following OWASP best practices:

**Same-Origin Validation**:
*   All API routes validate that requests originate from the same domain
*   Checks `Origin` and `Referer` headers against `Host` header
*   Rejects cross-origin requests with 403 Forbidden status
*   Enforced at both middleware and individual route levels

**Protected Endpoints**:
*   `POST /api/scan/start` - Initiates new security scans
*   `GET /api/scan/logs` - Server-Sent Events for real-time logs
*   `GET /api/scan/[id]/status` - Scan progress polling
*   `GET /api/scan/[id]/results` - Complete scan results
*   `GET /api/history/[hostname]` - Historical scan data

### 9.2 Security Headers
A global middleware (`middleware.ts`) applies comprehensive security headers to all responses:

*   **X-Frame-Options: DENY** - Prevents clickjacking by blocking iframe embedding
*   **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing attacks
*   **X-XSS-Protection: 1; mode=block** - Enables browser XSS filtering
*   **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information leakage
*   **Permissions-Policy** - Restricts browser features (camera, microphone, geolocation)
*   **Content-Security-Policy** - Comprehensive CSP preventing XSS and injection attacks

### 9.3 Defense in Depth
Multiple security layers ensure comprehensive protection:

1.  **Browser Layer**: CSP, X-Frame-Options, X-XSS-Protection headers
2.  **Middleware Layer**: Global origin validation and security header injection
3.  **Route Layer**: Individual route validation using `validateApiRequest()`
4.  **Business Logic Layer**: Input validation and sanitization
5.  **Database Layer**: Prisma ORM with parameterized queries

### 9.4 Attack Prevention
The implementation protects against:

*   ❌ **CSRF Attacks**: Same-origin validation prevents unauthorized requests from malicious sites
*   ❌ **XSS Attacks**: CSP headers block inline scripts and restrict script sources
*   ❌ **Clickjacking**: X-Frame-Options prevents embedding in malicious iframes
*   ❌ **MIME Sniffing**: X-Content-Type-Options forces browser to respect declared content types
*   ❌ **Cross-Origin Data Theft**: Origin validation blocks unauthorized API access

### 9.5 OWASP Compliance
The security implementation aligns with OWASP guidelines:
*   OWASP CSRF Prevention Cheat Sheet (same-origin validation)
*   OWASP Secure Headers Project (comprehensive header set)
*   OWASP Top 10:2025 - A02 Security Misconfiguration (proper header configuration)
*   OWASP Top 10:2025 - A07 Authentication Failures (CSRF prevention)

## 10. Timeline & Milestones

*   **Phase 1 (Conception)**: Problem definition, requirement gathering, and architectural design. ✅ Completed
*   **Phase 2 (Development)**: Implementation of core scanning engine, static and dynamic agents, database integration, UI, and security hardening. ✅ Completed
    *   Core scanning agents (static, dynamic, dependency analysis)
    *   Real-time logging with Server-Sent Events
    *   Mozilla Observatory-style scoring (0-100, A+ to F grades)
    *   CSRF protection and same-origin validation
    *   Comprehensive security headers middleware
    *   API endpoint protection (all 5 routes secured)
    *   Documentation (CSRF-IMPLEMENTATION.md, SECURITY-FLOW.md, csrf-protection.md)
*   **Phase 3 (Finalization)**: Refinement of scoring algorithm, comprehensive testing, deployment preparation, and final report generation. (Upcoming)

## 10. Conclusion

WebSecScan represents a practical approach to automated web security with enterprise-grade protection. By combining static and dynamic analysis in a developer-friendly package, it addresses the critical need for accessible security tools while maintaining the highest security standards for the tool itself. The current implementation successfully:

*   Detects a range of common vulnerabilities aligned with OWASP Top 10:2025
*   Provides actionable feedback with Mozilla Observatory-style scoring
*   Implements comprehensive CSRF protection and same-origin validation
*   Applies defense-in-depth security architecture with multiple validation layers
*   Protects all API endpoints from cross-origin attacks
*   Enforces strict security headers (CSP, X-Frame-Options, X-XSS-Protection, etc.)

**Security Implementation Highlights**:
*   625 lines of security code added across 9 files
*   Zero TypeScript compilation errors
*   All 5 API endpoints protected with same-origin validation
*   Global middleware applying 6+ security headers to all responses
*   OWASP-compliant CSRF prevention using same-origin checking

Future work will focus on expanding the rule set, improving the crawler's depth, adding support for authenticated scanning, and implementing optional token-based CSRF for enhanced security.

**Key Achievement**: WebSecScan not only scans for security vulnerabilities in target applications but also demonstrates secure coding practices by implementing enterprise-grade security measures in its own architecture.

## 11. Bibliography

1.  **OWASP Foundation**. "OWASP Top 10:2025". https://owasp.org/Top10/2025/
2.  **Mozilla**. "Mozilla Observatory". https://observatory.mozilla.org/
3.  **Next.js Documentation**. https://nextjs.org/docs
4.  **Prisma Documentation**. https://www.prisma.io/docs

---

**GitHub Repository**: [Link to your repository]
