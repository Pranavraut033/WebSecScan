# Crawler Design & Configuration

## Overview

WebSecScan's crawler is designed to be **conservative, safe, and ethical** by default. It discovers endpoints, forms, and potential API routes while respecting website owners' preferences and avoiding system overload.

## Design Philosophy

The crawler prioritizes **safety over exhaustive coverage**. This trade-off is intentional to:

1. **Prevent Denial of Service (DoS)**: Aggressive crawling can overwhelm small servers
2. **Respect Website Policies**: Honor robots.txt and rate limits
3. **Avoid Legal Issues**: Safe defaults reduce risk of unauthorized scanning
4. **Enable Quick Scans**: Shallow crawls complete faster, encouraging iterative testing

## Default Configuration

### Core Parameters

| Parameter | Default | Rationale | Trade-off |
|-----------|---------|-----------|-----------|
| `maxDepth` | `2` | Limits crawl depth to prevent exponential URL explosion | May miss deeply nested routes (e.g., `/admin/settings/advanced/debug`) |
| `maxPages` | `50` | Caps total pages crawled to prevent resource exhaustion | Won't discover all endpoints in large applications |
| `rateLimit` | `1000ms` | 1 second between requests respects server resources | Slower scans; 50 pages = ~50 seconds minimum |
| `respectRobotsTxt` | `true` | Ethical crawling honors website owner preferences | May skip security-relevant admin panels |
| `allowExternalLinks` | `false` | Prevents pivoting to external domains | Won't test federated authentication flows |
| `timeout` | `10000ms` | 10-second timeout prevents hanging on slow responses | May timeout on legitimately slow endpoints |

### Implementation Details

```typescript
const DEFAULT_OPTIONS: Required<CrawlerOptions> = {
  maxDepth: 2,              // Crawl up to 2 levels deep
  maxPages: 50,             // Stop after 50 pages
  rateLimit: 1000,          // 1 second between requests
  respectRobotsTxt: true,   // Check robots.txt before crawling
  allowExternalLinks: false, // Only crawl same-origin URLs
  timeout: 10000            // 10-second request timeout
};
```

## Crawl Strategy

### 1. URL Discovery

The crawler uses **breadth-first traversal** to discover URLs:

1. Start with the target URL (depth 0)
2. Extract all `<a href>` links from HTML
3. Add new URLs to queue with depth + 1
4. Continue until `maxDepth` or `maxPages` reached

### 2. Endpoint Extraction

Beyond HTML links, the crawler extracts API endpoints from:

- **Inline Scripts**: `fetch('/api/users')`, `axios.get('/data')`
- **External Scripts**: Common patterns like `/api/*`, `/graphql`, `/rest/*`
- **AJAX Calls**: jQuery `$.ajax({url: '/endpoint'})` patterns
- **Event Handlers**: `onclick="loadData('/api/items')"`

### 3. Form Discovery

Extracts form metadata for later testing:

```typescript
interface Form {
  url: string;      // Page containing the form
  method: string;   // GET, POST, PUT, etc.
  action: string;   // Form submission endpoint (resolved to absolute URL)
}
```

## Robots.txt Compliance

### Parser Implementation

The crawler includes a **minimal robots.txt parser** that:

1. Fetches `/robots.txt` from target origin
2. Parses `User-agent: *` directives
3. Extracts `Disallow:` paths
4. Skips URLs matching disallowed prefixes

**Example:**

```
User-agent: *
Disallow: /admin/
Disallow: /api/internal/
```

→ Crawler skips `/admin/settings` and `/api/internal/users`

### Safety Fallback

If robots.txt is missing or returns an error, the crawler **allows all paths** rather than blocking legitimate testing.

## Rate Limiting

### Implementation

```typescript
if (visited.size > 1) {
  await sleep(opts.rateLimit); // Default: 1000ms
}
```

- **First request**: Immediate (no delay)
- **Subsequent requests**: Delayed by `rateLimit` milliseconds
- **Purpose**: Prevents overwhelming the target server

### Performance Impact

With default settings:
- **Minimum scan time**: `(maxPages - 1) × rateLimit / 1000` seconds
- **Example**: 50 pages × 1s = **~50 seconds** for full crawl

This is acceptable for security testing but slower than aggressive scanners.

## Limitations & Known Issues

### 1. Limited Depth Coverage

**Limitation**: `maxDepth: 2` won't reach deeply nested admin routes.

**Example Missed Route:**
```
/ → /dashboard → /admin → /settings → /advanced
     depth 0      depth 1   depth 2     depth 3 (SKIPPED)
```

**Mitigation**: For comprehensive admin panel testing, configure `maxDepth: 4` or higher.

### 2. JavaScript-Heavy Applications

**Limitation**: The crawler uses basic HTML parsing (Cheerio), not full browser rendering.

**Missed Content:**
- Single-Page Applications (SPAs) with client-side routing
- Dynamically loaded content via AJAX/fetch
- Shadow DOM elements

**Mitigation**: Use Dynamic Analysis mode, which employs Playwright for full JavaScript execution.

### 3. Authentication Barriers

**Limitation**: Unauthenticated crawling cannot discover login-protected pages.

**Example:**
```
/ (public) → /login (public) → /dashboard (401 Unauthorized)
```

**Mitigation**: See [Authenticated Scans](../security/authenticated-scans.md) for Phase 3 login flow implementation.

### 4. Robots.txt Strictness

**Limitation**: Respecting robots.txt may block security-critical admin panels.

**Example:**
```
Disallow: /admin/  # Crawler skips, but vulnerabilities may exist
```

**Mitigation**: For authorized testing, set `respectRobotsTxt: false` in configuration.

## Configuration via API

### Current Implementation

Crawler options are **hardcoded** in `actions.ts`:

```typescript
const crawlResult = await crawlWebsite(scan.targetUrl, {
  maxDepth: 2,
  maxPages: 20,
  rateLimit: 1000,
  respectRobotsTxt: true
});
```

### Planned Enhancement (Phase 3)

Expose configuration via scan request payload:

```typescript
// POST /api/scan/start
{
  "targetUrl": "https://example.com",
  "mode": "BOTH",
  "crawlerOptions": {
    "maxDepth": 3,        // User override
    "maxPages": 100,       // User override
    "rateLimit": 500,      // Faster scans (use cautiously)
    "respectRobotsTxt": false  // For authorized testing only
  }
}
```

**Validation Rules:**
- `maxDepth`: 1–5 (prevent excessive recursion)
- `maxPages`: 1–200 (prevent resource exhaustion)
- `rateLimit`: 100–5000ms (prevent DoS, respect servers)
- `respectRobotsTxt`: Boolean (require explicit consent checkbox if false)

## Performance Metrics

### Typical Crawl Statistics

Based on Juice Shop benchmark (see [benchmarking.md](../evaluation/benchmarking.md)):

| Metric | Value | Notes |
|--------|-------|-------|
| **URLs Discovered** | 1–50 | Depends on site structure |
| **Endpoints Extracted** | 5–20 | API routes from scripts |
| **Forms Found** | 2–10 | Login, search, comment forms |
| **Runtime** | ~10–50s | Dominated by rate limiting |
| **Memory Usage** | <10 MB | Lightweight HTML parsing |

### Comparison with OWASP ZAP

| Feature | WebSecScan | OWASP ZAP |
|---------|------------|-----------|
| **URLs Crawled** | 1 (shallow) | 95 (deep) |
| **Crawl Time** | ~1s | ~20s |
| **JavaScript Execution** | No (Static mode) | Yes (Spider AJAX) |
| **Robots.txt Respect** | Yes (default) | Configurable |

**Takeaway**: WebSecScan trades coverage for speed. For comprehensive discovery, use ZAP Spider or enable Playwright crawling.

## Security Considerations

### 1. Request Headers

The crawler identifies itself:

```
User-Agent: WebSecScan/1.0 (Educational Security Scanner)
```

**Purpose**: Transparent identification for website owners and WAF administrators.

### 2. DoS Prevention

- **Rate limiting** prevents overwhelming small servers
- **Max pages cap** ensures predictable resource usage
- **Timeout enforcement** avoids hanging on unresponsive endpoints

### 3. Ethical Crawling

- **Robots.txt compliance** respects website owner preferences
- **Explicit consent** required in UI before scanning
- **No brute-force** crawling or aggressive fuzzing

## Future Enhancements

### Phase 3 Roadmap

1. **Configurable Options**: Expose via API with validation
2. **Authenticated Crawling**: Integrate Playwright login flows (see [authenticated-scans.md](../security/authenticated-scans.md))
3. **JavaScript Rendering**: Full browser crawling for SPAs
4. **Smart Depth**: Adaptive `maxDepth` based on site size
5. **Form Interaction**: Basic form filling for deeper navigation

### Proposed Features

- **Session persistence**: Reuse cookies across crawler requests
- **Parallel crawling**: Process multiple URLs concurrently (with rate limit per domain)
- **Sitemap.xml parsing**: Bootstrap URL queue from sitemap
- **GraphQL introspection**: Discover GraphQL schema and queries
- **WebSocket detection**: Identify real-time communication endpoints

## References

1. OWASP Testing Guide v4.2 - Crawlers and Spiders
2. RFC 9309 - Robots Exclusion Protocol
3. Google Webmaster Guidelines - Crawl Rate Optimization
4. Burp Suite Documentation - Spider Configuration
5. NIST SP 800-115 - Technical Guide to Information Security Testing

---

**Related Documentation:**
- [Authenticated Scans](../security/authenticated-scans.md) - Phase 3 login flow design
- [Benchmarking](../evaluation/benchmarking.md) - Comparison with OWASP ZAP crawler
- [Real-World Testing](real-world-testing.md) - Ethical guidelines
