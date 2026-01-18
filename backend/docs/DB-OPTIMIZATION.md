# Database Optimization & Pagination Guide

## 📊 Database Optimization

### Índices Creados

Se han creado índices estratégicos para mejorar el rendimiento de las consultas:

#### Students Table
- `idx_students_email` - Búsqueda por email (login)
- `idx_students_class_id` - Filtrado por clase
- `idx_students_section_id` - Filtrado por sección
- `idx_students_status` - Filtrado por estado
- `idx_students_class_section` - Índice compuesto para consultas clase+sección
- `idx_students_admission_date` - Ordenamiento por fecha
- `idx_students_wallet_address` - Operaciones blockchain

#### Staff Table
- `idx_staff_email` - Login
- `idx_staff_department_id` - Filtrado por departamento
- `idx_staff_role` - Filtrado por rol
- `idx_staff_status` - Estado del staff

#### Other Tables
- Classes, Sections, Departments, Notices, Leave, Roles, Permissions, etc.
- Índices en foreign keys para mejores JOINs
- Índices compuestos para consultas frecuentes

### Connection Pooling

Configuración optimizada de pool de conexiones:

```javascript
const pool = new Pool({
  max: 20,              // Máximo 20 conexiones
  min: 2,               // Mínimo 2 conexiones
  idleTimeoutMillis: 30000,  // 30 segundos timeout
  connectionTimeoutMillis: 10000,  // 10 segundos para adquirir conexión
  maxUses: 7500,        // Reciclar después de 7500 usos
});
```

### Query Optimization

**Antes (N+1 problem):**
```javascript
const students = await findAllStudents();
for (const student of students) {
  const profile = await findProfile(student.id); // N+1!
}
```

**Después (JOIN optimizado):**
```javascript
SELECT u.*, p.*
FROM users u
INNER JOIN user_profiles p ON u.id = p.user_id
WHERE u.role_id = 3
ORDER BY u.id
LIMIT 10 OFFSET 0;
```

### Monitoreo de Performance

El sistema detecta automáticamente queries lentas:

```javascript
// Queries > 100ms se loguean como WARNING
if (duration > 100) {
  logger.warn('Slow query detected', { query, duration, rows });
}
```

### Aplicar Índices

```bash
# Ejecutar script de índices
cd backend
psql -U postgres -d school_mgmt < src/scripts/create-indexes.sql
```

---

## 📄 Sistema de Paginación

### Características

✅ **Paginación estándar** - page, limit, offset
✅ **Metadata completa** - totalPages, hasNext, hasPrevious
✅ **Ordenamiento** - sortBy, sortOrder (ASC/DESC)
✅ **Filtrado** - Parámetros personalizados por endpoint
✅ **Validación** - Límites configurables (default: 10, max: 100)

### Ejemplo de Uso

#### Request
```http
GET /api/v1/students?page=2&limit=20&sortBy=name&sortOrder=ASC&className=10A
```

#### Response
```json
{
  "data": [
    {
      "id": 21,
      "name": "Alice Johnson",
      "email": "alice@school.com",
      "className": "10A",
      "roll": "21"
    }
  ],
  "pagination": {
    "currentPage": 2,
    "itemsPerPage": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true,
    "nextPage": 3,
    "previousPage": 1
  }
}
```

### Parámetros de Query

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Número de página (min: 1) |
| `limit` | integer | 10 | Items por página (max: 100) |
| `sortBy` | string | 'id' | Campo de ordenamiento |
| `sortOrder` | string | 'ASC' | Orden: ASC o DESC |

### Implementación en Endpoints

#### 1. Controller
```javascript
const { parsePaginationParams, parseSortingParams } = require('../../utils/pagination');

const handleGetAllStudents = asyncHandler(async (req, res) => {
  const pagination = parsePaginationParams(req.query, { 
    defaultLimit: 10, 
    maxLimit: 100 
  });
  
  const sorting = parseSortingParams(
    req.query, 
    ['id', 'name', 'email'],  // Campos permitidos
    'id',   // Default field
    'ASC'   // Default order
  );
  
  const result = await getAllStudents({ ...pagination, ...sorting });
  res.json(result);
});
```

#### 2. Service
```javascript
const { buildPaginatedResponse } = require('../../utils/pagination');

const getAllStudents = async (payload) => {
  const { page, limit } = payload;
  
  // Ejecutar queries en paralelo para mejor performance
  const [students, total] = await Promise.all([
    findAllStudents(payload),
    countStudents(payload)
  ]);
  
  return buildPaginatedResponse(students, page, limit, total);
};
```

#### 3. Repository
```javascript
const findAllStudents = async (payload) => {
  const { page, limit, sortBy, sortOrder, ...filters } = payload;
  
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT u.*, p.*
    FROM users u
    INNER JOIN user_profiles p ON u.id = p.user_id
    WHERE u.role_id = 3
  `;
  
  // Agregar filtros dinámicamente
  const params = [];
  let paramIndex = 1;
  
  if (filters.name) {
    query += ` AND u.name ILIKE $${paramIndex}`;
    params.push(`%${filters.name}%`);
    paramIndex++;
  }
  
  // Ordenamiento y paginación
  query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const { rows } = await processDBRequest({ query, queryParams: params });
  return rows;
};

const countStudents = async (filters) => {
  // Query count con los mismos filtros
  let query = `SELECT COUNT(*) FROM users WHERE role_id = 3`;
  // ... aplicar mismos filtros
  const { rows } = await processDBRequest({ query, queryParams });
  return parseInt(rows[0].count, 10);
};
```

### Utilidades Disponibles

```javascript
// Parsear parámetros de paginación
parsePaginationParams(query, options)

// Parsear parámetros de ordenamiento
parseSortingParams(query, allowedFields, defaultField, defaultOrder)

// Parsear filtros
parseFilterParams(query, allowedFilters)

// Construir respuesta paginada
buildPaginatedResponse(data, page, limit, total)

// Construir WHERE clause dinámico
buildWhereClause(filters, startIndex)

// Middleware de paginación
paginationMiddleware(options)
```

### Swagger Documentation

Los endpoints paginados incluyen documentación completa:

```yaml
parameters:
  - name: page
    in: query
    schema:
      type: integer
      default: 1
      minimum: 1
  - name: limit
    in: query
    schema:
      type: integer
      default: 10
      minimum: 1
      maximum: 100
```

---

## 🚀 Performance Benefits

### Antes de las Optimizaciones

- ❌ Sin índices - Full table scans
- ❌ N+1 queries - Múltiples consultas por request
- ❌ Sin paginación - Carga de todos los registros
- ❌ Sin connection pooling - Conexión nueva por query

### Después de las Optimizaciones

- ✅ **Índices estratégicos** - Queries 10-100x más rápidas
- ✅ **JOINs optimizados** - 1 query en vez de N+1
- ✅ **Paginación** - Solo carga datos necesarios
- ✅ **Connection pooling** - Reutilización eficiente de conexiones
- ✅ **Query monitoring** - Detección automática de slow queries

### Métricas Estimadas

| Escenario | Antes | Después | Mejora |
|-----------|-------|---------|--------|
| GET /students (1000 records) | ~500ms | ~50ms | **10x** |
| GET /students?page=1&limit=10 | N/A | ~15ms | **Nuevo** |
| Query con filtros | ~200ms | ~20ms | **10x** |
| Conexiones simultáneas | 1-2 | 20 pooled | **10x** |

---

## 📚 Archivos Creados

1. **`backend/src/scripts/create-indexes.sql`** - Script de creación de índices
2. **`backend/src/config/db-pool.js`** - Connection pooling optimizado
3. **`backend/src/utils/pagination.js`** - Utilidades de paginación
4. **`backend/docs/DB-OPTIMIZATION.md`** - Esta guía

---

## 🔍 Verificar Mejoras

### Verificar índices creados
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### Ver estadísticas de uso de índices
```sql
SELECT 
  schemaname, tablename, indexname, 
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Ver queries lentas (logs)
```bash
tail -f backend/logs/combined.log | grep "Slow query"
```

### Probar paginación
```bash
# Primera página
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/students?page=1&limit=10"

# Con filtros y ordenamiento
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/students?page=1&limit=20&sortBy=name&sortOrder=ASC&className=10A"
```

---

## ⚡ Próximos Pasos

1. ✅ Aplicar índices en todas las tablas
2. ✅ Implementar paginación en `/students`
3. 🔄 Extender paginación a otros endpoints (staff, notices, leave)
4. 🔄 Implementar cursor-based pagination para datasets muy grandes
5. 🔄 Agregar caching con Redis en queries frecuentes
6. 🔄 Configurar query monitoring con pg_stat_statements
