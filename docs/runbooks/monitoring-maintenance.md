# Monitoring & Maintenance Runbook

## Overview
Regular maintenance tasks and monitoring procedures for the School Management System.

---

## Daily Tasks

### Morning Health Check (15 minutes)
```bash
# 1. Verify all services are running
docker-compose ps
# Expected: All services "Up" and "healthy"

# 2. Check application health
curl http://localhost:5007/health | jq .
# Expected: {"success":true,"status":"healthy"}

# 3. Check error logs from last 24 hours
docker logs --since 24h school_mgmt_backend | grep -i error | wc -l
# Expected: < 10 errors

# 4. Check database connections
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
# Expected: < 20 active connections

# 5. Check disk space
df -h | grep -E "/$|/var"
# Expected: < 80% usage

# 6. Check memory usage
free -h
# Expected: > 20% free memory

# 7. Check response times
time curl -s http://localhost:5007/api/v1/students > /dev/null
# Expected: < 200ms
```

**Action if Failed:**
- Log issue in incident tracker
- Follow incident response runbook
- Escalate if SEV1/SEV2

---

## Weekly Tasks

### Monday: Backup Verification (30 minutes)
```bash
# 1. List recent backups
ls -lh backups/ | tail -10

# 2. Verify latest backup integrity
LATEST_BACKUP=$(ls -t backups/*.sql.gz | head -1)
gzip -t $LATEST_BACKUP
echo "✓ Backup integrity verified: $LATEST_BACKUP"

# 3. Test backup restore (in test environment)
docker-compose -f docker-compose.test.yml up -d postgres-test
./scripts/restore-database.sh $LATEST_BACKUP
# Verify restore successful

# 4. Clean up test environment
docker-compose -f docker-compose.test.yml down -v
```

### Tuesday: Performance Review (45 minutes)
```bash
# 1. Check slow queries (> 1 second)
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT query, calls, total_time, mean_time, max_time 
   FROM pg_stat_statements 
   WHERE mean_time > 1000
   ORDER BY mean_time DESC 
   LIMIT 20;"

# 2. Review and add indexes if needed
# CREATE INDEX CONCURRENTLY idx_<table>_<column> ON <table>(<column>);

# 3. Check cache hit ratio
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT 
     sum(heap_blks_read) as heap_read,
     sum(heap_blks_hit) as heap_hit,
     sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
   FROM pg_statio_user_tables;"
# Expected: cache_hit_ratio > 0.99 (99%)

# 4. Analyze application performance
docker logs --since 24h school_mgmt_backend | grep "duration" | \
  awk '{print $NF}' | sort -n | tail -20
# Review slowest operations
```

### Wednesday: Security Audit (30 minutes)
```bash
# 1. Check for unauthorized access attempts
docker logs --since 7d school_mgmt_backend | grep -i "401\|403" | wc -l

# 2. Review rate limit violations
docker logs --since 7d school_mgmt_backend | grep "RATE_LIMIT_EXCEEDED" | wc -l

# 3. Check for SQL injection attempts
docker logs --since 7d school_mgmt_backend | grep -iE "(\bUNION\b|\bDROP\b|\bDELETE\b.*WHERE.*=)" | wc -l

# 4. Verify SSL certificates expiration
openssl s_client -connect localhost:443 -servername yourdomain.com 2>/dev/null | \
  openssl x509 -noout -dates

# 5. Check for outdated dependencies
cd backend && npm audit
cd ../frontend && npm audit
```

### Thursday: Log Analysis (30 minutes)
```bash
# 1. Analyze error patterns
docker logs --since 7d school_mgmt_backend | \
  grep "Error:" | \
  awk -F 'Error:' '{print $2}' | \
  sort | uniq -c | sort -rn | head -10

# 2. Check API endpoint usage
docker logs --since 7d school_mgmt_backend | \
  grep "HTTP" | \
  awk '{print $7}' | \
  sort | uniq -c | sort -rn | head -10

# 3. Identify slow endpoints
docker logs --since 7d school_mgmt_backend | \
  grep "duration" | \
  awk '{print $7, $NF}' | \
  sort -k2 -n | tail -20

# 4. Archive old logs
find backend/logs -name "*.log" -mtime +30 -exec gzip {} \;
find backend/logs -name "*.log.gz" -mtime +90 -delete
```

### Friday: Capacity Planning (30 minutes)
```bash
# 1. Review database size growth
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT 
     pg_database.datname,
     pg_size_pretty(pg_database_size(pg_database.datname)) AS size
   FROM pg_database
   ORDER BY pg_database_size(pg_database.datname) DESC;"

# 2. Check table sizes
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT 
     relname AS table_name,
     pg_size_pretty(pg_total_relation_size(relid)) AS total_size
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC
   LIMIT 10;"

# 3. Project storage needs for next 3 months
# Based on current growth rate

# 4. Review and update capacity plan
```

---

## Monthly Tasks

### First Monday: System Updates (2 hours)
```bash
# 1. Create full system backup
./scripts/backup-database.sh
docker commit school_mgmt_backend school_mgmt_backend_backup
docker commit school_mgmt_frontend school_mgmt_frontend_backup

# 2. Update system packages
apt-get update
apt-get upgrade -y

# 3. Update Docker
apt-get install docker-ce docker-ce-cli containerd.io -y

# 4. Update Node.js dependencies (in test environment first)
cd backend
npm outdated
npm update

# 5. Run security audits
npm audit fix

# 6. Update Docker images
docker-compose pull
docker-compose build --no-cache

# 7. Test in staging
docker-compose -f docker-compose.staging.yml up -d
# Run smoke tests

# 8. Deploy to production
docker-compose down
docker-compose up -d

# 9. Verify deployment
./scripts/post-deployment-tests.sh
```

### Mid-Month: Database Maintenance (1 hour)
```bash
# 1. Analyze database for statistics
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c "ANALYZE VERBOSE;"

# 2. Vacuum database
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c "VACUUM VERBOSE;"

# 3. Reindex if needed
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "REINDEX DATABASE school_mgmt;"

# 4. Check for bloat
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
   FROM pg_tables 
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
   LIMIT 10;"

# 5. Update statistics
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT pg_stat_reset();"
```

### End of Month: Reporting (2 hours)
```bash
# 1. Generate uptime report
# Calculate from logs/monitoring

# 2. Generate performance report
# - Average response times
# - Error rates
# - Database query performance

# 3. Generate security report
# - Failed login attempts
# - Rate limit violations
# - Audit log summary

# 4. Generate capacity report
# - Storage usage
# - Memory usage
# - Database size
# - User growth

# 5. Create executive summary
# Present to stakeholders
```

---

## Quarterly Tasks

### System Audit (4 hours)
- [ ] Review all runbook procedures
- [ ] Update documentation
- [ ] Review disaster recovery plan
- [ ] Test backup/restore procedures end-to-end
- [ ] Conduct security penetration testing
- [ ] Review and update monitoring thresholds
- [ ] Capacity planning for next 12 months
- [ ] Review and renew SSL certificates
- [ ] Update on-call rotation schedule

### Disaster Recovery Drill (2 hours)
```bash
# 1. Simulate total system failure
docker-compose down -v

# 2. Restore from backups
./scripts/restore-database.sh backups/latest_backup.sql.gz

# 3. Redeploy services
docker-compose up -d

# 4. Verify functionality
./scripts/smoke-tests.sh

# 5. Document lessons learned
```

---

## Monitoring Dashboards

### Key Metrics to Monitor

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| API Response Time | > 500ms | Warning |
| API Response Time | > 2000ms | Critical |
| Error Rate | > 1% | Warning |
| Error Rate | > 5% | Critical |
| Database Connections | > 80 | Warning |
| Database Connections | > 95 | Critical |
| CPU Usage | > 70% | Warning |
| CPU Usage | > 90% | Critical |
| Memory Usage | > 80% | Warning |
| Memory Usage | > 95% | Critical |
| Disk Usage | > 80% | Warning |
| Disk Usage | > 90% | Critical |

---

## Useful Monitoring Commands

```bash
# Real-time logs
docker-compose logs -f

# Service health
watch -n 5 'docker-compose ps'

# Resource usage
watch -n 5 'docker stats --no-stream'

# Database connections
watch -n 5 'docker exec school_mgmt_db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"'

# Error rate
watch -n 5 'docker logs --since 5m school_mgmt_backend 2>&1 | grep -c "error"'

# Response times
while true; do 
  time curl -s http://localhost:5007/health > /dev/null
  sleep 5
done
```

---

## Document Information

- **Last Updated**: 2026-01-19
- **Version**: 1.0.0
- **Author**: DevOps Team
- **Review Schedule**: Quarterly
- **Next Review**: 2026-04-19
