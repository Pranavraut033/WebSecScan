# Evaluation Quick Start Guide

This guide walks you through running your first benchmark and evaluation of WebSecScan.

## Prerequisites

- Docker installed and running
- Node.js 18+ and npm installed
- WebSecScan project cloned and dependencies installed

```bash
git clone https://github.com/pranavraut/WebSecScan.git
cd WebSecScan
npm install
npm run migrate
```

## Step 1: Start Test Target (OWASP Juice Shop)

```bash
# Start Juice Shop container
npm run docker:juice-shop

# Verify it's running
curl http://localhost:3001
```

You should see the Juice Shop HTML response. The application will be available at `http://localhost:3001`.

## Step 2: Run Your First Benchmark

Run a comprehensive benchmark against Juice Shop:

```bash
npm run benchmark -- \
  --target http://localhost:3001 \
  --mode BOTH \
  --output results/juice-shop/first-run.json
```

This will:
- Run both STATIC and DYNAMIC analysis
- Collect comprehensive metrics (findings, coverage, performance)
- Save results to JSON file
- Display summary in terminal

**Expected output:**
```
=== Starting Benchmark ===
Target: http://localhost:3001
Mode: BOTH
...
=== Benchmark Complete ===
Duration: 45.23s
Total Findings: 42
  Critical: 3
  High: 12
  Medium: 18
  Low: 7
  Info: 2
Score: 58/100 (High Risk)
...
```

## Step 3: Run Comparison Analysis

Compare different scan modes:

```bash
npm run compare -- \
  --all \
  --target http://localhost:3001 \
  --output results/juice-shop
```

This will:
- Run STATIC, DYNAMIC, and BOTH scans
- Generate individual reports for each mode
- Create comparison report showing differences
- Export CSV summary for analysis

**Generated files:**
- `static-report.md` - Static analysis results
- `dynamic-report.md` - Dynamic analysis results
- `both-report.md` - Combined scan results
- `comparison-report.md` - Cross-mode comparison
- `metrics-summary.csv` - CSV export

## Step 4: Review Results

Open the comparison report:

```bash
cat results/juice-shop/comparison-report.md
```

Key metrics to review:
- **Finding overlap**: How many vulnerabilities detected by multiple modes?
- **Unique findings**: What does each mode uniquely detect?
- **Duration**: Performance differences between modes
- **Category coverage**: OWASP Top 10 coverage by mode

## Step 5: Validate Findings (Manual)

Randomly sample findings for false-positive validation:

1. Open the detailed report:
   ```bash
   cat results/juice-shop/both-report.md
   ```

2. Select 20% of findings from each severity level

3. For each finding:
   - Review the evidence snippet
   - Visit the URL in browser
   - Attempt safe proof-of-concept exploit
   - Document result (TP/FP/Inconclusive)

4. Calculate false-positive rate:
   ```
   FP Rate = False Positives / Total Validated
   ```

## Step 6: Compare with OWASP ZAP (Optional)

Start OWASP ZAP and run baseline scan:

```bash
# Start ZAP container
npm run docker:zap

# Run ZAP baseline scan
docker run -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://host.docker.internal:3001 \
  -r results/juice-shop/zap-baseline.html
```

Compare findings manually:
- Which vulnerabilities did both tools find?
- Which are unique to WebSecScan?
- Which are unique to ZAP?
- Severity correlation

## Step 7: Export for Analysis

Export metrics for statistical analysis:

```bash
# Metrics are already in CSV format
open results/juice-shop/metrics-summary.csv
```

Import into:
- **Excel/Google Sheets**: Pivot tables, charts
- **Python/Pandas**: Statistical analysis
- **R**: Regression analysis, visualization

Example Python analysis:

```python
import pandas as pd

# Load metrics
df = pd.read_csv('results/juice-shop/metrics-summary.csv')

# Summary statistics
print(df.describe())

# Compare modes
print("\nFindings by Mode:")
print(df[['Mode', 'Total Findings', 'Score', 'Risk Level']])

# Performance comparison
print("\nDuration (seconds):")
print(df[['Mode', 'Duration (s)']])
```

## Step 8: Document Your Findings

Create a summary report for your academic submission:

```markdown
# WebSecScan Evaluation Results

## Test Environment
- **Target**: OWASP Juice Shop v14.0
- **Date**: 2026-01-10
- **Configuration**: Default (maxDepth=2, maxPages=50, rateLimit=1000ms)

## Results Summary

### Finding Distribution
| Mode | Total | Critical | High | Medium | Low | Score |
|------|-------|----------|------|--------|-----|-------|
| STATIC | 28 | 2 | 8 | 12 | 6 | 65/100 |
| DYNAMIC | 31 | 3 | 10 | 14 | 4 | 61/100 |
| BOTH | 42 | 3 | 12 | 18 | 7 | 58/100 |

### Key Insights
- Combined mode (BOTH) detected 17 unique findings not found by individual modes
- Static analysis was 2.3x faster than dynamic analysis
- False-positive rate: 8.5% (based on 20% sample validation)

### Comparison with OWASP ZAP
- WebSecScan found 12 unique vulnerabilities related to dependency management
- ZAP found 8 unique vulnerabilities related to SQL injection variants
- Overlap: 22 common findings (52% agreement)
```

## Troubleshooting

### Juice Shop won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Stop any conflicting containers
docker stop $(docker ps -q --filter ancestor=bkimminich/juice-shop)

# Restart
npm run docker:juice-shop
```

### Benchmark fails with timeout
```bash
# Increase limits for larger applications
npm run benchmark -- \
  --target http://localhost:3001 \
  --mode BOTH \
  --max-pages 100 \
  --rate-limit 500 \
  --output results/juice-shop/large-run.json
```

### Out of memory
```bash
# Run modes separately
npm run benchmark -- --target http://localhost:3001 --mode STATIC
npm run benchmark -- --target http://localhost:3001 --mode DYNAMIC
```

## Next Steps

1. **Expand testing**: Run against WebGoat, DVWA, custom targets
2. **Analyze false positives**: Validate larger sample, identify patterns
3. **Optimize rules**: Adjust confidence thresholds based on FP analysis
4. **Track regressions**: Run benchmarks on code changes, monitor trends
5. **Academic documentation**: Include evaluation in final report

## Resources

- [Benchmarking Documentation](../docs/benchmarking.md)
- [Real-World Testing Guide](../docs/real-world-testing.md)
- [Security Scoring Methodology](../docs/scoring.md)
- [OWASP Juice Shop Challenges](https://pwning.owasp-juice.shop/)

---

_Happy Testing!_ 🔒
