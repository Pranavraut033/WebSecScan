# Getting Started

This guide will help you install and run WebSecScan on your local machine.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **npm** (v9+) — Comes with Node.js
- **Git** — [Download](https://git-scm.com/)
- **(Optional)** **Docker** for containerized setup

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Pranavraut033/WebSecScan.git
cd WebSecScan
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:

- Next.js (React framework)
- Prisma (Database ORM)
- Playwright (Headless browser for dynamic testing)
- Cheerio (HTML parsing for static analysis)
- TypeScript and development tools

### 3. Set Up the Database

WebSecScan uses Prisma with SQLite by default. Initialize the database:

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. (Optional) Seed Test Data

To populate with sample scan data:

```bash
npm run seed
```

### 5. (Optional) Configure Environment

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Development
NODE_ENV=development

# Optional: For PostgreSQL instead of SQLite
# DATABASE_URL="postgresql://user:password@localhost:5432/websecscan"
```

---

## Running the Application

### Development Mode

Start the development server with hot-reloading:

```bash
npm run dev
```

The application will be available at **[http://localhost:3000](http://localhost:3000)**.

### Production Build

To create an optimized production build:

```bash
npm run build
npm start
```

### Docker Setup

Using Docker Compose:

```bash
docker-compose up --build
```

---

## Your First Scan

### 1. Open the Dashboard

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Configure a New Scan

You'll see the scan configuration form with these options:

| Option | Description |
|--------|-------------|
| **Target URL** | The website to scan (required) |
| **Scan Mode** | Choose `Static`, `Dynamic`, or `Both` |
| **Scan Mode Explanation** | See [Scanning Overview](scanning/overview.md) |

### 3. Review Safety Consent

The form includes an authorization check:

> "I have authorization to test this target"

**Check this box only if you own or have explicit written permission to scan the target.**

### 4. Start the Scan

Click **"Start Scan"** to begin.

You'll be redirected to the scan progress page, which displays **real-time logs** as the scan runs.

### 5. Review Results

Once complete, you'll see:

- **Vulnerabilities** found, grouped by severity
- **Security Score** (0-100, lower = more risk)
- **OWASP Category** mapping
- **Remediation Guidance** for each finding

---

## Example Scans

### Scan a Public Site (With Permission)

If you have a test environment or own a site:

```
Target URL: https://your-test-site.com
Scan Mode: Both (recommended)
```

### Scan a Local Application

If running your own app locally:

```
Target URL: http://localhost:8080
Scan Mode: Both
```

The scanner will crawl from this URL and test for vulnerabilities.

### Test Fixture (Vulnerable App)

The project includes intentionally vulnerable apps for testing:

```bash
# Build and run test fixture
cd test-fixtures
docker-compose up

# Then scan
Target URL: http://localhost:3001
Scan Mode: Both
```

---

## Troubleshooting

### "Cannot find module" Error

If you get module not found errors after installing:

```bash
# Regenerate Prisma client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Errors

If database migration fails:

```bash
# Reset the database (⚠️ clears all data)
npx prisma migrate reset

# Re-seed if desired
npm run seed
```

### Port Already in Use

If port 3000 is in use:

```bash
# Specify a different port
PORT=3001 npm run dev
```

### Scanner Timeout Issues

Dynamic scans may timeout on slow servers. Adjust in [crawler configuration](scanning/crawler.md):

```env
CRAWLER_TIMEOUT=20000  # 20 seconds
```

---

## Next Steps

Now that WebSecScan is running:

1. **[Learn About Features](features.md)** — Understand what you can do
2. **[Understanding Scans](scanning/overview.md)** — How static/dynamic modes work
3. **[API Reference](api/overview.md)** — Programmatic scanning
4. **[Deployment Guide](deployment.md)** — Setting up in production

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/Pranavraut033/WebSecScan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Pranavraut033/WebSecScan/discussions)
- **See Also**: [FAQ](faq.md) for common questions
