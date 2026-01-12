# Deployment

Guide for deploying WebSecScan to production environments.

---

## 🐳 Docker Deployment

### Quick Start with Docker

The simplest way to deploy WebSecScan is using Docker:

```bash
# Build the image
docker build -t websecscan:latest .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/prod.db" \
  -e NODE_ENV="production" \
  --name websecscan \
  websecscan:latest
```

### Docker Compose

For a complete setup with PostgreSQL:

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/websecscan
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=websecscan
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy**:

```bash
docker-compose up -d
```

---

## 📦 Manual Deployment

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or SQLite for testing)
- Reverse proxy (Nginx/Caddy) for HTTPS

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/pranavraut/WebSecScan.git
cd WebSecScan

# Install dependencies
npm ci --production

# Build application
npm run build
```

### Step 2: Configure Database

**For PostgreSQL**:

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/websecscan"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

**For SQLite** (development only):

```bash
export DATABASE_URL="file:./prisma/prod.db"
npx prisma migrate deploy
npx prisma generate
```

### Step 3: Configure Environment

Create `.env.production`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/websecscan

# Application
NODE_ENV=production
PORT=3000

# Security (recommended)
NEXT_PUBLIC_API_URL=https://your-domain.com

# Optional: Enable logging
LOG_LEVEL=info
```

### Step 4: Start Application

```bash
# Start in production mode
NODE_ENV=production npm start
```

### Step 5: Set Up Process Manager

Use PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "websecscan" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

---

## 🌐 Reverse Proxy Configuration

### Nginx

```nginx
# /etc/nginx/sites-available/websecscan

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeout for long-running scans
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
}
```

**Enable and restart**:

```bash
sudo ln -s /etc/nginx/sites-available/websecscan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Caddy (Simpler Alternative)

```caddy
# Caddyfile

your-domain.com {
    reverse_proxy localhost:3000
    
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
}
```

**Start Caddy**:

```bash
caddy run
```

---

## ☁️ Cloud Platform Deployment

### Vercel (Recommended for Next.js)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Build**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**:
   ```
   DATABASE_URL=postgresql://...
   NODE_ENV=production
   ```

4. **Deploy**: Automatic on push to main branch

### Railway

1. **Create New Project**: [railway.app](https://railway.app)

2. **Add PostgreSQL Plugin**: From marketplace

3. **Deploy from GitHub**: Connect repository

4. **Configure**:
   ```bash
   # Build command
   npm run build && npx prisma migrate deploy
   
   # Start command
   npm start
   ```

### Heroku

```bash
# Create app
heroku create websecscan

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Configure buildpack
heroku buildpacks:set heroku/nodejs

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

---

## 🔐 Production Security Checklist

### Database Security

- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Restrict database access to application server only
- [ ] Regular backups configured
- [ ] Keep PostgreSQL updated

### Application Security

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only (no HTTP)
- [ ] Enable security headers (HSTS, CSP, etc.)
- [ ] Implement rate limiting
- [ ] Configure CORS appropriately
- [ ] Remove development dependencies

### Infrastructure Security

- [ ] Keep OS and packages updated
- [ ] Configure firewall (only ports 80, 443, 22)
- [ ] Use SSH keys (disable password auth)
- [ ] Enable automatic security updates
- [ ] Set up monitoring and alerting
- [ ] Regular security audits

---

## 📊 Monitoring & Logging

### Application Logging

Configure structured logging:

```typescript
// src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Check Endpoint

Add a health check endpoint:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Database connection failed'
    }, { status: 503 });
  }
}
```

### Monitoring Tools

**Recommended**: 

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Performance**: New Relic, DataDog
- **Logs**: Logtail, Papertrail

---

## 🔄 Continuous Deployment

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
        run: |
          echo "$SSH_PRIVATE_KEY" > deploy_key
          chmod 600 deploy_key
          
          ssh -i deploy_key -o StrictHostKeyChecking=no \
            $SERVER_USER@$SERVER_HOST \
            "cd /var/www/websecscan && \
             git pull origin main && \
             npm ci --production && \
             npm run build && \
             npx prisma migrate deploy && \
             pm2 restart websecscan"
```

---

## 🔧 Performance Optimization

### Caching Strategy

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};
```

### Database Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pooling
  relationMode = "prisma"
  pool_timeout = 30
  connection_limit = 10
}
```

### CDN Configuration

Use Vercel Edge Network or Cloudflare for:
- Static asset delivery
- DDoS protection
- Global distribution

---

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or cloud load balancer
2. **Session Storage**: Use Redis for session state
3. **Database**: PostgreSQL with read replicas
4. **Queue**: Add Redis/RabbitMQ for scan jobs

### Vertical Scaling

**Minimum Requirements**:
- 1 CPU core
- 1 GB RAM
- 10 GB disk

**Recommended Production**:
- 2+ CPU cores
- 4+ GB RAM
- 50+ GB disk (SSD)

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check connection
psql $DATABASE_URL

# Verify Prisma client
npx prisma generate
```

**Port Already in Use**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

**Build Failures**:
```bash
# Clear caches
rm -rf .next node_modules
npm install
npm run build
```

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## Next Steps

- **[Security & Ethics](security/security-ethics.md)**: Production security considerations
- **[Development Guide](development.md)**: Local development setup
- **[API Reference](api.md)**: API integration for custom deployments
