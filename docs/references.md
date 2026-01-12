# References & Bibliography

Academic references, standards, and authoritative sources that inform WebSecScan design and implementation.

---

## OWASP Standards (Primary)

1. **OWASP Top 10 2025**  
   https://owasp.org/Top10/  
   Primary vulnerability taxonomy used by WebSecScan.

2. **OWASP Top 10 2021**  
   https://owasp.org/Top10/  
   Historical reference; see [OWASP 2025 Mapping](security/owasp-2025.md) for 2021→2025 migration.

3. **OWASP Testing Guide v4.2**  
   https://owasp.org/www-project-web-security-testing-guide/  
   Testing methodologies for static and dynamic analysis.

4. **OWASP Application Security Verification Standard (ASVS) v4.0**  
   https://owasp.org/www-project-application-security-verification-standard/  
   Security verification requirements and levels.

5. **OWASP Dependency-Check**  
   https://owasp.org/www-project-dependency-check/  
   Dependency vulnerability scanning approach.

6. **OWASP ZAP - Baseline Scan**  
   https://www.zaproxy.org/docs/docker/baseline-scan/  
   Benchmarking and safe testing defaults.

---

## Security Standards & Specifications

7. **Common Vulnerability Scoring System (CVSS) v3.1**  
   https://www.first.org/cvss/v3.1/specification-document  
   Vulnerability severity scoring methodology.

8. **CVSS v4.0**  
   https://www.first.org/cvss/v4.0/  
   Updated scoring framework with environmental factors.

9. **NIST SP 800-53 Rev. 5**  
   https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final  
   Security control baselines and assessment frameworks.

10. **Content Security Policy Level 3 (W3C)**  
    https://www.w3.org/TR/CSP3/  
    CSP syntax validation and policy effectiveness.

11. **HTTP Strict-Transport-Security (HSTS) - RFC 6797**  
    https://www.rfc-editor.org/rfc/rfc6797  
    HTTPS enforcement and preload requirements.

12. **X-Frame-Options - RFC 7034**  
    https://www.rfc-editor.org/rfc/rfc7034  
    Clickjacking defense headers.

---

## Web Security Testing

13. **OWASP CheatSheet Series**  
    https://cheatsheetseries.owasp.org/  
    Practical remediation guidance for vulnerabilities.

14. **Mozilla Observatory**  
    https://observatory.mozilla.org/  
    Website security analysis and scoring methodology.

15. **Burp Suite Academy**  
    https://portswigger.net/web-security  
    Web application vulnerability exploitation examples.

---

## Cryptography

16. **FIPS 197 - Advanced Encryption Standard (AES)**  
    https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf  
    Standard encryption algorithm specification.

17. **FIPS 186-4 - Digital Signature Standard**  
    https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf  
    Digital signature and hashing standards.

---

## Databases & Authentication

18. **OWASP Identification and Authentication Cheat Sheet**  
    https://cheatsheetseries.owasp.org/cheatsheets/Identification_and_Authentication_Cheat_Sheet.html  
    Authentication security best practices.

19. **JSON Web Token (JWT) - RFC 7519**  
    https://www.rfc-editor.org/rfc/rfc7519  
    Token-based authentication specification.

20. **OAuth 2.0 - RFC 6749**  
    https://www.rfc-editor.org/rfc/rfc6749  
    Authorization delegation framework.

---

## HTTP Security

21. **HTTP/2 Specification - RFC 7540**  
    https://www.rfc-editor.org/rfc/rfc7540  
    HTTP/2 protocol and security implications.

22. **Expect-CT - RFC 6962**  
    https://www.rfc-editor.org/rfc/rfc6962  
    Certificate Transparency enforcement.

23. **Referrer-Policy Specification**  
    https://www.w3.org/TR/referrer-policy/  
    Referrer header control and privacy.

---

## Software Development

24. **OWASP Secure Coding Practices**  
    https://owasp.org/www-project-secure-coding-practices/  
    Developer guidance for secure code.

25. **CWE - Common Weakness Enumeration**  
    https://cwe.mitre.org/  
    Classification of software weaknesses and vulnerabilities.

26. **SCA - Software Composition Analysis**  
    https://www.synopsys.com/blogs/software-security/sca-software-composition-analysis/  
    Dependency and supply chain security analysis.

---

## Accessibility & Standards

27. **WCAG 2.1 - Web Content Accessibility Guidelines**  
    https://www.w3.org/WAI/WCAG21/quickref/  
    Web accessibility standards (not security, but good practice).

28. **GDPR - General Data Protection Regulation**  
    https://gdpr-info.eu/  
    EU data protection regulation and compliance requirements.

---

## Academic Papers & Research

29. **Strengthening and Demonstrating Website Security with HSTS**  
    https://tools.ietf.org/html/rfc6797  
    Academic analysis of HTTPS enforcement.

30. **The Web Application Security Scanner Benchmarking Project**  
    Various scanner evaluations and methodologies.

---

## Tools & Implementations

31. **Playwright Documentation**  
    https://playwright.dev/  
    Browser automation for dynamic testing.

32. **Cheerio Documentation**  
    https://cheerio.js.org/  
    HTML parsing and DOM manipulation.

33. **Prisma ORM**  
    https://www.prisma.io/docs/  
    Type-safe database ORM for Node.js.

34. **Next.js Documentation**  
    https://nextjs.org/docs  
    React framework for full-stack web applications.

---

## Responsible Disclosure

35. **The Web Application Security Consortium**  
    http://www.webappsec.org/  
    Web application security standards and practices.

36. **HackerOne Responsible Disclosure**  
    https://www.hackerone.com/responsible-disclosure  
    Vulnerability disclosure best practices.

37. **Bug Bounty Resources**  
    https://www.bugcrowd.com/resources/  
    Security research and bug bounty guidance.

---

## How to Use These References

**For Vulnerability Categories**: See [OWASP Top 10 2025](security/owasp-2025.md)  
**For Detection Methodology**: See [Architecture Overview](architecture/overview.md)  
**For Security Guidelines**: See [Security & Ethics](security/ethics-and-authorization.md)  
**For Remediation**: See [OWASP CheatSheet Series](https://cheatsheetseries.owasp.org/)  
**For Scanning Details**: See [Scanning Guide](scanning/overview.md)  

---

**Last Updated**: January 2026  
**Maintained By**: WebSecScan Contributors
