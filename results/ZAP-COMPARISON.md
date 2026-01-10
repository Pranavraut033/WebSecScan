# WebSecScan vs OWASP ZAP - Comparative Analysis

**Date**: 2026-01-10
**Target**: https://juice-shop.herokuapp.com
**Scan Modes**: WebSecScan (BOTH) vs ZAP (Baseline)

## Executive Summary

| Tool | Total Findings | Critical | High | Medium | Low | Duration | URLs Scanned |
|------|---------------|----------|------|--------|-----|----------|--------------|
| **WebSecScan** | 8 | 1 | 4 | 2 | 1 | 2.67s | 0 |
| **OWASP ZAP** | 14 | 0 | 0 | 2 | 6 | 51.23s | 16 |

## Performance Comparison

- **Speed**: WebSecScan is 19.2x faster
- **Coverage**: ZAP discovered 16.0x more URLs
- **Critical Findings**: WebSecScan found 1, ZAP found 0 (baseline limitation)

## WebSecScan Findings

| OWASP Category | Count |
|----------------|-------|
| A05:2025 - Injection | 5 |
| A02:2025 - Security Misconfiguration | 2 |
| A04:2025 - Cryptographic Failures | 1 |

## OWASP ZAP Alerts

| Risk | Alert | Category | Instances |
|------|-------|----------|-----------|
| Medium | Content Security Policy (CSP) Header Not Set | Security Misconfiguration | 5 |
| Medium | Cross-Domain Misconfiguration | Security Misconfiguration | 5 |
| Low | Cross-Domain JavaScript Source File Inclusion | Security Misconfiguration | 5 |
| Low | Dangerous JS Functions | Security Misconfiguration | 2 |
| Low | Deprecated Feature Policy Header Set | Security Misconfiguration | 5 |
| Low | Insufficient Site Isolation Against Spectre Vulnerability | Security Misconfiguration | 10 |
| Low | Strict-Transport-Security Header Not Set | Security Misconfiguration | 5 |
| Low | Timestamp Disclosure - Unix | Security Misconfiguration | 5 |
| Informational | Information Disclosure - Suspicious Comments | Security Misconfiguration | 2 |
| Informational | Modern Web Application | Security Misconfiguration | 5 |
| Informational | Non-Storable Content | Security Misconfiguration | 3 |
| Informational | Re-examine Cache-control Directives | Security Misconfiguration | 5 |
| Informational | Storable and Cacheable Content | Security Misconfiguration | 1 |
| Informational | Storable but Non-Cacheable Content | Security Misconfiguration | 5 |

## Conclusion

**WebSecScan Strengths:**
- ⚡ Significantly faster scan time
- 🎯 Deep code-level static analysis
- 🔴 Identifies critical vulnerabilities (e.g., eval, innerHTML)
- 🪶 Lightweight with minimal memory footprint

**OWASP ZAP Strengths:**
- 🕷️ Superior crawling and URL discovery
- 📋 Comprehensive passive security checks
- 🏭 Industry-standard, mature tooling
- 🛡️ Extensive ruleset with diverse finding types

**Recommendation:** Use both tools for complementary coverage. WebSecScan for fast development feedback, ZAP for comprehensive security validation.
