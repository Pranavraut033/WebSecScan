# Getting Started

This guide will help you set up and run WebSecScan on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **(Optional)** Docker for containerized deployment

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/pranavraut/WebSecScan.git
cd WebSecScan
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Next.js (Framework)
- Prisma (Database ORM)
- Playwright (Dynamic testing)
- Cheerio (HTML parsing)
- TypeScript and development tools

### 3. Set Up the Database

WebSecScan uses Prisma with SQLite by default. Initialize the database:

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. (Optional) Seed Test Data

To populate the database with sample scan data:

```bash
npm run seed
```

---

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

To create an optimized production build:

```bash
npm run build
npm start
```

---

## Your First Scan

### 1. Open the Dashboard

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Configure a New Scan

You'll see the scan configuration form with the following options:

- **Target URL** (Required): The website to scan
- **Scan Mode**: Choose from:
  - **Static Only**: Analyze source code patterns
  - **Dynamic Only**: Runtime behavior testing
  - **Both**: Comprehensive static + dynamic analysis

### 3. Review Safety Consent

!!! warning "Ethical Scanning"
    By starting a scan, you confirm that you:
    
    - Own the target website or have explicit permission to test it
    - Understand that unauthorized scanning may be illegal
    - Accept responsibility for the scan results

Check the consent box to proceed.

### 4. Start the Scan

Click **Start Scan**. You'll be redirected to the scan progress page.

### 5. View Results

Once the scan completes, you'll see:

- **Vulnerability Summary**: Count by severity (Critical, High, Medium, Low)
- **Detailed Findings**: Each vulnerability with:
  - Severity and confidence level
  - Affected file/URL location
  - Evidence snippet
  - Remediation guidance

---

## Understanding Scan Results

### Severity Levels

| Severity | Color | Description |
|----------|-------|-------------|
| **Critical** | 🔴 Red | Immediate action required; high exploitability |
| **High** | 🟠 Orange | Significant risk; should be fixed soon |
| **Medium** | 🟡 Yellow | Moderate risk; plan remediation |
| **Low** | 🔵 Blue | Minor issue; address when convenient |

### Confidence Levels

- **High**: Verified finding with strong evidence
- **Medium**: Likely issue but may require manual validation
- **Low**: Potential issue; further investigation recommended

---

## Running Tests

WebSecScan includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

See the [Testing Guide](testing.md) for detailed information.

---

## Docker Deployment

For containerized deployment:

```bash
# Build the Docker image
docker build -t websecscan .

# Run the container
docker run -p 3000:3000 websecscan
```

Or use Docker Compose:

```bash
docker-compose up
```

See [Deployment Guide](deployment.md) for production considerations.

---

## Quick Command Reference

```bash
# Development
npm run dev          # Start development server
npm run build        # Create production build
npm start            # Start production server

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate   # Run migrations
npx prisma studio    # Open Prisma Studio GUI

# Testing
npm test             # Run tests
npm run lint         # Run ESLint

# Docker
docker-compose up    # Start with Docker Compose
```

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
PORT=3001 npm run dev
```

### Database Connection Issues

Ensure the database file has proper permissions:

```bash
chmod 644 prisma/dev.db
```

### Playwright Installation

If dynamic testing fails, install Playwright browsers:

```bash
npx playwright install chromium
```

---

## Next Steps

- **[Explore Features](features.md)**: Learn about all scanning capabilities
- **[Understand Testing Coverage](testing-coverage.md)**: See what vulnerabilities we detect
- **[Read API Documentation](api.md)**: Integrate scanning into your workflow
- **[Contribute](development.md)**: Help improve WebSecScan

---

!!! tip "Need Help?"
    Check the [Development Guide](development.md) for detailed setup instructions and troubleshooting tips.
