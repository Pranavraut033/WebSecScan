# FAQ

Common questions about using and developing WebSecScan.

---

## Usage Questions

### Q: How long does a scan take?

**A:** Depends on scan mode and target:
- **Static only**: 5-30 seconds
- **Dynamic only**: 1-5 minutes (crawling + testing)
- **Both**: 2-10 minutes

Large sites with many endpoints take longer. Configure crawler limits in settings.

### Q: Can I scan localhost?

**A:** Yes, localhost is allowed in development mode. Scanning works for:
- `http://localhost:3000`
- `http://127.0.0.1:8080`
- `http://192.168.x.x` (private networks in dev)

Public internet scans require explicit authorization.

### Q: Does WebSecScan modify the target?

**A:** No. All tests are **read-only**:
- ✅ Can read responses
- ✅ Can observe headers
- ❌ Cannot modify files, database, configuration
- ❌ Cannot delete or create data

### Q: What's the difference between MEDIUM and HIGH severity?

**A:**
- **HIGH**: Likely exploitable; requires fix soon (days)
- **MEDIUM**: Possible exploitation; should be fixed (weeks)

Use confidence score to help prioritize. A CRITICAL with LOW confidence may be less urgent than a MEDIUM with HIGH confidence.

### Q: Why does it say I need authorization?

**A:** Unauthorized penetration testing is **illegal** in most jurisdictions. The authorization check is a legal requirement. See [Security & Ethics](../security/ethics-and-authorization.md).

### Q: Can I get false positives?

**A:** Yes, pattern matching can have false positives. WebSecScan minimizes this through:
- Confidence scoring (HIGH/MEDIUM/LOW)
- Context-aware analysis (framework detection, minification handling)
- Evidence requirement (proof, not just pattern match)

Manually validate critical findings. See [Reducing False Positives](../security/reducing-false-positives.md).

### Q: How do I fix vulnerabilities?

Each finding includes **remediation guidance**. For detailed help:
- [OWASP Top 10 2025](../security/owasp-2025.md) — Category explanation
- [OWASP CheatSheet Series](https://cheatsheetseries.owasp.org/) — Fix patterns
- [GitHub Issues](https://github.com/Pranavraut033/WebSecScan/issues) — Ask community

### Q: Can I scan without authorization?

**No.** You must check the authorization box, and it must be truthful. Scanning without authorization is illegal.

### Q: What if a scan fails/times out?

Check:
1. Target is accessible from your network
2. Target is not blocking requests (firewall, WAF)
3. Try increasing timeout in configuration
4. Check server logs for errors

---

## Deployment Questions

### Q: Can I run this in production?

**A:** Yes, but add security:
- [ ] Add API authentication (API keys)
- [ ] Add rate limiting per user
- [ ] Enable HTTPS
- [ ] Configure CORS appropriately
- [ ] Add audit logging
- [ ] Use PostgreSQL (not SQLite)
- [ ] Run behind reverse proxy (Nginx)

See [Deployment Guide](../deployment.md) for details.

### Q: Which database should I use?

**Development**: SQLite (no setup required)  
**Production**: PostgreSQL (recommended)  
  - More scalable
  - Better concurrency
  - Can be remotely hosted

See [Deployment Guide](../deployment.md) for PostgreSQL setup.

### Q: How do I scale horizontally?

**Challenges**:
- Scans must complete on same server (no distributed scans)
- Crawler stores state in memory
- Logs are in-memory

**Solutions**:
- Multiple instances behind load balancer
- Each instance handles independent scans
- Add Redis for session sharing (future enhancement)
- Use PostgreSQL (supports concurrent queries)

### Q: Can I restrict scan targets?

**A:** Yes (future feature). For now, rely on:
- API authentication
- Network access controls
- User authorization check (legal requirement)
- Audit logging

---

## Development Questions

### Q: How do I add a new vulnerability check?

**A:**
1. Create rule module in `src/security/rules/`
2. Implement detection logic (deterministic pattern matching)
3. Map to OWASP 2025 category
4. Add unit tests
5. Update documentation

See [Contributing Guide](contributing.md) for details.

### Q: Why are tests failing?

Check:
1. Database initialized: `npx prisma migrate dev`
2. Dependencies installed: `npm install`
3. Prisma generated: `npx prisma generate`
4. Running `npm test` (not `node --test`)

If still failing, open an issue with error output.

### Q: Can I contribute?

**Yes!** See [Contributing Guide](contributing.md) for:
- Code standards
- Testing requirements
- PR process
- Mandatory project rules

### Q: Where do I report bugs?

Open an issue on [GitHub Issues](https://github.com/Pranavraut033/WebSecScan/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, etc.)
- Error logs if applicable

### Q: How do I request a feature?

Use [GitHub Discussions](https://github.com/Pranavraut033/WebSecScan/discussions) to:
- Propose new features
- Discuss design decisions
- Share ideas with community

Or open an issue labeled `enhancement`.

### Q: What's the testing philosophy?

**Real Logic Only**:
- ✅ Test actual detection logic
- ❌ Don't mock core logic
- ✅ Mock external boundaries (network, filesystem)
- ✅ Deterministic inputs/outputs

See [Testing Guide](development/testing.md) for details.

### Q: Why TypeScript strict mode?

**Benefits**:
- Catches bugs at compile time
- Clear function contracts
- Better IDE autocomplete
- Maintainability

No `any` without documented justification.

---

## Security Questions

### Q: Is WebSecScan safe to run?

**A:** Yes, if used correctly:
- ✅ Only scan systems you own or have permission to test
- ✅ Non-destructive (read-only operations)
- ✅ No data extraction or modification
- ✅ No credential stealing
- ✅ No exploit chaining

See [Security & Ethics](../security/ethics-and-authorization.md).

### Q: Will scanning be detected?

**A:** Yes, scanning generates HTTP requests and logs. Target server will likely detect it (unless stealth testing is configured, which WebSecScan doesn't support).

### Q: Can I test production?

**A:** Only with explicit written authorization from the organization. Testing without authorization is illegal.

### Q: What about GDPR compliance?

**A:** When using authenticated scanning:
- Don't extract personal data
- Use in-memory credentials only
- Don't log sensitive information
- Delete session data after scan

See [Security & Ethics](../security/ethics-and-authorization.md) for details.

---

## Technical Questions

### Q: What's the difference between "Finding" and "Alert"?

**A:** WebSecScan uses terminology from OWASP:
- **Vulnerability** — A security weakness in the code
- **Finding** — A detected vulnerability during scanning
- **Security Test** — A specific test performed (e.g., "XSS in /search")

The terms are sometimes used interchangeably, but "vulnerability" is the most precise.

### Q: Why OWASP 2025 instead of 2021?

**A:** OWASP 2025 is the current standard. Key changes:
- Security Misconfiguration moved to #2 (up from #5)
- SSRF merged into Broken Access Control
- New category: Exceptional Condition Handling

Migration details in [OWASP 2025 Mapping](../security/owasp-2025.md).

### Q: How is the security score calculated?

**A:** Based on:
- Number of vulnerabilities
- Severity distribution (CRITICAL weighs more)
- OWASP category coverage
- Confidence adjustments

Formula: See [Security Scoring](../security/detection-details.md).

Score is 0-100, where:
- 90-100: Low risk (green)
- 70-89: Medium risk (yellow)
- 40-69: High risk (orange)
- 0-39: Critical risk (red)

### Q: Why no ML/AI in WebSecScan?

**A:** WebSecScan prioritizes:
- **Transparency** — All logic is rule-based and auditable
- **Reproducibility** — Scans produce consistent results
- **Explainability** — Easy to understand why something was flagged
- **Academic value** — Clear for learning and research

ML would add complexity, reduce explainability, and make results less reproducible.

---

## Troubleshooting

### "Cannot access target" error

**Check:**
1. URL is correct and accessible
2. Target is not blocking requests (firewall, WAF, rate limiting)
3. Your network allows outbound HTTP(S)
4. Try increasing request timeout

### "Scan stuck" or "not finishing"

**Try:**
1. Stop the scan and try again
2. Check if target server is responsive
3. Reduce `maxPages` or `maxDepth` in crawler config
4. Check server logs for errors

### Tests fail with "Cannot find module"

```bash
npx prisma generate
npm install
```

### Database errors

```bash
# Reset database (⚠️ clears all data)
npx prisma migrate reset --force
npx prisma migrate dev
npm run seed
```

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/Pranavraut033/WebSecScan/issues)
- **Questions**: [GitHub Discussions](https://github.com/Pranavraut033/WebSecScan/discussions)
- **Documentation**: [WebSecScan Docs](https://pranavraut.github.io/WebSecScan/)

---

**Didn't find your answer?** Open a discussion or issue!
