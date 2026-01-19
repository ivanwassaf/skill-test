# Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying the School Management System to production.

## Prerequisites
- [ ] Docker and Docker Compose installed
- [ ] PostgreSQL database server accessible
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Backup system tested

## Pre-Deployment Checklist

### 1. Environment Preparation
```bash
# Verify Docker installation
docker --version
docker-compose --version

# Verify system resources
free -h  # Check available RAM (minimum 4GB recommended)
df -h    # Check available disk space (minimum 20GB recommended)

# Verify network connectivity
ping -c 3 google.com
```

### 2. Configuration Review
```bash
# Review environment variables
cd /path/to/project
cat .env | grep -v '^#' | grep -v '^$'

# Verify all required secrets are set
grep 'your_' .env  # Should return no matches in production
```

### 3. Database Preparation
```bash
# Create database backup before deployment
./scripts/backup-database.sh

# Verify backup
ls -lh backups/ | tail -5
```

## Deployment Steps

### Step 1: Pull Latest Code
```bash
# Navigate to project directory
cd /path/to/school-management-system

# Backup current version
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Pull latest code
git fetch origin
git checkout main
git pull origin main

# Verify correct version
git log -1 --oneline
```

### Step 2: Update Dependencies
```bash
# Update backend dependencies
cd backend
npm ci --only=production

# Update frontend dependencies
cd ../frontend
npm ci

# Return to root
cd ..
```

### Step 3: Build Docker Images
```bash
# Build all services
docker-compose build --no-cache

# Verify images
docker images | grep school_mgmt
```

### Step 4: Database Migration
```bash
# Run database migrations (if any)
docker-compose run --rm backend npm run migrate

# Verify database schema
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c "\dt"
```

### Step 5: Deploy Services
```bash
# Stop existing services
docker-compose down

# Start new services
docker-compose up -d

# Verify all services are running
docker-compose ps
```

### Step 6: Health Checks
```bash
# Wait for services to be ready
sleep 30

# Check backend health
curl http://localhost:5007/health

# Check frontend
curl -I http://localhost

# Check database
docker exec school_mgmt_db pg_isready -U postgres

# Check blockchain
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Step 7: Smoke Testing
```bash
# Test authentication
curl -X POST http://localhost:5007/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-secret-header: secret" \
  -d '{"email":"test@example.com","password":"Password@123"}'

# Test API endpoints
curl http://localhost:5007/api/v1/students \
  -H "Authorization: Bearer <token>" \
  -H "x-secret-header: secret"

# Check logs for errors
docker-compose logs --tail=50 backend | grep -i error
```

### Step 8: Monitoring Setup
```bash
# Verify logging
docker logs school_mgmt_backend --tail 20

# Check disk usage
docker system df

# Monitor resource usage
docker stats --no-stream
```

## Post-Deployment Verification

### 1. Functional Testing
- [ ] Login with test credentials
- [ ] Create a test student
- [ ] Issue a certificate
- [ ] Verify certificate
- [ ] Generate a PDF report
- [ ] Check API documentation at /api-docs

### 2. Performance Testing
- [ ] Verify response times < 200ms
- [ ] Check database query performance
- [ ] Monitor blockchain initialization time

### 3. Security Verification
- [ ] SSL certificate valid
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] Rate limiting functional
- [ ] CORS configured correctly

## Rollback Procedure

If deployment fails or critical issues are found:

```bash
# Stop new services
docker-compose down

# Restore previous version
tar -xzf backup-<timestamp>.tar.gz -C /tmp/restore
cp -r /tmp/restore/* .

# Restore database backup
./scripts/restore-database.sh backups/backup_school_mgmt_<timestamp>.sql.gz

# Start previous version
docker-compose up -d

# Verify rollback
curl http://localhost:5007/health
```

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Check port conflicts
netstat -tulpn | grep -E ":(5007|80|5432|8545)"

# Rebuild with no cache
docker-compose build --no-cache
docker-compose up -d --force-recreate
```

### Database Connection Issues
```bash
# Check database status
docker exec school_mgmt_db pg_isready -U postgres

# Check connection string
docker exec school_mgmt_backend env | grep DATABASE_URL

# Verify network
docker network inspect school-network
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Check slow queries
docker exec school_mgmt_db psql -U postgres -d school_mgmt \
  -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check logs for errors
docker logs school_mgmt_backend --tail=100 | grep -i error
```

## Contacts

- **DevOps Lead**: devops@company.com
- **Backend Team**: backend@company.com
- **On-Call**: oncall@company.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

## Document Information

- **Last Updated**: 2026-01-19
- **Version**: 1.0.0
- **Author**: DevOps Team
- **Review Date**: Every 3 months
