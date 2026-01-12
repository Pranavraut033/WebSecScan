# Crawler Design & Configuration

Web crawler for endpoint discovery and vulnerability testing.

---

## Crawler Philosophy

The crawler is **conservative, safe, and ethical**:

1. **Prevent DoS** — Rate limiting respects server resources
2. **Respect policies** — Honors robots.txt
3. **Avoid legal issues** — Safe defaults
4. **Enable quick testing** — Shallow crawls are fast

---

## Default Configuration

```typescript
const DEFAULT_CRAWLER_OPTIONS = {
  maxDepth: 2,              // Max 2 link levels deep
  maxPages: 50,             // Stop after 50 pages
  rateLimit: 1000,          // 1 second between requests
  respectRobotsTxt: true,   // Check robots.txt
  allowExternalLinks: false, // Same-origin only
  timeout: 10000            // 10-second per-request timeout
};
```

---

## Crawl Strategy

### Breadth-First Traversal

1. Start at root URL (depth 0)
2. Extract all links from page
3. Add new URLs to queue with depth + 1
4. Continue until maxDepth or maxPages reached

### Discovery Methods

| Method | Example |
|--------|---------|
| HTML links | `<a href="/page">` → `/page` |
| Form actions | `<form action="/submit">` |
| AJAX calls | `fetch('/api/data')` → `/api/data` |
| Redirects | 301/302 to `/new` → `/new` |
| Sitemaps | `sitemap.xml` entries |

---

## Rate Limiting

Prevents overwhelming the target:

```
Time:     0ms   1000ms  2000ms  3000ms
Request: [ 1 ]           [ 2 ]           [ 3 ]
         <----1 sec---><----1 sec---->
```

**Benefit**: Respects server resources, avoids DoS detection

**Trade-off**: 50 pages = ~50 seconds minimum

---

## Robots.txt Compliance

Respects website owner preferences:

```robots.txt
User-agent: *
Disallow: /admin/
Disallow: /private/
Crawl-delay: 1

Sitemap: /sitemap.xml
```

The crawler will:
- ✅ Skip `/admin/` and `/private/`
- ✅ Wait 1 second between requests
- ✅ Check `sitemap.xml` for URLs

---

## Configuration Example

```typescript
const crawler = new WebCrawler({
  targetUrl: 'https://example.com',
  maxDepth: 3,          // Deeper crawl
  maxPages: 100,        // More pages
  rateLimit: 500,       // Faster (2 req/sec)
  timeout: 15000        // Longer timeout
});

const results = await crawler.crawl();
```

---

## Real-Time Logging

Progress updates via Server-Sent Events:

```
• 10:30:51 [DYNAMIC] Starting URL crawl...
• 10:30:52 [DYNAMIC] Discovered /products
• 10:30:53 [DYNAMIC] Discovered /api/users
• 10:30:54 [DYNAMIC] Discovered /contact
✓ 10:30:55 [DYNAMIC] Crawl completed. Found 20 URLs
```

---

## Next Steps

- **[Dynamic Testing](dynamic-testing.md)** — How tests run
- **[Architecture](../architecture/overview.md)** — System design
