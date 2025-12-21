# URL Normalization and Security

WebSecScan automatically normalizes and secures URLs during the scanning process to ensure optimal security coverage and identify protocol-level vulnerabilities.

## Features

### 1. Automatic Protocol Addition
- If no protocol is specified (e.g., `example.com`), HTTPS is added by default
- Prioritizes secure connections over insecure ones

### 2. HTTPS Upgrade Detection
- Automatically attempts to upgrade HTTP URLs to HTTPS
- Tests HTTPS availability before falling back to HTTP
- Warns users when upgrade is successful

### 3. HTTP Security Threat Detection
- Flags sites using HTTP as **HIGH severity** security threats
- Maps to OWASP A04:2025 - Cryptographic Failures
- Provides detailed remediation guidance including:
  - Obtaining SSL/TLS certificates
  - Server configuration for HTTPS redirection
  - Implementing HSTS headers

### 4. Redirect Detection
- Identifies when URLs redirect to different destinations
- Specifically detects www vs non-www redirects
- Tracks final destination URL for accurate scanning

### 5. Connection Validation
- Tests URL accessibility before scanning
- Enforces configurable timeouts (default: 10 seconds)
- Provides clear error messages for inaccessible targets

## Implementation Details

### URL Normalization Process

```
User Input → Format Validation → Protocol Addition → HTTPS Test → HTTP Fallback → Redirect Check → Security Analysis
```

1. **Format Validation**: Basic URL structure and syntax check
2. **Protocol Addition**: Add `https://` if missing
3. **HTTPS Test**: Attempt connection via HTTPS
4. **HTTP Fallback**: If HTTPS fails, try HTTP
5. **Redirect Check**: Follow redirects and identify destination
6. **Security Analysis**: Flag HTTP usage and document findings

### Security Threat Recording

When HTTP is detected, a vulnerability record is created with:
- **Vulnerability ID**: `WSS-PROTOCOL-{timestamp}`
- **Name**: Insecure HTTP Protocol
- **Severity**: HIGH
- **OWASP Category**: A04:2025 - Cryptographic Failures
- **CWE ID**: CWE-319 (Cleartext Transmission of Sensitive Information)
- **CVSS Score**: 7.5
- **Confidence**: HIGH

## Usage

### API Integration

```typescript
import { normalizeUrl } from '@/lib/urlNormalizer'

const result = await normalizeUrl('example.com', {
  preferHttps: true,
  checkRedirects: true,
  timeout: 10000,
})

console.log(result.normalizedUrl) // "https://example.com"
console.log(result.protocol) // "https"
console.log(result.securityThreats) // Array of detected threats
```

### Scan API Response

```json
{
  "scanId": "...",
  "status": "RUNNING",
  "targetUrl": "https://example.com",
  "mode": "BOTH",
  "urlInfo": {
    "protocol": "https",
    "redirected": false,
    "warnings": ["Protocol not specified, defaulting to HTTPS"],
    "securityThreats": []
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preferHttps` | boolean | `true` | Try HTTPS before HTTP |
| `checkRedirects` | boolean | `true` | Follow and detect redirects |
| `timeout` | number | `10000` | Connection timeout in milliseconds |

## User Interface

The scan form displays URL normalization results including:
- Detected protocol (HTTP/HTTPS)
- Redirect information
- Warnings about protocol changes
- Security threats with visual indicators

## Testing

Comprehensive test coverage includes:
- URL format validation
- Protocol addition
- HTTPS upgrade attempts
- HTTP fallback behavior
- Redirect detection (www and non-www)
- Security threat flagging
- Timeout handling
- Error scenarios

Run tests:
```bash
npm test -- urlNormalizer.test.ts
```

## Security Considerations

### Private Network Protection
The system blocks scanning of:
- Link-local addresses (169.254.x.x)
- Embedded credentials in URLs

Local development addresses are allowed:
- localhost
- 127.0.0.1
- 192.168.x.x
- 10.x.x.x
- 172.16.x.x
- *.local domains

### Ethical Scanning
- Only scans targets that return 2xx or 3xx status codes
- Respects connection timeouts to avoid hanging
- Non-destructive connection tests (HEAD requests)

## Related Documentation

- [Security Ethics](security-ethics.md)
- [API Documentation](api.md)
- [Testing Coverage](testing-coverage.md)
