# API Reference

Complete API documentation for WebSecScan's REST API endpoints, Server Actions, and real-time logging.

---

## 🌐 REST API Endpoints

Base URL: `http://localhost:3000/api`

---

### 1. Start Scan

Initiates a new security scan.

**Endpoint**: `POST /api/scan/start`

**Request Body**:

```json
{
  "targetUrl": "https://example.com",
  "scanMode": "BOTH"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetUrl` | string | ✅ | URL to scan (HTTP/HTTPS only) |
| `scanMode` | enum | ✅ | `"STATIC"`, `"DYNAMIC"`, or `"BOTH"` |

**Validation Rules**:

- `targetUrl` must be valid HTTP/HTTPS URL
- Protocol auto-added if missing (defaults to HTTPS)
- Automatic HTTPS upgrade attempted for HTTP URLs
- HTTP-only sites flagged as security threats
- Private IPs (127.0.0.1, 192.168.x.x) allowed in dev only
- No embedded credentials in URL
- No link-local addresses (169.254.x.x)
- Redirects automatically detected and followed

**URL Normalization Process**:
1. Format validation (syntax, credentials check)
2. Protocol addition (defaults to `https://` if missing)
3. HTTPS upgrade test (if HTTP provided)
4. HTTP fallback (with security threat flagging)
5. Redirect detection (including www-redirects)
6. Connection validation

**Response** (200 OK):

```json
{
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "status": "RUNNING",
  "targetUrl": "https://example.com",
  "mode": "BOTH",
  "urlInfo": {
    "protocol": "https",
    "redirected": false,
    "redirectedTo": null,
    "isWwwRedirect": false,
    "warnings": [
      "Protocol not specified, defaulting to HTTPS"
    ],
    "securityThreats": []
  }
}
```

**Note**: After receiving the `scanId`, clients should redirect to `/scan/{scanId}` to view real-time logs and progress.

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `scanId` | string | Unique scan identifier (CUID) |
| `status` | string | `"RUNNING"` - scan initiated |
| `targetUrl` | string | Normalized URL being scanned |
| `mode` | string | Scan mode: `"STATIC"`, `"DYNAMIC"`, or `"BOTH"` |
| `urlInfo` | object | URL normalization details |
| `urlInfo.protocol` | string | Protocol used: `"http"` or `"https"` |
| `urlInfo.redirected` | boolean | Whether URL redirects |
| `urlInfo.redirectedTo` | string\|null | Final URL if redirected |
| `urlInfo.isWwwRedirect` | boolean | True if www ↔ non-www redirect detected |
| `urlInfo.warnings` | string[] | Normalization warnings |
| `urlInfo.securityThreats` | string[] | Detected security threats (e.g., `"INSECURE_PROTOCOL"`) |

**HTTP Security Threat Example**:

When an HTTP-only site is scanned:
```json
{
  "scanId": "clx...",
  "status": "RUNNING",
  "targetUrl": "http://insecure-site.com",
  "mode": "DYNAMIC",
  "urlInfo": {
    "protocol": "http",
    "redirected": false,
    "warnings": [
      "HTTPS not available, using HTTP"
    ],
    "securityThreats": [
      "INSECURE_PROTOCOL"
    ]
  }
}
```

The system automatically records this as a HIGH severity vulnerability in the scan results.

**Response** (201 Created - Legacy Format)**:

Some clients may still receive the older format:
```json
{
  "success": true,
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "targetUrl": "https://example.com",
  "scanMode": "BOTH",
  "status": "PENDING",
  "message": "Scan initiated successfully"
}
```

**Error Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

**Example Usage**:

```typescript
const response = await fetch('/api/scan/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUrl: 'example.com', // Protocol auto-added
    scanMode: 'BOTH'
  })
});

const data = await response.json();
console.log('Scan ID:', data.scanId);
console.log('Protocol:', data.urlInfo.protocol); // 'https'
console.log('Warnings:', data.urlInfo.warnings);

// Check for HTTP security threats
if (data.urlInfo.securityThreats.includes('INSECURE_PROTOCOL')) {
  console.warn('Site uses insecure HTTP protocol');
}
```

**URL Normalization Examples**:

```typescript
// Example 1: Protocol auto-addition
Input:  { targetUrl: 'example.com' }
Output: { targetUrl: 'https://example.com', urlInfo: { protocol: 'https', ... } }

// Example 2: HTTP to HTTPS upgrade
Input:  { targetUrl: 'http://example.com' }
Test:   Checks if https://example.com is accessible
Output: { targetUrl: 'https://example.com', warnings: ['HTTP URL upgraded to HTTPS'] }

// Example 3: HTTP fallback with threat detection
Input:  { targetUrl: 'http://legacy-site.com' }
Test:   HTTPS unavailable
Output: { 
  targetUrl: 'http://legacy-site.com',
  urlInfo: {
    protocol: 'http',
    securityThreats: ['INSECURE_PROTOCOL']
  }
}

// Example 4: Redirect detection
Input:  { targetUrl: 'example.com' }
Output: {
  targetUrl: 'https://example.com',
  urlInfo: {
    redirected: true,
    redirectedTo: 'https://www.example.com',
    isWwwRedirect: true
  }
}
```

---

### 2. Get Scan Status

Retrieve the current status of a scan.

**Endpoint**: `GET /api/scan/:id/status`

**URL Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Scan ID (CUID) |

**Response** (200 OK):

```json
{
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "status": "IN_PROGRESS",
  "targetUrl": "https://example.com",
  "scanMode": "BOTH",
  "startedAt": "2025-12-20T10:30:00.000Z",
  "progress": 45
}
```

**Status Values**:

- `PENDING`: Scan queued, not yet started
- `IN_PROGRESS`: Scan currently running
- `COMPLETED`: Scan finished successfully
- `FAILED`: Scan encountered an error

**Error Response** (404 Not Found):

```json
{
  "error": "Scan not found"
}
```

**Example Usage**:

```typescript
async function pollScanStatus(scanId: string) {
  const response = await fetch(`/api/scan/${scanId}/status`);
  const data = await response.json();
  
  if (data.status === 'IN_PROGRESS') {
    // Poll again in 2 seconds
    setTimeout(() => pollScanStatus(scanId), 2000);
  } else if (data.status === 'COMPLETED') {
    // Fetch results
    fetchResults(scanId);
  }
}
```

---

### 3. Get Scan Results

Retrieve complete scan results including all vulnerabilities.

**Endpoint**: `GET /api/scan/:id/results`

**URL Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Scan ID (CUID) |

**Query Parameters** (Optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `severity` | string | Filter by severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `owaspCategory` | string | Filter by OWASP category (e.g., `A05:2025-Injection`) |

**Response** (200 OK):

```json
{
  "scan": {
    "id": "clx1a2b3c4d5e6f7g8h9",
    "targetUrl": "https://example.com",
    "scanMode": "BOTH",
    "status": "COMPLETED",
    "startedAt": "2025-12-20T10:30:00.000Z",
    "completedAt": "2025-12-20T10:35:23.000Z"
  },
  "summary": {
    "total": 12,
    "critical": 2,
    "high": 5,
    "medium": 3,
    "low": 2
  },
  "vulnerabilities": [
    {
      "id": "vuln_abc123",
      "vulnId": "WSS-STATIC-JS-001",
      "owaspCategory": "A05:2025-Injection",
      "cweId": "CWE-95",
      "severity": "CRITICAL",
      "confidence": "HIGH",
      "title": "Use of eval() with potential user input",
      "description": "The eval() function executes arbitrary JavaScript code...",
      "evidence": "const result = eval(userInput);",
      "location": "src/utils/parser.js:42",
      "remediation": "Remove eval() usage entirely. Use JSON.parse() for JSON data...",
      "references": [
        "https://owasp.org/Top10/2025/",
        "https://cwe.mitre.org/data/definitions/95.html"
      ],
      "createdAt": "2025-12-20T10:35:12.000Z"
    }
    // ... more vulnerabilities
  ]
}
```

**Error Response** (404 Not Found):

```json
{
  "error": "Scan not found"
}
```

**Error Response** (409 Conflict):

```json
{
  "error": "Scan not completed yet",
  "status": "IN_PROGRESS"
}
```

**Example Usage**:

```typescript
async function fetchResults(scanId: string) {
  const response = await fetch(`/api/scan/${scanId}/results`);
  const data = await response.json();
  
  console.log(`Found ${data.summary.total} vulnerabilities`);
  console.log(`Critical: ${data.summary.critical}`);
  
  // Filter critical vulnerabilities
  const critical = data.vulnerabilities.filter(v => 
    v.severity === 'CRITICAL'
  );
  
  critical.forEach(vuln => {
    console.log(`[${vuln.vulnId}] ${vuln.title}`);
    console.log(`Location: ${vuln.location}`);
  });
}
```

---

### 4. Stream Scan Logs (SSE)

**NEW** - Stream real-time scan progress logs using Server-Sent Events.

**Endpoint**: `GET /api/scan/logs?scanId=:id`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scanId` | string | ✅ | Scan ID to stream logs for |

**Response**: Server-Sent Events stream

**Event Format**:

```
data: {"scanId":"clx...","timestamp":"2025-12-21T10:30:45.123Z","level":"info","message":"Starting dynamic analysis...","phase":"DYNAMIC"}

data: {"scanId":"clx...","timestamp":"2025-12-21T10:30:46.456Z","level":"info","message":"Fetching headers from https://example.com...","phase":"DYNAMIC"}

data: {"scanId":"clx...","timestamp":"2025-12-21T10:30:47.789Z","level":"success","message":"Crawl completed. Found 20 URLs, 0 endpoints, 2 forms","phase":"DYNAMIC"}
```

**Log Object Structure**:

| Field | Type | Description |
|-------|------|-------------|
| `scanId` | string | ID of the scan |
| `timestamp` | string | ISO 8601 timestamp |
| `level` | enum | `"info"`, `"success"`, `"warning"`, `"error"` |
| `message` | string | Human-readable log message |
| `phase` | string (optional) | Scan phase: `"STATIC"`, `"DYNAMIC"`, etc. |
| `metadata` | object (optional) | Additional structured data |

**Log Levels**:

- **info** (•): General progress updates
- **success** (✓): Successful completion of a phase
- **warning** (⚠): Non-critical issues detected
- **error** (✗): Critical errors or failures

**Example Client Implementation**:

```typescript
function connectToScanLogs(scanId: string) {
  const eventSource = new EventSource(`/api/scan/logs?scanId=${scanId}`);
  
  eventSource.onopen = () => {
    console.log('Connected to scan log stream');
  };
  
  eventSource.onmessage = (event) => {
    const log = JSON.parse(event.data);
    console.log(`[${log.level}] ${log.message}`);
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    eventSource.close();
  };
  
  return eventSource;
}

// Usage
const eventSource = connectToScanLogs('clx1a2b3c4d5e6f7g8h9');

// Clean up when done
eventSource.close();
```

**React Hook Example**:

```typescript
function useScanLogs(scanId: string) {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/scan/logs?scanId=${scanId}`);
    
    eventSource.onopen = () => setIsConnected(true);
    
    eventSource.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs(prev => [...prev, log]);
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };
    
    return () => eventSource.close();
  }, [scanId]);
  
  return { logs, isConnected };
}
```

**Notes**:
- Connection stays open until scan completes or client disconnects
- Logs are not persisted to database (in-memory only)
- Automatic reconnection handled by browser
- Works with Next.js serverless functions

---

### 5. Get Scan History

Retrieve scan history for a specific hostname.

**Endpoint**: `GET /api/history/:hostname`

**URL Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `hostname` | string | Domain/hostname (e.g., "example.com") |

**Query Parameters** (Optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max records (default: 20) |

**Response** (200 OK):

```json
{
  "hostname": "example.com",
  "scans": [
    {
      "id": "clx1a2b3c4d5e6f7g8h9",
      "createdAt": "2025-12-20T10:30:00.000Z",
      "status": "COMPLETED",
      "score": 85,
      "grade": "B",
      "mode": "BOTH",
      "scanSummary": {
        "totalTests": 10,
        "passedTests": 7,
        "failedTests": 3,
        "vulnerabilityCount": 5
      }
    }
    // ... more scans
  ]
}
```

**Example Usage**:

```typescript
async function fetchScanHistory(hostname: string) {
  const response = await fetch(
    `/api/history/${encodeURIComponent(hostname)}`
  );
  const data = await response.json();
  
  console.log(`Found ${data.scans.length} scans for ${hostname}`);
  data.scans.forEach(scan => {
    console.log(`${scan.createdAt}: Grade ${scan.grade} (${scan.score})`);
  });
}
```

---

## 🔐 Server Actions

Server Actions are secure, server-side functions that can be called from React components.

### 1. createScan

Create a new scan record in the database.

**Signature**:

```typescript
async function createScan(
  targetUrl: string,
  scanMode: ScanMode
): Promise<Scan>
```

**Parameters**:

- `targetUrl`: URL to scan
- `scanMode`: `'STATIC' | 'DYNAMIC' | 'BOTH'`

**Returns**: Prisma `Scan` object

**Example**:

```typescript
'use server';

import { createScan } from '@/app/actions';

export async function startNewScan(url: string) {
  const scan = await createScan(url, 'BOTH');
  return scan.id;
}
```

---

### 2. runStaticAnalysis

Execute static code analysis on provided source code.

**Signature**:

```typescript
async function runStaticAnalysis(
  code: string,
  filename: string,
  scanId: string
): Promise<void>
```

**Parameters**:

- `code`: Source code to analyze
- `filename`: File name/path for reporting
- `scanId`: Associated scan ID

**Side Effects**: Creates `Vulnerability` records in database

**Example**:

```typescript
'use server';

import { runStaticAnalysis } from '@/app/actions';

export async function analyzeFile(scanId: string, file: File) {
  const code = await file.text();
  await runStaticAnalysis(code, file.name, scanId);
}
```

---

### 3. runDynamicAnalysis

Execute dynamic security tests against a live URL.

**Signature**:

```typescript
async function runDynamicAnalysis(
  targetUrl: string,
  scanId: string,
  options?: DynamicAnalysisOptions
): Promise<void>
```

**Parameters**:

- `targetUrl`: URL to test
- `scanId`: Associated scan ID
- `options`: Optional configuration

**Options**:

```typescript
interface DynamicAnalysisOptions {
  maxDepth?: number;        // Crawl depth (default: 3)
  maxPages?: number;        // Max pages (default: 100)
  rateLimit?: number;       // Requests/sec (default: 10)
  timeout?: number;         // Timeout ms (default: 30000)
}
```

**Side Effects**: Creates `Vulnerability` records in database

**Example**:

```typescript
'use server';

import { runDynamicAnalysis } from '@/app/actions';

export async function performDynamicScan(scanId: string, url: string) {
  await runDynamicAnalysis(url, scanId, {
    maxDepth: 2,
    maxPages: 50,
    rateLimit: 5
  });
}
```

---

### 4. getScanHistory

Retrieve scan history for a hostname.

**Signature**:

```typescript
async function getScanHistory(
  hostname: string
): Promise<ScanHistoryItem[]>
```

**Parameters**:

- `hostname`: Domain/hostname to query

**Returns**:

```typescript
interface ScanHistoryItem {
  id: string;
  createdAt: Date;
  status: string;
  score: number | null;
  grade: string | null;
  mode: string;
  _count: {
    results: number;
    securityTests: number;
  };
}
```

**Example**:

```typescript
'use server';

import { getScanHistory } from '@/app/actions';

export async function displayHistory(hostname: string) {
  const history = await getScanHistory(hostname);
  
  history.forEach(scan => {
    console.log(`${scan.createdAt}: ${scan.grade} (${scan.score}/100)`);
    console.log(`  ${scan._count.results} vulnerabilities`);
  });
}
```

---

### 5. generateReport

Generate a formatted vulnerability report.

**Signature**:

```typescript
async function generateReport(
  scanId: string,
  format?: 'JSON' | 'PDF'
): Promise<Report>
```

**Parameters**:

- `scanId`: Scan ID to generate report for
- `format`: Output format (default: 'JSON')

**Returns**:

```typescript
interface Report {
  scan: Scan;
  summary: VulnerabilitySummary;
  vulnerabilities: Vulnerability[];
  generatedAt: Date;
}
```

**Example**:

```typescript
'use server';

import { generateReport } from '@/app/actions';

export async function downloadReport(scanId: string) {
  const report = await generateReport(scanId, 'JSON');
  return JSON.stringify(report, null, 2);
}
```

---

## 📊 Data Models

### Scan

```typescript
interface Scan {
  id: string;                          // CUID
  targetUrl: string;                   // Scanned URL
  hostname: string;                    // Extracted hostname
  mode: 'STATIC' | 'DYNAMIC' | 'BOTH';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  score: number | null;                // Security score (0-100)
  grade: string | null;                // Letter grade (A+, A, B, C, D, F)
  createdAt: Date;
  completedAt: Date | null;
  scanSummary: Json | null;            // Raw headers, cookies, CSP
  vulnerabilities: Vulnerability[];    // Related vulnerabilities
  securityTests: SecurityTest[];       // Security test results
}
```

### Vulnerability

```typescript
interface Vulnerability {
  id: string;                          // CUID
  scanId: string;                      // Foreign key to Scan
  type: string;                        // Vulnerability type
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location: string;                    // File:line or URL
  remediation: string;                 // Fix guidance
  owaspCategory: string | null;        // A05:2025-Injection
  owaspId: string | null;              // WSS-STATIC-JS-001
  ruleId: string | null;               // Rule identifier
}
```

### SecurityTest

```typescript
interface SecurityTest {
  id: string;                          // CUID
  scanId: string;                      // Foreign key to Scan
  testName: string;                    // "Content Security Policy", "Cookies", etc.
  passed: boolean;                     // Test passed or failed
  score: number;                       // Score contribution (can be negative)
  result: 'Passed' | 'Failed' | 'Info' | 'N/A';
  reason: string | null;               // Why it passed/failed
  recommendation: string | null;       // How to fix
  details: Json | null;                // Structured test data (CSP checks, etc.)
}
```

### VulnerabilitySummary

```typescript
interface VulnerabilitySummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}
```

### ScoringResult

```typescript
interface ScoringResult {
  score: number;                       // 0-100
  grade: string;                       // A+, A, B, C, D, F
  breakdown: Array<{
    testName: string;
    score: number;                     // Points added/subtracted
    passed: boolean;
  }>;
}
```

### ScanSummary

```typescript
interface ScanSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  vulnerabilityCount: number;
  rawHeaders?: Record<string, string>; // HTTP response headers
  setCookieHeaders?: string[];         // Set-Cookie headers
  csp?: string | null;                 // Content-Security-Policy
}
```

---

## 🔒 Authentication & Authorization

**Current Status**: No authentication implemented (academic project)

**Future Considerations**:

For production deployment, consider:

- JWT-based authentication
- API key authentication for programmatic access
- Rate limiting per user/API key
- Scan result access control
- Audit logging

---

## 🚦 Rate Limiting

**Current Limits** (per IP):

- Start Scan: 10 requests / 10 minutes
- Status Check: 60 requests / minute
- Results Fetch: 20 requests / minute

**Headers** (Future):

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640000000
```

---

## 🛠️ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_URL` | 400 | URL validation failed |
| `INVALID_SCAN_MODE` | 400 | Invalid scan mode value |
| `SCAN_NOT_FOUND` | 404 | Scan ID doesn't exist |
| `SCAN_IN_PROGRESS` | 409 | Scan not completed yet |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📡 Webhooks (Future Feature)

**Planned**: Webhook notifications when scans complete

```json
POST https://your-app.com/webhook
{
  "event": "scan.completed",
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "summary": {
    "total": 12,
    "critical": 2
  },
  "completedAt": "2025-12-20T10:35:23.000Z"
}
```

---

## 🧪 Testing API Endpoints

### Using curl

```bash
# Start a scan
curl -X POST http://localhost:3000/api/scan/start \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://example.com","scanMode":"BOTH"}'

# Check status
curl http://localhost:3000/api/scan/{scanId}/status

# Get results
curl http://localhost:3000/api/scan/{scanId}/results
```

### Using JavaScript

```javascript
// Start scan
const startScan = async (url, mode) => {
  const res = await fetch('/api/scan/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl: url, scanMode: mode })
  });
  return res.json();
};

// Poll for completion
const waitForCompletion = async (scanId) => {
  while (true) {
    const { status } = await fetch(`/api/scan/${scanId}/status`)
      .then(r => r.json());
    
    if (status === 'COMPLETED') break;
    if (status === 'FAILED') throw new Error('Scan failed');
    
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s
  }
};

// Fetch results
const getResults = async (scanId) => {
  const res = await fetch(`/api/scan/${scanId}/results`);
  return res.json();
};
```

---

## Next Steps

- **[View Architecture](architecture.md)**: Understand API implementation
- **[Development Guide](development.md)**: Contribute to the API
- **[Deployment](deployment.md)**: Deploy the API to production
