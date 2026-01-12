# Deployment

Production deployment guide for WebSecScan.

---

## Quick Start: Docker Compose

The easiest way to deploy:

```bash
# Clone
git clone https://github.com/Pranavraut033/WebSecScan.git
cd WebSecScan

# Deploy
docker-compose up -d
```

Application is available at **http://localhost:3000**

---

## Docker Compose Setup

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
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

### Configuration

Edit environment variables:

```env
# Database connection
DATABASE_URL=postgresql://user:password@db:5432/websecscan

# Security
NODE_ENV=production

# Optional: API rate limiting
API_RATE_LIMIT=100  # requests per minute
MAX_CONCURRENT_SCANS=5
SCAN_TIMEOUT=300    # seconds
```

### Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop
docker-compose down
```

---

## Manual Deployment

For non-Docker environments:

### 1. Install Dependencies

```bash
# Install Node.js 18+ and PostgreSQL

# Clone repository
git clone https://github.com/Pranavraut033/WebSecScan.git
cd WebSecScan

# Install packages
npm install

# Generate Prisma client
npx prisma generate
```

### 2. Configure Database

Create PostgreSQL database:

```sql
CREATE DATABASE websecscan;
CREATE USER websecscan WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE websecscan TO websecscan;
```

Create `.env.production`:

```env
DATABASE_URL="postgresql://websecscan:secure_password@localhost:5432/websecscan"
NODE_ENV=production
```

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

### 4. Build Application

```bash
npm run build
```

### 5. Start Application

```bash
npm start
```

Application runs on port 3000. Set up reverse proxy (Nginx).

---

## HTTPS & Reverse Proxy (Nginx)

### Nginx Configuration

Create `/etc/nginx/sites-available/websecscan`:

```nginx
upstream websecscan {
  server localhost:3000;
}

server {
  listen 80;
  server_name scanner.example.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name scanner.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  location / {
    proxy_pass http://websecscan;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # SSE streaming (real-time logs)
  location /api/scan/*/logs {
    proxy_pass http://websecscan;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
  }
}
```

### Enable & Test

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/websecscan \
  /etc/nginx/sites-enabled/websecscan

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Get SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d scanner.example.com
```

---

## Security Hardening

### 1. Add API Authentication

Implement API key validation in `src/api/middleware/auth.ts`:

```typescript
export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === process.env.API_KEY;
}
```

Update `.env.production`:

```env
API_KEY=your_secure_random_key_here
```

### 2. Enable Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### 3. Database Security

```sql
-- Create restricted user for app
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE websecscan TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

### 4. Environment Security

Never commit secrets:

```bash
# .gitignore
.env
.env.local
.env.production
```

Use secure secret management:
- Environment variables
- Secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Docker Secrets (if using swarm/compose)

### 5. Logging & Monitoring

Enable audit logging:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Log scan requests
logger.info('Scan initiated', { scanId, url, userId, timestamp });
```

---

## Health Checks

For monitoring and load balancers:

```typescript
// GET /api/health
export async function GET() {
  try {
    // Check database
    await prisma.scan.count();
    
    return Response.json({ status: 'healthy' }, { status: 200 });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

Kubernetes example:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Backup & Recovery

### Database Backups

```bash
# Backup PostgreSQL
pg_dump websecscan > backup.sql

# Restore
psql websecscan < backup.sql

# Or using Docker
docker-compose exec db pg_dump -U postgres websecscan > backup.sql
```

Schedule automated backups:

```bash
# Daily backup cron
0 2 * * * pg_dump websecscan > /backups/websecscan-$(date +\%Y\%m\%d).sql
```

### Data Retention

Set retention policy:

```sql
-- Delete scans older than 90 days
DELETE FROM "Scan" WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Database Connection Fails

```bash
# Test connection
psql postgresql://user:password@host:5432/database

# Check Docker Postgres is running
docker-compose logs db

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Prisma Migration Issues

```bash
# Reset database (⚠️ clears all data)
npx prisma migrate reset --force

# Redeploy migrations
npx prisma migrate deploy
```

### Nginx Proxy Issues

```bash
# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Reload Nginx
sudo systemctl reload nginx
```

---

## Monitoring Checklist

- [ ] SSL/TLS enabled and valid
- [ ] Reverse proxy configured
- [ ] Database backups running
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Health checks working
- [ ] Error monitoring (Sentry, DataDog, etc.)
- [ ] Performance monitoring
- [ ] Uptime monitoring (StatusCake, Pingdom, etc.)

---

## Next Steps

- **[Security & Ethics](../security/ethics-and-authorization.md)** — Audit logging and compliance
- **[Development Setup](../development/setup.md)** — For contributors
- **[FAQ](../faq.md)** — Common deployment questions
