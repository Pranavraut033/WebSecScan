# API Response Schemas

Complete request and response type definitions.

---

## Request Schemas

### ScanRequest

```typescript
interface ScanRequest {
  targetUrl: string;        // URL to scan
  scanMode: "STATIC" | "DYNAMIC" | "BOTH";
}
```

---

## Response Schemas

### ScanResponse

```typescript
interface ScanResponse {
  scanId: string;           // Unique scan identifier
  status: "RUNNING" | "COMPLETED" | "FAILED";
  targetUrl: string;        // Normalized target URL
  mode: string;             // Scan mode used
  score?: number;           // Security score (0-100)
  vulnerabilities?: Vulnerability[];
  completedAt?: string;     // ISO timestamp
}
```

### Vulnerability

```typescript
interface Vulnerability {
  id: string;               // Unique finding ID (WSS-...)
  owaspId: string;         // OWASP 2025 category (A01-A10)
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  title: string;           // Vulnerability name
  description: string;     // Detailed explanation
  evidence: string;        // Code/response snippet
  remediation: string;     // How to fix
  references: string[];    // External links
}
```

### SecurityTest

```typescript
interface SecurityTest {
  id: string;              // Test identifier
  type: string;            // Test type (XSS, SQLi, etc.)
  endpoint: string;        // API endpoint tested
  method: string;          // HTTP method
  status: "PASS" | "FAIL"; // Test result
}
```

---

## Log Schema

### LogEntry

```typescript
interface LogEntry {
  timestamp: string;       // ISO timestamp
  level: "info" | "success" | "warning" | "error";
  phase: "STATIC" | "DYNAMIC";
  message: string;         // Log message
}
```

---

## Next Steps

- **[Endpoints](endpoints.md)** — API reference
- **[API Overview](overview.md)** — General info
