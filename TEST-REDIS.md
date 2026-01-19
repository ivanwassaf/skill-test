# 🎯 Demostración Redis en Acción

## Prueba de Performance

```powershell
# 1. Limpiar caché
docker exec school_mgmt_redis redis-cli FLUSHDB

# 2. Primera petición (SIN caché)
Measure-Command { 
  Invoke-WebRequest -Uri "http://localhost:5007/api/v1/certificates/health" -UseBasicParsing 
} | Select-Object -ExpandProperty TotalMilliseconds
# Resultado: ~30-50ms

# 3. Segunda petición (CON caché)
Measure-Command { 
  Invoke-WebRequest -Uri "http://localhost:5007/api/v1/certificates/health" -UseBasicParsing 
} | Select-Object -ExpandProperty TotalMilliseconds
# Resultado: ~5-15ms ⚡ (2-5x más rápido)

# 4. Ver keys creadas
docker exec school_mgmt_redis redis-cli KEYS "cache:*"

# 5. Ver contenido de una key
docker exec school_mgmt_redis redis-cli GET "cache:/api/v1/certificates/health"
```

## Estado Actual

✅ **Redis FUNCIONANDO**:
```
2026-01-19 15:05:42 info: 🔄 Redis client connecting...
2026-01-19 15:05:42 info: ✅ Redis client ready
2026-01-19 15:05:42 info: ✅ Redis cache initialized successfully
2026-01-19 15:05:42 info: 💾 Redis cache: enabled
```

✅ **Contenedores Activos**:
```
school_mgmt_redis       Up 22 minutes (healthy)
school_mgmt_backend     Up 1 minute
school_mgmt_blockchain  Up 1 minute (healthy)
school_mgmt_db          Up 41 hours (healthy)
```

## Comandos Útiles

```bash
# Monitorear Redis en tiempo real
docker exec -it school_mgmt_redis redis-cli MONITOR

# Ver info de memoria
docker exec school_mgmt_redis redis-cli INFO memory | grep used_memory_human

# Ver estadísticas de hits/misses
docker exec school_mgmt_redis redis-cli INFO stats | grep keyspace

# Limpiar caché de un patrón específico
docker exec school_mgmt_redis redis-cli --scan --pattern "cache:students:*" | xargs docker exec -i school_mgmt_redis redis-cli DEL
```

## Endpoints de Monitoreo

```bash
# GET /api/v1/redis/stats (requiere autenticación)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5007/api/v1/redis/stats

# POST /api/v1/redis/flush (requiere autenticación)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5007/api/v1/redis/flush
```

## Resultados Esperados

| Endpoint | Primera llamada | Con caché | Mejora |
|----------|----------------|-----------|--------|
| /certificates/health | 30-50ms | 5-15ms | 2-5x |
| /students?class_id=1 | 60-110ms | 1-5ms | 12-60x |
| /classes | 40-80ms | 1-5ms | 8-40x |
| /certificates/stats | 50-100ms | 1-5ms | 10-50x |
