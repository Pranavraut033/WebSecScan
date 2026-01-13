# API Overview

WebSecScan exposes security scanning functionality through a **REST API** and **Server Actions** for programmatic access.

---

## Getting Started

### Base URL

```
http://localhost:3000/api
```

### Authentication

Currently, WebSecScan API has **no authentication** (suitable for local/internal use). Production deployments should add:
- API key validation
- Rate limiting per key
- Audit logging

### Response Format

All responses are **JSON**:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Invalid URL format"
}
```

---

## Core Endpoints

### POST /api/scan/start

Initiates a new security scan.

**Request**:
```json
{
  "targetUrl": "https://example.com",
  "scanMode": "BOTH"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetUrl` | string | ✅ | URL to scan (HTTP/HTTPS) |
| `scanMode` | enum | ✅ | `"STATIC"`, `"DYNAMIC"`, or `"BOTH"` |

**Response** (200 OK):

```json
{
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "status": "RUNNING",
  "targetUrl": "https://example.com",
  "mode": "BOTH"
}
```

After receiving `scanId`, redirect to `/scan/{scanId}` to see real-time progress.

### GET /api/scan/{scanId}

Fetch scan status and results.

**Response** (200 OK):

```json
{
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "status": "COMPLETED",
  "targetUrl": "https://example.com",
  "mode": "BOTH",
  "score": 78,
  "riskLevel": "MEDIUM",
  "vulnerabilities": [
    {
      "id": "WSS-XSS-001",
      "owaspId": "A05:2025",
      "severity": "HIGH",
      "title": "Reflected XSS",
      "description": "...",
      "evidence": "...",
      "remediation": "..."
    }
  ],
  "completedAt": "2026-01-12T10:31:30Z"
}
```

### GET /api/scan/{scanId}/logs

Stream live scan progress via **Server-Sent Events (SSE)**.

**Usage**:
```typescript
const eventSource = new EventSource(`/api/scan/{scanId}/logs`);

eventSource.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log(`[${log.level}] ${log.message}`);
};

eventSource.onerror = () => {
  eventSource.close();
};
```

**Log Entry Format**:
```json
{
  "timestamp": "2026-01-12T10:30:45Z",
  "level": "info",
  "phase": "STATIC",
  "message": "Analyzing JavaScript files..."
}
```

---

## Server Actions (Next.js)

For server-side code, use TypeScript Server Actions directly:

```typescript
'use server'

import { startScan } from '@/app/actions/scan'

// In a Server Component
const result = await startScan({
  targetUrl: 'https://example.com',
  scanMode: 'BOTH'
});

console.log(result.scanId);
```

---

## Rate Limiting

To prevent abuse:

| Limit | Value |
|-------|-------|
| Max requests per minute | 60 |
| Max concurrent scans | 5 |
| Max scan duration | 5 minutes |
| Request timeout | 10 seconds |

---

## Error Handling

Common error scenarios:

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid URL format | Malformed URL |
| 400 | Target not accessible | Network error, firewall block |
| 404 | Scan not found | Invalid scanId |
| 408 | Scan timeout | Target too slow or unresponsive |
| 429 | Rate limit exceeded | Too many requests |
| 500 | Server error | Internal failure (check logs) |

**Example error response**:
```json
{
  "success": false,
  "error": "Invalid URL: must be HTTP or HTTPS"
}
```

---

## Examples

### Using cURL

```bash
# Start a scan
curl -X POST http://localhost:3000/api/scan/start \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "example.com", "scanMode": "BOTH"}'

# Get results (replace SCAN_ID with actual ID)
curl http://localhost:3000/api/scan/SCAN_ID

# Stream live logs
curl http://localhost:3000/api/scan/SCAN_ID/logs
```

### Using JavaScript Fetch

```typescript
// Start scan
const response = await fetch('/api/scan/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetUrl: 'example.com',
    scanMode: 'BOTH'
  })
});

const { scanId } = await response.json();

// Redirect to results page
window.location.href = `/scan/${scanId}`;
```

### Using Python

```python
import requests

# Start scan
response = requests.post('http://localhost:3000/api/scan/start', json={
    'targetUrl': 'example.com',
    'scanMode': 'BOTH'
})

scan = response.json()
scan_id = scan['scanId']

# Get results
results = requests.get(f'http://localhost:3000/api/scan/{scan_id}')
print(results.json())
```

---

## Next Steps

- **[API Endpoints Reference](endpoints.md)** — Detailed endpoint documentation
- **[Response Schemas](schemas.md)** — Request/response types
- **[Features Overview](../features.md)** — What the scanner can do

## Resources

| Resource | Link |
|----------|------|
| **GitHub Repository** | [https://github.com/Pranavraut033/WebSecScan](https://github.com/Pranavraut033/WebSecScan) |
| **Live Demo** | [https://web-sec-scan.vercel.app](https://web-sec-scan.vercel.app) |
| **Documentation** | [https://pranavraut033.github.io/WebSecScan/](https://pranavraut033.github.io/WebSecScan/) |
| **Test Fixtures** | [https://github.com/Pranavraut033/WebSecScan-TestFixtures](https://github.com/Pranavraut033/WebSecScan-TestFixtures) |
