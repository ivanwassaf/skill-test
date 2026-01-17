# Test del Servicio Go PDF - SCRIPT SIMPLE

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   TESTING GO PDF SERVICE" -ForegroundColor Cyan  
Write-Host "=====================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n[1] Verificando health check..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "  OK - Service Status: $($healthData.status)" -ForegroundColor Green
    Write-Host "  OK - Service Name: $($healthData.service)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR - Health check failed!" -ForegroundColor Red
    exit 1
}

# 2. Generar PDF para estudiante ID 3
Write-Host "`n[2] Generando PDF para estudiante ID 3 (Ben)..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:8080/api/v1/students/3/report" -OutFile "student_3_report.pdf" -UseBasicParsing
    $file3 = Get-Item "student_3_report.pdf"
    Write-Host "  OK - PDF generado: $($file3.Name) - Size: $($file3.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "  ERROR - generando PDF para estudiante 3" -ForegroundColor Red
}

# 3. Generar PDF para estudiante ID 4
Write-Host "`n[3] Generando PDF para estudiante ID 4 (Raul)..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:8080/api/v1/students/4/report" -OutFile "student_4_report.pdf" -UseBasicParsing
    $file4 = Get-Item "student_4_report.pdf"
    Write-Host "  OK - PDF generado: $($file4.Name) - Size: $($file4.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "  ERROR - generando PDF para estudiante 4" -ForegroundColor Red
}

# 4. Abrir PDF
Write-Host "`n[4] Abriendo PDFs generados..." -ForegroundColor Yellow
Start-Process "student_3_report.pdf"
Start-Sleep -Seconds 1
Start-Process "student_4_report.pdf"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLETADO" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "`nArchivos generados:" -ForegroundColor White
Get-ChildItem student_*_report.pdf | Select-Object Name, Length, LastWriteTime | Format-Table
