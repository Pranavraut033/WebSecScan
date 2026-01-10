# WebSecScan Benchmark & Comparison Results

This directory contains benchmark results and comparative analysis between WebSecScan and OWASP ZAP.

## Quick Start

### Automated Comparison (Recommended)

Run both WebSecScan and OWASP ZAP scans automatically:

```bash
# Start Juice Shop
docker-compose up -d juice-shop

# Run full automated comparison
npm run compare -- --all

# Interactive mode (prompts for URL if target not reachable)
npm run compare -- --all --interactive

# Custom output directory
npm run compare -- --all --output results/my-scan
```

**What it does:**
1. ✅ Checks if target (default: http://localhost:3001) is reachable
2. ✅ Runs WebSecScan STATIC scan
3. ✅ Runs WebSecScan DYNAMIC scan
4. ✅ Runs WebSecScan BOTH (combined) scan
5. ✅ Runs OWASP ZAP baseline scan (if Docker available)
6. ✅ Generates comparison reports between all scan modes
7. ✅ Generates WebSecScan vs ZAP comparative analysis
8. ✅ Exports metrics to CSV for further analysis

**Generated Files:**
- `static-report.md`, `dynamic-report.md`, `both-report.md` - WebSecScan individual scan reports
- `static-raw.json`, `dynamic-raw.json`, `both-raw.json` - Raw WebSecScan results
- `comparison-report.md` - Comparison between WebSecScan modes (STATIC vs DYNAMIC vs BOTH)
- `ZAP-COMPARISON.md` - **WebSecScan vs OWASP ZAP comparative analysis**
- `zap-baseline.json` - OWASP ZAP raw results (JSON format)
- `zap-baseline-report.html` - OWASP ZAP HTML report
- `zap-baseline.xml` - OWASP ZAP XML report
- `metrics-summary.csv` - CSV export of all metrics

### Single WebSecScan Scan

Run a single WebSecScan scan without comparison:

```bash
npm run benchmark -- --target http://localhost:3001 --mode BOTH
```

## Interactive Mode

If Juice Shop is not running or you want to scan a different target:

```bash
# Interactive prompt for target URL
npm run compare -- --all --interactive

# Or specify target directly
npm run compare -- --all --target http://example.com
```

The script will:
- Check if the target is reachable
- Prompt for a different URL if unreachable
- Show clear error messages if target cannot be reached

## Structure

```
results/
├── README.md                    # This file
├── juice-shop/                  # Juice Shop scan results (example)
│   ├── ZAP-COMPARISON.md       # ✨ WebSecScan vs ZAP analysis
│   ├── comparison-report.md    # WebSecScan mode comparison
│   ├── static-report.md        # STATIC scan detailed report
│   ├── dynamic-report.md       # DYNAMIC scan detailed report
│   ├── both-report.md          # BOTH scan detailed report
│   ├── static-raw.json         # STATIC raw results
│   ├── dynamic-raw.json        # DYNAMIC raw results
│   ├── both-raw.json           # BOTH raw results
│   ├── metrics-summary.csv     # CSV metrics export
│   ├── zap-baseline.json       # ZAP raw JSON results
│   ├── zap-baseline.xml        # ZAP raw XML results
│   └── zap-baseline-report.html # ZAP HTML report
└── zap/                        # ZAP configuration
    └── zap.yaml                # ZAP automation config
```

## Command Options

### Compare Script (Automated)

```bash
npm run compare -- [options]

Options:
  --all                    Run all scans (STATIC + DYNAMIC + BOTH + ZAP) [DEFAULT]
  --target <url>           Target URL (default: http://localhost:3001)
  --static                 Run WebSecScan STATIC scan only
  --dynamic                Run WebSecScan DYNAMIC scan only
  --both                   Run WebSecScan BOTH (combined) scan only
  --zap                    Run OWASP ZAP baseline scan only
  --output <dir>           Output directory (default: ./results)
  --zap-timeout <min>      ZAP scan timeout in minutes (default: 5)
  --zap-max-duration <min> ZAP spider max duration (default: 2)
  --interactive, -i        Prompt for target URL at runtime
  --help                   Show help message
```

### Benchmark Script (Single Scan)

```bash
npm run benchmark -- [options]

Options:
  --target <url>        Target URL (default: http://localhost:3001)
  --mode <mode>         Scan mode: STATIC, DYNAMIC, or BOTH (default: BOTH)
  --output <file>       Save results to JSON file
  --max-depth <n>       Maximum crawl depth (default: 2)
  --max-pages <n>       Maximum pages to crawl (default: 50)
  --rate-limit <ms>     Rate limit between requests (default: 1000)
  --help                Show help message
```

## Understanding the Reports

### ZAP-COMPARISON.md (Auto-generated)
Comprehensive comparison between WebSecScan and OWASP ZAP:
- Executive summary with metrics table
- Performance comparison (speed, coverage, memory)
- Finding overlap analysis
- Unique detections from each tool
- Strengths and weaknesses
- Use case recommendations

### comparison-report.md
Comparison between WebSecScan scan modes:
- STATIC vs DYNAMIC vs BOTH
- Finding distribution by mode
- Category overlap
- Performance metrics

### Individual Reports (*-report.md)
Detailed findings for each scan mode:
- Severity distribution
- OWASP Top 10 category breakdown
- Specific vulnerability details
- Remediation guidance

## Troubleshooting

### "Target not reachable" Error

```bash
# Check if Juice Shop is running
curl http://localhost:3001

# Start Juice Shop if not running
docker-compose up -d juice-shop

# Wait for Juice Shop to be ready (30-60 seconds)
docker-compose logs -f juice-shop

# Try interactive mode
npm run compare -- --all --interactive
```

### "ZAP not available" Warning

```bash
# Pull ZAP Docker image
docker pull ghcr.io/zaproxy/zaproxy:stable

# Verify image exists
docker images | grep zaproxy

# Alternative: Skip ZAP scan
npm run compare -- --static --dynamic --both
```

## Ethical & Safety Notes

⚠️ **Important:**
- Only scan systems you own or have explicit written permission to test
- Never scan production systems without proper authorization
- Respect rate limits and avoid causing denial of service
- Dynamic tests are safe and non-destructive by design

## References

- [Benchmarking Documentation](../docs/benchmarking.md)
- [OWASP Juice Shop](https://github.com/juice-shop/juice-shop)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)

---

**Last Updated:** January 2026  
**Status:** Automated comparison fully functional

Example Python analysis:

```python
import pandas as pd
import matplotlib.pyplot as plt

# Load metrics
df = pd.read_csv('results/juice-shop/metrics-summary.csv')

# Plot severity distribution
df[['Critical', 'High', 'Medium', 'Low']].plot(kind='bar', stacked=True)
plt.title('Vulnerability Severity Distribution by Scan Mode')
plt.xlabel('Scan Mode')
plt.ylabel('Finding Count')
plt.show()

# Calculate false-positive rate
fp_rate = df['False Positives'] / df['Total Findings']
print(f'Average FP Rate: {fp_rate.mean():.2%}')
```

## Git Ignore

By default, `results/` is gitignored to avoid committing large datasets. To track specific benchmarks:

```bash
git add -f results/juice-shop/comparison-report.md
git commit -m "Add baseline Juice Shop benchmark"
```
