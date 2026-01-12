# Scan Results Verification Manifest

**Generated**: 2026-01-11T18:58:56.348Z
**Target**: http://localhost:3001
**Output Directory**: ./results

## Raw Result Files (For Manual Verification)

These files contain complete, unprocessed scan data for independent verification.

### WebSecScan STATIC Scan
- **File**: `static-raw.json`
- **Scan ID**: cmka3jar50000ibjtkaagu88v
- **Content**: Complete benchmark metrics including all findings
- **Verification**: Compare findings array against database records

### WebSecScan DYNAMIC Scan
- **File**: `dynamic-raw.json`
- **Scan ID**: cmka3jb030006ibjt1px26yqp
- **Content**: Complete benchmark metrics including crawler results
- **Verification**: Verify endpoints discovered match against crawl logs

### WebSecScan BOTH (Combined) Scan
- **File**: `both-raw.json`
- **Scan ID**: cmka3jh4r000jibjtciby2uks
- **Content**: Combined static + dynamic results
- **Verification**: Should be superset of STATIC and DYNAMIC findings

### OWASP ZAP Baseline Scan
- **Files**: `zap-baseline.json`, `zap-baseline.xml`, `zap-baseline-report.html`
- **Metrics**: `zap-baseline-metrics.json` (parsed metrics)
- **Content**: ZAP alerts and security findings
- **Verification**: Compare alerts against HTML report and XML export

## Report Files (Generated From Raw Data)

- `static-report.md` - Detailed report generated from static-raw.json
- `dynamic-report.md` - Detailed report generated from dynamic-raw.json
- `both-report.md` - Detailed report generated from both-raw.json
- `comparison-report.md` - WebSecScan mode comparison (category-based overlap detection)
- `ZAP-COMPARISON.md` - WebSecScan vs OWASP ZAP analysis

## Summary Data

- `metrics-summary.csv` - Tabular export of all scan metrics

## Data Integrity Notes

1. **Raw JSON files** contain complete, unmodified benchmark results
2. **Markdown reports** are generated from raw JSON and database records
3. **Overlap calculations** use category-based matching (see metrics.ts for logic)
4. **ZAP metrics** are extracted from official ZAP JSON output and re-validated
5. **All timestamps** are preserved from scan execution

## How to Verify Results

### Verify WebSecScan Raw Data:
```bash
# Check scan data in database
npx prisma studio
# Query scans table and compare with *-raw.json files
```

### Verify ZAP Results:
```bash
# Compare JSON, XML, and HTML outputs
jq . results/zap-baseline.json | head -50
# Open HTML report in browser
open results/zap-baseline-report.html
```

### Verify Comparison Logic:
```bash
# Compare raw JSON findings
jq '.findings | length' results/static-raw.json
jq '.findings | length' results/dynamic-raw.json
jq '.findings | length' results/both-raw.json
# Results in comparison-report.md should reflect these counts
```

