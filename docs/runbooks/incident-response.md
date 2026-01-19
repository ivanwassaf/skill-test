# Incident Response Runbook

## Overview
This runbook provides procedures for responding to and resolving incidents in the School Management System.

## Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **SEV1** | System down, data loss | Immediate | CTO, CEO |
| **SEV2** | Major feature broken | < 30 min | Engineering Lead |
| **SEV3** | Minor feature degraded | < 2 hours | Team Lead |
| **SEV4** | Minor issue, no impact | < 1 day | Assigned Engineer |

---

## Common Incidents

### 1. Application Not Responding (SEV1)

**Symptoms:**
- HTTP 502/503 errors
- No response from API
- Users cannot access system

**Diagnosis:**
```bash
# Check if services are running
docker-compose ps

# Check service health
curl -I http://localhost:5007/health
curl -I http://localhost

# Check logs
docker logs school_mgmt_backend --tail=50
docker logs school_mgmt_frontend --tail=50

# Check resource usage
docker stats --no-stream
```

**Resolution:**
```bash
# Restart services
docker-compose restart backend frontend

# If that fails, full restart
docker-compose down
docker-compose up -d

# Verify recovery
curl http://localhost:5007/health
```

**Root Cause Analysis:**
- [ ] Check error logs
- [ ] Review recent deployments
- [ ] Check system resources
- [ ] Review monitoring dashboards

---

### 2. Database Connection Failures (SEV1)

**Symptoms:**
- "Cannot connect to database" errors
- Timeout errors
- 500 errors on all endpoints

**Diagnosis:**
```bash
# Check database status
docker ps | grep postgres

# Check database health
docker exec school_mgmt_db pg_isready -U postgres

# Check connection pool
docker logs school_mgmt_backend | grep "database"

# Check active connections
docker exec school_mgmt_db psql -U postgres -d school_mgmt \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution:**
```bash
# Restart database
docker-compose restart postgres

# If database is corrupted, restore from backup
./scripts/restore-database.sh backups/latest_backup.sql.gz

# Restart dependent services
docker-compose restart backend

# Verify connections
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c "SELECT 1;"
```

---

### 3. High Response Times (SEV2)

**Symptoms:**
- API responses > 5 seconds
- User complaints about slowness
- Timeout errors

**Diagnosis:**
```bash
# Check response times
time curl http://localhost:5007/api/v1/students

# Check slow queries
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;"

# Check CPU/Memory usage
docker stats --no-stream

# Check disk I/O
docker exec school_mgmt_db iostat -x 1 5
```

**Resolution:**
```bash
# Scale up services (if using Docker Swarm/Kubernetes)
docker-compose up -d --scale backend=3

# Clear cache
docker exec school_mgmt_backend redis-cli FLUSHALL

# Optimize slow queries (see query output above)

# Add indexes if needed
docker exec school_mgmt_db psql -U postgres -d school_mgmt -c \
  "CREATE INDEX CONCURRENTLY idx_users_email ON users(email);"
```

---

### 4. Blockchain Service Unavailable (SEV2)

**Symptoms:**
- Certificate operations failing
- "Blockchain not initialized" errors
- Transaction timeouts

**Diagnosis:**
```bash
# Check blockchain service
docker logs school_mgmt_blockchain --tail=50

# Check RPC endpoint
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check contract deployment
docker exec school_mgmt_blockchain ls -la deployments/
```

**Resolution:**
```bash
# Restart blockchain service
docker-compose restart blockchain

# If contract not deployed, redeploy
docker-compose up -d --force-recreate blockchain

# Wait for initialization
sleep 10

# Verify contract address
docker logs school_mgmt_blockchain | grep "Contract address"

# Restart backend to reconnect
docker-compose restart backend
```

---

### 5. High Error Rate (SEV2)

**Symptoms:**
- Error rate > 5%
- Multiple 500 errors in logs
- Failed transactions

**Diagnosis:**
```bash
# Check error logs
docker logs school_mgmt_backend --tail=200 | grep -i error

# Check error distribution
docker logs school_mgmt_backend | grep "HTTP" | \
  awk '{print $9}' | sort | uniq -c | sort -rn

# Check specific error patterns
docker logs school_mgmt_backend | grep "Error:" | tail -20
```

**Resolution:**
```bash
# Identify error patterns
# Fix code if needed
# Deploy hotfix

# Restart affected services
docker-compose restart backend

# Monitor error rate
watch -n 5 'docker logs school_mgmt_backend --since 5m | grep -c "error"'
```

---

### 6. Disk Space Full (SEV1)

**Symptoms:**
- "No space left on device" errors
- Cannot write logs
- Database insert failures

**Diagnosis:**
```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Find large files
du -h / | sort -rh | head -20

# Check log sizes
du -sh /var/log/*
du -sh backend/logs/*
```

**Resolution:**
```bash
# Clean Docker resources
docker system prune -a --volumes

# Clean old logs
find backend/logs -name "*.log" -mtime +7 -delete

# Clean old backups
find backups -name "*.sql.gz" -mtime +30 -delete

# Verify space freed
df -h
```

---

### 7. Memory Leak (SEV2)

**Symptoms:**
- Memory usage continuously increasing
- OOM (Out of Memory) errors
- Services restarting unexpectedly

**Diagnosis:**
```bash
# Monitor memory usage
docker stats --no-stream

# Check for memory leaks in Node.js
docker exec school_mgmt_backend node --expose-gc -e \
  "setInterval(() => { console.log(process.memoryUsage()); global.gc(); }, 1000);"

# Check heap snapshots (if profiling enabled)
docker exec school_mgmt_backend curl http://localhost:5007/heapdump
```

**Resolution:**
```bash
# Immediate: Restart service
docker-compose restart backend

# Long-term: Investigate code
# - Review recent changes
# - Check for unclosed connections
# - Review event listener leaks

# Set memory limits
docker-compose down
# Add to docker-compose.yml:
#   backend:
#     mem_limit: 2g

docker-compose up -d
```

---

## Escalation Procedures

### SEV1 Escalation
1. **0-5 min**: Engineer attempts resolution
2. **5-10 min**: Notify Team Lead
3. **10-15 min**: Notify Engineering Manager
4. **15-30 min**: Notify CTO
5. **30+ min**: Notify CEO, initiate disaster recovery

### Communication Template
```
INCIDENT: [Brief description]
SEVERITY: SEV[1-4]
IMPACT: [Number of users affected, % downtime]
STATUS: [Investigating/Resolving/Resolved]
ETA: [Expected resolution time]
ACTIONS: [What has been done/will be done]
OWNER: [Person responsible]
```

---

## Post-Incident Review

Within 48 hours of SEV1/SEV2 incidents:

1. **Timeline**: Document exact sequence of events
2. **Root Cause**: Identify underlying cause(s)
3. **Impact**: Quantify user/business impact
4. **Resolution**: Document what fixed it
5. **Prevention**: Action items to prevent recurrence
6. **Follow-up**: Assign owners and deadlines

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Engineer | - | - | oncall@company.com |
| Team Lead | - | - | teamlead@company.com |
| Engineering Manager | - | - | manager@company.com |
| CTO | - | - | cto@company.com |
| Database Admin | - | - | dba@company.com |
| Infrastructure | - | - | infra@company.com |

---

## Useful Commands Quick Reference

```bash
# Service status
docker-compose ps

# Recent logs
docker-compose logs --tail=50 --follow

# Resource usage
docker stats

# Restart everything
docker-compose restart

# Full reboot
docker-compose down && docker-compose up -d

# Database backup
./scripts/backup-database.sh

# Database restore
./scripts/restore-database.sh <backup-file>

# Clean resources
docker system prune -a
```

---

## Document Information

- **Last Updated**: 2026-01-19
- **Version**: 1.0.0
- **Author**: DevOps Team
- **Review Date**: Monthly or after each SEV1/SEV2 incident
