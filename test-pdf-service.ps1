# Script para probar el servicio Go PDF

# 1. Login para obtener tokens
Write-Host "1. Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = "admin@school-admin.com"
    password = "3OU4zn3q6Zh9"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:5007/api/v1/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json" `
    -SessionVariable session `
    -UseBasicParsing

Write-Host "Login successful!" -ForegroundColor Green

# 2. Obtener lista de estudiantes
Write-Host "`n2. Getting students..." -ForegroundColor Cyan
$studentsResponse = Invoke-WebRequest -Uri "http://localhost:5007/api/v1/students" `
    -Method GET `
    -WebSession $session `
    -UseBasicParsing

$students = ($studentsResponse.Content | ConvertFrom-Json).students
Write-Host "Found $($students.Count) students:" -ForegroundColor Green
$students | ForEach-Object { Write-Host "  - ID: $($_.id) - $($_.name) ($($_.email))" }

# 3. Seleccionar el primer estudiante
$studentId = $students[0].id
Write-Host "`n3. Generating PDF for student ID: $studentId ($($students[0].name))" -ForegroundColor Cyan

# 4. Generar PDF (el servicio Go no necesita cookies, solo que el backend esté disponible)
# Pero como el backend requiere auth, necesitamos una solución alternativa
Write-Host "`nNOTE: The Go service needs authentication to access the backend API." -ForegroundColor Yellow
Write-Host "You have two options:" -ForegroundColor Yellow
Write-Host "1. Use the test endpoint below (requires temporary backend modification)" -ForegroundColor Yellow
Write-Host "2. Integrate the PDF button in the frontend UI" -ForegroundColor Yellow

Write-Host "`n--- Option 1: Direct Test (after backend modification) ---" -ForegroundColor Magenta
Write-Host "Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/students/$studentId/report' -OutFile 'student_report.pdf' -UseBasicParsing"

Write-Host "`n--- Option 2: Frontend Integration ---" -ForegroundColor Magenta
Write-Host "Add this to the frontend student detail page:"
Write-Host "<Button onClick={() => window.open('http://localhost:8080/api/v1/students/' + studentId + '/report', '_blank')}>Download PDF Report</Button>"
