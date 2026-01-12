# API Endpoints Reference

Detailed REST API endpoint documentation.

---

## Scan Endpoints

### POST /api/scan/start

Start a new security scan.

**Request**:
```json
{
  "targetUrl": "https://example.com",
  "scanMode": "BOTH"
}
```

**Response**:
```json
{
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "status": "RUNNING",
  "targetUrl": "https://example.com"
}
```

### GET /api/scan/{scanId}

Get scan status and results.

**Response**:
```json
{
  "scanId": "clx1a2b3c4d5e6f7g8h9",
  "status": "COMPLETED",
  "score": 78,
  "vulnerabilities": [...]
}
```

### GET /api/scan/{scanId}/logs

Stream live logs via Server-Sent Events.

**Usage**:
```typescript
const eventSource = new EventSource(`/api/scan/{scanId}/logs`);
eventSource.onmessage = (event) => {
  const log = JSON.parse(event.data);
};
```

---

## Response Schemas

See [API Schemas](schemas.md) for complete type definitions.

---

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid URL format | Malformed URL |
| 404 | Scan not found | Invalid scanId |
| 408 | Request timeout | Target unresponsive |
| 429 | Rate limit exceeded | Too many requests |
| 500 | Server error | Internal failure |

---

## Next Steps

- **[Response Schemas](schemas.md)** — Request/response types
- **[API Overview](overview.md)** — General API info
