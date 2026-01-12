# Archived Documentation Files

This directory contains documentation files that were archived during the documentation restructuring on January 11, 2026.

## Why These Files Were Archived

These files were created during the development and auditing process but are not part of the core documentation set. They contain:

- **Audit reports** - Historical code and documentation audits
- **Implementation summaries** - Snapshots of implementation progress
- **Evaluation quickstarts** - Temporary evaluation guides
- **Executive summaries** - Marketing-style summaries not suitable for academic docs
- **Migration notes** - One-time migration documentation
- **Index files** - Replaced by the new documentation structure

## Contents

### Audit Files
- `AUDIT-CHECKLIST.md` - Checklist used during code audits
- `AUDIT-INDEX.md` - Index of audit documents
- `AUDIT-SUMMARY.md` - Summary of audit findings
- `README-AUDIT.md` - Audit-specific README

### Comparison & Evaluation Tools
- `COMPARE-SCRIPT-AUDIT.md` - Analysis of comparison scripts
- `COMPARE-TOOL-GUIDE.md` - Guide for comparison tools
- `EVALUATION-QUICKSTART.md` - Quick evaluation guide (superseded)

### Implementation Documentation
- `IMPLEMENTATION-IMPROVEMENTS.md` - Historical improvement notes
- `IMPLEMENTATION-SUMMARY.md` - Implementation milestone summary
- `AUTHENTICATED-SCANNING-IMPLEMENTATION.md` - Implementation details (content merged into security/authenticated-scans.md)

### Design & Architecture
- `DATA-FLOW-DIAGRAMS.md` - Raw data flow diagrams (converted to Mermaid and integrated into architecture.md)
- `design-system.md` - UI design system (may be restored if needed)

### Migration & History
- `MIGRATION-SUMMARY.md` - OWASP 2021 to 2025 migration notes
- `CRAWLER-FIX-SUMMARY.md` - Historical crawler fixes
- `EXECUTIVE-SUMMARY.md` - Marketing-style summary

### Navigation
- `index.md` - Old index file (replaced by new index.md)

## What Was Kept

The following documentation was reorganized and kept:

### Core Docs (Root Level)
- README.md (rewritten)
- index.md (new welcome page)
- getting-started.md
- features.md
- architecture.md
- agents.md
- api.md
- deployment.md
- development.md
- references.md

### Security Subdirectory
- authenticated-scans.md
- csrf-protection.md
- header-security-enhancements.md
- url-normalization.md
- owasp-mapping.md
- context-aware-confidence.md
- false-positive-analysis.md
- scoring.md
- security-ethics.md

### Crawler Subdirectory
- crawler-design.md
- crawler-improvements.md
- real-time-logging.md

### Evaluation Subdirectory
- testing.md
- testing-coverage.md
- benchmarking.md
- real-world-testing.md

## Accessing Archived Content

If you need information from these archived files:

1. Browse this `_temp/` directory
2. Files are preserved exactly as they were
3. Consider whether the information should be integrated into the main docs

## Should These Be Deleted?

**Not yet.** These files are preserved for:

- Historical reference
- Recovery of any missed content
- Understanding the project's evolution

They can be safely deleted after:

- Verification that all useful content has been extracted
- A review period (suggested: 3-6 months)
- Team consensus

## Restructuring Summary

The documentation was restructured to:

1. **Separate concerns** - Security, crawler, and evaluation topics in subdirectories
2. **Remove redundancy** - Consolidated overlapping content
3. **Improve navigation** - Clear hierarchy with logical grouping
4. **Academic tone** - Professional, research-appropriate language
5. **Mermaid diagrams** - Converted diagrams to maintainable format

For details on the restructuring process, see the main [docs/README.md](../README.md).

---

**Archive Date**: January 11, 2026  
**Restructured By**: GitHub Copilot  
**Restructuring Instructions**: [.github/prompts/docs.prompt.md](../../.github/prompts/docs.prompt.md)
