- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements

- [x] Scaffold the Project

- [x] Customize the Project

- [x] Install Required Extensions

- [x] Compile the Project

- [x] Create and Run Task

- [x] Launch the Project

- [x] Ensure Documentation is Complete

# Copilot / Contributor Instructions

This file is a project-specific checklist for contributors (including Copilot automation guidance). Follow these rules strictly to preserve security, determinism, and evaluability.

- ✅ Verify this file exists and is up-to-date before starting work.

## Mandatory Project Rules

- **Do NOT generate placeholder logic** that returns fake vulnerabilities; implement deterministic rule checks and unit tests.
- **Do NOT skip validation.** All inputs (target URLs, request payloads, CLI args) must be validated and sanitized server-side.
- Use **TypeScript (strict mode)** everywhere. Avoid `any` unless justified and documented.
- **Server-only scanning**: All scanning logic must execute exclusively on the server (Server Actions or API routes). The client UI must never run scanners.
- Follow **OWASP terminology** exactly for categories and severity mapping.
- Separate scanning logic into small modules; avoid large monolithic files.
- Add **clear comments** explaining why a finding is risky and how remediation reduces risk.
- Use Prisma types by importing from '@prisma/client', e.g., `import { Prisma, ScanResult, TrendingSite } from '@prisma/client'`

## Tests & CI

- Each agent rule must include unit tests with deterministic inputs and expected outputs.
- Add integration tests that run a small static scan against an intentionally insecure fixture app in `test-fixtures/`.
- CI must run type-checks, linters, and tests before merging.

## PR Checklist

- Type-checked (tsc --noEmit)
- Linted (eslint)
- Tests added & passing
- Relevant docs updated (`README.md`, `agents.md`, `tasks.md`)
- No hardcoded secrets or credentials

## Ethical & Safety Notes

- Only scan systems you own or have explicit permission to test.
- Dynamic checks must be safe and non-destructive (no brute force, no DoS, no credential stuffing).

## Communication

- Keep messages concise and focused.
- When significant changes are made (new rules, major refactors), update this checklist and notify maintainers.

_Adherence to these instructions is required for contributions to the academic project._
