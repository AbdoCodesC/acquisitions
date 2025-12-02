# Docker Deployment Guide

This guide explains how to run the Acquisitions API using Docker in both development and production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Development Setup (Neon Local)](#development-setup-neon-local)
- [Production Setup (Neon Cloud)](#production-setup-neon-cloud)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Prerequisites

### Required Tools
- **Docker Desktop** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Neon Account** (https://neon.tech)

### Neon Setup
1. Create a Neon account at https://console.neon.tech
2. Create a new project
3. Get your API credentials:
   - **API Key**: Settings → API Keys → Generate new key
   - **Project ID**: Project Settings → General

## Architecture Overview

### Development Environment
```
┌─────────────────────────────────────────────────────┐
│  Your Machine                                        │
│                                                      │
│  ┌──────────────┐         ┌──────────────────────┐ │
│  │   App        │────────▶│   Neon Local         │ │
│  │ Container    │         │   (PostgreSQL)       │ │
│  │ Port: 3000   │         │   Port: 5432         │ │
│  └──────────────┘         └──────────────────────┘ │
│         │                           │               │
│         │                           │               │
│    Hot Reload               Ephemeral Branches      │
│    (Volume Mount)           (Auto-created)          │
└─────────────────────────────────────────────────────┘
         │
         │ Syncs schema with
         ▼
┌─────────────────────┐
│   Neon Cloud        │
│   (Production DB)   │
└─────────────────────┘
```

### Production Environment
```
┌─────────────────────────────────────────────────────┐
│  Production Server                                   │
│                                                      │
│  ┌──────────────┐                                   │
│  │   App        │                                   │
│  │ Container    │                                   │
│  │ Port: 3000   │                                   │
│  └──────┬───────┘                                   │
└─────────┼───────────────────────────────────────────┘
          │
          │ HTTPS/SSL Connection
          ▼
┌─────────────────────┐
│   Neon Cloud        │
│ (Serverless Postgres│
│   *.neon.tech)      │
└─────────────────────┘
```

## Development Setup (Neon Local)

### Step 1: Configure Environment Variables

Copy the development environment template:
```bash
cp .env.development .env
```

Edit `.env` and add your Neon credentials:
```bash
# Required
NEON_API_KEY=neon_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEON_PROJECT_ID=your-project-id-here

# Optional - will use defaults if not set
JWT_SECRET=your-dev-secret
LOG_LEVEL=debug
```

**Where to find these values:**
- `NEON_API_KEY`: https://console.neon.tech/app/settings/api-keys
- `NEON_PROJECT_ID`: Project Settings → General → Project ID

### Step 2: Start Development Environment

```bash
# Build and start all services
docker compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker compose -f docker-compose.dev.yml up -d
```

**What happens:**
1. **Neon Local** container starts and creates an ephemeral branch
2. **App container** waits for database to be healthy
3. Application connects to `postgres://neon:npg@neon-local:5432/neondb`
4. Hot-reload is enabled - code changes automatically restart the server

### Step 3: Run Database Migrations

```bash
# Generate migration from schema changes
docker compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations to Neon Local
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Step 4: Access the Application

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Drizzle Studio**: 
  ```bash
  docker compose -f docker-compose.dev.yml exec app npm run db:studio
  ```

### Step 5: Stop Development Environment

```bash
# Stop and remove containers
docker compose -f docker-compose.dev.yml down

# Stop and remove containers + volumes (clean slate)
docker compose -f docker-compose.dev.yml down -v
```

### Development Features

✅ **Hot Reload**: Code changes automatically restart the server  
✅ **Ephemeral Branches**: Fresh database copy on each startup  
✅ **Local Development**: No internet required after initial setup  
✅ **Schema Sync**: Mirrors your production Neon database structure  
✅ **Volume Persistence**: Dependencies cached for faster rebuilds  

## Production Setup (Neon Cloud)

### Step 1: Configure Production Environment

Copy the production environment template:
```bash
cp .env.production .env.prod
```

Edit `.env.prod` with your production values:
```bash
NODE_ENV=production
LOG_LEVEL=info

# Production Neon Cloud connection string
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require

# Strong JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secure-production-secret-key
```

**Get your production `DATABASE_URL`:**
1. Go to https://console.neon.tech
2. Select your project
3. Click "Connection Details"
4. Copy the connection string

### Step 2: Deploy to Production

```bash
# Build and start production container
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Check health
curl http://localhost:3000/health
```

### Step 3: Run Production Migrations

```bash
# Apply migrations to production database
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Step 4: Monitor Production

```bash
# View real-time logs
docker compose -f docker-compose.prod.yml logs -f app

# Check container health
docker compose -f docker-compose.prod.yml ps

# View resource usage
docker stats acquisitions-app-prod
```

### Production Features

✅ **Optimized Build**: Multi-stage Docker build (smaller image)  
✅ **Non-root User**: Runs as unprivileged user (security)  
✅ **Health Checks**: Automatic container restart on failure  
✅ **Resource Limits**: CPU and memory constraints  
✅ **Production Logging**: JSON format for log aggregation  
✅ **Direct Neon Cloud**: Connects to serverless Postgres  

## Database Migrations

### Development Workflow

```bash
# 1. Modify schema in src/models/*.js
# Example: Add a new field to user.model.js

# 2. Generate migration
docker compose -f docker-compose.dev.yml exec app npm run db:generate

# 3. Review generated SQL in drizzle/ folder

# 4. Apply to Neon Local
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# 5. Test your changes
curl http://localhost:3000/api/auth/sign-up -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"12345678"}'
```

### Production Deployment

```bash
# 1. Ensure migrations work in development first

# 2. Apply to production
docker compose -f docker-compose.prod.yml exec app npm run db:migrate

# 3. Verify migration
docker compose -f docker-compose.prod.yml logs app | grep "migration"
```

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to Neon Local"

**Symptoms:**
```
Error: getaddrinfo ENOTFOUND neon-local
```

**Solutions:**
- Ensure Neon Local container is healthy: `docker compose -f docker-compose.dev.yml ps`
- Check logs: `docker compose -f docker-compose.dev.yml logs neon-local`
- Verify `NEON_API_KEY` and `NEON_PROJECT_ID` are set correctly

#### 2. "NEON_API_KEY is required"

**Symptoms:**
```
Error: NEON_API_KEY environment variable is required
```

**Solutions:**
- Create API key at https://console.neon.tech/app/settings/api-keys
- Add to `.env` file: `NEON_API_KEY=neon_api_xxx`
- Restart containers: `docker compose -f docker-compose.dev.yml restart`

#### 3. "Hot reload not working"

**Symptoms:**
Code changes don't trigger server restart

**Solutions:**
- Check volume mounts: `docker compose -f docker-compose.dev.yml config`
- Verify Node.js `--watch` is working: `docker compose -f docker-compose.dev.yml logs app`
- On Mac: Ensure Docker Desktop uses gRPC FUSE (not VirtioFS)
  - Docker Desktop → Settings → General → Choose file sharing implementation

#### 4. "Permission denied" errors

**Symptoms:**
```
Error: EACCES: permission denied, mkdir '/app/logs'
```

**Solutions:**
```bash
# Fix log directory permissions
mkdir -p logs
chmod 777 logs

# Rebuild containers
docker compose -f docker-compose.dev.yml up --build
```

#### 5. Port already in use

**Symptoms:**
```
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Debug Commands

```bash
# View all container logs
docker compose -f docker-compose.dev.yml logs -f

# Access app container shell
docker compose -f docker-compose.dev.yml exec app sh

# Access Neon Local container shell
docker compose -f docker-compose.dev.yml exec neon-local sh

# Connect to Neon Local database
docker compose -f docker-compose.dev.yml exec neon-local psql -U neon -d neondb

# Rebuild without cache
docker compose -f docker-compose.dev.yml build --no-cache

# Remove all volumes and start fresh
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

## Best Practices

### Security

1. **Never commit `.env` files** with real credentials
   ```bash
   # Ensure .env is in .gitignore
   echo ".env" >> .gitignore
   echo ".env.*" >> .gitignore
   ```

2. **Use strong JWT secrets** in production
   ```bash
   # Generate secure secret
   openssl rand -base64 32
   ```

3. **Rotate API keys** regularly in Neon console

4. **Use environment-specific files**
   - Development: `.env.development`
   - Production: `.env.production` (never commit!)

### Performance

1. **Use Docker volumes** for faster rebuilds
   ```yaml
   volumes:
     - node_modules:/app/node_modules  # Cache dependencies
   ```

2. **Multi-stage builds** reduce image size (already configured)

3. **Resource limits** prevent memory leaks
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build production image
        run: docker build -t acquisitions-api --target production .
      
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          docker run --rm \
            -e DATABASE_URL=$DATABASE_URL \
            acquisitions-api \
            npm run db:migrate
      
      - name: Deploy to server
        # Your deployment steps here
```

### Monitoring

```bash
# Production health monitoring
while true; do
  curl -f http://localhost:3000/health || echo "Health check failed!"
  sleep 30
done

# Container resource monitoring
docker stats acquisitions-app-prod

# Log aggregation (example with JSON logs)
docker compose -f docker-compose.prod.yml logs app --tail=100 | jq .
```

## Environment Variables Reference

### Development (.env.development)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEON_API_KEY` | ✅ Yes | - | Neon API key for Neon Local |
| `NEON_PROJECT_ID` | ✅ Yes | - | Your Neon project ID |
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `LOG_LEVEL` | No | `debug` | Winston log level |
| `JWT_SECRET` | No | Default | JWT signing secret |
| `DATABASE_URL` | Auto | Auto-set | Connection to Neon Local |

### Production (.env.production)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | Neon Cloud connection string |
| `JWT_SECRET` | ✅ Yes | - | Strong production secret |
| `NODE_ENV` | No | `production` | Must be `production` |
| `PORT` | No | `3000` | Server port |
| `LOG_LEVEL` | No | `info` | Winston log level |

## Additional Resources

- **Neon Local Documentation**: https://neon.com/docs/local/neon-local
- **Neon API Keys**: https://console.neon.tech/app/settings/api-keys
- **Docker Compose Reference**: https://docs.docker.com/compose/
- **Drizzle ORM**: https://orm.drizzle.team/

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Neon Local docs: https://neon.com/docs/local
3. Check Docker logs: `docker compose logs -f`
