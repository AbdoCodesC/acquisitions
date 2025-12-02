# Quick Start Guide

Get the Acquisitions API running in Docker in under 5 minutes!

## 🚀 Development (with Neon Local)

### 1. Set up environment variables

```bash
# Copy the development template
cp .env.development .env

# Edit .env and add your Neon credentials:
# - NEON_API_KEY: Get from https://console.neon.tech/app/settings/api-keys
# - NEON_PROJECT_ID: Get from Project Settings → General
```

### 2. Start the application

```bash
docker compose -f docker-compose.dev.yml up --build
```

### 3. Run migrations

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### 4. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Sign up a user
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "role": "user"
  }'
```

### 5. Stop the application

```bash
docker compose -f docker-compose.dev.yml down
```

---

## 🌐 Production (with Neon Cloud)

### 1. Set up production environment

```bash
# Copy production template
cp .env.production .env.prod

# Edit .env.prod with your production Neon Cloud DATABASE_URL
# Get it from: https://console.neon.tech → Connection Details
```

### 2. Deploy to production

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### 3. Run migrations

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### 4. Monitor

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Check health
curl http://localhost:3000/health
```

---

## 📝 Common Commands

### Development
```bash
# Start (with live logs)
docker compose -f docker-compose.dev.yml up

# Start (detached)
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker compose -f docker-compose.dev.yml down -v

# Restart a service
docker compose -f docker-compose.dev.yml restart app

# Run migrations
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Generate migrations
docker compose -f docker-compose.dev.yml exec app npm run db:generate

# Open Drizzle Studio
docker compose -f docker-compose.dev.yml exec app npm run db:studio

# Access app shell
docker compose -f docker-compose.dev.yml exec app sh

# Access database
docker compose -f docker-compose.dev.yml exec neon-local psql -U neon -d neondb
```

### Production
```bash
# Start
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Stop
docker compose -f docker-compose.prod.yml down

# Restart
docker compose -f docker-compose.prod.yml restart app

# Run migrations
docker compose -f docker-compose.prod.yml exec app npm run db:migrate

# Monitor resources
docker stats acquisitions-app-prod
```

---

## 🔧 Troubleshooting

### "Cannot connect to database"
```bash
# Check if containers are running
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs neon-local
```

### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

### "Permission denied"
```bash
# Fix log directory permissions
mkdir -p logs
chmod 777 logs
```

### Start fresh
```bash
# Remove everything and rebuild
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

---

## 📚 Full Documentation

For complete documentation, see [DOCKER.md](./DOCKER.md)

---

## 🎯 What's Included?

- ✅ **Development**: Neon Local with hot-reload and ephemeral branches
- ✅ **Production**: Optimized build connecting to Neon Cloud
- ✅ **Security**: Non-root user, health checks, resource limits
- ✅ **Database**: Automatic migrations with Drizzle ORM
- ✅ **Logging**: Winston with JSON format for production
- ✅ **Volume Persistence**: Cached dependencies for faster rebuilds
