# API Security - CSRF and Same-Origin Protection

WebSecScan implements comprehensive CSRF (Cross-Site Request Forgery) protection and same-origin validation for all API endpoints to prevent unauthorized access and cross-origin attacks.

## Security Features

### 1. Same-Origin Policy Enforcement
All API routes validate that requests originate from the same domain as the application, preventing cross-origin attacks.

**Implementation:**
- Checks `Origin` and `Referer` headers against the `Host` header
- Rejects requests from different origins with 403 Forbidden
- Enforced at both middleware and individual route levels

### 2. Global Middleware Protection
Located at `src/middleware.ts`, this Next.js middleware applies security to all routes:

**Security Headers:**
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Browser XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features
- `Content-Security-Policy` - Comprehensive CSP to prevent XSS and injection attacks

**Origin Validation:**
- POST, PUT, DELETE, PATCH requests must include valid origin headers
- GET requests to sensitive endpoints (status, results, history) validate origin
- Direct navigation (no origin header) allowed only for non-sensitive GET requests

### 3. Per-Route Validation
Each API route imports and uses `validateApiRequest()` from `src/lib/csrf.ts`:

```typescript
import { validateApiRequest } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  const validation = await validateApiRequest(request)
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || 'Invalid request origin' },
      { status: 403 }
    )
  }
  // ... rest of handler
}
```

### 4. Protected Endpoints

All API routes are protected:

| Endpoint | Method | Protection |
|----------|--------|------------|
| `/api/scan/start` | POST | Same-origin validation |
| `/api/scan/logs` | GET (SSE) | Same-origin validation |
| `/api/scan/[id]/status` | GET | Same-origin validation |
| `/api/scan/[id]/results` | GET | Same-origin validation |
| `/api/history/[hostname]` | GET | Same-origin validation |

## How It Works

### Request Flow
1. **Middleware Layer**: All requests pass through `middleware.ts`
   - Security headers applied to response
   - Basic origin validation for state-changing methods
   - CSP and frame protection headers added

2. **Route Layer**: Individual routes perform additional validation
   - `validateApiRequest()` checks origin/referer headers
   - Compares request origin with host hostname
   - Returns 403 if validation fails

### Origin Validation Logic

```typescript
// Extract origin from headers
const origin = request.headers.get('origin')
const referer = request.headers.get('referer')
const host = request.headers.get('host')

// Parse hostname from origin or referer
const requestOrigin = new URL(origin || referer).hostname
const hostName = host.split(':')[0]

// Must match exactly
if (requestOrigin !== hostName) {
  return { valid: false, error: 'Cross-origin request not allowed' }
}
```

## Server Actions Protection

Next.js Server Actions (in `src/app/actions.ts`) have built-in CSRF protection:
- Next.js automatically validates Server Actions requests
- Origin checking is performed by Next.js framework
- No additional CSRF tokens needed for Server Actions

## Security Benefits

✅ **Prevents CSRF Attacks**: Only requests from your application can modify data

✅ **Prevents XSS**: CSP headers block inline scripts and restrict sources

✅ **Prevents Clickjacking**: X-Frame-Options prevents embedding in iframes

✅ **Prevents MIME Sniffing**: X-Content-Type-Options prevents browser from guessing content types

✅ **Zero-Trust Model**: Every API call is validated, even internal ones

## Development Notes

### Local Development
- Same-origin validation works with `localhost:3000`
- Middleware applies in both dev and production
- No environment-specific bypasses

### Testing
When testing APIs directly (e.g., with curl or Postman):
```bash
# Include origin header matching your host
curl -X POST http://localhost:3000/api/scan/start \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://example.com", "mode": "STATIC"}'
```

### Deployment Considerations
- Ensure your deployment platform supports Next.js middleware
- Verify CSP headers don't conflict with CDN requirements
- Monitor for false positives in origin validation
- Consider adding rate limiting for additional protection

## Extensibility

### Adding Token-Based CSRF (Optional)
For additional security, you can implement token-based CSRF:

1. Generate tokens server-side (function already exists in `csrf.ts`)
2. Store in HTTP-only cookies
3. Validate token on each request
4. Rotate tokens periodically

Current implementation uses same-origin validation which is sufficient for most use cases and recommended by OWASP.

## OWASP Compliance

This implementation follows OWASP guidelines:
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsecurityproject.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- Same-origin validation is listed as a primary defense against CSRF

## Monitoring & Logging

403 Forbidden responses from origin validation are logged server-side:
- Check server logs for blocked requests
- Monitor for unusual patterns (potential attack attempts)
- False positives may indicate misconfigured clients

## Related Documentation
- [Security Ethics](./security-ethics.md)
- [API Reference](./api.md)
- [Architecture](./architecture.md)
