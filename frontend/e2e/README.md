# Frontend E2E Testing

Este directorio contiene pruebas End-to-End (E2E) para el frontend usando **Playwright**.

## 🎯 Propósito

Las pruebas E2E verifican la funcionalidad completa del sistema desde la perspectiva del usuario, interactuando con la interfaz real en un navegador.

## 📁 Estructura de Pruebas

- **auth.spec.ts**: Autenticación (login, logout, sesión)
- **students.spec.ts**: Módulo de estudiantes (listado, CRUD completo)
- **classes.spec.ts**: Módulo de clases (listado, CRUD completo)
- **departments.spec.ts**: Módulo de departamentos (listado, CRUD completo)
- **notices.spec.ts**: Módulo de noticias (listado, CRUD, selección de destinatarios)

## 🚀 Requisitos Previos

1. **Sistema corriendo con Docker**:
   ```bash
   cd skill-test
   docker-compose up -d
   ```

2. **Verificar servicios activos**:
   - Frontend: http://localhost
   - Backend: http://localhost:5007

3. **Datos sembrados**: Ejecutar seed de base de datos
   ```bash
   docker exec -it skill-test-db-1 psql -U postgres -d school -f /docker-entrypoint-initdb.d/seed-db.sql
   ```

## 🔧 Instalación

```bash
cd frontend
npm install
npx playwright install chromium
```

## ▶️ Ejecutar Pruebas

### Todas las pruebas
```bash
npm run test:e2e
```

### Modo UI (Interactivo)
```bash
npx playwright test --ui
```

### Pruebas específicas
```bash
# Solo autenticación
npx playwright test auth

# Solo estudiantes
npx playwright test students

# Solo clases
npx playwright test classes

# Solo departamentos
npx playwright test departments

# Solo noticias
npx playwright test notices
```

### Con navegador visible (headed mode)
```bash
npx playwright test --headed
```

### Modo debug
```bash
npx playwright test --debug
```

## 📊 Ver Reportes

```bash
npx playwright show-report
```

## 🧪 Cobertura de Pruebas

### Autenticación (auth.spec.ts)
- ✅ Mostrar página de login
- ✅ Mostrar error con credenciales inválidas
- ✅ Login exitoso con credenciales válidas
- ✅ Mantener sesión después de recargar
- ✅ Logout exitoso

### Estudiantes (students.spec.ts)
- ✅ Navegar a lista de estudiantes
- ✅ Mostrar estudiantes en la lista
- ✅ Abrir página de agregar estudiante
- ✅ Crear nuevo estudiante
- ✅ Ver detalles de estudiante
- ✅ Filtrar estudiantes por nombre
- ✅ Flujo completo CRUD: Crear → Ver → Actualizar

### Clases (classes.spec.ts)
- ✅ Navegar a lista de clases
- ✅ Mostrar clases en la lista
- ✅ Crear nueva clase
- ✅ Editar clase existente
- ✅ Flujo completo CRUD: Crear → Ver → Actualizar → Eliminar

### Departamentos (departments.spec.ts)
- ✅ Navegar a lista de departamentos
- ✅ Mostrar departamentos en la lista
- ✅ Crear nuevo departamento
- ✅ Editar departamento existente
- ✅ Ver detalles de departamento
- ✅ Flujo completo CRUD: Crear → Ver → Actualizar → Eliminar

### Noticias (notices.spec.ts)
- ✅ Navegar a lista de noticias
- ✅ Abrir página de agregar noticia sin error 404
- ✅ Cargar tipos de destinatarios sin error
- ✅ Crear noticia para destinatarios Admin
- ✅ Crear noticia para Teachers con selección de departamento
- ✅ Crear noticia para Students con selección de clase
- ✅ Ver detalles de noticia
- ✅ Flujo completo CRUD: Crear → Ver → Actualizar

## 🔐 Credenciales de Prueba

```
Email: admin@school-admin.com
Password: 3OU4zn3q6Zh9
```

## ⚠️ Notas Importantes

1. **Base de datos**: Las pruebas crean y modifican datos. Usar ambiente de desarrollo/testing.

2. **Orden de ejecución**: Playwright ejecuta pruebas en paralelo por defecto. La configuración actual usa `workers: 1` para ejecución secuencial.

3. **Timeouts**: Las pruebas tienen timeouts configurados para esperar carga de datos y navegación.

4. **Selectores flexibles**: Las pruebas usan selectores múltiples para adaptarse a diferentes implementaciones de UI.

5. **Limpieza**: Las pruebas CRUD que crean datos usan timestamps para evitar conflictos.

## 🐛 Troubleshooting

### Error: "Target closed"
- Verificar que el sistema esté corriendo: `docker-compose ps`
- Reiniciar servicios: `docker-compose restart`

### Error: "Timeout waiting for selector"
- Verificar que la URL base sea correcta en `playwright.config.ts`
- Incrementar timeout en la prueba específica
- Ejecutar con `--headed` para ver qué está pasando

### Error 404 en /api/v1/notices/recipients/list
- Verificar que la tabla `notice_recipient_types` tenga datos
- Ejecutar seed: `docker exec -it skill-test-db-1 psql -U postgres -d school -f /docker-entrypoint-initdb.d/seed-db.sql`

### Las pruebas fallan con credenciales
- Verificar que usas `3OU4zn3q6Zh9` (NO `Admin@1234`)
- Verificar que el usuario admin existe en la base de datos

## 📈 Comparación con Tests de Integración

| Aspecto | E2E (Frontend) | Integración (Backend) |
|---------|----------------|----------------------|
| Qué testea | UI real en navegador | APIs HTTP directamente |
| Tecnología | Playwright | Mocha + Chai + Supertest |
| Velocidad | Más lento | Más rápido |
| Cobertura | Experiencia completa del usuario | Lógica de negocio y APIs |
| Cuándo ejecutar | Pre-deploy, CI/CD | Desarrollo continuo, CI/CD |

## 🚀 Integración con CI/CD

```yaml
# Ejemplo para GitHub Actions
- name: Run E2E Tests
  run: |
    docker-compose up -d
    cd frontend
    npx playwright test
```

## 📝 Mejores Prácticas

1. **Page Object Model**: Considerar implementar POM para DRY
2. **Datos de prueba**: Usar factories o fixtures para datos consistentes
3. **Screenshots on failure**: Ya configurado en `playwright.config.ts`
4. **Video recording**: Activar en CI para debugging
5. **Parallel execution**: Desactivar si hay dependencias entre tests

## 🔗 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
