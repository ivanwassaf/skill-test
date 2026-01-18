# 🧪 GUÍA DE PRUEBA - Sistema de Certificados Blockchain

## ⚡ Prueba Rápida (Sin Blockchain - Modo Simulación)

### Opción 1: Probar sin Blockchain (Recomendado para Primera Vez)

El sistema funciona en "modo degradado" cuando no está configurado blockchain. Los endpoints responderán con mensajes informativos.

#### Pasos:

1. **Accede al frontend**: http://localhost (o http://localhost:5173 si no usas Docker)

2. **Login**: 
   - Email: `admin@school-admin.com`
   - Password: `3OU4zn3q6Zh9`

3. **Ve a la lista de estudiantes**: `/app/students`

4. **Click en el menú (3 puntos) de cualquier estudiante**
   - Verás la opción "Issue Certificate" (con ícono de certificado)
   - Click en "Issue Certificate"

5. **Llenar el formulario**:
   - Certificate Type: Selecciona "Academic Excellence"
   - Achievement: "Outstanding performance in all subjects during 2024"
   - Additional Info: (Opcional) `{"grade": "A+", "year": "2024"}`

6. **Resultado esperado (SIN blockchain configurado)**:
   - Error: "Blockchain service not available"
   - Esto es **NORMAL** - significa que el frontend y backend están comunicándose correctamente

---

## 🚀 Prueba Completa (Con Blockchain Local)

### Requisitos:
- Node.js 16+
- Hardhat node corriendo

### Paso 1: Iniciar Nodo Hardhat (Terminal 1)

```bash
cd blockchain
npx hardhat node
```

**Deja esta terminal abierta** - el nodo debe permanecer corriendo.

### Paso 2: Desplegar Contrato (Terminal 2)

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Copia la dirección del contrato** que aparece en:
```
✅ StudentCertificate deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Paso 3: Configurar Backend

Edita `backend/.env` y agrega:

```env
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOCKCHAIN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
LOCALHOST_RPC_URL=http://127.0.0.1:8545
```

**Nota sobre Docker**: Si usas Docker, cambia `LOCALHOST_RPC_URL` a la IP de tu host:
```env
LOCALHOST_RPC_URL=http://host.docker.internal:8545
```

### Paso 4: Configurar IPFS (Opcional pero Recomendado)

1. Crea cuenta gratuita en [Pinata](https://pinata.cloud)
2. Obtén tus API keys
3. Agrega a `backend/.env`:

```env
PINATA_API_KEY=tu_api_key_aqui
PINATA_SECRET_KEY=tu_secret_key_aqui
```

**Sin IPFS**: El sistema funcionará pero sin metadata persistente.

### Paso 5: Reiniciar Backend

```bash
# Con Docker
docker-compose restart backend

# Sin Docker
cd backend
npm start
```

### Paso 6: Verificar Logs

```bash
# Con Docker
docker logs school_mgmt_backend --tail 20

# Deberías ver:
# ✅ Blockchain service ready
# 🔗 Contract address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Paso 7: Emitir Certificado

1. Ve a http://localhost/app/students
2. Login como admin
3. Click en menú (3 puntos) → "Issue Certificate"
4. Llena el formulario:
   - Type: "Graduation Certificate"
   - Achievement: "Successfully completed all academic requirements"
5. Click "Issue Certificate"

**Resultado esperado**:
- ✅ Success: "Certificate issued successfully!"
- Ver: Certificate ID, Transaction Hash, IPFS Hash
- El proceso toma ~2-3 segundos

### Paso 8: Verificar Certificado

1. Ve a http://localhost/verify-certificate
2. Ingresa el Certificate ID (ej: 1, 2, 3...)
3. Click "Verify"

**Verás**:
- ✅ Valid Certificate
- Student Name
- Certificate Type
- Issue Date
- Issuer Address
- IPFS Link (si configuraste Pinata)
- Status: Active

---

## 🧪 Tests del Smart Contract

Ejecutar suite de tests:

```bash
cd blockchain
npm test
```

**Resultado esperado**: 14 tests pasando ✅

Tests incluyen:
- Deployment
- Role management
- Certificate issuance
- Verification
- Revocation
- Access control

---

## 📊 Verificar en Consola del Navegador

Abre DevTools (F12) y ve a Network:

### Al emitir certificado:
```
POST /api/v1/certificates
Status: 201 Created

Response:
{
  "success": true,
  "message": "Certificate issued successfully",
  "data": {
    "certificateId": "1",
    "ipfsHash": "QmXXXXXXXX",
    "transactionHash": "0xabcdef123456...",
    "blockNumber": 2
  }
}
```

### Al verificar:
```
GET /api/v1/certificates/verify/1
Status: 200 OK

Response:
{
  "success": true,
  "valid": true,
  "data": {
    "id": "1",
    "studentName": "Ben Smith",
    "certificateType": "Academic Excellence",
    ...
  }
}
```

---

## ❌ Troubleshooting

### Error: "Blockchain service not available"
**Solución**: Backend no está configurado con blockchain
- Verifica `BLOCKCHAIN_PRIVATE_KEY` y `BLOCKCHAIN_CONTRACT_ADDRESS` en `.env`
- Reinicia backend

### Error: "IPFS service not configured"
**Solución**: Sin Pinata configurado
- Agrega `PINATA_API_KEY` y `PINATA_SECRET_KEY`
- O ignora - el sistema funcionará sin IPFS (solo sin metadata)

### Error: "Failed to issue certificate"
**Posibles causas**:
1. Nodo Hardhat no está corriendo → Reinicia `npx hardhat node`
2. RPC URL incorrecta → Verifica `LOCALHOST_RPC_URL`
3. Sin fondos en wallet → Usa account #0 de Hardhat (tiene 10000 ETH)

### Certificate muestra "Invalid"
**Causas**:
1. Certificado revocado
2. ID incorrecto
3. Red equivocada

---

## 🎯 Escenarios de Prueba

### Escenario 1: Certificado Válido
1. Emite certificado para estudiante ID 1
2. Verifica con el ID recibido
3. Resultado: ✅ Valid

### Escenario 2: Certificado Inexistente
1. Ve a /verify-certificate
2. Ingresa ID 999
3. Resultado: ❌ Invalid - "Certificate not found"

### Escenario 3: Múltiples Certificados
1. Emite 3 certificados para mismo estudiante
2. Ve a student detail page
3. Ver sección "Blockchain Certificates"
4. Deberías ver lista de 3 certificados

### Escenario 4: Sin IPFS
1. No configures Pinata
2. Emite certificado
3. Resultado: Funciona pero sin `ipfsHash`
4. Verificación muestra datos básicos sin metadata

---

## 📝 Datos de Prueba

### Tipos de Certificados Disponibles:
- Academic Excellence
- Perfect Attendance
- Graduation Certificate
- Honor Roll
- Sports Achievement
- Arts & Culture
- Community Service
- Leadership Award
- Best Student
- Subject Excellence

### Estudiantes de Prueba (IDs):
- ID 1: "Ben Smith"
- ID 3: "Alice Johnson"

---

## 🔗 URLs Importantes

- Frontend: http://localhost (o :5173)
- Backend API: http://localhost:5007
- Hardhat Node: http://127.0.0.1:8545
- Verify Page: http://localhost/verify-certificate

---

## 📚 Próximos Pasos

Después de probar básicamente:

1. **Ver certificados de estudiante**: `/app/students/:id`
2. **Revocar certificado**: Via API o agregar UI
3. **Ver estadísticas**: GET `/api/v1/certificates/stats`
4. **Explorar IPFS**: Click en "View on IPFS" en certificados
5. **Desplegar en testnet**: Usa `npm run deploy:sepolia`

---

¿Necesitas ayuda? Revisa:
- `blockchain/README.md` - Documentación del módulo blockchain
- `BLOCKCHAIN_README.md` - Guía de implementación completa
- Logs del backend: `docker logs school_mgmt_backend`
