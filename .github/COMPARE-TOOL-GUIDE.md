# WebSecScan Compare Tool - Quick Reference

## Overview

The `npm run compare` script now provides **automated comparison between WebSecScan and OWASP ZAP** scans.

## What Changed

### Before
- ❌ Only ran WebSecScan in different modes (STATIC/DYNAMIC/BOTH)
- ❌ No ZAP integration
- ❌ No target availability checking
- ❌ Manual ZAP scans required

### After
- ✅ Runs both WebSecScan **and** OWASP ZAP scans automatically
- ✅ Generates comprehensive comparison reports
- ✅ Checks if target is reachable before scanning
- ✅ Interactive mode prompts for URL if target unavailable
- ✅ Full ZAP integration via Docker or local installation

## Usage

### Default (All Scans)

```bash
# Runs: STATIC + DYNAMIC + BOTH + ZAP
npm run compare
```

### Interactive Mode (Recommended)

```bash
# Prompts for URL if Juice Shop isn't running
npm run compare -- --all --interactive
```

### Custom Options

```bash
# Specific scans
npm run compare -- --both --zap

# Custom target
npm run compare -- --all --target http://example.com

# Custom output directory
npm run compare -- --all --output results/my-scan

# ZAP timeout settings
npm run compare -- --all --zap-timeout 10 --zap-max-duration 5

# WebSecScan only (skip ZAP)
npm run compare -- --static --dynamic --both
```

## Generated Reports

### New: ZAP-COMPARISON.md ✨
Automatically generated comparison between WebSecScan and OWASP ZAP:
- Side-by-side metrics comparison
- Performance analysis (speed, coverage)
- Finding overlap analysis
- Tool strengths and weaknesses
- Recommendations for when to use each tool

### Existing Reports (Enhanced)
- `comparison-report.md` - WebSecScan mode comparisons
- `static-report.md`, `dynamic-report.md`, `both-report.md` - Individual scan reports
- `metrics-summary.csv` - CSV export of all metrics
- `zap-baseline.json` - ZAP raw results
- `zap-baseline-report.html` - ZAP HTML report

## Requirements

### WebSecScan (Always Required)
```bash
npm install
npm run migrate
```

### OWASP ZAP (Optional, for --zap flag)
```bash
# Option 1: Docker (Recommended)
docker pull ghcr.io/zaproxy/zaproxy:stable

# Option 2: Local installation
# Download from https://www.zaproxy.org/download/
```

### Test Target
```bash
# Start Juice Shop (default target)
docker-compose up -d juice-shop

# Or provide custom URL with --target
```

## How It Works

1. **Target Check**: Verifies target is reachable
   - If unreachable and `--interactive`: prompts for new URL
   - If unreachable and non-interactive: exits with error

2. **WebSecScan Scans**: Runs requested modes
   - STATIC: Code-level analysis
   - DYNAMIC: Runtime testing
   - BOTH: Combined analysis

3. **ZAP Scan** (if `--zap` or `--all`):
   - Checks if ZAP is available (Docker or local)
   - Runs baseline scan (passive + spider)
   - Parses results into standardized format

4. **Report Generation**:
   - Individual scan reports
   - Cross-mode comparisons
   - **WebSecScan vs ZAP comparative analysis**
   - CSV metrics export

## Error Handling

### Target Not Reachable
```
❌ Target http://localhost:3001 is not reachable!
Please ensure:
  - Juice Shop is running: docker-compose up -d juice-shop
  - Or provide a different target URL
```

**Solutions:**
- Start Juice Shop: `docker-compose up -d juice-shop`
- Use interactive mode: `npm run compare -- --all --interactive`
- Specify different target: `npm run compare -- --all --target http://other-url`

### ZAP Not Available
```
⚠️  OWASP ZAP is not available. Skipping ZAP scan.
Install ZAP: docker pull ghcr.io/zaproxy/zaproxy:stable
```

**Solutions:**
- Install ZAP: `docker pull ghcr.io/zaproxy/zaproxy:stable`
- Skip ZAP: `npm run compare -- --static --dynamic --both`

## Examples

### Academic Evaluation
```bash
# Full comparison for academic analysis
docker-compose up -d juice-shop
npm run compare -- --all --output results/evaluation

# View reports
open results/evaluation/ZAP-COMPARISON.md
open results/evaluation/comparison-report.md
```

### CI/CD Integration
```bash
# Fast development feedback (WebSecScan only)
npm run compare -- --both --output ci-results
```

### Research Comparison
```bash
# Compare against multiple targets
npm run compare -- --all --target http://localhost:3001 --output results/juice-shop
npm run compare -- --all --target http://localhost:8080 --output results/webgoat
npm run compare -- --all --target http://localhost:9000 --output results/dvwa
```

## Documentation Updates

- ✅ [results/README.md](../results/README.md) - Updated with automated comparison guide
- ✅ [docs/benchmarking.md](../docs/benchmarking.md) - Enhanced with ZAP integration
- ✅ [results/juice-shop/ZAP-COMPARISON.md](../results/juice-shop/ZAP-COMPARISON.md) - Marked as auto-generatable
- ✅ [scripts/compare.ts](../scripts/compare.ts) - Full ZAP integration implemented
- ✅ [src/lib/zapIntegration.ts](../src/lib/zapIntegration.ts) - New ZAP integration module

## Key Features

### 🎯 Automated Workflow
- One command runs everything
- No manual ZAP setup required
- Automatic report generation

### 🛡️ Safety First
- Target reachability checks
- Safe, non-destructive tests
- Ethical scanning guidelines

### 📊 Comprehensive Analysis
- Side-by-side tool comparison
- Performance metrics
- Finding overlap analysis
- Actionable recommendations

### 🚀 Developer Friendly
- Interactive mode for flexibility
- Clear error messages
- Detailed documentation
- CSV export for analysis

## Quick Commands Cheat Sheet

```bash
# Full automated comparison (default)
npm run compare

# With interactive prompt
npm run compare -- --all -i

# WebSecScan only
npm run compare -- --static --dynamic --both

# Just ZAP vs WebSecScan BOTH
npm run compare -- --both --zap

# Custom everything
npm run compare -- \
  --all \
  --target http://localhost:3001 \
  --output results/my-scan \
  --zap-timeout 10 \
  --zap-max-duration 5 \
  --interactive
```

## Next Steps

1. **Try it out:**
   ```bash
   docker-compose up -d juice-shop
   npm run compare -- --all --interactive
   ```

2. **View results:**
   ```bash
   open results/ZAP-COMPARISON.md
   ```

3. **Read documentation:**
   - [Benchmarking Guide](../docs/benchmarking.md)
   - [Results README](../results/README.md)

---

**Status:** ✅ Fully Implemented & Documented  
**Last Updated:** January 2026
